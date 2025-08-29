export type TemplateType = 'none' | 'bottomBar' | 'cornerTag' | 'textOverlay';

export interface BrandingOptions {
  overlayText: string;
  colors: { brand: string; accent: string; text: string; bar: string };
  font: string;
  template: TemplateType;
  showOverlay: boolean;
  logoDataUrl: string | null;
  logoEnabled: boolean;
  logoSize: number;         // relative width 0.05 - 0.5
  logoPos: { x: number; y: number }; // 0..1
  textPos: { x: number; y: number }; // 0..1
}

export interface GeneratedContent {
  title: string;
  description: string;
  keywords: string[];
}