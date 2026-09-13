import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  RefreshCw,
  Play,
  Square,
  Sparkles,
  AlertTriangle,
  Clock,
  Check,
  Copy,
  Sliders,
  Image as ImageIcon,
} from "lucide-react";
import { AnalysisResult } from "../types";

// Cenários de teste pré-definidos caso o usuário não tenha webcam ativa no momento
const SAMPLE_SCENARIOS = [
  {
    id: "office",
    name: "Mesa de Escritório",
    description: "Laptop, caneca à direita e bloco de notas",
    imageUrl:
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "medicine",
    name: "Remédio & Bula",
    description: "Frasco com rótulo legível e texto de dosagem",
    imageUrl:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "hallway",
    name: "Corredor & Degrau",
    description: "Porta de saída com degrau e placa de sinalização",
    imageUrl:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "supermarket",
    name: "Prateleira com Preço",
    description: "Embalagens de alimentos e etiquetas com números",
    imageUrl:
      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80",
  },
];

export const LiveCameraDemo: React.FC = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isContinuous, setIsContinuous] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [enableVoice, setEnableVoice] = useState(true);
  const [analysisInterval, setAnalysisInterval] = useState(3.5);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [currentResult, setCurrentResult] = useState<AnalysisResult>({
    description:
      "Assistente pronto. Ative sua webcam ou selecione um cenário de teste para iniciar a audiodescrição em tempo real.",
    timestamp: new Date().toLocaleTimeString(),
    latencyMs: 0,
    model: "gemini-3.6-flash",
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Iniciar webcam
  const startCamera = async () => {
    setCameraError(null);
    setSelectedSample(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Erro ao acessar câmera:", err);
      setCameraError(
        "Não foi possível acessar a câmera (permissão negada ou dispositivo indisponível). Você pode testar usando um dos cenários pré-configurados abaixo!"
      );
      setIsCameraActive(false);
    }
  };

  // Parar webcam
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsContinuous(false);
  };

  // Síntese de voz com a API nativa Web Speech
  const speakText = useCallback(
    (text: string) => {
      if (!enableVoice || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel(); // Cancela falas anteriores
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "pt-BR";
        utterance.rate = 1.1; // Velocidade ligeiramente mais ágil para acessibilidade
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("Erro ao sintetizar voz:", e);
      }
    },
    [enableVoice]
  );

  // Analisar o frame atual (seja da câmera ou da imagem de exemplo)
  const analyzeFrame = useCallback(async () => {
    if (isAnalyzing) return;

    let base64Data: string | null = null;

    if (isCameraActive && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      // Reduz resolução para 640px de largura para acelerar upload e latência
      const targetWidth = 640;
      const scale = targetWidth / (video.videoWidth || 640);
      const targetHeight = Math.round((video.videoHeight || 480) * scale);

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        base64Data = canvas.toDataURL("image/jpeg", 0.8);
      }
    } else if (selectedSample) {
      // Converte a imagem de exemplo selecionada
      const sample = SAMPLE_SCENARIOS.find((s) => s.id === selectedSample);
      if (sample) {
        try {
          const response = await fetch(sample.imageUrl);
          const blob = await response.blob();
          base64Data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.error("Erro ao carregar imagem de exemplo:", e);
        }
      }
    }

    if (!base64Data) {
      if (!isCameraActive && !selectedSample) {
        // Seleciona o primeiro exemplo automaticamente se nada estiver ativo
        setSelectedSample("office");
      }
      return;
    }

    setIsAnalyzing(true);
    const startTime = performance.now();

    try {
      const res = await fetch("/api/analyze-frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Data,
        }),
      });

      const data = await res.json();
      const elapsed = Math.round(performance.now() - startTime);

      if (data.success && data.description) {
        const result: AnalysisResult = {
          description: data.description,
          timestamp: new Date().toLocaleTimeString(),
          latencyMs: elapsed,
          model: data.model || "gemini-3.6-flash",
        };
        setCurrentResult(result);
        speakText(data.description);
      } else {
        setCurrentResult({
          description: data.error || "Não foi possível obter a descrição da cena.",
          timestamp: new Date().toLocaleTimeString(),
          latencyMs: elapsed,
          model: data.model || "gemini-3.6-flash",
        });
      }
    } catch (err: any) {
      console.error("Erro na requisição /api/analyze-frame:", err);
      setCurrentResult({
        description: "Erro de conexão ao contatar o modelo Gemini.",
        timestamp: new Date().toLocaleTimeString(),
        latencyMs: Math.round(performance.now() - startTime),
        model: "gemini-3.6-flash",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, isCameraActive, selectedSample, speakText]);

  // Controle do ciclo contínuo de captura e análise (Loop em background)
  useEffect(() => {
    if (isContinuous) {
      // Faz uma análise imediatamente
      analyzeFrame();
      timerRef.current = setInterval(() => {
        analyzeFrame();
      }, analysisInterval * 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isContinuous, analysisInterval, analyzeFrame]);

  // Cleanup de câmera ao desmontar
  useEffect(() => {
    return () => {
      stopCamera();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentResult.description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Barra de Controles Principais */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Botões de Ação da Câmera */}
          <div className="flex flex-wrap items-center gap-3">
            {!isCameraActive ? (
              <button
                id="btn-start-camera"
                onClick={startCamera}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>Ativar Minha Webcam</span>
              </button>
            ) : (
              <button
                id="btn-stop-camera"
                onClick={stopCamera}
                className="flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
              >
                <CameraOff className="w-4 h-4" />
                <span>Desativar Câmera</span>
              </button>
            )}

            {/* Alternar Modo Contínuo */}
            <button
              id="btn-toggle-continuous"
              onClick={() => setIsContinuous(!isContinuous)}
              disabled={!isCameraActive && !selectedSample}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                isContinuous
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 disabled:opacity-50"
              }`}
            >
              {isContinuous ? <Square className="w-4 h-4 fill-amber-300" /> : <Play className="w-4 h-4 fill-slate-300" />}
              <span>{isContinuous ? "Parar Modo Contínuo" : "Loop Contínuo (Real-Time)"}</span>
            </button>

            {/* Botão de Disparo Manual */}
            <button
              id="btn-single-capture"
              onClick={analyzeFrame}
              disabled={isAnalyzing || (!isCameraActive && !selectedSample)}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg border border-slate-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? "animate-spin text-emerald-400" : ""}`} />
              <span>{isAnalyzing ? "Analisando..." : "Analisar Frame Agora"}</span>
            </button>
          </div>

          {/* Opções de Áudio e Intervalo */}
          <div className="flex items-center space-x-4">
            <button
              id="btn-toggle-voice"
              onClick={() => {
                setEnableVoice(!enableVoice);
                if (enableVoice && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
              }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                enableVoice
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {enableVoice ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <span>{enableVoice ? "Audiodescrição Ativa" : "Voz Desativada"}</span>
            </button>

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Sliders className="w-3.5 h-3.5" />
              <span>Intervalo:</span>
              <select
                id="select-interval"
                value={analysisInterval}
                onChange={(e) => setAnalysisInterval(parseFloat(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value={2.0}>2.0 segundos</option>
                <option value={3.0}>3.0 segundos (Padrão)</option>
                <option value={4.0}>4.0 segundos</option>
                <option value={5.0}>5.0 segundos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mensagem de Erro de Câmera amigável */}
        {cameraError && (
          <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-xs flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p>{cameraError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Grid Principal: Visor de Vídeo / HUD + Painel de Diagnóstico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Visor de Câmera com HUD estilo OpenCV */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative bg-black rounded-xl overflow-hidden border border-slate-800 aspect-video flex items-center justify-center shadow-lg">
            {/* Elemento de Vídeo real */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${isCameraActive ? "block" : "hidden"}`}
            />

            {/* Imagem de Exemplo selecionada se câmera desligada */}
            {!isCameraActive && selectedSample && (
              <img
                src={SAMPLE_SCENARIOS.find((s) => s.id === selectedSample)?.imageUrl}
                alt="Cenário de teste"
                className="w-full h-full object-cover"
              />
            )}

            {/* Placeholder quando nada está ativo */}
            {!isCameraActive && !selectedSample && (
              <div className="text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-slate-200 font-semibold text-base">Câmera Desconectada</h3>
                <p className="text-slate-400 text-xs max-w-md mx-auto">
                  Ative sua webcam para testar o sistema de audiodescrição em tempo real ou selecione um dos cenários
                  abaixo para simular a visão multimodal do Gemini.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
                  >
                    Ativar Webcam
                  </button>
                  <button
                    onClick={() => setSelectedSample("office")}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700"
                  >
                    Usar Imagem de Teste
                  </button>
                </div>
              </div>
            )}

            {/* HUD Overlay Estilo OpenCV (Barra Superior) */}
            <div className="absolute top-0 left-0 right-0 bg-black/85 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between z-10 backdrop-blur-xs">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-3 h-3 rounded-full animate-pulse ${
                    isAnalyzing ? "bg-amber-400 shadow-[0_0_8px_#f59e0b]" : "bg-emerald-400 shadow-[0_0_8px_#10b981]"
                  }`}
                />
                <span className="text-xs font-mono font-bold tracking-wide text-white uppercase">
                  {isAnalyzing ? "IA PROCESSANDO FRAME..." : "ASSISTENTE ATIVO (GEMINI VISION)"}
                </span>
              </div>

              <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
                {currentResult.latencyMs > 0 && (
                  <span className="flex items-center space-x-1 text-emerald-400">
                    <Clock className="w-3 h-3" />
                    <span>{currentResult.latencyMs}ms</span>
                  </span>
                )}
                <span className="hidden sm:inline bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700">
                  {isContinuous ? "STREAM ASSÍNCRONO" : "FRAME-BY-FRAME"}
                </span>
              </div>
            </div>

            {/* HUD Overlay Estilo OpenCV (Painel Inferior de Audiodescrição) */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/90 border-t border-slate-800 px-4 py-3 z-10 backdrop-blur-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono font-bold text-amber-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Audiodescrição em Tempo Real (Acessibilidade)
                </span>
                <span className="text-[10px] font-mono text-slate-400">{currentResult.timestamp}</span>
              </div>
              <p
                id="hud-description-text"
                className="text-white text-sm font-medium leading-relaxed font-sans line-clamp-3"
              >
                {currentResult.description}
              </p>
            </div>

            {/* Canvas oculto para captura dos frames */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Seletor de Cenários de Teste */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                Cenários de Teste Pré-Configurados (Sem Webcam)
              </h4>
              {selectedSample && (
                <span className="text-xs text-emerald-400 font-medium">Cenário selecionado</span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SAMPLE_SCENARIOS.map((scenario) => {
                const isSelected = selectedSample === scenario.id && !isCameraActive;
                return (
                  <button
                    key={scenario.id}
                    id={`sample-btn-${scenario.id}`}
                    onClick={() => {
                      if (isCameraActive) stopCamera();
                      setSelectedSample(scenario.id);
                    }}
                    className={`text-left p-2.5 rounded-lg border transition-all text-xs space-y-1 ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-200 shadow-sm"
                        : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <div className="font-semibold text-white truncate">{scenario.name}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                      {scenario.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coluna 3: Painel de Informações e Inspeção Multimodal */}
        <div className="space-y-4">
          {/* Card de Transcrição e Ações */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Saída do Gemini Multimodal
              </h3>
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700 transition-colors"
                title="Copiar texto gerado"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs leading-relaxed text-slate-200 font-mono min-h-[140px] whitespace-pre-wrap selection:bg-emerald-800">
              {currentResult.description}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Latência de Rede:</span>
                <span className="text-white font-mono font-bold text-sm">
                  {currentResult.latencyMs > 0 ? `${currentResult.latencyMs} ms` : "--"}
                </span>
              </div>
              <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Modelo em Uso:</span>
                <span className="text-emerald-400 font-mono font-bold text-sm">
                  {currentResult.model || "gemini-3.6-flash"}
                </span>
              </div>
            </div>

            {enableVoice && (
              <button
                onClick={() => speakText(currentResult.description)}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors"
              >
                <Volume2 className="w-4 h-4" />
                <span>Ouvir Audiodescrição Novamente</span>
              </button>
            )}
          </div>

          {/* Dicas de Execução em Python */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Equivalência com o Script Python
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              No script Python (<code className="text-emerald-300 font-mono">accessibility_assistant.py</code>), este
              fluxo é orquestrado por duas threads concorrentes:
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>
                <strong className="text-white">Thread de Vídeo:</strong> Loop OpenCV a 30+ FPS com <code className="text-slate-400">cv2.imshow</code>.
              </li>
              <li>
                <strong className="text-white">Thread Worker:</strong> Fila <code className="text-slate-400">Queue(maxsize=1)</code> para envio contínuo ao Gemini.
              </li>
              <li>
                <strong className="text-white">Thread de Voz:</strong> Síntese de áudio local com <code className="text-slate-400">pyttsx3</code>.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
