# Cuaderno de bitácora

Buscador de ofertas de empleo náutico para una sola persona. Reúne lo que
publican los portales del sector, lo puntúa contra dos perfiles de
búsqueda y lo deja en una pantalla que se lee en el móvil en un minuto.

## Cómo está montado

Web estática: no hay servidor, ni base de datos, ni cuentas de pago.

- Las ofertas viven en `datos/ofertas.json`, dentro del repositorio. El
  histórico es el historial de git.
- Lo que la usuaria marca (guardada, aplicada, notas, descartes) se
  guarda en su propio navegador y no sale de su teléfono.
- Se publica sola en GitHub Pages en cada push a `main`.

## Comandos

```
npm run dev       verlo en local
npm run semilla   regenerar los datos de prueba
npm run build     generar la web estática en out/
```

## Los dos perfiles

- **Embarque**: cubierta y puente en velero o goleta grande, temporada
  larga, se vive a bordo.
- **Patrón Barcelona**: patrón portuario de motora de 12-16 m en el área
  de Barcelona, se duerme en casa.

No son un perfil con muchos filtros. Son dos pestañas.
