import React from "react";
import { ActiveTab } from "../types";
import { Eye, Code2, Terminal, Sparkles, Layers, BookOpen } from "lucide-react";

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: "demo", label: "Simulador ao Vivo", icon: <Eye className="w-4 h-4" /> },
    { id: "code", label: "Código Python Completo", icon: <Code2 className="w-4 h-4" /> },
    { id: "setup", label: "Ambiente & .env", icon: <Terminal className="w-4 h-4" /> },
    { id: "instructions", label: "System Instructions", icon: <BookOpen className="w-4 h-4" /> },
    { id: "architecture", label: "Arquitetura Multithread", icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Logo e Título */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Assistente de Acessibilidade Visual
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                  <Sparkles className="w-3 h-3 mr-1" /> Gemini 3.6 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Visão Computacional em Tempo Real com OpenCV & Google GenAI SDK (Python)
              </p>
            </div>
          </div>

          {/* Abas de Navegação */}
          <nav className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
