// Web estática: sale HTML y JS planos, sin servidor detrás. Así cabe en
// GitHub Pages, que es gratis.
const repo = "bitacora";
const enPages = process.env.GITHUB_ACTIONS === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // En GitHub Pages la web cuelga de /bitacora; en local, de la raíz.
  basePath: enPages ? `/${repo}` : "",
  assetPrefix: enPages ? `/${repo}/` : "",
  images: { unoptimized: true },
  // Para que el manifiesto y los iconos apunten al sitio correcto.
  env: { NEXT_PUBLIC_BASE_PATH: enPages ? `/${repo}` : "" },
  trailingSlash: true,
};

export default nextConfig;
