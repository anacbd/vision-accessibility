export const PYTHON_SOURCE_CODE = `#!/usr/bin/env python3
"""
=============================================================================
Assistente de Acessibilidade Visual em Tempo Real com Google Gemini & OpenCV
=============================================================================
Desenvolvido com padrão de Engenharia de IA Sênior para Sistemas Multimodais.
Utiliza o SDK Oficial \`google-genai\` e processamento assíncrono multithread.

Recursos:
- Captura contínua de webcam via OpenCV sem congelamento de interface (30+ FPS).
- Thread de inferência assíncrona consumindo o frame mais recente via Queue.
- Integração com Gemini 3.6 Flash usando \`google-genai\`.
- System Instructions especializadas em acessibilidade e audiodescrição concisa.
- Renderização de HUD com texto quebrado (word-wrap) e fundo de alto contraste.
- Opcional: Narração por voz (Text-to-Speech) em thread dedicada com \`pyttsx3\`.
=============================================================================
"""

import os
import sys
import time
import queue
import threading
from typing import Optional

# Tratamento de dependências essenciais
try:
    import cv2
    import numpy as np
    from PIL import Image
    from dotenv import load_dotenv
    from google import genai
    from google.genai import types
except ImportError as e:
    print(f"[-] Erro ao importar bibliotecas: {e}")
    print("[!] Execute: pip install google-genai opencv-python numpy pillow python-dotenv pyttsx3")
    sys.exit(1)

# Suporte opcional a voz (TTS)
HAVE_TTS = False
try:
    import pyttsx3
    HAVE_TTS = True
except ImportError:
    pass

# Carrega variáveis do arquivo .env
load_dotenv()


# =============================================================================
# PROMPT DE SISTEMA (SYSTEM INSTRUCTIONS) ESPECIALIZADO EM ACESSIBILIDADE
# =============================================================================
SYSTEM_INSTRUCTIONS = """Você é um Assistente Visual de Acessibilidade em Tempo Real de alta precisão para pessoas com deficiência visual ou baixa visão.
Seu objetivo é analisar a imagem capturada pela câmera e fornecer uma audiodescrição extremamente útil, concisa e focada na independência e segurança do usuário.

REGRAS DE FORMATAÇÃO E RESPOSTA:
1. ESTRUTURA DIRETA (Máximo de 2 a 3 frases objetivas):
   - [CENA]: Ambiente imediato e contexto (ex: "Você está em um escritório em frente a uma bancada de trabalho").
   - [OBJETOS & ESPAÇO]: Liste os 2 ou 3 objetos mais críticos com posição espacial em relação ao usuário (ex: "Garrafa de água à sua direita, notebook fechado no centro, cabo solto no chão à frente").
   - [TEXTO/TELAS]: Se houver placas, telas de computadores, avisos ou rótulos legíveis, leia o texto chave com precisão.
2. NUNCA use introduções genéricas como "Na imagem vejo...", "Esta foto mostra..." ou "Percebo que...". Vá direto aos fatos.
3. Se houver algum perigo iminente (degrau, obstáculo de tropeço, líquido derramado, borda de mesa), alerte IMEDIATAMENTE no início da fala com "Atenção:".
4. Responda em Português do Brasil com linguagem clara, direta e natural.
"""


class AccessibilityVisionAssistant:
    """
    Controlador principal do Assistente de Visão para Acessibilidade.
    Coordena as threads de captura de vídeo, inferência de IA e síntese de voz.
    """

    def __init__(
        self,
        camera_index: int = 0,
        model_name: str = "gemini-3.6-flash",
        analysis_interval: float = 3.0,
        enable_tts: bool = True,
    ):
        self.camera_index = camera_index
        self.model_name = model_name
        self.analysis_interval = analysis_interval
        self.enable_tts = enable_tts and HAVE_TTS

        # Validação da Chave de API
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("[ERRO CRÍTICO] Variável GEMINI_API_KEY não encontrada no .env!")
            print("Obtenha gratuitamente em: https://aistudio.google.com/")
            sys.exit(1)

        # Inicialização do cliente oficial Google GenAI
        print(f"[*] Inicializando cliente Google GenAI ({self.model_name})...")
        self.client = genai.Client(api_key=api_key)

        # Controle de concorrência e estado
        self.is_running = True
        self.latest_description = "Iniciando visão artificial... Posicione a câmera."
        self.last_analysis_timestamp = 0.0
        self.is_ai_busy = False
        self.lock = threading.Lock()

        # Fila de frames para a thread de IA (tamanho 1 para descartar frames antigos)
        self.frame_queue: queue.Queue = queue.Queue(maxsize=1)
        self.tts_queue: queue.Queue = queue.Queue(maxsize=3)

        # Threads auxiliares
        self.ai_thread = threading.Thread(target=self._ai_worker_loop, daemon=True)
        self.tts_thread = threading.Thread(target=self._tts_worker_loop, daemon=True)

    def start(self):
        """Inicia a captura de vídeo e as threads de trabalho."""
        self.ai_thread.start()
        if self.enable_tts:
            self.tts_thread.start()

        self._video_capture_loop()

    def _ai_worker_loop(self):
        """Thread assíncrona consumindo frames e consultando o Gemini sem travar a interface."""
        while self.is_running:
            try:
                frame = self.frame_queue.get(timeout=0.5)
            except queue.Empty:
                continue

            try:
                with self.lock:
                    self.is_ai_busy = True

                t_start = time.time()

                # Redimensiona para otimizar velocidade de upload e latência (largura 640px)
                height, width = frame.shape[:2]
                target_width = 640
                if width > target_width:
                    scaling_factor = target_width / float(width)
                    new_height = int(height * scaling_factor)
                    frame_to_send = cv2.resize(frame, (target_width, new_height), interpolation=cv2.INTER_AREA)
                else:
                    frame_to_send = frame

                # Codifica para JPEG em memória
                success, encoded_image = cv2.imencode(
                    ".jpg", frame_to_send, [int(cv2.IMWRITE_JPEG_QUALITY), 80]
                )
                if not success:
                    continue

                image_bytes = encoded_image.tobytes()

                # Chamada oficial da API usando SDK google-genai
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                        "Descreva os elementos essenciais desta cena para uma pessoa cega: ambiente, localização de objetos e textos.",
                    ],
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_INSTRUCTIONS,
                        temperature=0.2,
                        top_p=0.9,
                    ),
                )

                elapsed = time.time() - t_start
                description = response.text.strip() if response.text else "Sem descrição retornada."

                with self.lock:
                    self.latest_description = description

                print(f"\\n[AI - {elapsed:.2f}s]: {description}")

                if self.enable_tts:
                    try:
                        self.tts_queue.put_nowait(description)
                    except queue.Full:
                        pass

            except Exception as ex:
                print(f"[-] Erro na chamada Gemini: {ex}")
                with self.lock:
                    self.latest_description = "Falha temporária de conexão com o Gemini."
            finally:
                with self.lock:
                    self.is_ai_busy = False
                self.frame_queue.task_done()

    def _tts_worker_loop(self):
        """Thread de Text-to-Speech com pyttsx3 para audiodescrição."""
        try:
            engine = pyttsx3.init()
            engine.setProperty("rate", 185)
        except Exception:
            return

        while self.is_running:
            try:
                text_to_speak = self.tts_queue.get(timeout=0.5)
            except queue.Empty:
                continue

            try:
                engine.say(text_to_speak)
                engine.runAndWait()
            except Exception:
                pass
            finally:
                self.tts_queue.task_done()

    def _draw_hud(self, frame: np.ndarray) -> np.ndarray:
        """Renderiza HUD acessível no frame com caixa semitransparente e word-wrap."""
        overlay = frame.copy()
        h, w = frame.shape[:2]

        with self.lock:
            text = self.latest_description
            is_busy = self.is_ai_busy

        # Barra de status superior
        banner_h = 42
        cv2.rectangle(overlay, (0, 0), (w, banner_h), (25, 25, 25), -1)

        status_color = (0, 165, 255) if is_busy else (0, 220, 100)
        status_text = "IA PROCESSANDO NOVO FRAME..." if is_busy else "ASSISTENTE ATIVO (GEMINI)"
        cv2.circle(overlay, (20, 21), 7, status_color, -1)
        cv2.putText(overlay, status_text, (35, 27), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)

        # Painel inferior para audiodescrição
        hud_h = 130
        hud_y = h - hud_h
        cv2.rectangle(overlay, (0, hud_y), (w, h), (15, 15, 15), -1)
        cv2.line(overlay, (0, hud_y), (w, hud_y), (70, 70, 70), 1)

        cv2.putText(overlay, "AUDIODESCRICAO DE ACESSIBILIDADE:", (15, hud_y + 24), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 200, 255), 1, cv2.LINE_AA)

        # Word-Wrap para OpenCV
        words = text.split()
        lines, current_line = [], []
        max_chars = max(35, int(w / 11))
        for word in words:
            if len(" ".join(current_line + [word])) <= max_chars:
                current_line.append(word)
            else:
                lines.append(" ".join(current_line))
                current_line = [word]
        if current_line:
            lines.append(" ".join(current_line))

        y_text = hud_y + 50
        for line in lines[:3]:
            cv2.putText(overlay, line, (15, y_text), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (245, 245, 245), 1, cv2.LINE_AA)
            y_text += 24

        cv2.putText(overlay, "Pressione 'q' para sair", (w - 180, banner_h - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (180, 180, 180), 1, cv2.LINE_AA)

        alpha = 0.85
        return cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)

    def _video_capture_loop(self):
        """Loop principal de captura com OpenCV."""
        cap = cv2.VideoCapture(self.camera_index)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        if not cap.isOpened():
            print(f"[-] Erro ao acessar webcam (índice {self.camera_index}).")
            self.is_running = False
            return

        window_title = "Assistente de Acessibilidade - Gemini Vision AI"
        cv2.namedWindow(window_title, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(window_title, 1024, 600)

        print("[+] Câmera iniciada com sucesso! Pressione 'q' para sair.")

        try:
            while self.is_running:
                ret, frame = cap.read()
                if not ret:
                    break

                now = time.time()
                with self.lock:
                    ai_busy = self.is_ai_busy

                if not ai_busy and (now - self.last_analysis_timestamp >= self.analysis_interval):
                    self.last_analysis_timestamp = now
                    if not self.frame_queue.empty():
                        try:
                            self.frame_queue.get_nowait()
                        except queue.Empty:
                            pass
                    self.frame_queue.put_nowait(frame.copy())

                annotated_frame = self._draw_hud(frame)
                cv2.imshow(window_title, annotated_frame)

                key = cv2.waitKey(1) & 0xFF
                if key == ord("q") or key == 27:
                    break

        finally:
            self.is_running = False
            cap.release()
            cv2.destroyAllWindows()


if __name__ == "__main__":
    assistant = AccessibilityVisionAssistant(
        camera_index=int(os.getenv("CAMERA_INDEX", "0")),
        model_name=os.getenv("GEMINI_MODEL", "gemini-3.6-flash"),
        analysis_interval=float(os.getenv("ANALYSIS_INTERVAL_SECONDS", "3.0")),
        enable_tts=os.getenv("ENABLE_VOICE_NARRATION", "True").lower() in ("true", "1", "yes"),
    )
    assistant.start()
`;

export const REQUIREMENTS_TXT = `google-genai>=1.0.0
opencv-python>=4.8.0
numpy>=1.24.0
pillow>=10.0.0
python-dotenv>=1.0.0
pyttsx3>=2.90
`;

export const ENV_EXAMPLE = `# Chave da API do Google Gemini
# Obtenha sua chave gratuita em: https://aistudio.google.com/
GEMINI_API_KEY=AIzaSy...sua_chave_aqui

# Modelo Gemini (gemini-3.6-flash recomendado)
GEMINI_MODEL=gemini-3.6-flash

# Intervalo entre análises da IA (em segundos)
ANALYSIS_INTERVAL_SECONDS=3.0

# Índice da webcam (0 para câmera interna padrão)
CAMERA_INDEX=0

# Ativar sintetizador de voz Text-to-Speech (True / False)
ENABLE_VOICE_NARRATION=True
`;

export const SYSTEM_INSTRUCTIONS_TEXT = `Você é um Assistente Visual de Acessibilidade em Tempo Real de alta precisão para pessoas com deficiência visual ou baixa visão.
Seu objetivo é analisar a imagem capturada pela câmera e fornecer uma audiodescrição extremamente útil, concisa e focada na independência e segurança do usuário.

REGRAS DE FORMATAÇÃO E RESPOSTA:
1. ESTRUTURA DIRETA (Máximo de 2 a 3 frases objetivas):
   - [CENA]: Ambiente imediato e contexto (ex: "Você está em um escritório em frente a uma bancada de trabalho").
   - [OBJETOS & ESPAÇO]: Liste os 2 ou 3 objetos mais críticos com posição espacial em relação ao usuário (ex: "Garrafa de água à sua direita, notebook fechado no centro, cabo solto no chão à frente").
   - [TEXTO/TELAS]: Se houver placas, telas de computadores, avisos ou rótulos legíveis, leia o texto chave com precisão.
2. NUNCA use introduções genéricas como "Na imagem vejo...", "Esta foto mostra..." ou "Percebo que...". Vá direto aos fatos.
3. Se houver algum perigo iminente (degrau, obstáculo de tropeço, líquido derramado, borda de mesa), alerte IMEDIATAMENTE no início da fala com "Atenção:".
4. Responda em Português do Brasil com linguagem clara, direta e natural.`;

export const README_TEXT = `# 👁️ Assistente de Acessibilidade Visual em Tempo Real com OpenCV & Google Gemini

Sistema multimodal de visão computacional em tempo real para auxílio a pessoas com deficiência visual ou baixa visão. Utiliza OpenCV para captura fluida a 30+ FPS, Gemini 3.6 Flash via SDK oficial \`google-genai\` para audiodescrições espaciais concisas, e síntese de voz offline (pyttsx3).

## Requisitos
- Python 3.10+
- Webcam
- Chave de API do Google Gemini (https://aistudio.google.com/)

## Instalação Rápida
\`\`\`bash
python3 -m venv venv
source venv/bin/activate  # No Windows: .\\venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
\`\`\`

## Configuração do .env
\`\`\`env
GEMINI_API_KEY=AIzaSy...sua_chave_aqui
GEMINI_MODEL=gemini-3.6-flash
ANALYSIS_INTERVAL_SECONDS=3.0
CAMERA_INDEX=0
ENABLE_VOICE_NARRATION=True
\`\`\`

## Execução
\`\`\`bash
python accessibility_assistant.py
\`\`\`
Pressione 'q' na janela de vídeo para encerrar.
`;
