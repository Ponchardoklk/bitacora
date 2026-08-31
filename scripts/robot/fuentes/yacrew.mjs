// yacrew.com — bolsa internacional de tripulación de yate.
//
// Es la que más volumen aporta con diferencia: solo en "Deckhand" tiene
// más de cien ofertas abiertas. Son de superyate y casi todas fuera de
// España, así que valen para la pestaña de Embarque, no para Barcelona.
//
// Lo bueno: el listado ya trae título, descripción, fecha y zona. No hay
// que entrar en ninguna ficha, así que se le piden seis páginas y ya.
import { bajar, respirar, texto } from "../html.mjs";

const RAIZ = "https://www.yacrew.com";

// Se buscan los puestos de su nivel. La categoría entera de cubierta
// está llena de capitanes y primeros oficiales, que se caen luego por
// titulación: mejor no traerlos.
//
// Ojo con la paginación: la página dice "112 ofertas, 9 páginas", pero
// en el HTML solo vienen 5 por página; el resto lo pinta con JavaScript.
// Por eso se piden varias páginas en vez de una.
const paginas = (puesto, hasta) =>
  Array.from({ length: hasta }, (_, i) =>
    i === 0 ? `${RAIZ}/search/${puesto}/` : `${RAIZ}/search/${puesto}/${i + 1}/`
  );

const BUSQUEDAS = [
  ...paginas("Deckhand", 6),
  ...paginas("Junior+Deckhand", 2),
  ...paginas("Lead+Deckhand", 2),
  ...paginas("Mate", 2),
];

export const nombre = "YaCrew";

const MESES = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

// El resumen viene como "9 August 2026 - Caribbean & South Pacific".
function leerResumen(resumen = "") {
  const m = resumen.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  const fecha =
    m && MESES[m[2].toLowerCase()] !== undefined
      ? new Date(Date.UTC(Number(m[3]), MESES[m[2].toLowerCase()], Number(m[1]), 9)).toISOString()
      : null;

  // Lo que va detrás del guion es la zona; se le quitan las marcas del
  // portal ("Approved", "Featured") que van pegadas detrás.
  const lugar = (resumen.split(/\s[-–]\s/)[1] ?? "")
    .replace(/✔|Approved|Featured|Exclusive/gi, "")
    .trim();

  return { fecha, lugar };
}

export async function buscar() {
  const vistas = new Map();

  for (const pagina of BUSQUEDAS) {
    const html = await bajar(pagina);
    if (!html) continue;

    // Cada oferta es un <li> dentro de <ol class="results2">.
    for (const trozo of html.split('<li class="clearfix">').slice(1)) {
      const enlace = trozo.match(/<h2><a href="([^"]+)">([\s\S]*?)<\/a><\/h2>/);
      if (!enlace) continue;

      const url = enlace[1];
      if (vistas.has(url)) continue;

      const parrafos = [...trozo.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g)].map((m) =>
        texto(m[1])
      );
      const resumen = parrafos.find((p) => /\d{4}/.test(p)) ?? "";
      const descripcion = parrafos.find((p) => p !== resumen && p.length > 40) ?? "";
      const { fecha, lugar } = leerResumen(resumen);

      vistas.set(url, {
        fuente: nombre,
        url,
        puesto: texto(enlace[2]),
        empresa: null,
        lugar,
        jornada: "",
        categoria: "deck",
        salarioTexto: "",
        fecha,
        texto: descripcion,
      });
    }
    await respirar(1500);
  }

  return [...vistas.values()];
}
