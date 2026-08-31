// Los dos perfiles de búsqueda, en la forma que necesita el robot.
//
// Ojo: este fichero está en un repositorio público. Aquí solo van
// palabras clave y nombres de barco. El perfil completo, con apellido y
// teléfonos, vive en docs/perfil-gemma.json y no sale del ordenador.

export const PERFILES = {
  embarque: {
    nombre: "Embarque",
    puestos: [
      "deckhand", "deck hand", "deck crew", "bridge crew",
      "marinera de puente", "marinero de puente",
      "marinera de cubierta", "marinero de cubierta",
      "marineria de cubierta", "marineria de puente",
      "marinera", "marinero", "marineria",
      "tripulante", "sailor", "day worker", "daywork",
    ],
    esloraObjetivo: 40,
    esloraMinima: 20,
    tiposObjetivo: ["velero", "goleta"],
    salarioReferencia: 3500,
  },

  barcelona: {
    nombre: "Patrón Barcelona",
    puestos: [
      "patron portuario", "patron de amarre", "patron de lancha",
      "patron traslados", "patron de traslados", "patron de motora",
      "patron", "skipper", "patrona",
    ],
    esloraMinima: 12,
    esloraMaxima: 16,
    salarioReferencia: 2800,
  },
};

// Lo que no es para ella en ningún caso. Se comprueba contra el título
// y contra quien publica: media docena de anuncios de "patrón" son en
// realidad de una empresa de motos de agua.
export const EXCLUIR = [
  // interior y cocina
  "azafata", "stewardess", "hostess", "steward", "interior",
  "cocina", "cocinero", "cocinera", "chef", "camarera", "camarero",
  // otros sectores
  "mercante", "pesca", "pesquero",
  "buceo", "buzo", "diving", "dive center", "submarinismo",
  // máquinas
  "jefe de maquinas", "maquinas", "engrasador", "mecanico", "mecánico",
  "electricista", "soldador", "fibra", "varadero", "taller",
  // ocio de playa
  "monitor", "moto de agua", "moto acuatica", "jet ski", "jetski",
  "parasailing", "hinchable", "arrastre", "banana", "flyboard",
  "paddle", "kayak", "socorrista", "lifeguard", "vela ligera",
  // tierra
  "comercial", "administrativo", "recepcion", "encargado", "gerente",
  "marketing", "contable", "limpieza",
];

// Piden más titulación de la que tiene: no descartan la oferta, pero la
// hunden en la lista.
export const SOBRECUALIFICADO = [
  "capitan de yate", "capitán de yate", "capitan de la marina mercante",
  "jefe de maquinas", "primer oficial", "chief officer", "captain",
];

// Barcos vigilados. Si aparece uno, la oferta sube a lo más alto.
export const WATCHLIST = [
  { barco: "Xarifa 1927", alias: ["xarifa"] },
  { barco: "Alma Explorer", alias: ["alma explorer"] },
];

// Área de Barcelona, para el perfil de patrón.
export const ZONA_BARCELONA = [
  "barcelona", "badalona", "el masnou", "masnou", "mataro", "mataró",
  "vilanova i la geltru", "vilanova", "port ginesta", "ginesta",
  "sitges", "castelldefels", "premia", "premià", "arenys", "blanes",
  "garraf", "port olimpic", "port olímpic", "port forum", "marina vela",
  "sant adria", "montgat", "maresme", "baix llobregat",
];

export const CARIBE = [
  "caribe", "caribbean", "antigua", "saint martin", "st martin",
  "guadalupe", "martinica", "bahamas", "bvi", "tortola", "san blas",
];

export const MEDITERRANEO = [
  "mediterraneo", "mediterráneo", "med", "palma", "mallorca", "ibiza",
  "menorca", "baleares", "valencia", "denia", "antibes", "niza", "nice",
  "cannes", "monaco", "mónaco", "italia", "cerdeña", "sardinia",
  "napoles", "nápoles", "genova", "génova", "grecia", "croacia",
  "turquia", "turquía", "malta", "porto cervo", "portisco", "costa azul",
];
