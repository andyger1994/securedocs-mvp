import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liconex | Documentación interactiva",
  description: "Documentación interactiva para instalaciones de seguridad electrónica",
  icons: {
    icon: "/brand/liconex-mark.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col">
        <div className="min-h-0 flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
