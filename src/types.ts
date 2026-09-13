export interface AnalysisResult {
  description: string;
  timestamp: string;
  latencyMs: number;
  model: string;
}

export type ActiveTab = "demo" | "code" | "setup" | "architecture" | "instructions";

export interface SampleScene {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
}
