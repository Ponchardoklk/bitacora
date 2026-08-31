/* Paleta: carta náutica
   papel #E9EEF1 · tinta #10222E · sonda #2C5F7C
   estribor #0E6B44 (nuevo) · babor #9B2C2C (watchlist) */
export const C = {
  papel: "#E9EEF1",
  papelAlt: "#F4F7F8",
  tinta: "#10222E",
  sonda: "#2C5F7C",
  suave: "#5D7688",
  linea: "#C7D5DC",
  estribor: "#0E6B44",
  babor: "#9B2C2C",
  arena: "#D9C9A3",
};

export const serif = 'Georgia, "Times New Roman", serif';
export const sans =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const PERFILES: [string, string][] = [
  ["embarque", "Embarque"],
  ["barcelona", "Patrón Barcelona"],
];

export const ZONAS: [string, string][] = [
  ["barcelona", "Barcelona"],
  ["espana", "España"],
  ["mediterraneo", "Mediterráneo"],
  ["caribe", "Caribe"],
  ["global", "Global"],
];

export const TIPOS: [string, string][] = [
  ["velero", "Velero"],
  ["goleta", "Goleta"],
  ["catamaran", "Catamarán"],
  ["motor", "Motor"],
];

export const DURACIONES: [string, string][] = [
  ["dia", "Día suelto"],
  ["temporada", "Temporada"],
  ["rotacion", "Rotación"],
  ["indefinido", "Indefinido"],
];

export const ESTADOS: [string, string][] = [
  ["nueva", "Nuevas"],
  ["guardada", "Guardadas"],
  ["aplicada", "Aplicadas"],
  ["descartada", "Descartadas"],
];

export const MOTIVOS_DESCARTE = [
  "salario bajo",
  "zona",
  "tipo de puesto",
  "requisitos que no tengo",
];

export const PUBLICADAS: [number, string][] = [
  [0, "Todo el histórico"],
  [2, "Últimas 48 h"],
  [7, "Última semana"],
  [30, "Último mes"],
];

export const etiqueta = (lista: [string, string][], clave: string | null) =>
  lista.find((par) => par[0] === clave)?.[1] ?? clave ?? "";

// El PIN es un pestillo, no una cerradura: la web es estática y el
// repositorio es público, así que quien mire el código lo verá. Sirve
// para que nadie que llegue de rebote se ponga a trastear. Por eso no
// hay aquí ningún dato personal: las notas de ella no salen del móvil.
export const PIN_ACCESO = "1927";
export const CLAVE_ACCESO = "bitacora:acceso";

// De donde sale cada oferta. Cuando el scraper traiga el enlace exacto
// se usa ese; mientras tanto, la web del portal, para que siempre se
// pueda ir a mirar la fuente.
export const WEBS_FUENTE: Record<string, string> = {
  "Emplea Náutica": "https://www.empleanautica.com",
  "Jobs&Sea": "https://www.jobsandsea.com",
  "Noticias Marinas": "https://www.noticiasmarinas.com/empleo",
  InfoJobs: "https://www.infojobs.net",
  Daywork123: "https://www.daywork123.com",
  Bluewater: "https://www.bluewateryachting.com",
  Yotspot: "https://www.yotspot.com",
};

export const enlaceFuente = (fuente: string, url: string | null) =>
  url ?? WEBS_FUENTE[fuente] ?? null;

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
