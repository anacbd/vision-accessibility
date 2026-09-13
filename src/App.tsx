import React, { useState } from "react";
import { ActiveTab } from "./types";
import { Header } from "./components/Header";
import { LiveCameraDemo } from "./components/LiveCameraDemo";
import { CodeViewer } from "./components/CodeViewer";
import { EnvironmentSetupGuide } from "./components/EnvironmentSetupGuide";
import { SystemInstructionsGuide } from "./components/SystemInstructionsGuide";
import { ArchitectureDiagram } from "./components/ArchitectureDiagram";
import { ShieldCheck, Download, Code2, Terminal } from "lucide-react";
import { PYTHON_SOURCE_CODE, REQUIREMENTS_TXT, README_TEXT } from "./data/pythonCode";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("demo");

  const downloadFile = (content: string, filename: string) => {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Cabeçalho e Navegação */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === "demo" && <LiveCameraDemo />}
        {activeTab === "code" && <CodeViewer />}
        {activeTab === "setup" && <EnvironmentSetupGuide />}
        {activeTab === "instructions" && <SystemInstructionsGuide />}
        {activeTab === "architecture" && <ArchitectureDiagram />}
      </main>

      {/* Rodapé com Acesso Rápido */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Arquitetura Multimodal Sênior: OpenCV + Google GenAI SDK (Gemini 3.6 Flash)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => downloadFile(PYTHON_SOURCE_CODE, "accessibility_assistant.py")}
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Baixar accessibility_assistant.py</span>
            </button>
            <span>•</span>
            <button
              onClick={() => downloadFile(REQUIREMENTS_TXT, "requirements.txt")}
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Baixar requirements.txt</span>
            </button>
            <span>•</span>
            <button
              onClick={() => downloadFile(README_TEXT, "README.md")}
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Baixar README.md</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
