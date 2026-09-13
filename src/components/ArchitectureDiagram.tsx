import React from "react";
import { Layers, Video, ArrowRight, Brain, Volume2, ShieldCheck, Zap } from "lucide-react";

export const ArchitectureDiagram: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          Arquitetura Multithread e Processamento Assíncrono
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Para que o vídeo na tela permaneça fluido (30 a 60 FPS) e sem travamentos perceptíveis enquanto a API de IA
          responde via internet, dividimos a aplicação em <strong>três threads concorrentes desacopladas</strong> via
          filas thread-safe (<code className="text-emerald-300 font-mono">queue.Queue</code>).
        </p>
      </div>

      {/* Diagrama Visual das 3 Threads */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Thread 1: Captura & Display */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 relative">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Video className="w-4 h-4 text-blue-400" />
            Thread Principal (OpenCV)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Responsável pelo loop ininterrupto de captura da webcam via <code className="text-slate-300">cap.read()</code>,
            renderização do HUD com <code className="text-slate-300">cv2.putText</code> e exibição em janela a 30+ FPS.
          </p>
          <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-blue-300">
            taxa de atualização: 30+ FPS contínuos
          </div>
        </div>

        {/* Thread 2: Inferência Multimodal */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 relative">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-emerald-400" />
            Thread Worker (Gemini AI)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Consome o frame mais recente da fila <code className="text-slate-300">Queue(maxsize=1)</code>, faz compressão
            JPEG em memória e executa a chamada ao modelo multimodal sem travar o vídeo.
          </p>
          <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-emerald-300">
            despacho assíncrono via google-genai
          </div>
        </div>

        {/* Thread 3: Síntese de Voz */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 relative">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-purple-400" />
            Thread de Voz (TTS)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Recebe as descrições geradas pela IA e utiliza o motor local <code className="text-slate-300">pyttsx3</code>{" "}
            para narrar com voz em português, evitando filas acumuladas.
          </p>
          <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-purple-300">
            vocalização offline em segundo plano
          </div>
        </div>
      </div>

      {/* Racional de Engenharia: Por que Queue(maxsize=1)? */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          Racional de Engenharia: Prevenção de Backlog e Latência Acumulada
        </h3>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Um dos erros mais comuns em implementações de visão computacional em tempo real é acumular centenas de frames em
            uma fila enquanto a API remota responde. Isso causa uma latência crescente em que a IA descreve o que aconteceu
            há 10 ou 20 segundos atrás.
          </p>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <div className="font-semibold text-emerald-400 font-mono text-xs">
              Estratégia do nosso código (Senior Pattern):
            </div>
            <p className="text-slate-300">
              1. A fila tem capacidade estrita <code className="text-emerald-300">maxsize=1</code>. Se um frame novo chega antes
              do anterior ser processado, o frame obsoleto é descartado imediatamente (<code className="text-emerald-300">get_nowait()</code>).
            </p>
            <p className="text-slate-300">
              2. Um semáforo booleano protegido por <code className="text-emerald-300">threading.Lock()</code> avisa o loop da câmera
              se o modelo está ocupado, evitando sobrecarregar a quota da API e garantindo que o próximo frame enviado seja
              sempre o mais recente possível.
            </p>
            <p className="text-slate-300">
              3. O frame é redimensionado para 640px de largura e codificado em JPEG diretamente na memória RAM (<code className="text-emerald-300">cv2.imencode</code>),
              eliminando leitura e escrita lenta em disco (I/O).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
