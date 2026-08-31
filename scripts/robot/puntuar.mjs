// Decide si una oferta es para ella, a cuál de los dos perfiles va y
// qué nota merece de 0 a 10. Son reglas, no un modelo: el texto de los
// portales viene bastante ordenado y una llamada a una API sería el
// único gasto del proyecto.
//
// El motivo se guarda en una frase, porque es lo que se lee en la
// tarjeta y lo que le permite fiarse o no de la nota.
import {
  EXCLUIR,
  PERFILES,
  TITULOS_QUE_NO_TIENE,
  TITULOS_QUE_TIENE,
  WATCHLIST,
  ZONA_BARCELONA,
} from "./perfiles.mjs";
import { sinTildes } from "./extraer.mjs";

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Palabra entera, no trozo de palabra. Buscando "patrón" a lo bruto
// salían ofertas de patronaje de vestidos de novia, porque "patronista"
// contiene "patron".
const hay = (t, lista) =>
  lista.some((p) =>
    new RegExp(`(^|[^a-z0-9])${escapar(sinTildes(p))}(s|es|a|as)?([^a-z0-9]|$)`).test(t)
  );

// ¿Le piden un título que no tiene? Entonces no es una oferta para ella,
// por bien que encaje en todo lo demás. Si el anuncio acepta además uno
// de los suyos ("patrón portuario o PPER"), sí puede presentarse.
export function fueraDeSuAlcance(texto) {
  const t = sinTildes(texto);
  if (!hay(t, TITULOS_QUE_NO_TIENE)) return false;
  return !hay(t, TITULOS_QUE_TIENE);
}

export function watchlistHit(oferta) {
  const t = sinTildes(`${oferta.puesto} ${oferta.barco ?? ""} ${oferta.texto}`);
  return WATCHLIST.find((w) => w.alias.some((a) => t.includes(a)))?.barco ?? null;
}

// La criba: ¿esto es siquiera un puesto de cubierta o de patrón, y puede
// ella presentarse? Solo con lo que ya trae la tarjeta del listado. Se usa
// antes de bajar ninguna ficha: de cada diez anuncios de estos portales,
// ocho son de moto de agua o de sala de máquinas. Pedirles la ficha
// sería castigar su servidor para nada, y encima acaban cortando.
export function pareceRelevante({ puesto = "", categoria = "", empresa = "" }) {
  if (hay(sinTildes(`${puesto} ${empresa ?? ""}`), EXCLUIR)) return false;
  // Si el propio título ya exige un papel que no tiene, ni se baja la ficha.
  if (fueraDeSuAlcance(puesto)) return false;
  const todo = sinTildes(`${puesto} ${categoria ?? ""}`);
  return hay(todo, PERFILES.barcelona.puestos) || hay(todo, PERFILES.embarque.puestos);
}

// Las dos pestañas separan una sola cosa: irse de temporada o dormir en
// casa. Por eso decide dónde está la oferta, no cómo se llame el puesto.
// Un patrón en Menorca es un embarque; un marinero de puerto en Badalona
// es trabajo de casa.
export function perfilDe(oferta) {
  if (!pareceRelevante(oferta)) return null;
  return oferta.zona === "barcelona" ? "barcelona" : "embarque";
}

function puntuarEmbarque(o) {
  const p = PERFILES.embarque;
  const razones = [];
  let nota;

  const vela = o.tipo === "velero" || o.tipo === "goleta";

  if (o.eslora && o.eslora >= p.esloraObjetivo && vela) {
    nota = 10;
    razones.push(`Vela de ${o.eslora} m, justo tu objetivo`);
  } else if (o.eslora && o.eslora >= p.esloraObjetivo) {
    nota = 8;
    razones.push(`Barco de ${o.eslora} m`);
  } else if (o.eslora && o.eslora >= p.esloraMinima) {
    nota = 6;
    razones.push(`${o.eslora} m, por debajo de tu objetivo`);
  } else if (o.eslora) {
    nota = 4;
    razones.push(`Solo ${o.eslora} m`);
  } else {
    nota = 6;
    razones.push(vela ? "Vela, sin eslora indicada" : "Sin eslora indicada");
  }

  if (o.salarioMin && o.periodo === "mes") {
    if (o.salarioMin >= p.salarioReferencia) {
      nota += 1;
      razones.push("salario por encima de tu referencia");
    } else if (o.salarioMin < 2500) {
      nota -= 1;
      razones.push("salario por debajo de referencia");
    }
  }

  if (o.duracion === "temporada") razones.push("temporada");
  if (o.duracion === "dia") nota -= 1;

  // Los títulos que le faltan no descartan, pero pesan.
  if (o.eng1) nota -= 2;
  if (o.pb2) nota -= 1;

  return { nota, razones };
}

function puntuarBarcelona(o) {
  const p = PERFILES.barcelona;
  const razones = [];
  let nota;

  // Aquí ya solo llegan ofertas del área de Barcelona. Lo que decide la
  // nota es si además es el puesto para el que tiene el título.
  if (hay(sinTildes(o.puesto), p.puestos)) {
    nota = 9;
    razones.push(o.puerto ? `Patrón en ${o.puerto}, duermes en casa` : "Patrón, duermes en casa");
  } else {
    nota = 6;
    razones.push(o.puerto ? `${o.puerto}, duermes en casa` : "En tu zona, duermes en casa");
  }

  if (o.eslora && o.eslora >= p.esloraMinima && o.eslora <= p.esloraMaxima) {
    razones.push(`${o.eslora} m, tu titulación llega`);
  } else if (o.eslora && o.eslora > p.esloraMaxima) {
    nota -= 1;
    razones.push(`${o.eslora} m, por encima de patrón portuario`);
  }

  if (o.salarioMin && o.periodo === "mes") {
    if (o.salarioMin >= p.salarioReferencia) {
      nota += 1;
      razones.push("salario por encima de tu referencia");
    } else if (o.salarioMin < 2000) {
      nota -= 2;
      razones.push("salario bajo");
    }
  }

  return { nota, razones };
}

export function puntuar(oferta) {
  const perfil = perfilDe(oferta);
  if (!perfil) return null;

  // Con el texto completo delante, segunda comprobación: el requisito
  // suele estar en el cuerpo del anuncio, no en el titular.
  if (fueraDeSuAlcance(`${oferta.puesto} ${oferta.texto ?? ""}`)) return null;

  const watchlist = watchlistHit(oferta);
  const { nota, razones } =
    perfil === "embarque" ? puntuarEmbarque(oferta) : puntuarBarcelona(oferta);

  const final = nota;

  // Un barco donde ya ha navegado va primero, pase lo que pase.
  if (watchlist) {
    return {
      perfil,
      score: 10,
      motivo: `Barco de tu lista: ya navegaste en el ${watchlist}`,
      watchlist,
    };
  }

  return {
    perfil,
    score: Math.max(0, Math.min(10, Math.round(final))),
    motivo: razones.join(", ").replace(/^./, (c) => c.toUpperCase()),
    watchlist: null,
  };
}

export { ZONA_BARCELONA };
