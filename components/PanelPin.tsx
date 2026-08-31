"use client";

import { useEffect, useState } from "react";
import { C, CLAVE_ACCESO, PIN_ACCESO, sans, serif } from "@/lib/constantes";

const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"];

export default function PanelPin({ onEntrar }: { onEntrar: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  // Se comprueba al llegar a cuatro dígitos, no dentro del propio clic:
  // así dos toques muy seguidos no se pisan y no se pierde ninguno.
  useEffect(() => {
    if (pin.length < 4) return;

    if (pin !== PIN_ACCESO) {
      setError(true);
      setPin("");
      return;
    }
    try {
      localStorage.setItem(CLAVE_ACCESO, "si");
    } catch {
      /* sin almacenamiento lo pedirá otra vez, pero entra igual */
    }
    onEntrar();
  }, [pin, onEntrar]);

  function pulsar(tecla: string) {
    if (tecla === "") return;
    setError(false);

    if (tecla === "←") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    setPin((p) => (p.length >= 4 ? p : p + tecla));
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-8"
      style={{ background: C.tinta, color: C.papel, fontFamily: sans }}
    >
      <h1 style={{ fontFamily: serif, fontSize: 24 }}>Cuaderno de bitácora</h1>

      <div className="mt-8 flex gap-4">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              border: `1px solid ${error ? C.babor : C.papel}`,
              background:
                pin.length > i ? (error ? C.babor : C.papel) : "transparent",
            }}
          />
        ))}
      </div>

      <p
        style={{
          fontSize: 13,
          marginTop: 16,
          height: 18,
          color: error ? C.babor : C.arena,
        }}
      >
        {error ? "Ese no es. Prueba otra vez." : "Marca tu clave"}
      </p>

      <div
        className="mt-6 grid grid-cols-3 gap-3"
        style={{ width: "min(280px, 80vw)" }}
      >
        {TECLAS.map((tecla, i) => (
          <button
            key={i}
            onClick={() => pulsar(tecla)}
            disabled={tecla === ""}
            style={{
              padding: "16px 0",
              fontSize: 22,
              color: C.papel,
              background: "transparent",
              border: tecla === "" ? "none" : `1px solid ${C.sonda}`,
            }}
          >
            {tecla}
          </button>
        ))}
      </div>
    </div>
  );
}
