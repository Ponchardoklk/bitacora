// Cuatro utilidades para leer HTML. No hace falta más: las dos webs
// sirven marcado plano y estable. Sin librerías, así el robot no se
// rompe porque un paquete cambie.

const ENTIDADES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú",
  Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú",
  ntilde: "ñ", Ntilde: "Ñ", uuml: "ü", Uuml: "Ü", ordf: "ª", ordm: "º",
  euro: "€", deg: "°", hellip: "…", mdash: "—", ndash: "–", rsquo: "’",
};

export function decodificar(s = "") {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (todo, n) => ENTIDADES[n] ?? todo);
}

// Quita etiquetas y deja texto legible. Los <p> y <br> se vuelven saltos
// de línea para no pegar frases que en pantalla iban separadas.
export function texto(html = "") {
  return decodificar(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Primer grupo de la primera coincidencia, ya como texto limpio.
export function capturar(html, re) {
  const m = html.match(re);
  return m ? texto(m[1]) : null;
}

// Todos los trozos que casan, en crudo.
export function trozos(html, re) {
  return html.match(re) ?? [];
}

// Descarga con reintentos. Si una página concreta falla, se devuelve
// null y la ingesta sigue: una oferta rota no puede tumbar el robot.
export async function bajar(url, { intentos = 2, espera = 3000 } = {}) {
  for (let i = 1; i <= intentos; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Accept-Language": "es-ES,es;q=0.9",
        },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (error) {
      if (i === intentos) {
        console.warn(`  no se pudo leer ${url}: ${error.message}`);
        return null;
      }
      await new Promise((r) => setTimeout(r, espera * i));
    }
  }
  return null;
}

// Entre página y página, para no machacar el servidor de nadie.
export const respirar = (ms = 1200) => new Promise((r) => setTimeout(r, ms));
