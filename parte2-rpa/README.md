# parte 2 - rpa demoqa

automa varios cenarios no site demoqa usando playwright

## como rodar

### 1. instalar dependencias

```bash
pip install -r requirements.txt
python -m playwright install
```

### 2. executar tudo

```bash
python run_all.py
```

pronto, isso roda todos os 4 cenarios automaticamente

## o que o script faz

### cenario 1: text box
- navega pra pagina `/text-box`
- preenche formulario com dados ficticios
- clica em submit
- extrai o resultado que aparece na tela
- salva em `outputs/text_box_result.json`

### cenario 2: check box
- navega pra pagina `/checkbox`
- expande toda a arvore de checkboxes
- seleciona "commands" e "general"
- tira screenshot como evidencia
- salva em `outputs/checkbox_result.json`

### cenario 3: web tables
- navega pra pagina `/webtables`
- extrai todos os dados da tabela
- salva dados brutos em `outputs/webtables_extract.csv`
- calcula estatisticas (media salarios, contagem por departamento)
- salva resumo em `outputs/webtables_summary.json`

### cenario 4: upload
- navega pra pagina `/upload-download`
- faz upload do arquivo `assets/documento_teste.pdf`
- valida se o nome do arquivo aparece na interface
- tira screenshot
- salva em `outputs/upload_result.json`

## outputs gerados

todos os arquivos ficam na pasta `outputs/`:

- `text_box_result.json` - resultado do formulario text box
- `checkbox_result.json` - items selecionados no checkbox
- `webtables_extract.csv` - dados brutos da tabela
- `webtables_summary.json` - resumo com:
  - total de registros
  - media de salarios
  - registros por departamento
- `upload_result.json` - confirmacao do upload
- `execution_report.json` - relatorio final com status de todos os cenarios
- `execution.log` - log completo da execucao
- `videos/` - videos gravados automaticamente pelo playwright
- `checkbox_evidence.png` - screenshot do checkbox
- `upload_evidence.png` - screenshot do upload

## caracteristicas tecnicas

- **waits explicitos**: espera elementos aparecerem antes de interagir
- **retry pattern**: tenta ate 3 vezes se algo falhar
- **logging completo**: salva tudo no arquivo de log + mostra no terminal
- **gravacao de video**: grava automaticamente quando roda em modo headed
- **screenshots**: tira print dos resultados importantes
- **fallbacks**: se um seletor nao funcionar, tenta alternativas

## requisitos

- python 3.10 ou superior
- playwright instalado (roda `python -m playwright install` depois de instalar)

## estrutura do codigo

- `run_all.py` - script principal que roda tudo
- `assets/documento_teste.pdf` - arquivo usado no teste de upload
- `outputs/` - pasta onde ficam todos os resultados (criada automaticamente)

## observacoes

- o script roda em modo headed (com interface) por padrao pra gravar video
- se der erro no modo headed, tenta headless automaticamente
- todos os outputs sao gerados automaticamente, nao precisa fazer nada manual
- o log mostra tudo que ta acontecendo em tempo real

