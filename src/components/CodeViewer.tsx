import React, { useState } from "react";
import { Copy, Check, Download, FileCode, CheckCircle2 } from "lucide-react";
import {
  PYTHON_SOURCE_CODE,
  REQUIREMENTS_TXT,
  ENV_EXAMPLE,
  SYSTEM_INSTRUCTIONS_TEXT,
} from "../data/pythonCode";

export const CodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<"python" | "requirements" | "env" | "instructions">("python");
  const [copied, setCopied] = useState(false);

  const getFileContent = () => {
    switch (selectedFile) {
      case "python":
        return { content: PYTHON_SOURCE_CODE, filename: "accessibility_assistant.py" };
      case "requirements":
        return { content: REQUIREMENTS_TXT, filename: "requirements.txt" };
      case "env":
        return { content: ENV_EXAMPLE, filename: ".env.example" };
      case "instructions":
        return { content: SYSTEM_INSTRUCTIONS_TEXT, filename: "SYSTEM_INSTRUCTIONS.txt" };
    }
  };

  const { content, filename } = getFileContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Seleção de Arquivo e Ações */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Abas de Arquivos */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedFile("python")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              selectedFile === "python"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>accessibility_assistant.py</span>
          </button>

          <button
            onClick={() => setSelectedFile("requirements")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              selectedFile === "requirements"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>requirements.txt</span>
          </button>

          <button
            onClick={() => setSelectedFile("env")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
              selectedFile === "env"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>.env.example</span>
          </button>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copiado para a área de transferência!" : "Copiar Código"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar {filename}</span>
          </button>
        </div>
      </div>

      {/* Destaques Técnicos do Código */}
      {selectedFile === "python" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Concorrência Não-Bloqueante</span>
            </div>
            <p className="text-slate-400">
              O loop OpenCV (<code className="text-slate-300">cv2.imshow</code>) roda a 30+ FPS contínuos; a IA processa em thread separada com <code className="text-slate-300">Queue(maxsize=1)</code>.
            </p>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SDK Oficial Google GenAI</span>
            </div>
            <p className="text-slate-400">
              Usa <code className="text-slate-300">from google import genai</code> com suporte aos modelos mais recentes (<code className="text-slate-300">gemini-3.6-flash</code>).
            </p>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>HUD Otimizado & Word-Wrap</span>
            </div>
            <p className="text-slate-400">
              Algoritmo de quebra de linhas para <code className="text-slate-300">cv2.putText</code> com fundo escuro semitransparente para máxima legibilidade.
            </p>
          </div>
        </div>
      )}

      {/* Visualizador de Código com Numeração de Linhas */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>{filename}</span>
          <span>{content.split("\n").length} linhas</span>
        </div>

        <div className="p-4 overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-800">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            {content.split("\n").map((line, idx) => (
              <div key={idx} className="flex hover:bg-slate-900/50 px-2 py-0.5 rounded">
                <span className="w-10 text-slate-600 select-none text-right pr-4 shrink-0 font-mono">
                  {idx + 1}
                </span>
                <span className="whitespace-pre">{line}</span>
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
};
