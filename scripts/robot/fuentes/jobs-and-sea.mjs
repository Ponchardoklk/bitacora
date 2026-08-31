// jobsandsea.com — listado propio, ordenable por fecha y con hasta 60
// ofertas por página. La tarjeta ya trae categoría, lugar, fecha y
// salario, así que la ficha solo se pide para el texto largo.
//
// Alguna ficha suelta devuelve un 500 en su servidor. Está previsto:
// la oferta entra igual con lo que traía la tarjeta.
import { bajar, capturar, respirar, texto } from "../html.mjs";
import { fueraDeSuAlcance, pareceRelevante } from "../puntuar.mjs";

const RAIZ = "https://www.jobsandsea.com";
const PAGINAS = [`${RAIZ}/job?limit=60&orderby=new`, `${RAIZ}/job?limit=60&orderby=new&page=2`];

export const nombre = "Jobs&Sea";

const fechaEs = (s) => {
  const m = (s || "").match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return new Date(`${m[3]}-${m[2]}-${m[1]}T09:00:00Z`).toISOString();
};

function leerTarjeta(trozo) {
  const url = (trozo.match(/href="(https?:\/\/[^"]*\/job\/[^"]+)"/) || [])[1];
  if (!url) return null;

  const puesto = capturar(trozo, /<h4>\s*<a[^>]*>([\s\S]*?)<\/a>/);
  if (!puesto) return null;

  // job-info trae categoría, lugar, fecha y salario, pero no siempre los
  // cuatro ni en el mismo orden. Cada uno lleva su icono, así que se
  // identifican por ahí y no por la posición, que engaña.
  const info = (trozo.match(/<ul class="job-info">([\s\S]*?)<\/ul>/) || [])[1] || "";
  const porIcono = (marca) =>
    capturar(info, new RegExp(`<li>[^<]*<[^>]*${marca}[^>]*>[^<]*<\\/(?:span|img)?>?([^<]*)<\\/li>`, "i")) ||
    capturar(info, new RegExp(`<li>[\\s\\S]*?${marca}[\\s\\S]*?>([^<]*)<\\/li>`, "i"));

  return {
    url,
    puesto,
    empresa: null,
    categoria: porIcono("imagen_categoria") ?? "",
    lugar: porIcono("flaticon-map-locator") ?? "",
    jornada: capturar(trozo, /<li class="time">([\s\S]*?)<\/li>/),
    fecha: fechaEs(porIcono("flaticon-clock-3")),
    salarioTexto: porIcono("flaticon-money") ?? "",
  };
}

async function ficha(url) {
  const html = await bajar(url, { intentos: 2 });
  if (!html) return null;
  const cuerpo = html.match(/<div class="job-detail">([\s\S]*?)<\/div>\s*<div/);
  return { texto: cuerpo ? texto(cuerpo[1]).slice(0, 2000) : null };
}

const MAX_FICHAS = 25;

export async function buscar({ completas = new Set() } = {}) {
  const vistas = new Map();

  for (const pagina of PAGINAS) {
    const html = await bajar(pagina);
    if (!html) continue;
    for (const trozo of html.split('<div class="job-block">').slice(1)) {
      const t = leerTarjeta(trozo);
      if (t && !vistas.has(t.url)) vistas.set(t.url, t);
    }
    await respirar();
  }

  const ofertas = [];
  let fichas = 0;
  let fallosSeguidos = 0;

  for (const t of vistas.values()) {
    const merecePena =
      pareceRelevante(t) && !fueraDeSuAlcance(t.puesto) && !completas.has(t.url) && fichas < MAX_FICHAS && fallosSeguidos < 5;

    let detalle = null;
    if (merecePena) {
      fichas++;
      detalle = await ficha(t.url);
      fallosSeguidos = detalle ? 0 : fallosSeguidos + 1;
      await respirar(1200);
    }

    ofertas.push({
      fuente: nombre,
      ...t,
      fecha: t.fecha ?? null,
      texto: detalle?.texto ?? "",
    });
  }

  return ofertas;
}
