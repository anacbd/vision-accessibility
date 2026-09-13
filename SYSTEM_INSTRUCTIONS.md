# Engenharia de Prompt: System Instructions para Acessibilidade Visual

## O Desafio da Audiodescrição em Tempo Real
Em sistemas de assistência visual para pessoas cegas ou com baixa visão, descrições prolixas ou poéticas são prejudiciais. O usuário precisa de **informações acionáveis**, **alta velocidade de processamento cognitivo** e **referência espacial imediata** ("à sua esquerda", "à sua frente", "no centro").

---

## O Prompt de Sistema (System Instructions)

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

---

## Por que esta formulação é ideal para acessibilidade?

1. **Eliminação de 'AI Filler'**: Proíbe expressamente locuções como *"Nesta imagem podemos observar um homem..."*. Em audiodescrição em tempo real, cada segundo de atraso na informação pode ser a diferença entre desviar de um obstáculo ou tropeçar.
2. **Gramática Espacial**: Obriga a IA a posicionar objetos no espaço relacional (*"à sua esquerda"*, *"à sua direita"*, *"no centro"*, *"ao alcance da mão"*).
3. **Detecção Prioritária de Texto (OCR Contextual)**: Se o usuário estiver apontando a câmera para uma caixa de remédios, porta de elevador, tela ou embalagem, o texto é extraído imediatamente.
4. **Trigger de Perigo (Early Warning)**: O comando de prefixar *"Atenção:"* garante que o sistema de voz (TTS) ou o leitor de tela do usuário vocalize o perigo de imediato antes de detalhes secundários.
5. **Temperatura Baixa (0.2)**: Garante respostas estritamente factuais, sem alucinações criativas.
