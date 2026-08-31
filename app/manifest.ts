import type { MetadataRoute } from "next";
import { BASE } from "@/lib/constantes";

// Para que en el iPad se pueda añadir a la pantalla de inicio y se abra
// como una app, sin barra del navegador.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cuaderno de bitácora",
    short_name: "Bitácora",
    description: "Ofertas de embarque y de patrón, en un sitio.",
    start_url: `${BASE}/`,
    scope: `${BASE}/`,
    display: "standalone",
    orientation: "any",
    background_color: "#10222E",
    theme_color: "#10222E",
    icons: [
      { src: `${BASE}/icono-180.png`, sizes: "180x180", type: "image/png" },
      {
        src: `${BASE}/icono-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
