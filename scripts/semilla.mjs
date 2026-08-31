// Genera datos/ofertas.json con las ofertas de prueba de la Fase 1.
//
//   npm run semilla
//
// Los scrapers de la Fase 3 escribirán este mismo fichero. Aquí solo se
// rellena a mano para poder enseñar la pantalla antes de tener nada real.
//
// Nada de lo que hay aquí lleva datos personales: este fichero acaba en
// un repositorio público.
import fs from "node:fs";
import path from "node:path";

const ahora = Date.now();
const hace = (horas) => new Date(ahora - horas * 3600_000).toISOString();

const OFERTAS = [
  // ── Embarque ────────────────────────────────────────────────
  ["e01", "embarque", "Deckhand", "Anny of Charm", 45, "goleta", "Malta",
   "mediterraneo", "Palma", "temporada", "a_bordo", 3200, "mes", true, false,
   "Bluewater", 2, 9, "Vela, 45 m, temporada completa", null,
   "Deckhand wanted for 45m sailing schooner. Season May-Oct, Med. STCW + ENG1 required. 3200 EUR/month, live aboard."],

  ["e02", "embarque", "Marinera de cubierta", "Xarifa 1927", 50, "goleta", "Malta",
   "mediterraneo", "Valencia", "temporada", "a_bordo", null, null, true, true,
   "Bluewater", 5, 10, "Ya trabajaste a bordo en 2023", "Xarifa 1927",
   "La goleta Xarifa busca marinería de cubierta para la temporada. Salida desde Valencia en mayo."],

  ["e03", "embarque", "Deckhand", "Swan 60", 18, "velero", "Reino Unido",
   "mediterraneo", "Denia", "temporada", "a_bordo", null, null, false, true,
   "Daywork123", 9, 6, "Eslora por debajo del objetivo", null,
   "Deckhand for Swan 60. Summer season, Med. Powerboat Level 2 required. Salary DOE."],

  ["e04", "embarque", "Bridge crew", "Sea Cloud", 110, "goleta", "Malta",
   "global", "Málaga", "rotacion", "a_bordo", 2900, "mes", true, true,
   "Yotspot", 26, 7, "Gran vela, pide ENG1", null,
   "Bridge crew for large sailing vessel. Rotational 3:1. Worldwide. ENG1 and PB2 essential."],

  ["e05", "embarque", "Stewardess / deck", "Lagoon 62", 19, "catamaran", "España",
   "caribe", "Saint Martin", "temporada", "a_bordo", 2400, "mes", false, false,
   "Daywork123", 30, 2, "Incluye interior", null,
   "Plaza mixta deck/stew en catamarán de chárter en el Caribe. Temporada de diciembre a abril."],

  ["e06", "embarque", "Marinera de puente", "Alma Explorer", 33, "motor", "España",
   "espana", "Barcelona", "temporada", "a_bordo", 2800, "mes", false, false,
   "Emplea Náutica", 48, 8, "Barco donde ya navegaste", "Alma Explorer",
   "El Alma Explorer busca marinería de puente para la temporada. Salida desde Barcelona."],

  ["e07", "embarque", "Deckhand", "Perini Navi 56", 56, "velero", "Islas Caimán",
   "mediterraneo", "Antibes", "temporada", "a_bordo", 3600, "mes", true, true,
   "Yotspot", 52, 9, "Objetivo exacto, pide ENG1 y PB2", null,
   "Deckhand for 56m Perini Navi. Med season. ENG1, STCW and PB2 mandatory. 3600 EUR."],

  ["e08", "embarque", "Deckhand", "Baltic 67", 20, "velero", "Reino Unido",
   "mediterraneo", "Portisco", "temporada", "a_bordo", 2500, "mes", false, true,
   "Daywork123", 96, 5, "Salario por debajo de referencia", null,
   "Deckhand needed for Baltic 67, Sardinia based. Season contract, 2500 EUR/month."],

  ["e09", "embarque", "Marinera cubierta y puente", "Classic 42", 42, "velero", "Italia",
   "mediterraneo", "Nápoles", "temporada", "a_bordo", 3400, "mes", true, false,
   "Bluewater", 120, 9, "Vela clásica, 42 m", null,
   "Velero clásico de 42 m busca marinería de cubierta y puente. Temporada completa en el Mediterráneo."],

  ["e10", "embarque", "Deck crew", "Sea Star", 41, "goleta", "Países Bajos",
   "mediterraneo", "Palma", "temporada", "a_bordo", 3100, "mes", true, false,
   "Bluewater", 14, 9, "Goleta de 41 m, temporada de mayo a octubre", null,
   "Deck crew for 41m schooner, Palma based. May to October. ENG1 required."],

  ["e11", "embarque", "Day work de cubierta", null, 30, "motor", "España",
   "espana", "Palma", "dia", "no_indicado", 150, "dia", false, false,
   "Daywork123", 7, 5, "Día suelto, fuera de Barcelona", null,
   "Day work available in Palma. Deck, washdowns and varnish. 150 EUR/day."],

  ["e12", "embarque", "Marinero de cubierta", "Guayra", 26, "velero", "España",
   "espana", "Ibiza", "temporada", "a_bordo", 2200, "mes", false, false,
   "Jobs&Sea", 33, 6, "Velero de 26 m, salario justo", null,
   "Se busca marinería de cubierta para velero de 26 m con base en Ibiza. Temporada de verano."],

  ["e13", "embarque", "Deckhand", "Maltese Falcon", 88, "velero", "Islas Caimán",
   "global", "Génova", "rotacion", "a_bordo", 3800, "mes", true, true,
   "Yotspot", 60, 8, "Barco grande, exige ENG1 y PB2", null,
   "Deckhand for 88m sailing yacht. Rotation. ENG1 and PB2 non negotiable."],

  ["e14", "embarque", "Marinera de puente", "Rafael Verdera", 22, "goleta", "España",
   "espana", "Palma", "temporada", "a_bordo", null, null, false, false,
   "Jobs&Sea", 40, 7, "Goleta clásica española, sin ENG1", null,
   "Goleta clásica española busca marinería de puente. Bandera española, no piden ENG1."],

  ["e15", "embarque", "Deck / Stew", "Sunreef 70", 21, "catamaran", "Malta",
   "caribe", "Antigua", "temporada", "a_bordo", 2600, "mes", true, false,
   "Daywork123", 130, 3, "Plaza mixta con interior", null,
   "Deck/Stew position on Sunreef 70. Caribbean season. Interior duties included."],

  ["e16", "embarque", "Deckhand", "Wally 47", 47, "velero", "Reino Unido",
   "mediterraneo", "Porto Cervo", "temporada", "a_bordo", null, null, true, true,
   "Yotspot", 20, 8, "Objetivo de eslora, salario sin publicar", null,
   "Deckhand for Wally 47. Med season, salary DOE. ENG1 and PB2 required."],

  ["e17", "embarque", "Deckhand", "Xarifa 1927", 50, "goleta", "Malta",
   "mediterraneo", "Valencia", "temporada", "a_bordo", 3000, "mes", true, false,
   "Bluewater", 200, 10, "Barco de tu lista, ya navegaste aquí", "Xarifa 1927",
   "La goleta Xarifa busca deckhand para el refit de invierno y el arranque de temporada."],

  ["e18", "embarque", "Deckhand", "Le Ponant", 88, "goleta", "Francia",
   "caribe", "Guadalupe", "rotacion", "a_bordo", 2700, "mes", true, false,
   "Yotspot", 150, 6, "Rotación, requiere ENG1", null,
   "Deckhand for expedition sailing vessel. Rotation 2:1. Caribbean and Atlantic."],

  // ── Patrón Barcelona ────────────────────────────────────────
  ["b01", "barcelona", "Patrón de lancha de 14 m", null, 14, "motor", "España",
   "barcelona", "Port Ginesta", "indefinido", "casa", 2600, "mes", false, false,
   "Emplea Náutica", 6, 8, "Patrón portuario, casa cada noche", null,
   "Se necesita patrón portuario para lancha de 14 m en Port Ginesta. Contrato indefinido."],

  ["b02", "barcelona", "Patrón de traslados", null, 12, "motor", "España",
   "barcelona", "Marina Vela", "dia", "casa", 140, "dia", false, false,
   "Jobs&Sea", 20, 7, "Puerto conocido, jornadas sueltas", null,
   "Patrón para traslados puntuales de embarcaciones de hasta 12 m. Marina Vela, Barcelona."],

  ["b03", "barcelona", "Patrón portuario", null, 16, "motor", "España",
   "barcelona", "El Masnou", "temporada", "casa", null, null, false, false,
   "Emplea Náutica", 70, 7, "Sin salario publicado", null,
   "Patrón portuario para la temporada de verano en El Masnou. Salario según valía."],

  ["b04", "barcelona", "Patrón de amarre", null, 13, "motor", "España",
   "barcelona", "Mataró", "temporada", "casa", 2400, "mes", false, false,
   "Emplea Náutica", 11, 8, "Amarre en Mataró, tu título vale", null,
   "La marina de Mataró busca patrón de amarre con título de patrón portuario."],

  ["b05", "barcelona", "Patrón de motora", null, 15, "motor", "España",
   "barcelona", "Badalona", "indefinido", "casa", 2900, "mes", false, false,
   "InfoJobs", 28, 9, "Barcelona, 15 m, por encima de referencia", null,
   "Empresa de chárter en Badalona busca patrón para motora de 15 m. Jornada completa."],

  ["b06", "barcelona", "Marinero de amarre", null, null, "motor", "España",
   "barcelona", "Vilanova i la Geltrú", "temporada", "casa", 1800, "mes", false, false,
   "InfoJobs", 45, 4, "Marinería de puerto, salario bajo", null,
   "Puerto deportivo busca personal de amarre para la temporada. No se requiere titulación."],

  ["b07", "barcelona", "Patrón de lancha rápida", null, 12, "motor", "España",
   "barcelona", "Sitges", "dia", "casa", 160, "dia", false, false,
   "Jobs&Sea", 62, 7, "Jornadas sueltas de verano", null,
   "Patrón para salidas de día en Sitges durante julio y agosto. Pago por jornada."],

  ["b08", "barcelona", "Patrón portuario", null, 16, "motor", "España",
   "barcelona", "Port Olímpic", "indefinido", "casa", 2800, "mes", false, false,
   "Emplea Náutica", 90, 9, "Barcelona ciudad, contrato indefinido", null,
   "Patrón portuario a jornada completa en el Port Olímpic. Incorporación inmediata."],

  ["b09", "barcelona", "Capitán de chárter", null, 18, "motor", "España",
   "barcelona", "Port Ginesta", "temporada", "casa", 3200, "mes", false, false,
   "InfoJobs", 110, 5, "Piden capitán, por encima de tu titulación", null,
   "Se busca capitán de yate para motora de 18 m en chárter. Titulación de capitán obligatoria."],

  ["b10", "barcelona", "Patrón de traslados", null, 14, "motor", "España",
   "espana", "Tarragona", "dia", "casa", 130, "dia", false, false,
   "Jobs&Sea", 25, 5, "Fuera del área de Barcelona", null,
   "Traslados de embarcaciones entre Tarragona y Valencia. Jornadas sueltas."],
];

const CAMPOS = [
  "id", "perfil", "puesto", "barco", "eslora", "tipo", "bandera",
  "zona", "puerto", "duracion", "alojamiento", "salarioMin", "periodo",
  "eng1", "pb2", "fuente", "horas", "score", "motivo", "watchlist", "texto",
];

const ofertas = OFERTAS.map((fila) => {
  const o = Object.fromEntries(CAMPOS.map((c, i) => [c, fila[i]]));
  o.publicada = hace(o.horas);
  delete o.horas;
  o.url = null;
  o.empresa = null;
  // De prueba: el robot las quita en cuanto trae ofertas reales.
  o.demo = true;
  return o;
});

const destino = path.join(process.cwd(), "datos", "ofertas.json");
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(
  destino,
  JSON.stringify({ actualizado: new Date(ahora).toISOString(), ofertas }, null, 2) + "\n"
);

console.log(`${ofertas.length} ofertas escritas en datos/ofertas.json`);
