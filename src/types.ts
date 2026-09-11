export interface CaseImage {
  id: string;
  format_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface CaseVideo {
  id: string;
  format_id: string;
  video_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  sort_order: number;
  created_at: string;
}

export interface AdFormat {
  id: string;
  title: string;
  vertical: string;
  format_type: string;
  dimensions: string | null;
  description: string | null;
  image_url: string | null;
  tags: string[];
  status: string;
  created_at: string;
  updated_at: string;
  case_images?: CaseImage[];
  case_videos?: CaseVideo[];
  cliente: string | null;
  plataforma: string | null;
  publish_date: string | null;
  video_links: string[];
  additional_formats: string[];
  outros_formato_name: string | null;
  impressoes: number | null;
  alcance: number | null;
  cliques: number | null;
  ctr: number | null;
  visualizacoes: number | null;
  visualizacoes_completas: number | null;
  taxa_conclusao: number | null;
  engajamento: number | null;
  taxa_engajamento: number | null;
  conversoes: number | null;
  outros_resultados: string | null;
}

export interface AdFormatInput {
  title: string;
  vertical: string;
  format_type: string;
  dimensions?: string;
  description?: string;
  image_url?: string;
  tags?: string[];
  status?: string;
  cliente?: string;
  plataforma?: string;
  publish_date?: string;
  video_links?: string[];
  additional_formats?: string[];
  outros_formato_name?: string | null;
  impressoes?: number | null;
  alcance?: number | null;
  cliques?: number | null;
  ctr?: number | null;
  visualizacoes?: number | null;
  visualizacoes_completas?: number | null;
  taxa_conclusao?: number | null;
  engajamento?: number | null;
  taxa_engajamento?: number | null;
  conversoes?: number | null;
  outros_resultados?: string | null;
}

export const VERTICALS = [
  "G1",
  "GE",
  "Globo",
  "Globoplay",
  "GShow",
  "Vídeos",
  "Receitas",
  "Telecine",
  "Premiere",
  "Combate",
  "Outros",
] as const;

export const FORMAT_TYPES = [
  "Home Day",
  "Home Super Premium",
  "Banner Vídeo",
  "Big Banner",
  "Billboard",
  "Maxiboard",
  "Super Leaderboard",
  "Branded Content",
  "Matéria Publicitária",
  "Patrocínio de Editoria",
  "Régua",
  "Widget",
  "Retângulo Médio",
  "Half Page",
  "Vídeo Vertical",
  "Interativo",
  "Carrossel",
  "Super Carrossel",
  "Clickshop",
  "Degustação Patrocinada",
  "Outros",
] as const;

export const PLATFORMS = [
  "Digital",
  "TV",
  "Pay TV",
  "Mobile",
  "Cross Media",
  "Outros",
] as const;

export const STATUS_OPTIONS = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "draft", label: "Rascunho" },
] as const;

export interface MetricDef {
  key: keyof Pick<
    AdFormat,
    | "impressoes"
    | "alcance"
    | "cliques"
    | "ctr"
    | "visualizacoes"
    | "visualizacoes_completas"
    | "taxa_conclusao"
    | "engajamento"
    | "taxa_engajamento"
    | "conversoes"
  >;
  label: string;
  suffix?: string;
  isPercentage?: boolean;
}

export const METRIC_DEFS: MetricDef[] = [
  { key: "impressoes", label: "Impressões" },
  { key: "alcance", label: "Alcance" },
  { key: "cliques", label: "Cliques" },
  { key: "ctr", label: "CTR", suffix: "%", isPercentage: true },
  { key: "visualizacoes", label: "Visualizações" },
  { key: "visualizacoes_completas", label: "Visualizações completas" },
  { key: "taxa_conclusao", label: "Taxa de conclusão", suffix: "%", isPercentage: true },
  { key: "engajamento", label: "Engajamento" },
  { key: "taxa_engajamento", label: "Taxa de engajamento", suffix: "%", isPercentage: true },
  { key: "conversoes", label: "Conversões" },
];

export const HOME_DAY_FORMAT = "Home Day";
export const OUTROS_FORMAT = "Outros";

export function isHomeDay(formatType: string): boolean {
  return formatType === HOME_DAY_FORMAT;
}

export function isOutros(formatType: string): boolean {
  return formatType === OUTROS_FORMAT;
}
