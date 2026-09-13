import React, { useState } from "react";
import { BookOpen, Copy, Check, Sparkles, CheckCircle, XCircle } from "lucide-react";
import { SYSTEM_INSTRUCTIONS_TEXT } from "../data/pythonCode";

export const SystemInstructionsGuide: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SYSTEM_INSTRUCTIONS_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Bloco 1: Introdução */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              Engenharia de Prompt para Acessibilidade Visual
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Como formatar o System Instructions para que o Gemini gere audiodescrições objetivas, espaciais e úteis
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copiado!" : "Copiar Prompt do Sistema"}</span>
          </button>
        </div>
      </div>

      {/* Bloco 2: O Prompt em Destaque */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 font-mono text-xs text-slate-200 leading-relaxed space-y-2">
        <div className="text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          SYSTEM_INSTRUCTIONS (Configuração Oficial no SDK)
        </div>
        <pre className="whitespace-pre-wrap text-slate-300 font-mono text-xs bg-slate-900/80 p-4 rounded-lg border border-slate-800">
          {SYSTEM_INSTRUCTIONS_TEXT}
        </pre>
      </div>

      {/* Bloco 3: Comparativo de Qualidade (Slop vs Acessibilidade) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exemplo Inadequado */}
        <div className="bg-slate-900 border border-rose-900/40 rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
            <XCircle className="w-4 h-4" />
            <span>Resposta Típica Inadequada (Sem System Prompt)</span>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-rose-950 text-xs text-slate-300 italic">
            "Olá! Nesta imagem muito bonita, podemos observar uma cena de escritório durante o dia com boa iluminação.
            Há uma mesa feita de madeira clara, onde está repousando um notebook moderno e também uma caneca de café
            que parece saborosa. É um ambiente propício para o trabalho produtivo."
          </div>
          <ul className="text-xs text-rose-300 space-y-1 list-disc list-inside">
            <li>Prolixa e cheia de adjetivos irrelevantes ("muito bonita", "saborosa").</li>
            <li>Não informa posições espaciais ("à direita", "à esquerda").</li>
            <li>Atraso cognitivo: demora 10 segundos de leitura para chegar ao objeto.</li>
          </ul>
        </div>

        {/* Exemplo Adequado */}
        <div className="bg-slate-900 border border-emerald-900/40 rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Resposta com nosso System Prompt Especializado</span>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-emerald-950 text-xs text-slate-200 font-medium">
            "Você está em frente a uma mesa de trabalho. Há um notebook aberto no centro e uma caneca quente logo à sua
            direita ao alcance da mão. Texto detectado na tela: 'Reunião às 14h'."
          </div>
          <ul className="text-xs text-emerald-300 space-y-1 list-disc list-inside">
            <li>Direta, factual e imediata (apenas 2 frases acionáveis).</li>
            <li>Posicionamento espacial explícito para orientação tátil segura.</li>
            <li>Extração instantânea de texto legível (OCR contextual).</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
