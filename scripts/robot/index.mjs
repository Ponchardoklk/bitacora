// El robot. Una vez al día: entra en los portales, se queda con lo que
// es para ella, lo puntúa y lo añade a datos/ofertas.json.
//
//   npm run robot            escribe datos/ofertas.json
//   npm run robot -- --seco  enseña lo que haría, sin tocar nada
//
// Dos reglas que no se negocian:
//   1. Nada se borra. Solo se añade y se mejora lo que ya había.
//   2. Una fuente rota no tumba la ingesta. Cada una va en su try y se
//      apunta cuándo respondió por última vez, para ver cuál lleva días
//      muerta sin tener que adivinarlo.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import * as empleaNautica from "./fuentes/emplea-nautica.mjs";
import * as jobsAndSea from "./fuentes/jobs-and-sea.mjs";
import * as extraer from "./extraer.mjs";
import { puntuar } from "./puntuar.mjs";

const FUENTES = [empleaNautica, jobsAndSea];
const SECO = process.argv.includes("--seco");
const FICHERO = path.join(process.cwd(), "datos", "ofertas.json");

// Barco (o quien publica) + puesto. La misma oferta publicada en dos
// portales cae en el mismo sitio.
//
// El esquema original metía además el mes. Se ha quitado a propósito:
// muchos anuncios no traen fecha hasta que se lee su ficha, y un id que
// depende de una fecha que puede corregirse mañana duplicaría la oferta
// en cuanto se corrigiera.
const idDe = (o) =>
  crypto
    .createHash("sha1")
    .update(
      [
        extraer.sinTildes(o.barco || o.empresa || o.puerto || ""),
        extraer.sinTildes(o.puesto),
      ].join("|")
    )
    .digest("hex")
    .slice(0, 12);

function normalizar(cruda, fechasPrevias) {
  const todo = [cruda.puesto, cruda.empresa, cruda.lugar, cruda.categoria, cruda.salarioTexto, cruda.texto]
    .filter(Boolean)
    .join("\n");

  const sal = extraer.salario(`${cruda.salarioTexto || ""}\n${cruda.texto || ""}`);

  const oferta = {
    puesto: cruda.puesto.trim(),
    empresa: cruda.empresa?.trim() || null,
    barco: extraer.barco(todo),
    eslora: extraer.eslora(todo),
    tipo: extraer.tipoBarco(todo),
    bandera: null,
    zona: extraer.zona(cruda.lugar || "", todo),
    puerto: extraer.lugarUtil(cruda.lugar || ""),
    duracion: extraer.duracion(todo, cruda.jornada || ""),
    alojamiento: extraer.alojamiento(todo),
    salarioMin: sal.min,
    periodo: sal.periodo,
    eng1: extraer.pideEng1(todo),
    pb2: extraer.pidePb2(todo),
    fuente: cruda.fuente,
    url: cruda.url,
    publicada: cruda.fecha ?? fechasPrevias.get(cruda.url) ?? new Date().toISOString(),
    // Muchos anuncios solo dan la fecha en su ficha, y la ficha no
    // siempre se puede leer. Mientras no se sepa, se marca: así mañana
    // se corrige en vez de quedarse una fecha inventada para siempre.
    fechaFiable: Boolean(cruda.fecha),
    texto: (cruda.texto || cruda.puesto).slice(0, 1500),
    categoria: cruda.categoria || null,
  };

  const nota = puntuar(oferta);
  if (!nota) return null; // no es un puesto de cubierta ni de patrón

  // Estos portales no dan de baja lo que caduca: hay anuncios de hace
  // tres años todavía colgados. Eso no es una oferta, es una página
  // muerta, y no entra al histórico.
  if (oferta.fechaFiable) {
    const dias = (Date.now() - new Date(oferta.publicada)) / 86_400_000;
    if (dias > 180) return null;
  }

  delete oferta.categoria;
  return { id: idDe(oferta), ...oferta, ...nota };
}

async function principal() {
  const previo = fs.existsSync(FICHERO)
    ? JSON.parse(fs.readFileSync(FICHERO, "utf8"))
    : { ofertas: [], fuentes: {} };

  const guardadas = new Map(previo.ofertas.map((o) => [o.id, o]));
  const salud = { ...(previo.fuentes || {}) };

  // Las que ya tienen el texto completo no hace falta volver a pedirlas.
  // Las que se quedaron a medias porque el portal falló, sí: mañana se
  // reintenta y la oferta se completa sola.
  const completas = new Set(
    previo.ofertas.filter((o) => o.texto && o.texto.length > 120).map((o) => o.url)
  );
  const fechasPrevias = new Map(
    previo.ofertas.filter((o) => o.url).map((o) => [o.url, o.publicada])
  );

  let encontradas = [];

  for (const fuente of FUENTES) {
    console.log(`\n· ${fuente.nombre}`);
    try {
      const crudas = await fuente.buscar({ completas });
      const utiles = crudas.map((c) => normalizar(c, fechasPrevias)).filter(Boolean);
      console.log(`  ${crudas.length} leídas, ${utiles.length} son para ella`);
      encontradas.push(...utiles);
      salud[fuente.nombre] = {
        ultimoCheck: new Date().toISOString(),
        leidas: crudas.length,
        utiles: utiles.length,
      };
    } catch (error) {
      // Una fuente rota no puede llevarse por delante a la otra.
      console.error(`  falló: ${error.message}`);
      salud[fuente.nombre] = {
        ...(salud[fuente.nombre] || {}),
        ultimoFallo: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  let nuevas = 0;
  for (const o of encontradas) {
    const previa = guardadas.get(o.id);
    if (previa) {
      // Se refresca lo que puede haber mejorado. La fecha solo se
      // reescribe si la de ahora es de fiar y la guardada no lo era:
      // si no, todo parecería recién salido cada mañana.
      const mejoraFecha = o.fechaFiable && !previa.fechaFiable;
      guardadas.set(o.id, {
        ...previa,
        ...o,
        publicada: mejoraFecha ? o.publicada : previa.publicada,
        fechaFiable: previa.fechaFiable || o.fechaFiable,
      });
    } else {
      guardadas.set(o.id, o);
      nuevas++;
    }
  }

  let ofertas = [...guardadas.values()];

  // En cuanto hay material real, las de prueba sobran.
  const reales = ofertas.filter((o) => !o.demo).length;
  if (reales >= 5) {
    const antes = ofertas.length;
    ofertas = ofertas.filter((o) => !o.demo);
    if (antes !== ofertas.length) {
      console.log(`\nFuera ${antes - ofertas.length} ofertas de prueba: ya hay reales.`);
    }
  }

  ofertas.sort((a, b) => new Date(b.publicada) - new Date(a.publicada));

  console.log(
    `\n${nuevas} nuevas · ${ofertas.length} en el histórico` +
      `\n  embarque: ${ofertas.filter((o) => o.perfil === "embarque").length}` +
      `  ·  barcelona: ${ofertas.filter((o) => o.perfil === "barcelona").length}`
  );

  if (SECO) {
    console.log("\n--seco: no se escribe nada. Muestra de lo encontrado:\n");
    for (const o of encontradas.slice(0, 8)) {
      console.log(
        `  [${o.score}] ${o.perfil.padEnd(9)} ${o.puesto}` +
          `\n            ${[o.puerto, o.eslora && `${o.eslora} m`, o.tipo, o.salarioMin && `${o.salarioMin} €/${o.periodo}`]
            .filter(Boolean)
            .join(" · ")}` +
          `\n            ${o.motivo}  —  ${o.fuente}`
      );
    }
    return;
  }

  fs.mkdirSync(path.dirname(FICHERO), { recursive: true });
  fs.writeFileSync(
    FICHERO,
    JSON.stringify(
      { actualizado: new Date().toISOString(), fuentes: salud, ofertas },
      null,
      2
    ) + "\n"
  );
  console.log(`\nEscrito ${path.relative(process.cwd(), FICHERO)}`);
}

principal().catch((error) => {
  console.error(error);
  process.exit(1);
});
