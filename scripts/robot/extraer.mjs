// Saca de un texto libre los datos que la pantalla necesita: eslora,
// salario, tipo de barco, requisitos y demás. Lo que no aparece se
// queda a null y así se muestra: "salario no indicado" es información,
// no un hueco que haya que rellenar inventando.
import { CARIBE, MEDITERRANEO, ZONA_BARCELONA } from "./perfiles.mjs";

export const sinTildes = (s = "") =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const contiene = (texto, lista) => lista.some((p) => texto.includes(sinTildes(p)));

// ── Eslora ────────────────────────────────────────────────────
// "yate de 37 metros", "45m sailing schooner", "Swan 60", "110 ft"
export function eslora(texto) {
  const t = sinTildes(texto);

  const pies = t.match(/(\d{2,3})\s*(?:ft|pies|feet|')\b/);
  if (pies) return Math.round(Number(pies[1]) * 0.3048);

  // Los anuncios de yate escriben "70m+", "40+m MY" o "60m".
  const masMenos = t.match(/(\d{2,3})\s*\+?\s*m\b|\b(\d{2,3})\s*\+\s*m/);
  if (masMenos) {
    const n = Number(masMenos[1] ?? masMenos[2]);
    if (n >= 6 && n <= 200) return n;
  }

  const metros = t.match(/(\d{2,3})[.,]?\d*\s*(?:m\b|mts\b|metros|meters)/);
  if (metros) {
    const n = Number(metros[1]);
    if (n >= 6 && n <= 200) return n;
  }

  // "yate de 37", "barco de 24"
  const suelto = t.match(/(?:yate|barco|velero|goleta|catamaran|motora|lancha|embarcacion)\s+de\s+(\d{2,3})\b/);
  if (suelto) {
    const n = Number(suelto[1]);
    if (n >= 6 && n <= 200) return n;
  }
  return null;
}

// ── Salario ───────────────────────────────────────────────────
// Devuelve siempre euros al mes, o al día si el anuncio va por jornada.
export function salario(texto) {
  const t = sinTildes(texto).replace(/\./g, "").replace(/,(\d{2})\b/g, "");

  const anual = t.match(/(\d{4,6})\s*(?:€|eur|euros)?\s*(?:\/|al |por |\s)?\s*(?:anual|ano|anuales)/);
  if (anual) {
    const n = Number(anual[1]);
    if (n >= 9000 && n <= 200000) return { min: Math.round(n / 12), periodo: "mes" };
  }

  const dia = t.match(/(\d{2,4})\s*(?:€|eur|euros)\s*(?:\/|al |por |\s)?\s*(?:dia|day|jornada)/);
  if (dia) {
    const n = Number(dia[1]);
    if (n >= 40 && n <= 900) return { min: n, periodo: "dia" };
  }

  const mes = t.match(/(\d{3,5})\s*(?:€|eur|euros)\s*(?:\/|al |por |\s)?\s*(?:mes|month|mensual)/);
  if (mes) {
    const n = Number(mes[1]);
    if (n >= 600 && n <= 20000) return { min: n, periodo: "mes" };
  }

  // Una cifra con símbolo y sin periodo: se asume mensual si encaja.
  const suelto = t.match(/(\d{3,5})\s*(?:€|eur\b|euros)/);
  if (suelto) {
    const n = Number(suelto[1]);
    if (n >= 900 && n <= 12000) return { min: n, periodo: "mes" };
  }
  return { min: null, periodo: null };
}

// ── Tipo de barco ─────────────────────────────────────────────
export function tipoBarco(texto) {
  const t = sinTildes(texto);
  if (contiene(t, ["goleta", "schooner"])) return "goleta";
  if (contiene(t, ["catamaran", "lagoon", "sunreef"])) return "catamaran";
  // En los anuncios de yate: S/Y es vela y M/Y es motor.
  if (/\bs\s*\/\s*y\b|\bsy\b/.test(t)) return "velero";
  if (contiene(t, ["velero", "vela", "sailing", "sailboat", "swan", "ketch", "sloop"]))
    return "velero";
  if (/\bm\s*\/\s*y\b|\bmy\b/.test(t)) return "motor";
  if (contiene(t, ["motora", "lancha", "motor yacht", "a motor", "semirrigida", "neumatica"]))
    return "motor";
  return null;
}

// ── Duración y alojamiento ────────────────────────────────────
export function duracion(texto, jornada = "") {
  const t = sinTildes(texto + " " + jornada);
  if (contiene(t, ["day work", "daywork", "jornada suelta", "por dias", "dia suelto", "puntual"]))
    return "dia";
  if (contiene(t, ["rotacion", "rotation", "rotativo", ":1"])) return "rotacion";
  if (contiene(t, ["temporada", "season", "verano", "estival", "temporal"])) return "temporada";
  if (contiene(t, ["indefinido", "todo el ano", "permanente", "estable", "anual"]))
    return "indefinido";
  return null;
}

export function alojamiento(texto) {
  const t = sinTildes(texto);
  if (contiene(t, ["a bordo", "live aboard", "liveaboard", "alojamiento incluido", "manutencion"]))
    return "a_bordo";
  return "no_indicado";
}

// ── Requisitos que a ella le faltan ───────────────────────────
export const pideEng1 = (texto) => /\beng\s?-?1\b/i.test(sinTildes(texto));

export const pidePb2 = (texto) =>
  /powerboat\s*(level)?\s*2|\bpb\s?2\b/i.test(sinTildes(texto));

// ── Lugar ─────────────────────────────────────────────────────
const SIN_LUGAR = ["cualquier lugar", "any", "worldwide", "varios", "a convenir", "-"];

// Muchos anuncios dejan el campo de sitio en "Cualquier lugar" y luego
// dicen el puerto en el título. Eso no es un lugar: devuelve null y se
// busca en el texto.
export function lugarUtil(lugar = "") {
  const l = sinTildes(lugar).trim();
  if (!l || SIN_LUGAR.includes(l)) return null;
  return lugar.trim();
}

// "Mediterranean" no es un puerto: es medio mundo. Muchos anuncios de
// yate ponen solo eso, y esas ella ni las mira.
const LUGARES_VAGOS = [
  "mediterranean", "mediterraneo", "med", "med season", "europe", "europa",
  "caribbean", "caribe", "worldwide", "global", "atlantic", "atlantico",
  "south pacific", "pacific", "west indies", "various", "varios",
  "international", "internacional", "usa", "tbc", "tba",
];

export function lugarConcreto(lugar = "") {
  const l = lugarUtil(lugar);
  if (!l) return false;
  // "Palma / Mediterranean" sí vale: queda un puerto de verdad.
  return sinTildes(l)
    .split(/[,/&+·|]|\band\b|\bor\b|\by\b/)
    .map((t) => t.trim())
    .filter(Boolean)
    .some((t) => !LUGARES_VAGOS.includes(t));
}

// La costa española del Mediterráneo es Mediterráneo. Parece obvio, pero
// estaba contando como "España" y por eso el filtro de Mediterráneo se
// dejaba fuera media Costa Brava, Levante y Andalucía oriental.
const MED_ESPANA = [
  // Costa Brava y Cataluña fuera del área de Barcelona
  "palamos", "roses", "l escala", "escala", "empuriabrava", "sant feliu",
  "platja d aro", "lloret", "girona", "costa brava", "cadaques",
  "llanca", "port de la selva", "torroella", "estartit", "tossa",
  "tarragona", "cambrils", "salou", "l ampolla", "sant carles",
  // Levante
  "vinaros", "peniscola", "castellon", "burriana", "sagunto", "gandia",
  "javea", "altea", "calpe", "santa pola", "alicante", "torrevieja",
  "murcia", "cartagena", "pinatar", "horadada", "mazarron",
  // Andalucía mediterránea y Estrecho
  "almeria", "aguadulce", "motril", "malaga", "marbella", "benalmadena",
  "fuengirola", "estepona", "puerto banus", "sotogrande", "algeciras",
  "ceuta", "melilla",
];

// España de fuera del Mediterráneo: Atlántico, Cantábrico y Canarias.
const ESPANA = [
  "espana", "spain", "galicia", "vigo", "coruna", "ferrol", "pontevedra",
  "sanxenxo", "santander", "bilbao", "getxo", "san sebastian",
  "asturias", "gijon", "aviles", "huelva", "ayamonte", "cadiz",
  "chiclana", "sevilla", "sanlucar", "rota", "puerto de santa maria",
  "canarias", "tenerife", "las palmas", "lanzarote", "fuerteventura",
  "gran canaria", "la gomera", "la palma",
];

// ── Zona ──────────────────────────────────────────────────────
export function zona(lugar = "", texto = "") {
  const util = lugarUtil(lugar);
  // Sin lugar declarado, el puerto suele estar en el título.
  const l = sinTildes(util ?? texto.slice(0, 200));
  const todo = sinTildes(`${lugar} ${texto}`);

  if (contiene(l, ZONA_BARCELONA)) return "barcelona";
  if (contiene(todo, CARIBE)) return "caribe";
  if (contiene(l, MED_ESPANA) || contiene(l, MEDITERRANEO)) return "mediterraneo";
  if (contiene(l, ESPANA)) return "espana";
  if (contiene(todo, ZONA_BARCELONA)) return "barcelona";
  if (contiene(todo, MED_ESPANA) || contiene(todo, MEDITERRANEO)) return "mediterraneo";
  if (contiene(todo, ESPANA)) return "espana";
  return "global";
}

// ── Barco ─────────────────────────────────────────────────────
// Solo cuando el nombre aparece claro. Antes inventarse nada, null.
export function barco(texto) {
  const m =
    texto.match(/\b(Xarifa(?:\s+1927)?)\b/i) ||
    texto.match(/\b(Alma Explorer)\b/i) ||
    texto.match(/\b(Swan|Baltic|Wally|Lagoon|Sunreef|Perini Navi|Oyster|Nautor)\s+(\d{2,3})\b/i);
  if (!m) return null;
  return m[2] ? `${m[1]} ${m[2]}` : m[1];
}
