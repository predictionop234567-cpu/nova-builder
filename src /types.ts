export type WebsiteType = 'Landing Page' | 'Portfolio' | 'Business' | 'Blog' | 'Restaurant' | 'Agency' | 'Startup' | 'Ecommerce';
export type DesignStyle = 'Modern' | 'Minimal' | 'Dark' | 'Glass' | 'Corporate' | 'Luxury' | 'Neon' | 'Startup';

export interface WebsiteSettings {
  type: WebsiteType;
  style: DesignStyle;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  options: {
    responsive: boolean;
    animations: boolean;
    seo: boolean;
    accessibility: boolean;
    multipleSections: boolean;
  };
}

export interface GeneratedVersion {
  id: string;
  timestamp: number;
  html: string;
  prompt: string;
  settings: WebsiteSettings;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  lastModified: number;
  versions: GeneratedVersion[];
  currentVersionId: string;
}
