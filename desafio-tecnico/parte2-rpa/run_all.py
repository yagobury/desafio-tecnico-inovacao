# RPA DemoQA - Automação com Playwright
# Cenários automatizados:
# 1. Text Box - Preenchimento e extração
# 2. Check Box - Seleção de itens
# 3. Web Tables - Extração e resumo
# 4. Upload - Upload de arquivo com validação
# Execução: python run_all.py

import asyncio
import json
import csv
import os
import sys
import logging
from datetime import datetime
from pathlib import Path

# configuracao dos logs
# define o nivel minimo de log e como vai aparecer
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        # salva os logs num arquivo
        logging.FileHandler("outputs/execution.log", mode="w", encoding="utf-8"),
        # mostra os logs no terminal tambem
        logging.StreamHandler(sys.stdout),
    ],
)

# cria o logger pra usar no codigo
logger = logging.getLogger(__name__)

# define as pastas do projeto
# diretorio base eh onde ta esse arquivo
DIRETORIO_BASE = Path(__file__).parent
DIRETORIO_SAIDAS = DIRETORIO_BASE / "outputs"
DIRETORIO_ASSETS = DIRETORIO_BASE / "assets"

# cria a pasta de saidas se nao existir
DIRETORIO_SAIDAS.mkdir(exist_ok=True)

# urls do site demoqa que vamos testar
URL_BASE_DEMOQA = "https://demoqa.com"
URLS = {
    "text_box": f"{URL_BASE_DEMOQA}/text-box",
    "check_box": f"{URL_BASE_DEMOQA}/checkbox",
    "web_tables": f"{URL_BASE_DEMOQA}/webtables",
    "upload_download": f"{URL_BASE_DEMOQA}/upload-download",
}

# dados da pessoa ficticia pra preencher os formularios
PESSOA = {
    "full_name": "Yago Bury",
    "email": "yagobury14@outlook.com",
    "current_address": "Rua Terra Roxa, 48 -  São Braz",
    "permanent_address": "Rua Terra Roxa, 48 -  São Braz",
}


async def configurar_navegador(playwright, mostrar_interface=True):
    # prepara o navegador chrome e retorna os objetos
    # inicia o chrome com ou sem interface visual
    navegador = await playwright.chromium.launch(
        headless=not mostrar_interface,
        args=["--no-sandbox", "--disable-setuid-sandbox"],
    )
    
    # cria um contexto do navegador com as configs de tela
    contexto = await navegador.new_context(
        viewport={"width": 1280, "height": 720},
        # grava video so se tiver em modo visual
        record_video_dir=str(DIRETORIO_SAIDAS / "videos") if mostrar_interface else None,
        record_video_size={"width": 1280, "height": 720},
    )
    
    # abre uma nova aba no navegador
    pagina = await contexto.new_page()
    
    # define tempo maximo de espera pra operacoes (15 segundos)
    pagina.set_default_timeout(15000)
    
    return navegador, contexto, pagina


async def clicar_com_seguranca(pagina, seletor, descricao="elemento", tentativas=3):
    # tenta clicar num elemento com varias tentativas se falhar
    for tentativa_atual in range(tentativas):
        try:
            # espera o elemento aparecer na tela (maximo 5 segundos)
            await pagina.wait_for_selector(seletor, state="visible", timeout=5000)
            # clica no elemento
            await pagina.click(seletor)
            logger.info(f"  ✓ Clicou em: {descricao}")
            return True
        except Exception as erro:
            # se ainda tem tentativas, tenta de novo
            if tentativa_atual < tentativas - 1:
                logger.warning(f"  ⚠ Tentativa {tentativa_atual + 1} falhou para {descricao}: {erro}")
                # espera 1 segundo antes de tentar de novo
                await pagina.wait_for_timeout(1000)
            else:
                # se acabou todas as tentativas, registra erro e para
                logger.error(f"  ✗ Falha ao clicar em {descricao}: {erro}")
                raise


async def preencher_campo(pagina, seletor, valor, descricao="campo"):
    # preenche um campo de formulario depois de garantir que ta visivel
    # espera o campo aparecer na tela (maximo 5 segundos)
    await pagina.wait_for_selector(seletor, state="visible", timeout=5000)
    # preenche o campo com o valor
    await pagina.fill(seletor, valor)
    # registra no log (mostra so os primeiros 50 caracteres do valor)
    logger.info(f"  ✓ Preencheu {descricao}: {valor[:50]}...")


# cenario 1: text box
async def cenario_caixa_texto(pagina):
    # preenche o formulario de text box e extrai o resultado que aparece
    logger.info("=" * 60)
    logger.info("CENÁRIO 1: TEXT BOX")
    logger.info("=" * 60)

    # navega pra pagina do formulario
    await pagina.goto(URLS["text_box"])
    await pagina.wait_for_load_state("networkidle")
    logger.info(f"  Navegou para: {URLS['text_box']}")

    # preenche todos os campos do formulario
    await preencher_campo(pagina, "#userName", PESSOA["full_name"], "Nome Completo")
    await preencher_campo(pagina, "#userEmail", PESSOA["email"], "Email")
    await preencher_campo(pagina, "#currentAddress", PESSOA["current_address"], "Endereço Atual")
    await preencher_campo(pagina, "#permanentAddress", PESSOA["permanent_address"], "Endereço Permanente")

    # rola a pagina pra baixo pra o botao ficar visivel
    await pagina.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    await pagina.wait_for_timeout(500)

    # clica no botao de enviar
    await clicar_com_seguranca(pagina, "#submit", "Botão Enviar")
    await pagina.wait_for_timeout(1000)

    # extrai o resultado que aparece na tela depois de enviar
    div_resultado = await pagina.query_selector("#output")
    resultado = {}
    if div_resultado:
        elemento_nome = await div_resultado.query_selector("#name")
        elemento_email = await div_resultado.query_selector("#email")
        elemento_endereco_atual = await div_resultado.query_selector("p#currentAddress")
        elemento_endereco_permanente = await div_resultado.query_selector("p#permanentAddress")

        resultado = {
            "name": await elemento_nome.inner_text() if elemento_nome else "",
            "email": await elemento_email.inner_text() if elemento_email else "",
            "currentAddress": await elemento_endereco_atual.inner_text() if elemento_endereco_atual else "",
            "permanentAddress": await elemento_endereco_permanente.inner_text() if elemento_endereco_permanente else "",
        }
        logger.info("  ✓ Resultado extraído com sucesso")
    else:
        logger.warning("  ⚠ Div de resultado não encontrado")

    # salva os dados num arquivo json
    dados_saida = {
        "cenario": "text_box",
        "timestamp": datetime.now().isoformat(),
        "dados_enviados": PESSOA,
        "resultado_exibido": resultado,
        "status": "sucesso" if resultado else "falha",
    }

    caminho_saida = DIRETORIO_SAIDAS / "text_box_result.json"
    with open(caminho_saida, "w", encoding="utf-8") as arquivo:
        json.dump(dados_saida, arquivo, ensure_ascii=False, indent=2)

    logger.info(f"  ✓ Salvo em: {caminho_saida}")
    return dados_saida


# cenario 2: check box
async def cenario_checkbox(pagina):
    # expande a arvore de checkboxes e seleciona commands e general
    logger.info("=" * 60)
    logger.info("CENÁRIO 2: CHECK BOX")
    logger.info("=" * 60)

    # navega pra pagina de checkboxes
    await pagina.goto(URLS["check_box"])
    await pagina.wait_for_load_state("networkidle")
    logger.info(f"  Navegou para: {URLS['check_box']}")

    # tenta expandir toda a arvore clicando no botao expand all
    botao_expandir = await pagina.query_selector("button[title='Expand all']")
    if botao_expandir:
        await botao_expandir.click()
        await pagina.wait_for_timeout(1000)
        logger.info("  ✓ Árvore expandida")
    else:
        # se nao encontrar o botao, expande manualmente cada item
        botoes_toggle = await pagina.query_selector_all(".rct-collapse")
        for botao_toggle in botoes_toggle:
            try:
                await botao_toggle.click()
                await pagina.wait_for_timeout(200)
            except:
                pass
        logger.info("  ✓ Árvore expandida manualmente")

    # seleciona o checkbox commands
    label_commands = await pagina.query_selector("label[for='tree-node-commands'] .rct-checkbox")
    if not label_commands:
        # tenta encontrar por xpath se nao encontrar pelo seletor css
        label_commands = await pagina.query_selector("//span[contains(text(),'Commands')]/..")
    if label_commands:
        await label_commands.click()
        await pagina.wait_for_timeout(500)
        logger.info("  ✓ Selecionado: Commands")
    else:
        # alternativa: clicar no label pelo texto
        await pagina.click("text=Commands")
        await pagina.wait_for_timeout(500)
        logger.info("  ✓ Selecionado: Commands (via texto)")

    # seleciona o checkbox general
    label_general = await pagina.query_selector("label[for='tree-node-general'] .rct-checkbox")
    if not label_general:
        # tenta encontrar por xpath se nao encontrar pelo seletor css
        label_general = await pagina.query_selector("//span[contains(text(),'General')]/..")
    if label_general:
        await label_general.click()
        await pagina.wait_for_timeout(500)
        logger.info("  ✓ Selecionado: General")
    else:
        # alternativa: clicar no label pelo texto
        await pagina.click("text=General")
        await pagina.wait_for_timeout(500)
        logger.info("  ✓ Selecionado: General (via texto)")

    # verifica o texto de resultado que aparece na tela
    elemento_resultado = await pagina.query_selector("#result")
    texto_selecionado = ""
    if elemento_resultado:
        texto_selecionado = await elemento_resultado.inner_text()
        logger.info(f"  ✓ Resultado: {texto_selecionado}")

    # tira screenshot como evidencia do que foi selecionado
    await pagina.screenshot(path=str(DIRETORIO_SAIDAS / "checkbox_evidence.png"), full_page=True)
    logger.info("  ✓ Screenshot salvo")

    # salva os dados num arquivo json
    dados_saida = {
        "cenario": "check_box",
        "timestamp": datetime.now().isoformat(),
        "itens_selecionados": ["commands", "general"],
        "resultado_exibido": texto_selecionado,
        "status": "sucesso",
    }

    caminho_saida = DIRETORIO_SAIDAS / "checkbox_result.json"
    with open(caminho_saida, "w", encoding="utf-8") as arquivo:
        json.dump(dados_saida, arquivo, ensure_ascii=False, indent=2)

    logger.info(f"  ✓ Salvo em: {caminho_saida}")
    return dados_saida


# cenario 3: web tables
async def cenario_tabelas_web(pagina):
    # extrai todos os dados da tabela e gera csv e json com resumo
    logger.info("=" * 60)
    logger.info("CENÁRIO 3: WEB TABLES")
    logger.info("=" * 60)

    # navega pra pagina de tabelas
    await pagina.goto(URLS["web_tables"])
    await pagina.wait_for_load_state("networkidle")
    logger.info(f"  Navegou para: {URLS['web_tables']}")

    # encontra todas as linhas da tabela
    linhas = await pagina.query_selector_all(".rt-tr-group")
    registros = []

    # pra cada linha, extrai os dados das celulas
    for linha in linhas:
        celulas = await linha.query_selector_all(".rt-td")
        if len(celulas) >= 6:
            valores = []
            for celula in celulas[:6]:
                texto = (await celula.inner_text()).strip()
                valores.append(texto)

            # ignora linhas vazias (celulas com espaco em branco ou caracteres especiais)
            if valores[0] and valores[0] != "\xa0" and valores[0] != " ":
                registros.append({
                    "First Name": valores[0],
                    "Last Name": valores[1],
                    "Age": valores[2],
                    "Email": valores[3],
                    "Salary": valores[4],
                    "Department": valores[5],
                })

    logger.info(f"  ✓ Extraídos {len(registros)} registros")

    # salva todos os registros num arquivo csv
    caminho_csv = DIRETORIO_SAIDAS / "webtables_extract.csv"
    if registros:
        nomes_colunas = ["First Name", "Last Name", "Age", "Email", "Salary", "Department"]
        with open(caminho_csv, "w", newline="", encoding="utf-8") as arquivo:
            escritor = csv.DictWriter(arquivo, fieldnames=nomes_colunas)
            escritor.writeheader()
            escritor.writerows(registros)
        logger.info(f"  ✓ CSV salvo: {caminho_csv}")

    # calcula estatisticas dos dados extraidos
    salarios = []
    contagem_departamentos = {}
    for registro in registros:
        try:
            # tenta converter salario pra numero
            salario = int(registro["Salary"])
            salarios.append(salario)
        except (ValueError, TypeError):
            # se nao conseguir converter, ignora
            pass
        departamento = registro["Department"]
        contagem_departamentos[departamento] = contagem_departamentos.get(departamento, 0) + 1

    # cria resumo com estatisticas
    resumo = {
        "cenario": "web_tables",
        "timestamp": datetime.now().isoformat(),
        "total_registros": len(registros),
        "media_salary": round(sum(salarios) / len(salarios), 2) if salarios else 0,
        "registros_por_department": contagem_departamentos,
        "dados_extraidos": registros,
        "status": "sucesso" if registros else "falha",
    }

    # salva resumo num arquivo json
    caminho_resumo = DIRETORIO_SAIDAS / "webtables_summary.json"
    with open(caminho_resumo, "w", encoding="utf-8") as arquivo:
        json.dump(resumo, arquivo, ensure_ascii=False, indent=2)

    logger.info(f"  ✓ Resumo salvo: {caminho_resumo}")
    logger.info(f"  📊 Total registros: {resumo['total_registros']}")
    logger.info(f"  📊 Média salary: {resumo['media_salary']}")
    logger.info(f"  📊 Por department: {resumo['registros_por_department']}")

    return resumo


# cenario 4: upload
async def cenario_upload(pagina):
    # faz upload de arquivo pdf e valida se apareceu certo na interface
    logger.info("=" * 60)
    logger.info("CENÁRIO 4: UPLOAD AND DOWNLOAD")
    logger.info("=" * 60)

    # navega pra pagina de upload
    await pagina.goto(URLS["upload_download"])
    await pagina.wait_for_load_state("networkidle")
    logger.info(f"  Navegou para: {URLS['upload_download']}")

    # verifica se o arquivo de teste existe, se nao existir, cria um
    arquivo_teste = DIRETORIO_ASSETS / "documento_teste.pdf"
    if not arquivo_teste.exists():
        logger.info("  ⚠ Arquivo de teste não encontrado, criando...")
        DIRETORIO_ASSETS.mkdir(exist_ok=True)
        # cria um pdf simples pra teste
        criar_pdf_teste(arquivo_teste)

    # faz o upload do arquivo
    input_arquivo = await pagina.query_selector("#uploadFile")
    if input_arquivo:
        await input_arquivo.set_input_files(str(arquivo_teste))
        await pagina.wait_for_timeout(1000)
        logger.info(f"  ✓ Upload realizado: {arquivo_teste.name}")
    else:
        logger.error("  ✗ Input de upload não encontrado")

    # verifica se o nome do arquivo aparece na interface depois do upload
    elemento_caminho_upload = await pagina.query_selector("#uploadedFilePath")
    nome_arquivo_confirmado = ""
    if elemento_caminho_upload:
        nome_arquivo_confirmado = await elemento_caminho_upload.inner_text()
        logger.info(f"  ✓ Arquivo confirmado na UI: {nome_arquivo_confirmado}")

    # tira screenshot como evidencia do upload
    await pagina.screenshot(path=str(DIRETORIO_SAIDAS / "upload_evidence.png"), full_page=True)

    # salva os dados num arquivo json
    dados_saida = {
        "cenario": "upload_and_download",
        "timestamp": datetime.now().isoformat(),
        "arquivo_enviado": str(arquivo_teste),
        "nome_arquivo": arquivo_teste.name,
        "confirmacao_ui": nome_arquivo_confirmado,
        "upload_validado": arquivo_teste.name in nome_arquivo_confirmado if nome_arquivo_confirmado else False,
        "status": "sucesso" if nome_arquivo_confirmado else "falha",
    }

    caminho_saida = DIRETORIO_SAIDAS / "upload_result.json"
    with open(caminho_saida, "w", encoding="utf-8") as arquivo:
        json.dump(dados_saida, arquivo, ensure_ascii=False, indent=2)

    logger.info(f"  ✓ Salvo em: {caminho_saida}")
    return dados_saida


def criar_pdf_teste(caminho):
    # cria um arquivo pdf de teste simples usando reportlab ou fallback manual
    try:
        # tenta usar a biblioteca reportlab se tiver instalada
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas

        canvas_pdf = canvas.Canvas(str(caminho), pagesize=A4)
        canvas_pdf.setFont("Helvetica-Bold", 24)
        canvas_pdf.drawString(100, 700, "Documento de Teste")
        canvas_pdf.setFont("Helvetica", 14)
        canvas_pdf.drawString(100, 660, "RPA DemoQA - Desafio Técnico")
        canvas_pdf.drawString(100, 630, f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
        canvas_pdf.drawString(100, 600, "Este arquivo é usado para testar o upload automatizado.")
        canvas_pdf.save()
        logger.info(f"  ✓ PDF criado com reportlab: {caminho}")
    except ImportError:
        # se reportlab nao tiver instalado, cria um pdf minimo manualmente
        conteudo_pdf = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 84 >>
stream
BT
/F1 18 Tf
100 700 Td
(Documento de Teste - RPA DemoQA) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000400 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
477
%%EOF"""
        with open(caminho, "wb") as arquivo:
            arquivo.write(conteudo_pdf)
        logger.info(f"  ✓ PDF criado (minimal): {caminho}")


# funcao principal
async def principal():
    # executa todos os cenarios de teste um depois do outro
    logger.info("=" * 60)
    logger.info("RPA DemoQA - Início da Execução")
    logger.info(f"Timestamp: {datetime.now().isoformat()}")
    logger.info("=" * 60)

    # marca o horario de inicio pra calcular duracao depois
    tempo_inicio = datetime.now()
    resultados = {}

    # verifica se o playwright ta instalado
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        logger.error("Playwright não instalado. Execute: pip install playwright && playwright install")
        sys.exit(1)

    # inicia o playwright e executa os testes
    async with async_playwright() as playwright:
        # tenta iniciar o navegador em modo visual primeiro
        try:
            navegador, contexto, pagina = await configurar_navegador(playwright, mostrar_interface=True)
            logger.info("Browser iniciado em modo HEADED (com interface)")
        except Exception:
            # se falhar, usa modo headless (sem interface)
            logger.warning("Modo headed falhou, usando headless")
            navegador, contexto, pagina = await configurar_navegador(playwright, mostrar_interface=False)
            logger.info("Browser iniciado em modo HEADLESS")

        try:
            # executa o cenario 1: text box
            resultados["text_box"] = await cenario_caixa_texto(pagina)
            await pagina.wait_for_timeout(1000)

            # executa o cenario 2: check box
            resultados["check_box"] = await cenario_checkbox(pagina)
            await pagina.wait_for_timeout(1000)

            # executa o cenario 3: web tables
            resultados["web_tables"] = await cenario_tabelas_web(pagina)
            await pagina.wait_for_timeout(1000)

            # executa o cenario 4: upload
            resultados["upload"] = await cenario_upload(pagina)
            await pagina.wait_for_timeout(1000)

        finally:
            # sempre fecha o navegador no final, mesmo se der erro
            await contexto.close()
            await navegador.close()

    # calcula quanto tempo levou a execucao
    tempo_decorrido = (datetime.now() - tempo_inicio).total_seconds()
    
    # cria relatorio final com estatisticas
    relatorio = {
        "execucao": {
            "timestamp_inicio": tempo_inicio.isoformat(),
            "timestamp_fim": datetime.now().isoformat(),
            "duracao_segundos": round(tempo_decorrido, 2),
            "cenarios_executados": len(resultados),
            "cenarios_com_sucesso": sum(1 for resultado in resultados.values() if resultado.get("status") == "sucesso"),
        },
        "resultados": {nome: resultado.get("status", "desconhecido") for nome, resultado in resultados.items()},
    }

    # salva relatorio num arquivo json
    caminho_relatorio = DIRETORIO_SAIDAS / "execution_report.json"
    with open(caminho_relatorio, "w", encoding="utf-8") as arquivo:
        json.dump(relatorio, arquivo, ensure_ascii=False, indent=2)

    # mostra relatorio final no console
    logger.info("\n" + "=" * 60)
    logger.info("RELATÓRIO FINAL")
    logger.info("=" * 60)
    logger.info(f"  Duração: {tempo_decorrido:.1f}s")
    logger.info(f"  Cenários: {relatorio['execucao']['cenarios_com_sucesso']}/{relatorio['execucao']['cenarios_executados']} com sucesso")
    for nome, status in relatorio["resultados"].items():
        icone = "✓" if status == "sucesso" else "✗"
        logger.info(f"  {icone} {nome}: {status}")
    logger.info("=" * 60)


if __name__ == "__main__":
    # executa a funcao principal quando o script eh rodado direto
    asyncio.run(principal())
