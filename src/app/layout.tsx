import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { BRANDING } from "@/config/branding";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${BRANDING.communityName} – Community Portal`,
  description: BRANDING.appDescription,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Inject primary brand colour as a CSS custom property at the root.
  // Overrides the default in globals.css — change NEXT_PUBLIC_PRIMARY_HSL to re-theme.
  const brandStyle = {
    "--primary": BRANDING.primaryHsl,
    "--ring": BRANDING.primaryHsl,
  } as React.CSSProperties;

  return (
    <html lang="en" style={brandStyle}>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
