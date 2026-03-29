export type SupportedLanguage = 'es' | 'en';
export type LocalizedString = string | Record<string, string>;

export function resolveLocalized(value: LocalizedString | undefined, lang: SupportedLanguage): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] ?? value['es'] ?? Object.values(value)[0] ?? '';
}

export interface Novel {
  id: string;
  title: string;
  titleChinese: string;
  genre: string;
  description: string;
  coverColor: string;
  chapters: string[];
  realms: Realm[];
}

export interface Chapter {
  id: string;
  number: number;
  title: LocalizedString;
  content: LocalizedString;
  stats: CharacterStats;
}

export interface CharacterStats {
  label: string;
  reino: string;
  reinoClass: string;
  talento: string;
  talentoClass: string;
  fuerza: string;
  ubicacion: string;
  abilities: string[];
  copiedTalents: string | null;
  talentos?: TalentStat[];
  edad?: string;
  golpeMax?: string;
  dominioCerebral?: string;
}

export interface TalentStat {
  nombre: string;
  nivel: string;
  tipo: string;
  estado: string;
}

export interface Realm {
  name: string;
  current: boolean;
  revealedAt?: number;
}

export interface ReaderSettings {
  fontSize: number;
  bgColor: string;
  showTalents: boolean;
  showStats: boolean;
  language: SupportedLanguage;
}
