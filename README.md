# 👁️ Assistente de Acessibilidade Visual em Tempo Real com OpenCV & Google Gemini

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Google GenAI SDK](https://img.shields.io/badge/SDK-google--genai-green.svg)](https://pypi.org/project/google-genai/)
[![Model](https://img.shields.io/badge/Model-Gemini%203.6%20Flash-orange.svg)](https://aistudio.google.com/)
[![OpenCV](https://img.shields.io/badge/Vision-OpenCV%204.x-red.svg)](https://opencv.org/)
[![Status](https://img.shields.io/badge/Status-Produção%20%2F%20Acessibilidade-success.svg)]()

Um sistema multimodal de visão computacional em tempo real projetado especificamente para **pessoas cegas ou com baixa visão**. Utilizando a biblioteca **OpenCV** e o modelo de última geração **Gemini 3.6 Flash** via SDK oficial `google-genai`, a aplicação analisa continuamente a visão da câmera e fornece audiodescrições espaciais diretas, alertas imediatos de perigo e transcrição de textos (OCR), além de síntese de voz (TTS) em segundo plano.

---

## 📑 Sumário

- [Visão Geral e Diferenciais](#-visão-geral-e-diferenciais)
- [Arquitetura Multithread e Concorrência](#-arquitetura-multithread-e-concorrência)
- [Estrutura do Repositório](#-estrutura-do-repositório)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação Passo a Passo](#-instalação-passo-a-passo)
- [Configuração do Arquivo `.env`](#-configuração-do-arquivo-env)
- [Como Executar](#-como-executar)
  - [1. Modo Script Python Local](#1-modo-script-python-local-terminal--webcam)
  - [2. Modo Simulador Web Interativo](#2-modo-estação-web-interativa)
- [Engenharia de Prompt (System Instructions)](#-engenharia-de-prompt-system-instructions)
- [Resolução de Problemas (Troubleshooting)](#-resolução-de-problemas-troubleshooting)
- [Boas Práticas e Segurança](#-boas-práticas-e-segurança)

---

## 🌟 Visão Geral e Diferenciais

Ao contrário de abordagens ingênuas que realizam chamadas HTTP síncronas bloqueando a captura de vídeo, esta solução foi projetada com padrões de engenharia sênior para garantir **baixa latência percebida**, **fluidez absoluta no display** e **qualidade descritiva acessível**:

1. **Vídeo a 30+ FPS Sem Congelamento:** O loop de exibição da câmera nunca é interrompido pelas chamadas de rede à API de IA.
2. **Prevenção de Acúmulo de Latência (Backlog Zero):** Fila thread-safe com capacidade estrita de 1 frame (`Queue(maxsize=1)`). Frames obsoletos são descartados automaticamente se a IA estiver ocupada com uma requisição anterior, garantindo que o modelo **sempre descreva o momento presente**.
3. **Prompt de Sistema Especializado em Audiodescrição:** Elimina floreios e frases prolixas ("Nesta imagem vemos..."). Entrega posicionamento espacial relacional ("à sua direita", "à frente"), transcrição imediata de placas/telas e alertas de obstáculos com prioridade máxima ("Atenção: degrau à frente").
4. **HUD com Alto Contraste e Word-Wrap:** Sobreposição gráfica no vídeo com banner de status em tempo real e caixa escura de alto contraste com quebra automática de linha para leitura em monitores.
5. **Síntese de Voz Offline (TTS):** Despacho das descrições para motor de áudio assíncrono local (`pyttsx3`), permitindo retorno falado em português sem atrasar o processamento visual.

---

## 🧠 Arquitetura Multithread e Concorrência

O sistema opera com **três threads desacopladas** em memória compartilhada protegida por primitivas de sincronização (`threading.Lock`):

```
                        ┌─────────────────────────────────────────┐
                        │        WEBCAM (Hardware de Vídeo)       │
                        └────────────────────┬────────────────────┘
                                             │
                                   cap.read() (30+ FPS)
                                             ▼
                        ┌─────────────────────────────────────────┐
                        │    THREAD 1: Captura & HUD (OpenCV)     │
                        │  - Exibição ininterrupta a 30+ FPS      │
                        │  - Renderização do HUD de alto contraste│
                        │  - Captura de eventos de teclado ('q')  │
                        └───────┬─────────────────────────┬───────┘
                                │                         ▲
        A cada N segundos &     │                         │ Atualiza texto
        se IA estiver ociosa    ▼                         │ compartilhado
                        ┌─────────────────┐               │ (com Lock)
                        │ Queue(maxsize=1)│               │
                        └───────┬─────────┘               │
                                │ get_nowait()            │
                                ▼                         │
                        ┌─────────────────────────────────┴───────┐
                        │    THREAD 2: Inferência (Gemini AI)     │
                        │  - Redimensionamento e compressão JPEG  │
                        │  - google-genai SDK (Gemini 3.6 Flash)  │
                        │  - Execução assíncrona da API           │
                        └───────────────────┬─────────────────────┘
                                            │
                                            │ Envia texto gerado
                                            ▼
                                ┌─────────────────────────┐
                                │    Queue de Áudio TTS   │
                                └───────────┬─────────────┘
                                            ▼
                        ┌─────────────────────────────────────────┐
                        │     THREAD 3: Síntese de Voz (TTS)      │
                        │  - pyttsx3 (motor de voz local)         │
                        │  - Vocalização falada sem travar o app  │
                        └─────────────────────────────────────────┘
```

---

## 📁 Estrutura do Repositório

```
├── accessibility_assistant.py  # Script Python autônomo com OpenCV e Gemini AI
├── requirements.txt            # Dependências Python para execução local
├── .env.example                # Modelo de variáveis de ambiente
├── README.md                   # Esta documentação completa do projeto
├── server.ts                   # Servidor Express de produção e proxy da API Gemini
├── src/
│   ├── App.tsx                 # Interface web interativa (Vite + React)
│   ├── components/
│   │   ├── LiveCameraDemo.tsx  # Simulador interativo com webcam/cenários e TTS no browser
│   │   ├── CodeViewer.tsx      # Visualizador de código Python com destaque de sintaxe
│   │   ├── EnvironmentSetupGuide.tsx # Guia visual de ambiente e terminal
│   │   ├── SystemInstructionsGuide.tsx # Engenharia do prompt de acessibilidade
│   │   └── ArchitectureDiagram.tsx   # Visualizador explicativo de multithreading
│   └── data/
│       └── pythonCode.ts       # Textos e código-fonte sincronizados para a interface
```

---

## 💻 Pré-requisitos

- **Python:** 3.10 ou superior instalado no sistema.
- **Hardware:** Webcam integrada ou câmera externa conectada via USB.
- **Acesso à Internet:** Para comunicação com a API do Google Gemini.
- **Chave de API do Gemini:** Gratuita via [Google AI Studio](https://aistudio.google.com/).

---

## 🚀 Instalação Passo a Passo

### 1. Clonar ou Baixar os Arquivos
Certifique-se de manter o arquivo `accessibility_assistant.py`, `requirements.txt` e `.env` no mesmo diretório de trabalho.

### 2. Criar e Ativar o Ambiente Virtual (Recomendado)

O uso de um ambiente virtual (`venv`) evita conflitos com pacotes globais do sistema:

**No Linux ou macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**No Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**No Windows (Prompt de Comando CMD):**
```cmd
python -m venv venv
.\venv\Scripts\activate.bat
```

### 3. Instalar as Dependências

```bash
pip install -r requirements.txt
```

As principais bibliotecas instaladas são:
- `google-genai`: SDK oficial do Google para os modelos Gemini.
- `opencv-python`: Captura de vídeo em tempo real, manipulação de frames e criação do HUD.
- `numpy`: Vetorização e processamento numérico de matrizes de imagem.
- `pillow`: Suporte e conversão de formatos de imagem.
- `python-dotenv`: Carregamento seguro das configurações do arquivo `.env`.
- `pyttsx3`: Sintetizador Text-to-Speech offline multiplataforma.

---

## ⚙️ Configuração do Arquivo `.env`

Crie um arquivo chamado exatamente `.env` na raiz do projeto (mesma pasta de `accessibility_assistant.py`):

```env
# 1. Chave de API Obrigatória do Google Gemini (https://aistudio.google.com/)
GEMINI_API_KEY=AIzaSy...sua_chave_real_aqui

# 2. Modelo de IA Recomendado para Baixa Latência e Multimodalidade
GEMINI_MODEL=gemini-3.6-flash

# 3. Intervalo em segundos entre cada envio de frame para a IA
ANALYSIS_INTERVAL_SECONDS=3.0

# 4. Índice da Câmera (0 = webcam padrão, 1 ou 2 = câmeras externas USB)
CAMERA_INDEX=0

# 5. Ativar sintetizador de voz falada (True ou False)
ENABLE_VOICE_NARRATION=True
```

---

## 🎬 Como Executar

### 1. Modo Script Python Local (Terminal + Webcam)

Com o ambiente virtual ativado e o arquivo `.env` preenchido:

```bash
python accessibility_assistant.py
```

**O que esperar durante a execução:**
- Uma janela OpenCV intitulada `Assistente de Acessibilidade - Gemini Vision AI` será aberta com a imagem da câmera a 30+ FPS.
- Na parte superior, a barra de status indicará `ASSISTENTE ATIVO (GEMINI)` em verde, alternando suavemente para `IA PROCESSANDO NOVO FRAME...` em âmbar a cada ciclo de análise.
- Na parte inferior, o painel de alto contraste exibirá a descrição em texto quebrado automaticamente.
- No terminal, cada resposta é exibida com o tempo exato de resposta da API (ex: `[GEMINI AI - 0.78s]: ...`).
- Caso `ENABLE_VOICE_NARRATION=True`, o sistema vocalizará as descrições em voz alta.
- **Para encerrar:** Selecione a janela do vídeo e pressione a tecla `q` (ou aperte `Ctrl + C` no terminal).

---

### 2. Modo Estação Web Interativa

Esta aplicação conta com uma interface web de suporte desenvolvida em React + Vite e Express:
- **Simulador de Câmera:** Teste a IA multimodal diretamente no navegador usando sua webcam ou cenários de teste pré-definidos (escritório, rótulo de remédio, travessia com obstáculos, etc.).
- **Voz Integrada no Navegador:** Síntese de voz com a API nativa `speechSynthesis`.
- **Guias Interativos:** Visualização dos comandos de terminal, diagramas de concorrência e cópia de snippets em um clique.

---

## 🎯 Engenharia de Prompt (System Instructions)

O sucesso de uma ferramenta de acessibilidade depende da clareza e velocidade de absorção da informação pela pessoa assistida. As instruções do sistema no script foram desenhadas com 4 pilares:

```text
Você é um Assistente Visual de Acessibilidade em Tempo Real de alta precisão para pessoas com deficiência visual ou baixa visão.
Seu objetivo é analisar a imagem capturada pela câmera e fornecer uma audiodescrição extremamente útil, concisa e focada na independência e segurança do usuário.

REGRAS DE FORMATAÇÃO E RESPOSTA:
1. ESTRUTURA DIRETA (Máximo de 2 a 3 frases objetivas):
   - [CENA]: Ambiente imediato e contexto (ex: "Você está em um escritório em frente a uma bancada de trabalho").
   - [OBJETOS & ESPAÇO]: Liste os 2 ou 3 objetos mais críticos com posição espacial em relação ao usuário (ex: "Garrafa de água à sua direita, notebook fechado no centro, cabo solto no chão à frente").
   - [TEXTO/TELAS]: Se houver placas, telas de computadores, avisos ou rótulos legíveis, leia o texto chave com precisão.
2. NUNCA use introduções genéricas como "Na imagem vejo...", "Esta foto mostra..." ou "Percebo que...". Vá direto aos fatos.
3. Se houver algum perigo iminente (degrau, obstáculo de tropeço, líquido derramado, borda de mesa), alerte IMEDIATAMENTE no início da fala com "Atenção:".
4. Responda em Português do Brasil com linguagem clara, direta e natural.
```

### Por que essa estrutura é superior?
| Abordagem Padrão (Sem System Prompt) | Abordagem Deste Assistente |
| :--- | :--- |
| ❌ *"Nesta imagem muito bonita podemos ver uma sala de escritório com iluminação natural e uma caneca..."* | ✅ *"Você está em um escritório. Notebook no centro e uma caneca quente à sua direita ao alcance da mão."* |
| ❌ Demora mais de 10 segundos de leitura para revelar o que importa. | ✅ Informação acionável entregue nos primeiros 2 segundos. |
| ❌ Não informa se o objeto está à esquerda, à direita ou no centro. | ✅ Orientação espacial relativa direta para localização tátil. |
| ❌ Ignora textos pequenos ou trata como detalhe secundário. | ✅ Transcreve rótulos, preços e avisos instantaneamente (OCR contextual). |

---

## 🔧 Resolução de Problemas (Troubleshooting)

### 1. Erro: `ApiError 404: This model models/gemini-2.5-flash is no longer available`
- **Causa:** Modelos anteriores foram descontinuados na API do Google AI Studio.
- **Solução:** No seu arquivo `.env`, certifique-se de configurar `GEMINI_MODEL=gemini-3.6-flash`.

### 2. Câmera não abre ou exibe tela preta (`cap.isOpened() == False`)
- **Causa:** Índice de câmera incorreto ou câmera em uso por outro aplicativo (Zoom, Meet, Teams).
- **Solução:** 
  1. Feche outros aplicativos que estejam usando a câmera.
  2. Altere `CAMERA_INDEX=1` ou `CAMERA_INDEX=2` no arquivo `.env` para apontar para a câmera correta.

### 3. Permissão de câmera negada no macOS
- **Solução:** No macOS, abra *Preferências do Sistema > Privacidade e Segurança > Câmera* e certifique-se de que o **Terminal**, **iTerm** ou **VS Code** possuem permissão marcada para acessar a câmera.

### 4. Erro de áudio no Linux (`pyttsx3` ou `espeak`)
- **Solução:** Em distribuições baseadas em Debian/Ubuntu, instale o motor de voz e os drivers ALSA via terminal:
  ```bash
  sudo apt-get update
  sudo apt-get install espeak espeak-data libespeak1
  ```

---

## 🔒 Boas Práticas e Segurança

- **Proteja sua Chave de API:** Nunca versione seu arquivo `.env` no Git. Mantenha `.env` devidamente incluído no `.gitignore`.
- **Taxa de Chamadas e Quota:** O parâmetro `ANALYSIS_INTERVAL_SECONDS=3.0` foi calibrado para fornecer descrições frequentes e atualizadas enquanto permanece confortavelmente dentro dos limites gratuitos de requisições por minuto (RPM) do Google AI Studio.

---

Desenvolvido para máxima acessibilidade, autonomia e segurança de pessoas com deficiência visual. ♿💙
