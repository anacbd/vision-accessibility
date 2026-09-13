import React, { useState } from "react";
import { Copy, Check, Terminal, Key, ShieldAlert, Cpu } from "lucide-react";

export const EnvironmentSetupGuide: React.FC = () => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Bloco 1: Visão Geral e Requisitos */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          Guia de Instalação e Configuração do Ambiente Python
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Para executar a aplicação em sua máquina local com desempenho em tempo real, recomendamos o uso de um ambiente
          virtual isolado (<code className="text-emerald-300 font-mono">venv</code>). Abaixo estão os comandos completos
          e testados.
        </p>
      </div>

      {/* Bloco 2: Passo a Passo de Instalação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Passo 1: Criar ambiente virtual */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">
                1
              </span>
              Criar e Ativar o Ambiente Virtual
            </h3>
            <button
              onClick={() =>
                copyText("python3 -m venv venv && source venv/bin/activate", "step1")
              }
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded"
            >
              {copiedCmd === "step1" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd === "step1" ? "Copiado" : "Copiar"}</span>
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-slate-400">No Linux / macOS:</p>
            <pre className="bg-slate-950 p-2.5 rounded text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800">
              python3 -m venv venv{"\n"}source venv/bin/activate
            </pre>
            <p className="text-xs text-slate-400 pt-1">No Windows (PowerShell):</p>
            <pre className="bg-slate-950 p-2.5 rounded text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800">
              python -m venv venv{"\n"}.\venv\Scripts\Activate.ps1
            </pre>
          </div>
        </div>

        {/* Passo 2: Instalar dependências */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">
                2
              </span>
              Instalar Dependências via Pip
            </h3>
            <button
              onClick={() =>
                copyText(
                  "pip install google-genai opencv-python numpy pillow python-dotenv pyttsx3",
                  "step2"
                )
              }
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded"
            >
              {copiedCmd === "step2" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCmd === "step2" ? "Copiado" : "Copiar"}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Instale o SDK oficial do Google Gemini e as bibliotecas de visão e áudio:
          </p>
          <pre className="bg-slate-950 p-3 rounded text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800 leading-relaxed">
            pip install google-genai opencv-python numpy pillow python-dotenv pyttsx3
          </pre>
        </div>
      </div>

      {/* Bloco 3: Configuração do Arquivo .env */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Configuração do Arquivo .env</h3>
          </div>
          <button
            onClick={() =>
              copyText(
                `GEMINI_API_KEY=AIzaSy_sua_chave_aqui\nGEMINI_MODEL=gemini-3.6-flash\nANALYSIS_INTERVAL_SECONDS=3.0\nCAMERA_INDEX=0\nENABLE_VOICE_NARRATION=True`,
                "env-file"
              )
            }
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded border border-slate-700"
          >
            {copiedCmd === "env-file" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCmd === "env-file" ? "Copiado" : "Copiar Template .env"}</span>
          </button>
        </div>

        <p className="text-sm text-slate-300">
          Crie um arquivo chamado exatamente <code className="text-emerald-300 font-mono">.env</code> na mesma pasta do
          script <code className="text-emerald-300 font-mono">accessibility_assistant.py</code>:
        </p>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
          <div className="text-slate-500"># 1. Chave de API obrigatória do Google Gemini</div>
          <div className="text-slate-500"># Obtenha gratuitamente em: https://aistudio.google.com/</div>
          <div className="text-emerald-400 font-bold">GEMINI_API_KEY=AIzaSy...sua_chave_real_aqui</div>
          <div className="pt-2 text-slate-500"># 2. Configurações de execução (Opcionais)</div>
          <div>GEMINI_MODEL=gemini-3.6-flash</div>
          <div>ANALYSIS_INTERVAL_SECONDS=3.0</div>
          <div>CAMERA_INDEX=0</div>
          <div>ENABLE_VOICE_NARRATION=True</div>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <p>
            <strong>Boas Práticas de Segurança:</strong> Nunca envie seu arquivo <code className="font-mono">.env</code> para
            repositórios públicos (GitHub, GitLab). Mantenha o arquivo <code className="font-mono">.gitignore</code> contendo a
            linha <code className="font-mono">.env</code>.
          </p>
        </div>
      </div>

      {/* Bloco 4: Dicas de Resolução de Problemas (Troubleshooting) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          Dicas de Resolução de Problemas Comuns
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
            <h4 className="font-bold text-slate-200">Câmera não abre (índice 0)</h4>
            <p className="text-slate-400 leading-relaxed">
              Em sistemas com múltiplos dispositivos de vídeo (ex: DroidCam ou placa de captura), altere{" "}
              <code className="text-emerald-300">CAMERA_INDEX=1</code> ou <code className="text-emerald-300">2</code> no arquivo <code className="text-emerald-300">.env</code>.
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
            <h4 className="font-bold text-slate-200">Permissão de Câmera no macOS</h4>
            <p className="text-slate-400 leading-relaxed">
              O macOS exige autorização explícita para o Terminal ou VS Code em:{" "}
              <em>Preferências do Sistema &gt; Privacidade e Segurança &gt; Câmera</em>.
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
            <h4 className="font-bold text-slate-200">Sintetizador de Voz (pyttsx3)</h4>
            <p className="text-slate-400 leading-relaxed">
              No Linux Ubuntu/Debian, pode ser necessário instalar o driver espeak via terminal:{" "}
              <code className="text-emerald-300">sudo apt-get install espeak</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
