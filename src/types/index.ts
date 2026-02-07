export interface Line {
  target_en: string;
  title_zh: string;
  content_zh: string;
  title_en: string;
  content_en: string;
  [key: string]: string | number; // For dynamic access
}

export interface Character {
  name_en: string;
  name_zh: string;
  lines: Line[];
  [key: string]: any;
}

export interface Stats {
  id: string;
  nodesIn: number;
  nodesOut: number;
  edgesIn: number;
  edgesOut: number;
  nodesConnected: number;
}

export type LayoutName = 'fcose' | 'avsdf' | 'concentric' | 'concentricCustom';

export type Language = 'zh' | 'en';
