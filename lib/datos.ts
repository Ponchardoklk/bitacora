export interface Oferta {
  id: string;
  perfil: string;
  puesto: string;
  barco: string | null;
  empresa: string | null;
  eslora: number | null;
  tipo: string | null;
  bandera: string | null;
  zona: string | null;
  puerto: string | null;
  duracion: string | null;
  alojamiento: string | null;
  salarioMin: number | null;
  periodo: string | null;
  eng1: boolean;
  pb2: boolean;
  fuente: string;
  publicada: string;
  score: number;
  motivo: string | null;
  watchlist: string | null;
  texto: string;
  url: string | null;
  // Muchos portales solo dan la fecha dentro de la ficha. Mientras no se
  // haya podido leer, la antigüedad no se enseña: más vale un hueco que
  // un "hace 2 h" que no es verdad.
  fechaFiable?: boolean;
  // Le piden un título que no tiene (PPER, capitán de yate...). No se le
  // enseña, pero se guarda para poder contarle cuántas puertas le cierra
  // cada papel que le falta.
  fueraDeAlcance?: string | null;
  // Las de prueba de la Fase 1. El robot las quita en cuanto trae reales.
  demo?: boolean;
}

// Lo que ella marca. Vive solo en su móvil: nunca sale de ahí ni llega
// al repositorio.
export interface Marca {
  estado: string; // nueva | guardada | aplicada | descartada
  motivoDescarte?: string | null;
  notas?: string | null;
  vista?: boolean;
  aplicadaEn?: string | null; // fecha ISO
}

export type Marcas = Record<string, Marca>;

const CLAVE_MARCAS = "bitacora:marcas";

export const MARCA_VACIA: Marca = { estado: "nueva", vista: false };

export function leerMarcas(): Marcas {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_MARCAS) || "{}") as Marcas;
  } catch {
    return {};
  }
}

export function guardarMarcas(marcas: Marcas) {
  try {
    localStorage.setItem(CLAVE_MARCAS, JSON.stringify(marcas));
  } catch {
    /* si el navegador no deja, al menos la sesión sigue funcionando */
  }
}

export const horasDesde = (iso: string) =>
  Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000));

export const diasDesde = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
