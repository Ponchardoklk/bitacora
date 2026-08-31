// empleanautica.com — WordPress con WP Job Manager.
//
// El listado sale entero en el HTML (40 ofertas), así que no hace falta
// navegador. Dos avisos aprendidos a base de golpes:
//
//   · Su servidor va justo. Devuelve 500 a rachas, incluso al listado, y
//     su propio /wp-json/ contesta "Error de la base de datos". No es
//     cosa nuestra, pero se le pide poco y despacio igualmente.
//   · La paginación por /page/2/ tampoco responde. Se cubren las
//     categorías que le interesan a ella, y solo si el listado ha ido
//     bien: si el sitio está caído, no se insiste.
import { bajar, capturar, respirar, texto } from "../html.mjs";
import { pareceRelevante } from "../puntuar.mjs";

const RAIZ = "https://www.empleanautica.com";

// El listado general trae las 40 más recientes. Las categorías cubren lo
// que se queda por debajo: son justo los tres títulos que ella tiene.
const PAGINAS = [
  `${RAIZ}/empleo-nautico/`,
  `${RAIZ}/categoria-trabajo/patron-portuario/`,
  `${RAIZ}/categoria-trabajo/marinero-de-puente/`,
  `${RAIZ}/categoria-trabajo/marinero-a/`,
];

export const nombre = "Emplea Náutica";

// Tope de fichas por pasada. Las novedades de un día caben de sobra, y
// así una racha de 500 no convierte la tarea en media hora de reintentos.
// Su servidor falla como la mitad de las veces, de ahí que el corte por
// fallos seguidos sea generoso: si fuera estricto no entraría ninguna.
const MAX_FICHAS = 15;

function tarjetas(html) {
  // Se parte por el comienzo de cada <li> de oferta: buscar el </li>
  // de cierre no vale, porque dentro hay listas anidadas.
  return html.split(/<li[^>]*class="post-\d+ job_listing/).slice(1);
}

function leerTarjeta(trozo) {
  const url = (trozo.match(/href="(https?:\/\/[^"]*\/trabajo\/[^"]+)"/) || [])[1];
  if (!url) return null;

  const puesto = capturar(trozo, /<h3[^>]*job-listing-loop-job__title[^>]*>([\s\S]*?)<\/h3>/);
  if (!puesto) return null;

  return {
    url,
    puesto,
    empresa: capturar(trozo, /class="job-listing-company company"[^>]*>\s*<strong>([\s\S]*?)<\/strong>/),
    lugar: capturar(trozo, /class="job-location location"[^>]*>([\s\S]*?)<\/div>/),
    jornada: capturar(trozo, /<li class="job-type[^"]*">([\s\S]*?)<\/li>/),
    categoria: ((trozo.match(/job_listing_category-([a-z0-9-]+)/) || [])[1] || "").replace(/-/g, " "),
  };
}

// La ficha da la fecha exacta y el texto completo, que es de donde
// salen la eslora, el salario y los títulos que piden.
async function ficha(url) {
  const html = await bajar(url);
  if (!html) return null;

  const fecha = (html.match(/<time datetime="(\d{4}-\d{2}-\d{2})"/) || [])[1];
  const cuerpo =
    html.match(/<div class="single-job-listing__description[^"]*">([\s\S]*?)<\/div>\s*<div/) ||
    html.match(/<div class="single-job-listing__description[^"]*">([\s\S]*?)<\/div>/);

  return {
    fecha: fecha ? new Date(`${fecha}T09:00:00Z`).toISOString() : null,
    texto: cuerpo ? texto(cuerpo[1]).slice(0, 2000) : null,
  };
}

export async function buscar({ completas = new Set() } = {}) {
  const vistas = new Map();

  for (const pagina of PAGINAS) {
    const html = await bajar(pagina);
    if (!html) {
      // El listado principal caído significa sitio caído: no se sigue.
      if (pagina === PAGINAS[0]) break;
      continue;
    }
    for (const trozo of tarjetas(html)) {
      const t = leerTarjeta(trozo);
      if (t && !vistas.has(t.url)) vistas.set(t.url, t);
    }
    await respirar(2000);
  }

  const ofertas = [];
  let fichas = 0;
  let fallosSeguidos = 0;

  for (const t of vistas.values()) {
    // Se pide la ficha solo si la oferta puede interesarle y aún no
    // tenemos su texto. Si un día falla, mañana se vuelve a intentar.
    const merecePena =
      pareceRelevante(t) && !completas.has(t.url) && fichas < MAX_FICHAS && fallosSeguidos < 8;

    let detalle = null;
    if (merecePena) {
      fichas++;
      detalle = await ficha(t.url);
      fallosSeguidos = detalle ? 0 : fallosSeguidos + 1;
      await respirar(2000);
    }

    ofertas.push({
      fuente: nombre,
      ...t,
      fecha: detalle?.fecha ?? null,
      texto: detalle?.texto ?? "",
      salarioTexto: "",
    });
  }

  if (fallosSeguidos >= 8) {
    console.warn("  su servidor está devolviendo 500; se deja para mañana");
  }

  return ofertas;
}
