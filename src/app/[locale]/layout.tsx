import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { careDeskConfig } from "@/care-desk/config/config";
import "../globals.css";

export const metadata: Metadata = {
  title: careDeskConfig.name,
};

export function generateStaticParams() {
  return careDeskConfig.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!careDeskConfig.locales.includes(locale)) notFound();

  const brandVars = {
    "--cd-primary": careDeskConfig.branding.primaryColor,
    "--cd-font": careDeskConfig.branding.fontFamily ?? "system-ui",
  } as CSSProperties;

  return (
    <html lang={locale} style={brandVars}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
