import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liconex MVP",
  description: "Documentacion interactiva para instalaciones de seguridad electronica"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
