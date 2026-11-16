
export interface Branding {
  primaryColor: string;
  logoUrl?: string;
  fontFamily?: string;
}

export interface Config {
  name: string;
  branding: Branding;
  defaultLocale: string;
  locales: string[];
}
