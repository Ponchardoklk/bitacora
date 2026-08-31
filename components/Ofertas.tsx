"use client";

import { useEffect, useMemo, useState } from "react";
import {
  C,
  DURACIONES,
  ESTADOS,
  MOTIVOS_DESCARTE,
  PERFILES,
  PUBLICADAS,
  TIPOS,
  ZONAS,
  enlaceFuente,
  etiqueta,
  sans,
  serif,
} from "@/lib/constantes";
import {
  MARCA_VACIA,
  diasDesde,
  guardarMarcas,
  horasDesde,
  leerMarcas,
  type Marca,
  type Marcas,
  type Oferta,
} from "@/lib/datos";

interface Filtros {
  zonas: string[];
  tipos: string[];
  duraciones: string[];
  esloraMin: number;
  salarioMin: number;
  sinSalario: boolean;
  estados: string[];
  dias: number;
}

const filtrosPorDefecto = (): Filtros => ({
  zonas: [],
  tipos: [],
  duraciones: [],
  esloraMin: 0,
  salarioMin: 0,
  // Casilla marcada por defecto: la mayoría de ofertas no publican salario.
  sinSalario: true,
  estados: ["nueva", "guardada", "aplicada"],
  dias: 0,
});

const CLAVE_FILTROS = "bitacora:filtros";

const antig = (h: number) =>
  h < 1 ? "ahora" : h < 24 ? `hace ${h} h` : h < 48 ? "ayer" : `hace ${Math.floor(h / 24)} días`;

const textoAplicada = (d: number) =>
  d === 0 ? "Aplicaste hoy." : d === 1 ? "Aplicaste ayer." : `Aplicaste hace ${d} días.`;

const alojamientoTexto = (a: string | null) =>
  a === "a_bordo" ? "vive a bordo" : a === "casa" ? "duerme en casa" : null;

export default function Ofertas({
  ofertas,
  actualizado,
}: {
  ofertas: Oferta[];
  actualizado?: string;
}) {
  const [perfil, setPerfil] = useState<string>("embarque");
  const [marcas, setMarcas] = useState<Marcas>({});
  const [sinVerAlEntrar, setSinVerAlEntrar] = useState<Set<string>>(new Set());
  const [abrirFiltros, setAbrirFiltros] = useState(false);
  const [notaAbierta, setNotaAbierta] = useState<string | null>(null);
  const [descartando, setDescartando] = useState<string | null>(null);
  const [textoAbierto, setTextoAbierto] = useState<string | null>(null);

  const [todos, setTodos] = useState<Record<string, Filtros>>({
    embarque: filtrosPorDefecto(),
    barcelona: filtrosPorDefecto(),
  });
  const f = todos[perfil];

  // Todo lo que ella marca vive en su móvil, no en ningún servidor.
  // El "sin ver" se congela al entrar: la etiqueta "nueva" dura toda la
  // visita aunque por debajo ya se hayan dado por vistas.
  useEffect(() => {
    const guardadas = leerMarcas();
    setMarcas(guardadas);
    setSinVerAlEntrar(
      new Set(ofertas.filter((o) => !guardadas[o.id]?.vista).map((o) => o.id))
    );
  }, [ofertas]);

  // Los filtros se guardan por perfil entre sesiones.
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_FILTROS);
      if (!guardado) return;
      const leido = JSON.parse(guardado);
      setTodos({
        embarque: { ...filtrosPorDefecto(), ...(leido.embarque ?? {}) },
        barcelona: { ...filtrosPorDefecto(), ...(leido.barcelona ?? {}) },
      });
    } catch {
      /* si el navegador no deja, se usan los de por defecto */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_FILTROS, JSON.stringify(todos));
    } catch {
      /* idem */
    }
  }, [todos]);

  const marca = (id: string): Marca => marcas[id] ?? MARCA_VACIA;

  const anotar = (id: string, cambio: Partial<Marca>) =>
    setMarcas((m) => {
      const siguiente = {
        ...m,
        [id]: { ...MARCA_VACIA, ...m[id], ...cambio, vista: true },
      };
      guardarMarcas(siguiente);
      return siguiente;
    });

  const cambiar = (id: string, estado: string) =>
    anotar(id, {
      estado,
      motivoDescarte: null,
      aplicadaEn:
        estado === "aplicada"
          ? marcas[id]?.aplicadaEn ?? new Date().toISOString()
          : null,
    });

  const descartar = (id: string, motivo: string) => {
    setDescartando(null);
    anotar(id, { estado: "descartada", motivoDescarte: motivo });
  };

  const escribirNota = (id: string, texto: string) => {
    setNotaAbierta(null);
    const limpio = texto.trim();
    anotar(id, { notas: limpio === "" ? null : limpio });
  };

  const set = <K extends keyof Filtros>(k: K, v: Filtros[K]) =>
    setTodos((p) => ({ ...p, [perfil]: { ...p[perfil], [k]: v } }));

  const toggle = (k: "zonas" | "tipos" | "duraciones" | "estados", v: string) =>
    setTodos((p) => {
      const actual = p[perfil][k];
      return {
        ...p,
        [perfil]: {
          ...p[perfil],
          [k]: actual.includes(v)
            ? actual.filter((x) => x !== v)
            : [...actual, v],
        },
      };
    });

  const lista = useMemo(
    () =>
      ofertas
        .filter((o) => o.perfil === perfil)
        // Si le piden un título que no tiene, no puede presentarse: no se
        // le enseña. Sigue en el histórico y cuenta para el pie.
        .filter((o) => !o.fueraDeAlcance)
        .filter((o) => (f.zonas.length ? f.zonas.includes(o.zona ?? "") : true))
        .filter((o) => (f.tipos.length ? f.tipos.includes(o.tipo ?? "") : true))
        .filter((o) =>
          f.duraciones.length ? f.duraciones.includes(o.duracion ?? "") : true
        )
        .filter((o) => (o.eslora ?? 0) >= f.esloraMin)
        .filter((o) =>
          o.salarioMin == null
            ? f.sinSalario
            : o.periodo === "dia"
            ? true
            : o.salarioMin >= f.salarioMin
        )
        .filter((o) => f.estados.includes(marca(o.id).estado))
        .filter((o) => (f.dias ? horasDesde(o.publicada) <= f.dias * 24 : true))
        // El encaje manda; la antigüedad solo desempata. Las que aún no
        // tienen fecha confirmada van detrás de las que sí: no se las
        // premia por parecer recién salidas.
        .sort(
          (a, b) =>
            b.score - a.score ||
            Number(a.fechaFiable === false) - Number(b.fechaFiable === false) ||
            horasDesde(a.publicada) - horasDesde(b.publicada)
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ofertas, perfil, f, marcas]
  );

  // Lo que ya ha pasado por pantalla deja de estar "sin ver".
  useEffect(() => {
    const pendientes = lista.filter((o) => !marca(o.id).vista).map((o) => o.id);
    if (pendientes.length === 0) return;
    const t = setTimeout(() => {
      setMarcas((m) => {
        const siguiente = { ...m };
        for (const id of pendientes) {
          siguiente[id] = { ...MARCA_VACIA, ...m[id], vista: true };
        }
        guardarMarcas(siguiente);
        return siguiente;
      });
    }, 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista]);

  const sinVer = ofertas.filter(
    (o) => o.perfil === perfil && !o.fueraDeAlcance && sinVerAlEntrar.has(o.id)
  ).length;

  const activos =
    f.zonas.length +
    f.tipos.length +
    f.duraciones.length +
    (f.esloraMin ? 1 : 0) +
    (f.salarioMin ? 1 : 0) +
    (f.dias ? 1 : 0);

  // Aplicada hace más de 7 días y sin respuesta.
  const aviso = useMemo(() => {
    const candidatas = ofertas
      .filter((o) => o.perfil === perfil)
      .map((o) => ({ oferta: o, m: marca(o.id) }))
      .filter(
        (x) =>
          x.m.estado === "aplicada" &&
          x.m.aplicadaEn &&
          diasDesde(x.m.aplicadaEn) > 7
      )
      .sort((a, b) => diasDesde(b.m.aplicadaEn!) - diasDesde(a.m.aplicadaEn!));
    return candidatas[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ofertas, perfil, marcas]);

  // Qué papel le cierra más puertas. Cuenta los tres tipos: los que se
  // sacan en una semana (ENG1, Powerboat 2) y los que son un curso entero
  // (PPER, capitán de yate), que además ni le aparecen en la lista.
  const bloqueos = useMemo(() => {
    const trimestre = ofertas.filter((o) => horasDesde(o.publicada) <= 90 * 24);
    const cuenta: Record<string, number> = {};
    const sumar = (titulo: string) => (cuenta[titulo] = (cuenta[titulo] ?? 0) + 1);

    for (const o of trimestre) {
      if (o.eng1) sumar("ENG1");
      if (o.pb2) sumar("Powerboat 2");
      if (o.fueraDeAlcance) sumar(o.fueraDeAlcance);
    }
    return Object.entries(cuenta)
      .map(([titulo, n]) => ({ titulo, n }))
      .sort((a, b) => b.n - a.n);
  }, [ofertas]);

  return (
    <div
      className="min-h-screen w-full pb-16"
      style={{ background: C.papel, fontFamily: sans, color: C.tinta }}
    >
      {/* Cabecera */}
      <header
        className="zona-segura sticky top-0 z-20"
        style={{ background: C.tinta, color: C.papel }}
      >
        <div className="contenedor px-4 pt-4 pb-3">
          <div className="flex items-baseline justify-between">
            <h1 style={{ fontFamily: serif, fontSize: 22, letterSpacing: "0.01em" }}>
              Cuaderno de bitácora
            </h1>
            <span style={{ fontSize: 12, color: C.arena }}>Gemma</span>
          </div>

          <div className="mt-3 flex gap-1">
            {PERFILES.map(([k, label]) => {
              const cuantas = ofertas.filter(
                (o) => o.perfil === k && !o.fueraDeAlcance
              ).length;
              const activa = perfil === k;
              return (
                <button
                  key={k}
                  onClick={() => setPerfil(k)}
                  className="flex-1 py-2 text-sm"
                  style={{
                    background: activa ? C.papel : "transparent",
                    color: activa ? C.tinta : C.papel,
                    border: `1px solid ${activa ? C.papel : C.sonda}`,
                    fontWeight: activa ? 600 : 400,
                  }}
                >
                  {label}{" "}
                  <span
                    style={{
                      fontVariantNumeric: "tabular-nums",
                      color: activa ? C.suave : C.arena,
                      fontWeight: 400,
                    }}
                  >
                    {cuantas}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ background: C.sonda }}>
          <div
            className="contenedor flex items-center justify-between px-4 py-2"
            style={{ fontSize: 13 }}
          >
            <span>
              <strong style={{ fontVariantNumeric: "tabular-nums" }}>{sinVer}</strong>{" "}
              sin ver · {lista.length} en pantalla
            </span>
            <button
              onClick={() => setAbrirFiltros((v) => !v)}
              className="py-1"
              style={{ color: C.papel, textDecoration: "underline" }}
            >
              Filtros{activos ? ` (${activos})` : ""}
            </button>
          </div>
        </div>
      </header>

      {/* Filtros */}
      {abrirFiltros && (
        <section
          style={{ background: C.papelAlt, borderBottom: `1px solid ${C.linea}` }}
        >
          <div className="contenedor px-4 py-4 md:grid md:grid-cols-2 md:gap-x-8">
          <Grupo titulo="Zona">
            {ZONAS.map(([k, l]) => (
              <Chip key={k} on={f.zonas.includes(k)} click={() => toggle("zonas", k)}>
                {l}
              </Chip>
            ))}
          </Grupo>

          <Grupo titulo="Tipo de barco">
            {TIPOS.map(([k, l]) => (
              <Chip key={k} on={f.tipos.includes(k)} click={() => toggle("tipos", k)}>
                {l}
              </Chip>
            ))}
          </Grupo>

          <Grupo titulo="Duración">
            {DURACIONES.map(([k, l]) => (
              <Chip
                key={k}
                on={f.duraciones.includes(k)}
                click={() => toggle("duraciones", k)}
              >
                {l}
              </Chip>
            ))}
          </Grupo>

          <Grupo titulo={`Eslora mínima · ${f.esloraMin} m`}>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={f.esloraMin}
              onChange={(e) => set("esloraMin", +e.target.value)}
              className="w-full"
              style={{ accentColor: C.sonda }}
            />
          </Grupo>

          <Grupo
            titulo={`Salario mínimo · ${
              f.salarioMin ? f.salarioMin + " €/mes" : "sin límite"
            }`}
          >
            <input
              type="range"
              min="0"
              max="4500"
              step="250"
              value={f.salarioMin}
              onChange={(e) => set("salarioMin", +e.target.value)}
              className="w-full"
              style={{ accentColor: C.sonda }}
            />
            <label className="mt-2 flex items-center gap-2" style={{ fontSize: 13 }}>
              <input
                type="checkbox"
                checked={f.sinSalario}
                onChange={(e) => set("sinSalario", e.target.checked)}
                style={{ accentColor: C.sonda }}
              />
              Incluir ofertas sin salario publicado
            </label>
            <p style={{ fontSize: 11, color: C.suave, marginTop: 4 }}>
              La mayoría no lo publica. Si lo desmarcas, pierdes casi todo.
            </p>
          </Grupo>

          <Grupo titulo="Estado">
            {ESTADOS.map(([k, l]) => (
              <Chip key={k} on={f.estados.includes(k)} click={() => toggle("estados", k)}>
                {l}
              </Chip>
            ))}
          </Grupo>

          <Grupo titulo="Publicadas">
            {PUBLICADAS.map(([k, l]) => (
              <Chip key={k} on={f.dias === k} click={() => set("dias", k)}>
                {l}
              </Chip>
            ))}
          </Grupo>

          <button
            onClick={() => setTodos((p) => ({ ...p, [perfil]: filtrosPorDefecto() }))}
            className="py-2 text-left"
            style={{ fontSize: 12, color: C.sonda, textDecoration: "underline" }}
          >
            Dejar los filtros como estaban
          </button>
          </div>
        </section>
      )}

      {/* Seguimiento */}
      {aviso && (
        <div className="contenedor px-4">
          <div
            className="mt-4 px-3 py-2"
            style={{
              background: C.papelAlt,
              borderLeft: `3px solid ${C.arena}`,
              fontSize: 13,
            }}
          >
            Aplicaste a{" "}
            <em style={{ fontFamily: serif }}>
              {aviso.oferta.barco ?? aviso.oferta.puesto}
            </em>{" "}
            hace {diasDesde(aviso.m.aplicadaEn!)} días y no hay respuesta. Toca
            insistir.
          </div>
        </div>
      )}

      {/* Lista */}
      <main className="contenedor px-4 pt-4">
        {lista.length === 0 ? (
          <div className="py-16 text-center" style={{ color: C.suave }}>
            <p style={{ fontFamily: serif, fontSize: 17, color: C.tinta }}>
              Nada con estos filtros
            </p>
            <p style={{ fontSize: 13, marginTop: 6 }}>
              Baja la eslora mínima o amplía la zona.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {lista.map((o) => {
              const m = marca(o.id);
              const horas = horasDesde(o.publicada);
              const banda =
                o.score >= 9 ? C.estribor : o.score >= 7 ? C.sonda : C.linea;
              const hayTexto = Boolean(
                o.texto && o.texto.length > o.puesto.length + 40
              );
              const abierto = textoAbierto === o.id;
              return (
                <li
                  key={o.id}
                  // Columna flexible para que, en dos columnas, las dos
                  // tarjetas de una fila midan igual y los botones queden
                  // alineados abajo.
                  className="flex flex-col"
                  style={{
                    background: C.papelAlt,
                    borderLeft: `5px solid ${banda}`,
                    opacity: m.estado === "descartada" ? 0.55 : 1,
                  }}
                >
                  <div className="flex-1 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <h2 style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>
                        {o.puesto}
                      </h2>

                      {/* La nota, a la vista. Con la banda sola no se
                          distingue un 9 de un 7 de un vistazo. */}
                      <div className="flex shrink-0 items-center gap-2">
                        {sinVerAlEntrar.has(o.id) && (
                          <span
                            style={{
                              fontSize: 10,
                              color: C.estribor,
                              border: `1px solid ${C.estribor}`,
                              padding: "1px 5px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            nueva
                          </span>
                        )}
                        <span
                          title={`Encaje ${o.score} sobre 10`}
                          style={{
                            fontSize: 17,
                            fontWeight: 700,
                            lineHeight: 1,
                            color: banda === C.linea ? C.suave : banda,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {o.score}
                        </span>
                      </div>
                    </div>

                    {o.watchlist && (
                      <p style={{ fontSize: 12, color: C.babor, marginTop: 3 }}>
                        Barco de tu lista · ya navegaste aquí
                      </p>
                    )}

                    {(() => {
                      // Si no se sabe el nombre del barco, al menos quién
                      // lo publica. Solo el barco va en cursiva.
                      const detalles = [
                        o.eslora ? `${o.eslora} m` : null,
                        etiqueta(TIPOS, o.tipo),
                        o.bandera,
                      ].filter(Boolean);
                      // Algunos portales ponen el nombre de la empresa
                      // como título del anuncio: no repetirlo debajo.
                      const empresa =
                        o.empresa && o.empresa.trim().toLowerCase() !== o.puesto.trim().toLowerCase()
                          ? o.empresa
                          : null;
                      const cabeza = o.barco ?? empresa;
                      if (!cabeza && detalles.length === 0) return null;
                      return (
                        <p style={{ fontSize: 13, marginTop: 4, color: C.tinta }}>
                          {o.barco ? (
                            <em style={{ fontFamily: serif, fontSize: 14 }}>{o.barco}</em>
                          ) : (
                            cabeza
                          )}
                          {cabeza && detalles.length > 0 && " · "}
                          {detalles.join(" · ")}
                        </p>
                      );
                    })()}

                    <p style={{ fontSize: 13, color: C.suave, marginTop: 2 }}>
                      {[
                        o.puerto,
                        etiqueta(DURACIONES, o.duracion),
                        alojamientoTexto(o.alojamiento),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>

                    <div className="mt-3 flex items-baseline justify-between gap-2">
                      {/* Un salario de verdad pesa; la falta de salario
                          se dice, pero no grita. */}
                      <span
                        style={
                          o.salarioMin
                            ? {
                                fontSize: 17,
                                fontWeight: 700,
                                fontVariantNumeric: "tabular-nums",
                                color: C.tinta,
                              }
                            : { fontSize: 12, color: C.suave, fontStyle: "italic" }
                        }
                      >
                        {o.salarioMin
                          ? `${o.salarioMin.toLocaleString("es-ES")} €/${
                              o.periodo === "dia" ? "día" : "mes"
                            }`
                          : "salario no indicado"}
                      </span>
                      <span
                        style={{ fontSize: 12, color: C.suave, whiteSpace: "nowrap" }}
                      >
                        {enlaceFuente(o.fuente, o.url) ? (
                          <a
                            href={enlaceFuente(o.fuente, o.url)!}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: C.sonda,
                              textDecoration: "underline",
                              display: "inline-block",
                              padding: "4px 2px",
                            }}
                          >
                            {o.fuente} ↗
                          </a>
                        ) : (
                          o.fuente
                        )}{" "}
                        · {o.fechaFiable === false ? "sin fecha" : antig(horas)}
                      </span>
                    </div>

                    {o.motivo && (
                      <p style={{ fontSize: 12, color: C.sonda, marginTop: 8 }}>
                        {o.motivo}
                      </p>
                    )}

                    {/* El anuncio original, para que pueda leerlo entero
                        sin salir de aquí. Importa más de lo que parece:
                        los portales se caen, y entonces el enlace no
                        lleva a ninguna parte. */}
                    {hayTexto ? (
                      <>
                        <p
                          onClick={() => setTextoAbierto(abierto ? null : o.id)}
                          style={{
                            fontSize: 12,
                            color: C.suave,
                            marginTop: 8,
                            lineHeight: 1.45,
                            whiteSpace: "pre-line",
                            cursor: "pointer",
                            ...(abierto
                              ? {}
                              : {
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical" as const,
                                  overflow: "hidden",
                                }),
                          }}
                        >
                          {o.texto}
                        </p>
                        {o.texto.length > 150 && (
                          <button
                            onClick={() => setTextoAbierto(abierto ? null : o.id)}
                            className="py-1"
                            style={{ fontSize: 12, color: C.sonda, textDecoration: "underline" }}
                          >
                            {abierto ? "Leer menos" : "Leer el anuncio entero"}
                          </button>
                        )}
                      </>
                    ) : (
                      <p style={{ fontSize: 11, color: C.suave, marginTop: 8, fontStyle: "italic" }}>
                        El anuncio todavía no se ha podido leer entero.
                      </p>
                    )}

                    {(o.eng1 || o.pb2) && (
                      <p style={{ fontSize: 12, color: C.babor, marginTop: 4 }}>
                        Te falta:{" "}
                        {[o.eng1 && "ENG1", o.pb2 && "Powerboat 2"]
                          .filter(Boolean)
                          .join(" y ")}
                      </p>
                    )}

                    {m.estado === "aplicada" && m.aplicadaEn && (
                      <p style={{ fontSize: 12, color: C.suave, marginTop: 4 }}>
                        {textoAplicada(diasDesde(m.aplicadaEn))}
                      </p>
                    )}

                    {m.estado === "descartada" && m.motivoDescarte && (
                      <p style={{ fontSize: 12, color: C.suave, marginTop: 4 }}>
                        Descartada por {m.motivoDescarte}.
                      </p>
                    )}

                    {m.notas && (
                      <p
                        style={{
                          fontSize: 12,
                          marginTop: 8,
                          padding: "6px 8px",
                          background: C.papel,
                          borderLeft: `2px solid ${C.arena}`,
                        }}
                      >
                        {m.notas}
                      </p>
                    )}

                    {notaAbierta === o.id && (
                      <textarea
                        autoFocus
                        rows={2}
                        defaultValue={m.notas ?? ""}
                        placeholder="Hablé con el capitán, quedamos en marzo…"
                        onBlur={(e) => escribirNota(o.id, e.target.value)}
                        className="mt-2 w-full p-2"
                        style={{
                          fontSize: 13,
                          border: `1px solid ${C.linea}`,
                          background: C.papel,
                        }}
                      />
                    )}

                    {descartando === o.id && (
                      <div className="mt-3">
                        <p style={{ fontSize: 12, color: C.suave, marginBottom: 6 }}>
                          ¿Por qué la descartas?
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {MOTIVOS_DESCARTE.map((motivo) => (
                            <Chip key={motivo} click={() => descartar(o.id, motivo)}>
                              {motivo}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className="flex"
                    style={{
                      borderTop: `1px solid ${C.linea}`,
                      fontSize: 12,
                      background: C.papel,
                    }}
                  >
                    <Accion
                      on={m.estado === "guardada"}
                      click={() =>
                        cambiar(o.id, m.estado === "guardada" ? "nueva" : "guardada")
                      }
                    >
                      Guardar
                    </Accion>
                    <Accion
                      on={m.estado === "aplicada"}
                      click={() => cambiar(o.id, "aplicada")}
                    >
                      Apliqué
                    </Accion>
                    <Accion
                      click={() => setNotaAbierta(notaAbierta === o.id ? null : o.id)}
                    >
                      Nota
                    </Accion>
                    {m.estado === "descartada" ? (
                      <Accion ultima click={() => cambiar(o.id, "nueva")}>
                        Recuperar
                      </Accion>
                    ) : (
                      <Accion
                        ultima
                        color={C.babor}
                        click={() => setDescartando(descartando === o.id ? null : o.id)}
                      >
                        Descartar
                      </Accion>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <footer
          className="mt-8 px-4 py-4"
          style={{
            background: C.papelAlt,
            borderTop: `2px solid ${C.linea}`,
            fontSize: 12,
            color: C.suave,
          }}
        >
          <p style={{ color: C.tinta, fontWeight: 600, marginBottom: 6 }}>
            Lo que dice el histórico
          </p>
          {/* Con dos o tres ofertas no se puede concluir nada, y decir
              que un título "te cierra puertas" sería exagerado. */}
          {!bloqueos[0] ? (
            <p>Todavía no hay histórico suficiente para decir nada.</p>
          ) : bloqueos[0].n >= 3 ? (
            <p>
              {bloqueos[0].n} ofertas de este trimestre pedían {bloqueos[0].titulo}.
              Es el título que más puertas te está cerrando.
            </p>
          ) : (
            <p>
              {bloqueos[0].n === 1
                ? `1 oferta de este trimestre pedía ${bloqueos[0].titulo}`
                : `${bloqueos[0].n} ofertas de este trimestre pedían ${bloqueos[0].titulo}`}
              . Todavía son pocas para sacar conclusiones.
            </p>
          )}

          {actualizado && (
            <p style={{ marginTop: 10, fontSize: 11, color: C.suave }}>
              {ofertas.length} ofertas guardadas · última búsqueda{" "}
              {antig(horasDesde(actualizado))}
            </p>
          )}
        </footer>
      </main>
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p style={{ fontSize: 12, color: C.suave, marginBottom: 6 }}>{titulo}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  on,
  click,
  children,
}: {
  on?: boolean;
  click: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={click}
      className="px-3 py-2"
      style={{
        fontSize: 13,
        background: on ? C.tinta : "transparent",
        color: on ? C.papel : C.tinta,
        border: `1px solid ${on ? C.tinta : C.linea}`,
      }}
    >
      {children}
    </button>
  );
}

function Accion({
  on,
  click,
  color,
  ultima,
  children,
}: {
  on?: boolean;
  click: () => void;
  color?: string;
  ultima?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={click}
      className="flex-1 py-3"
      style={{
        color: on ? C.papel : color || C.sonda,
        background: on ? C.sonda : "transparent",
        borderRight: ultima ? "none" : `1px solid ${C.linea}`,
        fontWeight: on ? 600 : 400,
      }}
    >
      {children}
    </button>
  );
}
