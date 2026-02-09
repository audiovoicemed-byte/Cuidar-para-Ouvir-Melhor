
export enum TinnitusType {
  TONAL = 'Agudo (Apito)',
  HISSING = 'Chiado (Vapor)',
  PULSATILE = 'Pulsátil (Coração)',
  CRICKET = 'Grilo (Intermitente)'
}

export interface SimulationResult {
  type: TinnitusType;
  decipheredCorrectly: boolean;
  feeling: string;
  timestamp: number;
}

export interface InformativePhrase {
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
}
