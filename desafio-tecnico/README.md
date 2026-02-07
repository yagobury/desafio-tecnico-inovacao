# desafio tecnico - analista de inovacao

esse repo tem duas partes do desafio: um dashboard com dados do banco central e uma automacao rpa no demoqa

## estrutura do projeto

```
desafio-tecnico/
├── parte1-dashboard/          # dashboard financeiro com dados do BC
│   ├── dashboard-bcb/         # projeto next.js
│   └── data/                  # scripts pra buscar dados da API
│
└── parte2-rpa/                # automacao no demoqa
    ├── run_all.py             # script principal (roda tudo)
    ├── requirements.txt       # dependencias python
    ├── assets/                # arquivos de teste
    └── outputs/                # resultados gerados automaticamente
```

---

## parte 1 - dashboard financeiro BCB

### o que faz
dashboard com dados do banco central: selic, dolar e ipca. mostra kpis e alguns insights

### fonte dos dados
usa a API publica do BCB (SGS):
- SELIC (codigo 11): taxa de juros basica
- USD/BRL (codigo 1): cambio dolar venda
- IPCA (codigo 433): inflacao mensal

endpoint: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados?formato=json&dataInicial={dd/MM/yyyy}&dataFinal={dd/MM/yyyy}`

### periodo
36 meses de historico (jan/2023 ate fev/2026)

### kpis implementados (7 no total)

1. **selic meta atual** - ultimo valor definido pelo copom
2. **selic variacao 30d** - diferenca vs mes anterior em pontos percentuais
3. **usd/brl atual** - ultimo cambio medio mensal
4. **usd/brl retorno 30d** - variacao percentual em 30 dias
5. **volatilidade usd 6m** - desvio padrao dos retornos mensais em 6 meses
6. **ipca acum 12m** - inflacao acumulada em 12 meses (calculo geometrico)
7. **ipca ultimo mes** - variacao mensal mais recente

### insights que implementei (4 no total)

1. **alerta de meta ipca** - compara ipca acumulado com a meta do cmn (3%) e teto (4.5%)
2. **percentil usd/brl** - mostra onde o cambio atual ta no historico (pra ver se ta caro ou barato)
3. **analise ciclo monetario** - rastreia o ciclo de alta da selic
4. **correlacao selic x cambio** - analisa como juros altos afetam o cambio

### como calcular os kpis

- **selic meta**: pega o valor definido pelo copom (nao a taxa diaria)
- **usd/brl**: media mensal da cotacao de venda
- **ipca**: variacao percentual mensal oficial
- **ipca acumulado 12m**: calculo geometrico → ∏(1 + taxa/100) - 1
- **volatilidade**: desvio padrao dos retornos percentuais mensais
- **percentil**: posicao do valor atual no historico ordenado

### tecnologias
- dashboard: react + next.js + recharts
- pipeline de dados: python (requests)
- formato: json

### como usar
1. entrar na pasta `parte1-dashboard/dashboard-bcb`
2. rodar `npm install` pra instalar dependencias
3. rodar `npm run dev` pra subir o servidor
4. pra atualizar dados: rodar `python data/fetch_bcb_data.py`

---

## parte 2 - rpa demoqa

### o que faz
automa varios cenarios no site demoqa: preenche formularios, seleciona checkboxes, extrai dados de tabelas e faz upload de arquivo

### cenarios automatizados (4 no total)

1. **text box** - preenche formulario e extrai resultado
2. **check box** - expande arvore e seleciona items
3. **web tables** - extrai dados da tabela e gera csv + resumo json
4. **upload** - faz upload de arquivo e valida na interface

### como rodar (one-click)

```bash
# instalar dependencias
pip install -r requirements.txt
python -m playwright install

# rodar tudo de uma vez
python run_all.py
```

pronto, isso roda todos os cenarios automaticamente e gera os outputs na pasta `outputs/`

### requisitos
- python 3.10 ou superior
- playwright instalado

### o que o codigo faz

- **waits explicitos**: espera elementos aparecerem antes de clicar/preencher
- **retry pattern**: tenta ate 3 vezes se algo falhar
- **logging**: salva tudo num arquivo de log + mostra no terminal
- **gravacao de video**: grava automaticamente (fica em outputs/videos/)
- **screenshots**: tira print dos resultados importantes
- **fallbacks**: se um seletor nao funcionar, tenta outro

### outputs gerados

todos ficam na pasta `outputs/`:

- `text_box_result.json` - resultado do formulario
- `checkbox_result.json` - items selecionados
- `webtables_extract.csv` - dados brutos da tabela
- `webtables_summary.json` - resumo com media de salarios, contagem por departamento
- `upload_result.json` - confirmacao do upload
- `execution_report.json` - relatorio final com status de tudo
- `execution.log` - log completo da execucao
- `videos/` - videos gravados automaticamente

### dicionario de metricas

| metrica | o que eh | unidade | fonte |
|---------|----------|---------|-------|
| selic meta | taxa basica de juros do copom | % a.a. | BCB serie 11 |
| usd/brl | cambio dolar venda | R$/US$ | BCB serie 1 |
| ipca | inflacao mensal | % mensal | BCB serie 433 |
| ipca acum 12m | inflacao acumulada em 12 meses | % | calculado |
| volatilidade 6m | desvio padrao dos retornos mensais | % | calculado |
| retorno % | variacao percentual entre periodos | % | calculado |
| percentil | posicao no historico ordenado | % (0-100) | calculado |

---

## autor
yago - fevereiro 2026
