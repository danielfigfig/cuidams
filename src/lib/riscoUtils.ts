export type ClassificacaoRisco = 'BNC' | 'MNC' | 'ANC' | 'ATNC';

export interface RiscoDetalhado {
  sigla: ClassificacaoRisco;
  nome: string;
  pontos: number;
  corCss: string; // Classes Tailwind
}

export function classificarRisco(pontuacaoTotal: number): RiscoDetalhado {
  if (pontuacaoTotal <= 1) {
    return { sigla: 'BNC', nome: 'Baixa Necessidade de Cuidado', pontos: pontuacaoTotal, corCss: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  }
  if (pontuacaoTotal <= 3) {
    return { sigla: 'MNC', nome: 'Moderada Necessidade de Cuidado', pontos: pontuacaoTotal, corCss: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  }
  if (pontuacaoTotal <= 6) {
    return { sigla: 'ANC', nome: 'Alta Necessidade de Cuidado', pontos: pontuacaoTotal, corCss: 'bg-orange-100 text-orange-800 border-orange-200' };
  }
  return { sigla: 'ATNC', nome: 'Altíssima Necessidade de Cuidado', pontos: pontuacaoTotal, corCss: 'bg-red-100 text-red-800 border-red-200' };
}

export function calcularApenasCertoBloco(bloco: 1 | 2, quantidadeSim: number): number {
  if (bloco === 1) {
    return 17 - quantidadeSim;
  }
  return quantidadeSim;
}
