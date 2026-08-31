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
  SOBRECUALIFICADO,
  WATCHLIST,
  ZONA_BARCELONA,
} from "./perfiles.mjs";
import { sinTildes } from "./extraer.mjs";

const hay = (t, lista) => lista.some((p) => t.includes(sinTildes(p)));

export function watchlistHit(oferta) {
  const t = sinTildes(`${oferta.puesto} ${oferta.barco ?? ""} ${oferta.texto}`);
  return WATCHLIST.find((w) => w.alias.some((a) => t.includes(a)))?.barco ?? null;
}

// Primer filtro: ¿esto es siquiera un puesto de cubierta o de patrón?
// Lo que no pasa de aquí no entra en el histórico. Es el único punto
// donde se descarta algo, y a propósito: el resto lo ordena la nota.
// La criba, solo con lo que ya trae la tarjeta del listado. Se usa
// antes de bajar ninguna ficha: de cada diez anuncios de estos portales,
// ocho son de moto de agua o de sala de máquinas. Pedirles la ficha
// sería castigar su servidor para nada, y encima acaban cortando.
export function pareceRelevante({ puesto = "", categoria = "", empresa = "" }) {
  if (hay(sinTildes(`${puesto} ${empresa ?? ""}`), EXCLUIR)) return false;
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

  const watchlist = watchlistHit(oferta);
  const { nota, razones } =
    perfil === "embarque" ? puntuarEmbarque(oferta) : puntuarBarcelona(oferta);

  let final = nota;

  // Piden más titulación de la que tiene.
  if (hay(sinTildes(oferta.puesto), SOBRECUALIFICADO)) {
    final -= 3;
    razones.push("piden más titulación de la que tienes");
  }

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
