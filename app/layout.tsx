import type { Metadata, Viewport } from "next";
import { BASE } from "@/lib/constantes";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cuaderno de bitácora",
  description: "Ofertas de embarque y de patrón, en un sitio.",
  // En el iPad, añadida a la pantalla de inicio, se abre sin barra del
  // navegador y con la cabecera metida bajo la barra de estado.
  appleWebApp: {
    capable: true,
    title: "Bitácora",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: `${BASE}/icono-180.png`,
    icon: `${BASE}/icono-512.png`,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#10222E",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
