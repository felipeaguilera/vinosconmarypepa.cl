# Tandas de desarrollo: Landing Woman Wine

Documento interno de trabajo. El código lo ejecuta el agente en Antigravity sobre el repo
`vinosconmarypepa.cl`; acá están las tandas y los criterios con los que se aprueba cada una.

Reglas del proceso:

- Cada tanda se pide completa y el agente se detiene al final. No se encadenan.
- Ninguna tanda se aprueba leyendo el reporte del agente. Se reproducen los criterios con una
  prueba real y se corre siempre el caso adversario.
- Los hallazgos de cada revisión van a la sección 9 de `docs/SPEC-WomanWine.md` antes de pedir la
  siguiente tanda.
- Antes de la tanda 1, el agente lee `AGENTS.md` y `SPEC.md` de la raíz del repo, y este documento.

---

## Tanda 1: Datos y rutas

Construir el esqueleto: el JSON del evento, el layout, la ruta `/feria/[slug]` y el home
renderizando el evento destacado. Sin diseño fino todavía, con los bloques identificados.

Criterios de aceptación:

- [ ] Existe `src/data/eventos/2026-10-24-woman-wine.json` con la estructura de la
      sección 2 de `docs/SPEC-WomanWine.md`, con los datos reales que ya tenemos y vacíos los que no.
- [ ] `/feria/woman-wine` renderiza el contenido del JSON.
- [ ] El home renderiza el mismo contenido, con canonical apuntando a la ruta de la feria.
- [ ] `npx astro build` pasa limpio.

Caso adversario:

- [ ] Agregar un segundo JSON de evento inventado genera su propia página sin tocar código.
- [ ] Ese segundo evento con `publicado: false` no genera página y no rompe el build.
- [ ] Dos eventos con `destacado: true` hacen fallar el build con un mensaje claro, no eligen uno
      en silencio.
- [ ] Con **cero** eventos destacados el build pasa, el home muestra la portada de siempre y las
      páginas de evento siguen generándose en su ruta. Este es el estado al que va a llegar el
      sitio cuando el home deje de ser la feria, no puede romper el build.
- [ ] Un evento con `destacado: true` y `publicado: false` no llega al home. O hace fallar el build
      con un mensaje claro, o se ignora como destacado, pero nunca deja la portada apuntando a una
      URL que no se generó.

---

## Tanda 2: Contenido y diseño

Hero, qué es, qué incluye, ubicación y contacto, con la identidad de Vinos con Marypepa: acento
`#880000`, Cormorant Garamond para títulos, Poppins para texto, fondo claro.

Criterios de aceptación:

- [ ] Las secciones 1, 2, 3, 6 y 7 de `docs/SPEC-WomanWine.md` están construidas y salen del JSON.
- [ ] En móvil, la fecha, el lugar y el precio se leen sin hacer scroll.
- [ ] El logo del podcast está en su versión vectorial, como archivo referenciado, no incrustado
      en el HTML.
- [ ] `npx astro build` pasa limpio.

Caso adversario:

- [ ] Con `lugar.direccion` y `lugar.urlMapa` vacíos, la sección de ubicación se ve completa y no
      muestra un link muerto ni un espacio roto.
- [ ] Con `bajada` y `descripcion` vacías, la página no muestra un hueco ni un "undefined".

---

## Tanda 3: Entradas y pago

El bloque de entradas con los cuatro estados y la lógica de evento pasado.

Criterios de aceptación:

- [ ] Con `estado: "activo"` y un link de prueba, el botón abre el link en pestaña nueva.
- [ ] La tabla de estados de la sección 4 de `docs/SPEC-WomanWine.md` se cumple para los cuatro casos.
- [ ] El correo de contacto queda visible en los cuatro estados.
- [ ] El CTA fijo de móvil aparece al pasar el hero y desaparece cuando el estado no es `activo`.

Caso adversario:

- [ ] Con `estado: "activo"` y `urlLink` vacío, no se renderiza un botón muerto: se comporta como
      `proximamente`.
- [ ] Con la fecha de término movida al pasado, la página muestra el estado post evento aunque el
      JSON diga `activo`.

---

## Tanda 4: Galería de enólogas

La sección que sostiene la página.

Criterios de aceptación:

- [ ] Las 12 participantes salen del JSON, en el orden del arreglo, con nombre, viña y cargo.
- [ ] Las que no tienen foto muestran el placeholder de marca, no un espacio vacío ni un ícono roto.
- [ ] La grilla se lee bien en móvil, tablet y escritorio, y las fotos no se deforman.
- [ ] Con `instagram` vacío la tarjeta no es un link; con `instagram` lleno, sí.

Caso adversario:

- [ ] Agregar una participante número 13 en el JSON la muestra sin tocar ningún componente.
- [ ] Una participante con nombre largo y viña larga no rompe la tarjeta ni desalinea la grilla.
- [ ] Una foto horizontal en un marco vertical se recorta por el eje correcto, no aplasta la cara.

---

## Tanda 5: Cierre y publicación

Metadatos, compartir y checklist de publicación.

Criterios de aceptación:

- [ ] `og:title`, `og:description`, `og:image` y `twitter:card` con los datos del evento.
- [ ] Imagen OG 1200x630 en su lugar.
- [ ] `noindex` retirado y `robots.txt` abierto.
- [ ] `SPEC.md` del repo actualizado con la arquitectura de rutas nueva.
- [ ] `git diff --stat --ignore-all-space` muestra solo lo que se tocó.

Caso adversario:

- [ ] La URL real pegada en WhatsApp muestra la tarjeta con la imagen correcta, no el favicon ni
      un recuadro vacío.
- [ ] La página cargada en un teléfono real, con datos móviles, es usable: el CTA se ve, las fotos
      cargan, nada tapa el botón.
