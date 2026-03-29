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
  worldInfo: string[];
  realms: Realm[];
  talentRanks: TalentRank[];
  baseInfo: Record<string, string>;
  baseInfoProgressive?: BaseInfoItem[];
}

export interface Chapter {
  id: string;
  number: number;
  title: LocalizedString;
  content: LocalizedString;
  talents: TalentEntry[];
  stats: CharacterStats;
  characters: string[]; // IDs of characters appearing in this chapter
}

export interface TalentEntry {
  owner: string;
  name: string;
  description?: string;
  tags: TalentTag[];
}

export interface TalentTag {
  label: string;
  type: 'cultivation' | 'ice' | 'copy' | 'awakened' | 'sleeping' | 'weak' | 'hidden' | 'primary' | 'medium';
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
  tipo: string; // cultivation, speed, blade, shadow, healing, strength, fire, etc.
  estado: 'activo' | 'copiado' | 'dormido' | 'por fusionar';
}

export interface Realm {
  name: string;
  current: boolean;
  revealedAt?: number;
}

export interface TalentRank {
  rank: string;
  description: string;
  highlight?: boolean;
  isCurrent?: boolean;
  revealedAt?: number;
  category?: 'cultivation' | 'special';
}

export interface BaseInfoItem {
  key: string;
  value: string;
  revealedAt?: number;
  replacedAt?: number;
}

export interface ReaderSettings {
  fontSize: number;
  bgColor: string;
  showTalents: boolean;
  showStats: boolean;
  language: SupportedLanguage;
}

// ── Characters ──

export interface NovelCharacter {
  id: string;
  name: string;
  nameChinese?: string;
  image?: string;
  role: 'protagonista' | 'principal' | 'secundario' | 'mencion';
  bio: string;
  // Wiki-style structured data
  info: CharacterInfo;
  abilities: CharacterAbility[];
  relationships: CharacterRelationship[];
  chapterAppearances: ChapterAppearance[];
}

export interface CharacterInfo {
  edad?: string;
  genero?: string;
  reino?: string;
  talentoCultivo?: string;
  afiliacion?: string;
  ubicacion?: string;
  estado?: string;
  primerAparicion?: string;
  [key: string]: string | undefined;
}

export interface CharacterAbility {
  name: string;
  type: string; // cultivation, ice, copy, sword, etc.
  rank?: string;
  status: 'activo' | 'dormido' | 'copiado' | 'perdido';
  description?: string;
  acquiredChapter?: number;
}

export interface CharacterRelationship {
  characterId: string;
  characterName: string;
  type: string; // hermana, compañero, rival, maestro, etc.
}

export interface ChapterAppearance {
  chapterId: string;
  chapterNumber: number;
  note: string; // what we learn about this character in this chapter
  statsSnapshot?: Partial<CharacterStats>; // optional stats at this point
}

export interface CharactersData {
  characters: NovelCharacter[];
}
