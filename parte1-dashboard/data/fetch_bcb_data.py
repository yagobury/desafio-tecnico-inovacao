"""
Pipeline de Ingestão de Dados - Banco Central do Brasil (SGS)
=============================================================
Consome séries temporais via API pública do BCB/SGS:
- SELIC (código 11): Taxa de juros básica
- USD/BRL (código 1): Taxa de câmbio - Dólar venda
- IPCA (código 433): Variação % mensal

Janela: 36 meses de histórico (mínimo exigido: 24)
Output: arquivos JSON prontos para consumo no dashboard
"""

import requests
import json
import os
from datetime import datetime, timedelta
from typing import Optional

# Configurações
BCB_SGS_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{}/dados"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "raw")
MESES_HISTORICO = 36

SERIES = {
    "selic": {"codigo": 11, "descricao": "Taxa SELIC (% a.a.)"},
    "usd_brl": {"codigo": 1, "descricao": "USD/BRL - Câmbio Venda"},
    "ipca": {"codigo": 433, "descricao": "IPCA - Variação % Mensal"},
}


def calcular_janela(meses: int = MESES_HISTORICO) -> tuple[str, str]:
    """Calcula datas de início e fim da janela temporal."""
    fim = datetime.now()
    inicio = fim - timedelta(days=meses * 31)
    return inicio.strftime("%d/%m/%Y"), fim.strftime("%d/%m/%Y")


def fetch_serie(codigo: int, data_inicio: str, data_fim: str) -> list[dict]:
    """Busca série temporal do BCB/SGS via API REST."""
    url = BCB_SGS_URL.format(codigo)
    params = {
        "formato": "json",
        "dataInicial": data_inicio,
        "dataFinal": data_fim,
    }
    print(f"  GET {url}")
    print(f"  Params: {params}")

    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()

    dados = response.json()
    print(f"  -> {len(dados)} registros recebidos")
    return dados


def processar_serie(dados_raw: list[dict]) -> list[dict]:
    """Padroniza formato: converte data e valor."""
    processados = []
    for item in dados_raw:
        try:
            # BCB retorna data como dd/mm/yyyy
            data = datetime.strptime(item["data"], "%d/%m/%Y").strftime("%Y-%m-%d")
            valor = float(item["valor"].replace(",", ".")) if isinstance(item["valor"], str) else float(item["valor"])
            processados.append({"data": data, "valor": valor})
        except (ValueError, KeyError) as e:
            print(f"  [WARN] Registro ignorado: {item} - {e}")
    return processados


def calcular_kpis(selic: list, usd: list, ipca: list) -> dict:
    """Calcula todos os KPIs obrigatórios + extras."""

    # Helpers
    def ultimo(serie):
        return serie[-1] if serie else None

    def valor_n_dias_atras(serie, dias):
        if not serie:
            return None
        data_limite = datetime.strptime(serie[-1]["data"], "%Y-%m-%d") - timedelta(days=dias)
        for item in reversed(serie):
            if datetime.strptime(item["data"], "%Y-%m-%d") <= data_limite:
                return item
        return serie[0]

    def retorno_pct(atual, anterior):
        if anterior and anterior["valor"] != 0:
            return round(((atual["valor"] - anterior["valor"]) / anterior["valor"]) * 100, 4)
        return None

    def volatilidade_30d(serie):
        """Volatilidade 30 dias baseada em retornos diários logarítmicos."""
        if len(serie) < 30:
            return None
        ultimos_30 = serie[-31:]
        retornos = []
        for i in range(1, len(ultimos_30)):
            if ultimos_30[i - 1]["valor"] != 0:
                ret = (ultimos_30[i]["valor"] - ultimos_30[i - 1]["valor"]) / ultimos_30[i - 1]["valor"]
                retornos.append(ret)
        if not retornos:
            return None
        media = sum(retornos) / len(retornos)
        variancia = sum((r - media) ** 2 for r in retornos) / len(retornos)
        return round((variancia ** 0.5) * 100, 4)  # em %

    def ipca_acumulado_12m(serie):
        """IPCA acumulado 12 meses: produto dos (1 + taxa/100) - 1."""
        if len(serie) < 12:
            return None
        ultimos_12 = serie[-12:]
        acumulado = 1.0
        for item in ultimos_12:
            acumulado *= (1 + item["valor"] / 100)
        return round((acumulado - 1) * 100, 2)

    def percentil_serie(serie, valor_atual):
        """Calcula em qual percentil o valor atual está na série histórica."""
        valores = sorted([s["valor"] for s in serie])
        posicao = sum(1 for v in valores if v <= valor_atual)
        return round((posicao / len(valores)) * 100, 1)

    # KPIs obrigatórios
    selic_atual = ultimo(selic)
    selic_30d = valor_n_dias_atras(selic, 30)
    usd_atual = ultimo(usd)
    usd_7d = valor_n_dias_atras(usd, 7)
    usd_30d = valor_n_dias_atras(usd, 30)

    kpis = {
        "data_atualizacao": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "selic": {
            "atual": selic_atual["valor"] if selic_atual else None,
            "data": selic_atual["data"] if selic_atual else None,
            "variacao_30d": round(selic_atual["valor"] - selic_30d["valor"], 2) if selic_atual and selic_30d else None,
            "valor_30d_atras": selic_30d["valor"] if selic_30d else None,
        },
        "usd_brl": {
            "atual": usd_atual["valor"] if usd_atual else None,
            "data": usd_atual["data"] if usd_atual else None,
            "retorno_7d_pct": retorno_pct(usd_atual, usd_7d),
            "retorno_30d_pct": retorno_pct(usd_atual, usd_30d),
            "valor_7d_atras": usd_7d["valor"] if usd_7d else None,
            "valor_30d_atras": usd_30d["valor"] if usd_30d else None,
            "volatilidade_30d": volatilidade_30d(usd),
            "percentil_historico": percentil_serie(usd, usd_atual["valor"]) if usd_atual else None,
        },
        "ipca": {
            "ultimo_mensal": ultimo(ipca)["valor"] if ultimo(ipca) else None,
            "data": ultimo(ipca)["data"] if ultimo(ipca) else None,
            "acumulado_12m": ipca_acumulado_12m(ipca),
            "meta_cmn": 3.0,
            "teto_meta": 4.5,
        },
    }

    # Insights extras
    if kpis["ipca"]["acumulado_12m"]:
        kpis["ipca"]["acima_meta"] = kpis["ipca"]["acumulado_12m"] > kpis["ipca"]["meta_cmn"]
        kpis["ipca"]["acima_teto"] = kpis["ipca"]["acumulado_12m"] > kpis["ipca"]["teto_meta"]
        kpis["ipca"]["desvio_meta_pp"] = round(kpis["ipca"]["acumulado_12m"] - kpis["ipca"]["meta_cmn"], 2)

    # Alerta USD
    if kpis["usd_brl"]["percentil_historico"]:
        kpis["usd_brl"]["alerta"] = (
            "ALTO" if kpis["usd_brl"]["percentil_historico"] >= 90
            else "ELEVADO" if kpis["usd_brl"]["percentil_historico"] >= 75
            else "NORMAL"
        )

    return kpis


def calcular_series_derivadas(selic: list, usd: list, ipca: list) -> dict:
    """Calcula séries derivadas para gráficos do dashboard."""

    # Retornos diários do USD/BRL
    retornos_usd = []
    for i in range(1, len(usd)):
        if usd[i - 1]["valor"] != 0:
            ret = ((usd[i]["valor"] - usd[i - 1]["valor"]) / usd[i - 1]["valor"]) * 100
            retornos_usd.append({"data": usd[i]["data"], "valor": round(ret, 4)})

    # Volatilidade móvel 30d do USD/BRL
    vol_movel = []
    for i in range(30, len(retornos_usd)):
        janela = [r["valor"] for r in retornos_usd[i - 30:i]]
        media = sum(janela) / len(janela)
        variancia = sum((r - media) ** 2 for r in janela) / len(janela)
        vol = round((variancia ** 0.5), 4)
        vol_movel.append({"data": retornos_usd[i]["data"], "valor": vol})

    # IPCA acumulado 12m rolling
    ipca_acum_12m = []
    for i in range(11, len(ipca)):
        janela = ipca[i - 11:i + 1]
        acum = 1.0
        for item in janela:
            acum *= (1 + item["valor"] / 100)
        ipca_acum_12m.append({"data": ipca[i]["data"], "valor": round((acum - 1) * 100, 2)})

    # Média móvel 30d do USD/BRL
    mm30_usd = []
    for i in range(29, len(usd)):
        janela = [u["valor"] for u in usd[i - 29:i + 1]]
        mm30_usd.append({"data": usd[i]["data"], "valor": round(sum(janela) / len(janela), 4)})

    # Correlação móvel SELIC vs USD (por mês)
    # Agrupa USD por mês (média) e cruza com SELIC
    usd_mensal = {}
    for item in usd:
        mes = item["data"][:7]
        if mes not in usd_mensal:
            usd_mensal[mes] = []
        usd_mensal[mes].append(item["valor"])
    usd_mensal_avg = {k: sum(v) / len(v) for k, v in usd_mensal.items()}

    selic_mensal = {}
    for item in selic:
        mes = item["data"][:7]
        selic_mensal[mes] = item["valor"]  # última do mês

    return {
        "retornos_diarios_usd": retornos_usd,
        "volatilidade_movel_30d": vol_movel,
        "ipca_acumulado_12m_rolling": ipca_acum_12m,
        "media_movel_30d_usd": mm30_usd,
        "usd_mensal_avg": [{"data": k, "valor": round(v, 4)} for k, v in sorted(usd_mensal_avg.items())],
        "selic_mensal": [{"data": k, "valor": v} for k, v in sorted(selic_mensal.items())],
    }


def main():
    """Pipeline principal de ingestão e processamento."""
    print("=" * 60)
    print("Pipeline de Dados - Banco Central do Brasil")
    print("=" * 60)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    data_inicio, data_fim = calcular_janela()
    print(f"\nJanela: {data_inicio} a {data_fim} ({MESES_HISTORICO} meses)\n")

    # 1. Fetch das séries
    dados_raw = {}
    dados_processados = {}
    for nome, config in SERIES.items():
        print(f"[{nome.upper()}] Buscando série {config['codigo']} - {config['descricao']}")
        raw = fetch_serie(config["codigo"], data_inicio, data_fim)
        dados_raw[nome] = raw
        dados_processados[nome] = processar_serie(raw)
        print()

    # 2. Salvar séries processadas
    for nome, dados in dados_processados.items():
        path = os.path.join(OUTPUT_DIR, f"{nome}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(dados, f, ensure_ascii=False, indent=2)
        print(f"[SAVE] {path} ({len(dados)} registros)")

    # 3. Calcular KPIs
    print("\n[KPIs] Calculando indicadores...")
    kpis = calcular_kpis(
        dados_processados["selic"],
        dados_processados["usd_brl"],
        dados_processados["ipca"],
    )
    kpi_path = os.path.join(OUTPUT_DIR, "kpis.json")
    with open(kpi_path, "w", encoding="utf-8") as f:
        json.dump(kpis, f, ensure_ascii=False, indent=2)
    print(f"[SAVE] {kpi_path}")

    # 4. Calcular séries derivadas
    print("[DERIVADAS] Calculando séries derivadas...")
    derivadas = calcular_series_derivadas(
        dados_processados["selic"],
        dados_processados["usd_brl"],
        dados_processados["ipca"],
    )
    derivadas_path = os.path.join(OUTPUT_DIR, "series_derivadas.json")
    with open(derivadas_path, "w", encoding="utf-8") as f:
        json.dump(derivadas, f, ensure_ascii=False, indent=2)
    print(f"[SAVE] {derivadas_path}")

    # 5. Resumo
    print("\n" + "=" * 60)
    print("RESUMO DOS KPIs")
    print("=" * 60)
    print(f"  SELIC atual:           {kpis['selic']['atual']}% a.a.")
    print(f"  SELIC variação 30d:    {kpis['selic']['variacao_30d']} p.p.")
    print(f"  USD/BRL atual:         R$ {kpis['usd_brl']['atual']}")
    print(f"  USD/BRL retorno 7d:    {kpis['usd_brl']['retorno_7d_pct']}%")
    print(f"  USD/BRL retorno 30d:   {kpis['usd_brl']['retorno_30d_pct']}%")
    print(f"  USD/BRL vol 30d:       {kpis['usd_brl']['volatilidade_30d']}%")
    print(f"  USD/BRL percentil:     {kpis['usd_brl']['percentil_historico']}% ({kpis['usd_brl'].get('alerta', 'N/A')})")
    print(f"  IPCA último mensal:    {kpis['ipca']['ultimo_mensal']}%")
    print(f"  IPCA acum. 12m:        {kpis['ipca']['acumulado_12m']}%")
    print(f"  IPCA vs meta CMN:      {kpis['ipca']['desvio_meta_pp']} p.p.")
    print("=" * 60)
    print("Pipeline concluído com sucesso!")


if __name__ == "__main__":
    main()
