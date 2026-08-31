"use client";

import { useEffect, useState } from "react";
import archivo from "@/datos/ofertas.json";
import Ofertas from "@/components/Ofertas";
import PanelPin from "@/components/PanelPin";
import { C, CLAVE_ACCESO } from "@/lib/constantes";
import type { Oferta } from "@/lib/datos";

const ofertas = archivo.ofertas as unknown as Oferta[];

export default function Pagina() {
  const [montado, setMontado] = useState(false);
  const [dentro, setDentro] = useState(false);

  useEffect(() => {
    try {
      setDentro(localStorage.getItem(CLAVE_ACCESO) === "si");
    } catch {
      /* navegador sin almacenamiento: pedirá el PIN cada vez */
    }
    setMontado(true);
  }, []);

  // Hasta saber si ya ha entrado, pantalla en negro: si no, parpadearía
  // el teclado del PIN en cada recarga.
  if (!montado) return <div style={{ minHeight: "100vh", background: C.tinta }} />;
  if (!dentro) return <PanelPin onEntrar={() => setDentro(true)} />;
  return <Ofertas ofertas={ofertas} />;
}
