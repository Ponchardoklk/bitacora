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
  if (contiene(t, ["velero", "vela", "sailing", "sailboat", "swan", "ketch", "sloop"]))
    return "velero";
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

const ESPANA = [
  "espana", "spain", "malaga", "cadiz", "chiclana", "murcia", "alicante",
  "castellon", "tarragona", "galicia", "vigo", "coruna", "santander",
  "bilbao", "asturias", "canarias", "tenerife", "las palmas", "lanzarote",
  "almeria", "huelva", "sevilla", "marbella", "benalmadena", "sotogrande",
  "torrevieja", "cartagena", "pinatar", "horadada", "gandia", "javea",
  "estepona", "fuengirola", "puerto banus", "algeciras", "ceuta", "melilla",
  "santa pola", "denia", "altea", "calpe", "burriana", "peniscola",
  "san sebastian", "getxo", "gijon", "aviles", "ferrol", "pontevedra",
  "sanxenxo", "cambrils", "salou", "l ampolla", "sant carles", "vinaros",
];

// Costa catalana fuera del área metropolitana: sigue siendo España,
// pero conviene reconocerla para no mandarla a "global".
const CATALUNA = [
  "palamos", "roses", "l escala", "escala", "empuriabrava", "sant feliu",
  "platja d aro", "blanes", "lloret", "girona", "costa brava", "cadaques",
  "llanca", "port de la selva", "torroella", "estartit", "calella",
  "sant pol", "malgrat", "pineda", "canet", "sant vicenc", "tossa",
];

// ── Zona ──────────────────────────────────────────────────────
export function zona(lugar = "", texto = "") {
  const util = lugarUtil(lugar);
  // Sin lugar declarado, el puerto suele estar en el título.
  const l = sinTildes(util ?? texto.slice(0, 200));
  const todo = sinTildes(`${lugar} ${texto}`);

  if (contiene(l, ZONA_BARCELONA)) return "barcelona";
  if (contiene(l, CATALUNA)) return "espana";
  if (contiene(todo, CARIBE)) return "caribe";
  if (contiene(l, MEDITERRANEO)) return "mediterraneo";
  if (contiene(l, ESPANA)) return "espana";
  if (contiene(todo, ZONA_BARCELONA)) return "barcelona";
  if (contiene(todo, CATALUNA) || contiene(todo, ESPANA)) return "espana";
  if (contiene(todo, MEDITERRANEO)) return "mediterraneo";
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
