// infojobs.net — bolsa generalista.
//
// Está aquí por una razón concreta: es la única de las tres que trae algo
// del área de Barcelona, que es lo que a ella más le interesa. Emplea
// Náutica y Jobs&Sea van casi todas de Baleares y Levante.
//
// A cambio, el ruido es brutal: buscar "patrón" devuelve patronistas de
// vestidos de novia, y "náutica" devuelve dependientes de tienda. La
// criba de puntuar.mjs se encarga, pero por eso aquí no se pide ninguna
// ficha: se trabaja solo con lo que trae la tarjeta del listado y no se
// gasta una sola petición en algo que se va a descartar.
import { capturar, bajar, respirar, texto } from "../html.mjs";

const RAIZ = "https://www.infojobs.net";

const BUSQUEDAS = [
  "marinero/barcelona",
  "patron-portuario/barcelona",
  "amarre/barcelona",
  "nautica/barcelona",
  "marinero",
  "patron-portuario",
];

export const nombre = "InfoJobs";

const MESES = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
};

// Las fechas vienen como "20 jul", "Hoy" o "Ayer".
function fechaDe(txt = "") {
  const t = txt.toLowerCase().trim();
  const hoy = new Date();

  if (t.startsWith("hoy")) return hoy.toISOString();
  if (t.startsWith("ayer")) return new Date(hoy - 86_400_000).toISOString();

  const m = t.match(/(\d{1,2})\s*([a-z]{3})/);
  if (!m || !(m[2] in MESES)) return null;

  const mes = MESES[m[2]];
  // Si el mes va por delante del actual, es del año pasado.
  const anio = mes > hoy.getMonth() ? hoy.getFullYear() - 1 : hoy.getFullYear();
  return new Date(Date.UTC(anio, mes, Number(m[1]), 9)).toISOString();
}

function leerTarjeta(trozo) {
  const ruta = (trozo.match(/href="(\/\/www\.infojobs\.net\/[^"]*of-i[^"?]+)/) || [])[1];
  if (!ruta) return null;

  const puesto =
    capturar(trozo, /class="ij-OfferCardContent-description-title-link">([^<]+)</) ||
    capturar(trozo, /aria-label="([^"]+)"/);
  if (!puesto) return null;

  const datos = [...trozo.matchAll(/class="ij-OfferCardContent-description-list-item[^"]*"[^>]*>([\s\S]*?)<\/li>/g)]
    .map((m) => texto(m[1]))
    .filter(Boolean);

  return {
    url: `https:${ruta}`,
    puesto,
    empresa: capturar(trozo, /id="job-company-[^"]*"[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/),
    // El primero de la lista es siempre la población.
    lugar: datos[0] ?? "",
    jornada: datos.find((d) => /jornada|parcial|completa|indefinid|temporal/i.test(d)) ?? "",
    salarioTexto: datos.find((d) => /€|eur|bruto/i.test(d)) ?? "",
    fecha: fechaDe(datos.find((d) => /^\d{1,2}\s|hoy|ayer/i.test(d)) ?? ""),
    categoria: "",
  };
}

export async function buscar() {
  const vistas = new Map();

  for (const busqueda of BUSQUEDAS) {
    const html = await bajar(`${RAIZ}/ofertas-trabajo/${busqueda}`);
    if (!html) continue;

    for (const trozo of html.split('<h2 id="job-title-').slice(1)) {
      const t = leerTarjeta(trozo);
      if (t && !vistas.has(t.url)) vistas.set(t.url, t);
    }
    await respirar(2500);
  }

  return [...vistas.values()].map((t) => ({
    fuente: nombre,
    ...t,
    // Sin ficha: el texto es lo que se ve en la tarjeta.
    texto: "",
  }));
}
