// Genera los iconos de la web: los que usa el iPad cuando ella añade la
// página a la pantalla de inicio y le queda como una app más.
//
//   npm run iconos
//
// Se dibuja a mano, píxel a píxel, y se escribe el PNG sin ninguna
// librería: así el proyecto no arrastra dependencias por un icono.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const TINTA = [0x10, 0x22, 0x2e];
const PAPEL = [0xe9, 0xee, 0xf1];
const ARENA = [0xd9, 0xc9, 0xa3];

// Rosa de los vientos: un aro y una estrella de cuatro puntas.
function color(x, y, lado) {
  const c = lado / 2;
  const dx = x + 0.5 - c;
  const dy = y + 0.5 - c;
  const dist = Math.hypot(dx, dy);

  const radioAro = lado * 0.36;
  const grosor = lado * 0.035;
  if (Math.abs(dist - radioAro) < grosor) return ARENA;

  // Astroide: |dx|^(2/3) + |dy|^(2/3) <= r^(2/3)
  const r = lado * 0.34;
  const t = (v) => Math.pow(Math.abs(v), 2 / 3);
  if (t(dx) + t(dy) <= t(r)) return PAPEL;

  return TINTA;
}

// ── PNG a pelo ────────────────────────────────────────────────
const TABLA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (const b of buf) c = TABLA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function trozo(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
  const suma = Buffer.alloc(4);
  suma.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([largo, cuerpo, suma]);
}

function png(lado) {
  // Una fila = 1 byte de filtro + lado * 3 bytes (RGB)
  const filas = Buffer.alloc(lado * (1 + lado * 3));
  let i = 0;
  for (let y = 0; y < lado; y++) {
    filas[i++] = 0; // sin filtro
    for (let x = 0; x < lado; x++) {
      const [r, g, b] = color(x, y, lado);
      filas[i++] = r;
      filas[i++] = g;
      filas[i++] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lado, 0);
  ihdr.writeUInt32BE(lado, 4);
  ihdr[8] = 8; // 8 bits por canal
  ihdr[9] = 2; // color RGB
  // 10, 11, 12 se quedan a cero: sin compresión extra, sin entrelazado

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo("IHDR", ihdr),
    trozo("IDAT", zlib.deflateSync(filas, { level: 9 })),
    trozo("IEND", Buffer.alloc(0)),
  ]);
}

const destino = path.join(process.cwd(), "public");
fs.mkdirSync(destino, { recursive: true });

for (const lado of [180, 512]) {
  const fichero = path.join(destino, `icono-${lado}.png`);
  fs.writeFileSync(fichero, png(lado));
  console.log(`public/icono-${lado}.png`);
}
