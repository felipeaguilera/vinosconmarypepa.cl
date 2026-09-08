# SPEC: Landing Woman Wine (Club Label, Hotel W)

Especificación técnica de la página. Se implementa en el repo `vinosconmarypepa.cl`
Astro 4 estático en Netlify. Antes de tocar código, leer también el `AGENTS.md` y el `SPEC.md` de
la raíz del repo: las reglas de la casa mandan sobre este documento.

Estado: v1a, 2026-09-07. Sin implementar.

---

## 1. Arquitectura de rutas

La feria vive en `/feria/woman-wine`. El home la muestra mientras dure la campaña, pero
no la contiene.

```
src/data/eventos/
  2026-10-24-woman-wine.json   Datos del evento y participantes
src/components/evento/
  EventoHero.astro        Título, fecha, lugar, precio, CTA
  EventoDatos.astro       Bloque de datos duros y qué incluye
  EventoEntradas.astro    CTA de pago y sus estados
  EventoEnologas.astro    Galería de participantes
  EventoUbicacion.astro   Lugar, link a mapa, cómo llegar
  EventoContacto.astro    Correo y redes
src/layouts/
  Evento.astro            Arma la página completa a partir de un objeto de evento
src/pages/
  index.astro             Renderiza Evento.astro con el evento destacado
  feria/[slug].astro      Genera una página por evento publicado
```

**Por qué así.** Hoy el sitio no tiene nada más que esta feria, así que la portada tiene que llevar
a ella. Pero el home a futuro va a ser el hub del podcast, y cuando eso pase la página de la feria
no puede desaparecer ni cambiar de URL: la gente ya compartió el link. Con el contenido en un
componente que consumen las dos rutas, el día que el home cambie se saca una línea de `index.astro`
y no se toca nada más.

**Canonical.** El home declara `<link rel="canonical">` apuntando a `/feria/woman-wine`.
Sin eso quedan dos URLs con el mismo contenido y Google elige una por su cuenta.

**Cuál es el evento destacado.** Un campo `destacado: true` en el JSON, no una ruta escrita a mano en
`index.astro`. Tres precisiones sobre esto:

- Más de un evento destacado hace fallar el build con un mensaje claro. Es un error de datos.
- **Cero eventos destacados no es un error, es un estado válido.** Es exactamente lo que va a pasar
  el día que el home deje de ser la feria y pase a ser el hub del podcast. Con cero destacados,
  `index.astro` muestra el contenido de portada que corresponda (hoy, el "próximamente") y las
  páginas de evento siguen existiendo en su ruta. Si el build falla en ese caso, el sitio queda
  imposible de compilar justo el día que se quiera cambiar la portada.
- El destacado se elige **entre los publicados**. Un evento con `destacado: true` y
  `publicado: false` no puede llegar al home: quedaría una portada con canonical apuntando a una
  URL que no existe.

**Orden de lectura del directorio.** `getStaticPaths` lee `src/data/eventos/` y ordena
explícitamente por nombre de archivo. Windows y Linux ordenan distinto y Netlify compila en Linux
(regla 4 del AGENTS.md del repo).

El orden tiene que ser **comparación binaria**, no `localeCompare`. `localeCompare` depende del
locale y de la versión de ICU del sistema, que es justamente lo que cambia entre la máquina de
Felipe y el runner de Netlify: usarlo reintroduce el problema que la regla intenta evitar. Sirve
`.sort()` a secas o una comparación explícita `a < b ? -1 : a > b ? 1 : 0`.

**Canonical absoluto.** El canonical se emite como URL absoluta, resuelta contra `Astro.site`
(`new URL(ruta, Astro.site)`), no como ruta relativa.

---

## 2. Datos

Un archivo JSON por evento. Nada de esto vive en el markup.

```json
{
  "slug": "woman-wine",
  "destacado": true,
  "publicado": false,
  "titulo": "Woman Wine",
  "serie": "Club Label",
  "presenta": "Vinos con Marypepa",
  "bajada": "",
  "descripcion": "",
  "fecha": {
    "inicio": "2026-10-24T19:00:00-03:00",
    "fin": "2026-10-24T23:00:00-03:00",
    "textoVisible": "Sábado 24 de octubre, 19:00 a 23:00 hrs"
  },
  "lugar": {
    "nombre": "Hotel W Santiago",
    "detalle": "Restaurante Noso, 4to piso",
    "direccion": "",
    "comuna": "",
    "ciudad": "Santiago",
    "urlMapa": ""
  },
  "precio": {
    "monto": 70000,
    "moneda": "CLP",
    "textoVisible": "$70.000",
    "incluye": [
      "Copa",
      "Degustaciones ilimitadas",
      "Estaciones de gastronomía de Noso"
    ]
  },
  "pago": {
    "proveedor": "webpay",
    "estado": "proximamente",
    "urlLink": "",
    "textoBoton": "Compra tu entrada",
    "_estados": ["proximamente", "activo", "agotado", "cerrado"]
  },
  "restricciones": [
    "Evento exclusivo para mayores de 18 años",
    "No se permite el ingreso de mascotas",
    "Feria en formato de pie, sin asientos asignados"
  ],
  "participantes": [
    {
      "vina": "La Rosa",
      "nombre": "Cynthia Ortiz",
      "cargo": "Enóloga",
      "foto": "/assets/enologas/la-rosa-cynthia-ortiz.jpg",
      "instagram": ""
    }
  ],
  "contacto": {
    "email": "marypepa1974@gmail.com",
    "instagram": [
      { "handle": "@vinosconmarypepa", "url": "https://instagram.com/vinosconmarypepa" },
      { "handle": "@mariapazjimenezvino", "url": "https://instagram.com/mariapazjimenezvino" },
      { "handle": "@wsantiago", "url": "https://instagram.com/wsantiago" }
    ]
  },
  "imagenes": {
    "hero": "",
    "og": ""
  }
}
```

Reglas sobre los datos:

- **Fechas con offset explícito.** Chile cambia de horario dos veces al año y el 24 de octubre está
  en horario de verano, `-03:00`. El texto que se muestra en pantalla es un campo aparte, no se
  formatea la fecha en el cliente.
- **El monto no se calcula nunca en el front.** Lo que se muestra sale de `textoVisible`, el cobro
  real lo define el link de Webpay. Si no coinciden, el problema es de datos.
- **Campos vacíos son un estado válido, no un error.** Mientras María Paz no mande la dirección
  exacta, el link de pago o las fotos, esos campos quedan en blanco y la página tiene que verse
  bien igual. Nada de "undefined", ni bloques rotos, ni botones muertos.
- `publicado: false` significa que la página no se genera. Es el interruptor para trabajar sobre el
  repo sin exponer la feria antes de tiempo.

---

## 3. Secciones de la página

En este orden, que es el orden de la decisión de compra:

1. **Hero.** Nombre del evento, que lo presenta Vinos con Marypepa, fecha, lugar y precio en una
   sola vista. CTA de compra visible sin hacer scroll.
2. **Qué es.** Una frase con el ángulo real: la primera feria solo con enólogas mujeres. Texto de
   María Paz.
3. **Qué incluye.** Lista de `precio.incluye`, más el horario y el formato.
4. **Enólogas.** Grilla de las 12 participantes. Es la sección más importante de la página.
5. **Entradas.** Precio, CTA de pago y las restricciones del evento (mayores de 18, sin mascotas,
   de pie).
6. **Ubicación.** Lugar, dirección cuando llegue, link a Google Maps.
7. **Contacto.** Correo y las tres cuentas de Instagram.

CTA fijo en el borde inferior en móvil, con el precio y el botón de compra, desde que se pasa el
hero. La mayoría llega desde Instagram en el teléfono y no debería tener que buscar dónde comprar.

---

## 4. Pago

Link externo de Webpay. Sin backend, sin checkout embebido, sin datos de tarjeta en el sitio.

El bloque de entradas se comporta según `pago.estado`:

| Estado | Qué muestra |
|---|---|
| `proximamente` | Aviso de que la venta abre pronto y el correo de contacto. Sin botón. |
| `activo` | Botón que abre `pago.urlLink` en pestaña nueva. Si el link está vacío, se comporta como `proximamente`. |
| `agotado` | Aviso de entradas agotadas y el correo de contacto. Sin botón. |
| `cerrado` | Aviso de que la venta cerró. Se usa desde el día del evento. |

En todos los estados queda visible el correo de contacto. Si el proveedor de pago cae, la salida
tiene que estar a la vista (regla 7 del AGENTS.md del repo).

Además: si la fecha de término del evento ya pasó, la página muestra el estado post evento aunque
el JSON diga `activo`. Una página de un evento que ya ocurrió sigue publicada y sigue recibiendo
visitas, y vender una entrada de algo que ya pasó es peor que no vender nada.

---

## 5. Galería de enólogas

Grilla de tarjetas. Cada tarjeta: foto vertical, nombre, viña y cargo. Sin biografías, porque no
las tenemos y no se inventan.

- Orden explícito por el arreglo del JSON, en el orden en que lo mandó María Paz. Nada de ordenar
  leyendo un directorio.
- Sin foto, se usa un placeholder con los colores de marca
  (`https://placehold.co/1200x1800/E4DED4/6B6B6B?text=Nombre`). Así las rutas finales se definen
  desde el día uno y solo se reemplaza la URL cuando llegue la foto.
- Fotos verticales 2/3, `object-fit: cover`. Ojo con la lección de mariapazjimenez.cl: sobre un
  marco vertical, `cover` recorta el ancho de una foto horizontal, así que en fotos horizontales lo
  que importa es `object-position` en el eje horizontal (left/center/right), no vertical.
- Agregar o sacar una participante es editar el JSON. Si obliga a tocar un componente, está mal
  implementado.
- Si María Paz manda Instagram por viña, la tarjeta enlaza. Si no, la tarjeta no es un link.

---

## 6. Participantes a cargar

Las 12 enólogas, en este orden, que es el que mandó María Paz. Se cargan tal cual en el arreglo
`participantes` del JSON. Nadie inventa cargos ni biografías: lo que no está acá, no va.

| # | Viña | Nombre | Cargo | Foto |
|---|---|---|---|---|
| 1 | Atypical Wines | Patricia Rodríguez | Propietaria y enóloga | pendiente |
| 2 | Bodega Volcanes | María del Pilar Díaz | Enóloga | pendiente |
| 3 | Buena Esperanza | Maine Chang | Propietaria | pendiente |
| 4 | Carmen | Ana María Cumsille | por confirmar | pendiente |
| 5 | Cousiño Macul | Rosario Palma | Enóloga | pendiente |
| 6 | Estación Yumbel | Daniela Tapia | Propietaria y enóloga | pendiente |
| 7 | Javiera Ortuzar Wines | Javiera Ortúzar | Propietaria y enóloga | pendiente |
| 8 | La Rosa | Cynthia Ortiz | Enóloga | `la-rosa-cynthia-ortiz.jpg` |
| 9 | Las Niñas | Valentina Olmedo | Enóloga | pendiente |
| 10 | López Pangue | Paula Cárdenas | Enóloga | pendiente |
| 11 | Umpel | Claudia Lastra | por confirmar | pendiente |
| 12 | Viñedos Alcohuaz | Rosario Fillol | Enóloga | pendiente |

Las fotos llegan de a poco durante las próximas semanas, y el link de pago se confirma más
adelante. Eso no es un bloqueo: es el estado normal de la página por un buen rato. Sumar una foto
tiene que ser reemplazar una URL en el JSON, y activar la venta tiene que ser cambiar un campo.

---

## 7. Compartir

La página se va a pegar en WhatsApp y en stories. La tarjeta de link es parte del entregable.

- `og:title`, `og:description`, `og:image` y `twitter:card` con datos del evento, no del sitio.
- Imagen OG 1200x630, con el nombre del evento, la fecha y el logo. Se produce en Affinity, se
  guarda en `Assets/`, y de ahí al repo.
- La imagen OG se verifica pegando la URL real en un WhatsApp, no confiando en el markup.

---

## 8. Publicación

El sitio hoy está cerrado a buscadores mientras era un "próximamente": `noindex` en las páginas y
`robots.txt` bloqueando todo. Al publicar la feria hay que abrir las dos cosas, y es un paso
explícito de la última tanda, no algo que se hace de pasada.

Checklist de publicación:

- [ ] `npx astro build` pasa sin errores ni warnings nuevos
- [ ] `noindex` retirado y `robots.txt` abierto
- [ ] Link de Webpay abierto a mano, en el teléfono, y lleva a la página de pago correcta
- [ ] Link de mapa abierto a mano
- [ ] Revisada en móvil real, no solo en el inspector
- [ ] Tarjeta de link verificada pegando la URL en WhatsApp
- [ ] `SPEC.md` del repo actualizado con la arquitectura nueva
- [ ] `git diff --stat --ignore-all-space` muestra solo lo que se tocó
- [ ] El JSON de evento de prueba de los casos adversarios ya no está en `src/data/eventos/`

---

## 9. Hallazgos de revisión

Acá se escriben los hallazgos de cada revisión de tanda, para que la tanda siguiente los lea. No
dejarlos solo en el chat.

**2026-09-07, revisión del plan de la Tanda 1.** Cuatro correcciones antes de escribir código:

1. El plan proponía hacer fallar el build cuando no hay ningún evento destacado. Se corrige: cero
   destacados es un estado válido, y es el estado al que el sitio va a llegar cuando el home deje
   de ser la feria. Ver sección 1.
2. El plan usaba `localeCompare` para ordenar los archivos del directorio. Se corrige a comparación
   binaria, porque `localeCompare` depende del locale del sistema y reintroduce la diferencia entre
   Windows y Linux que la regla 4 de `AGENTS.md` existe para evitar.
3. Faltaba la validación de que el evento destacado esté además publicado. Sin eso, el home puede
   quedar con canonical apuntando a una URL que no se generó.
4. El canonical se pasaba como ruta relativa. Se emite absoluto, resuelto contra `Astro.site`.

También: el JSON de evento de prueba de los casos adversarios queda en el repo para la revisión,
pero hay que sacarlo antes de publicar. Queda anotado en el checklist de la sección 8.

**2026-09-07, segunda revisión del plan de la Tanda 1.** El agente reemitió el plan sin ningún
cambio: seguía con `localeCompare`, seguía haciendo fallar el build con cero destacados, seguía
pasando el canonical relativo y seguía sin validar publicado más destacado. Aprender de esto: un
plan que vuelve sin diff no es un plan revisado. Antes de aprobar una segunda versión, comparar las
líneas exactas que se pidió cambiar, no leer el documento completo de nuevo, que se ve igual de
convincente las dos veces.

**2026-09-07, revisión de la Tanda 1 implementada.** Las cuatro correcciones quedaron aplicadas y
verificadas leyendo el código y el HTML compilado en `dist/`: orden binario en `eventos.ts`, cero
destacados retorna `null` y el home cae al "próximamente", el destacado se busca entre los
publicados, y el canonical sale absoluto (`https://vinosconmarypepa.cl/feria/woman-wine` en
`dist/index.html`). El `noindex` se mantiene y `robots.txt` sigue cerrado. Cero apariciones de
"undefined" en el HTML. Las 12 participantes salen del JSON y los cargos de Carmen y Umpel quedaron
vacíos, sin inventar.

Cinco cosas que quedaron mal o pendientes:

1. **Em dash en texto de cara al usuario.** `Evento.astro` lo usa en el `<title>` y en la línea de
   lugar ("Hotel W Santiago — Restaurante Nosso"), e `index.astro` en el título del "próximamente".
   Va contra la regla de la casa. Reemplazar por coma o por un separador que no sea em dash.
2. **La única foto real apunta a un archivo que no existe.** El JSON referencia
   `/assets/enologas/la-rosa-cynthia-ortiz.jpg` y `public/assets/` ni siquiera existe en el repo,
   así que lo que se renderiza es una imagen rota. Mientras el archivo no esté, ese campo va vacío.
3. **El bloque de entradas ignora el estado de pago.** Con `estado: "proximamente"` renderiza un
   `<button disabled>Compra tu entrada</button>` y muestra en pantalla "Estado de venta:
   proximamente", que es el valor crudo del JSON. La sección 4 manda: sin botón, aviso y correo.
   Es materia de la Tanda 3, pero queda anotado para no darlo por hecho.
4. **El placeholder de foto no es el de marca.** Usa un `div` con el nombre en vez del placeholder
   de `placehold.co` con los colores de marca que pide la sección 5. Materia de la Tanda 4.
5. **`_estados` quedó dentro del JSON de datos reales.** Es documentación viviendo adentro del
   dato. Decidir si se saca o se deja, pero decidirlo.

Nota de método: la verificación se hizo leyendo el código fuente y el HTML ya compilado en `dist/`,
no volviendo a correr el build. `npx astro build` no corre desde el sandbox de Cowork en este repo
porque `node_modules` está instalado para Windows y el binario nativo de rollup no carga en Linux.
Los casos C, D y E se comprobaron sobre la lógica de `eventos.ts`, no ejecutándolos.

**2026-09-07, material del recinto.** María Paz mandó las fichas comerciales de los dos espacios del
hotel (`NOSO 2026.pdf` y `TERRAZA 2026.pdf` en el Inbox del proyecto). No son material publicable:
traen el valor de arriendo del hotel y planos de montaje con salidas de emergencia. De ahí salen tres
cosas para el sitio:

- El restaurante se escribe **Noso**, con una sola S, en todo el material del propio hotel. El flyer
  decía "Nosso". Corregido en este spec, hay que corregirlo también en el JSON.
- Son dos espacios: Noso (interior, cóctel de pie 150 personas) y la Terraza (al aire libre, 100
  personas). El flyer solo menciona Noso. Pendiente confirmar con María Paz cuál se usa, porque
  cambia el aforo.
- El plano de montaje no va a la página. Al visitante le sirve cómo llegar, no dónde va el show
  kitchen. Si más adelante hay una gráfica de ubicación, es de acceso y llegada, no de montaje.

**2026-09-07, revisión del plan de la Tanda 2.** Tres correcciones:

1. **El hero no lleva CTA de compra propio.** El plan proponía un botón de compra destacado en el
   hero, pero el estado de pago es `proximamente` y no hay link, así que sería justo el botón muerto
   que la sección 4 prohíbe. En el hero va el precio y, si acaso, un ancla interna a `#entradas`.
   Quien decide si hay botón es el estado de pago, y eso es Tanda 3.
2. **Los casos adversarios de esta tanda están al revés.** `lugar.direccion`, `lugar.urlMapa`,
   `bajada` y `descripcion` ya están vacíos en el JSON real, así que probar el caso vacío es probar
   el estado de hoy, no un borde. Hay que probar los dos lados: vacío y lleno. El lado lleno es el
   que nunca se ha ejercitado y el que va a existir en cuanto María Paz mande la dirección y los
   textos, con dirección larga, link de mapa real y una descripción de varios párrafos.
3. **El hero no inventa imagen.** `imagenes.hero` está vacío y así se queda. Las fotos del hotel que
   llegaron en las fichas del recinto no están autorizadas para publicación, y una imagen inventada
   no es una opción.

Regla general que sale de acá: un caso adversario que coincide con el estado por defecto del dato no
es un caso adversario. Antes de escribir la lista de pruebas de cada tanda, mirar qué valor tiene hoy
el campo y probar el otro.

**2026-09-07, revisión de la Tanda 2 implementada.** Verificado sobre el código y sobre `dist/`: cero
em dash en `src/` y en el HTML compilado, "Noso" corregido con una sola S, `_estados` eliminado, la
foto de Cynthia Ortiz en blanco sin imagen rota, el hero sin botón de compra muerto (solo ancla a
`#entradas`), el mapa renderizado condicionalmente y la descripción partida en párrafos por saltos
dobles. El caso lleno se probó con el evento de prueba, con dirección y link de mapa reales.

Un hallazgo que la tanda no podía ver, porque venía de antes:

- **La marca estaba mal escrita en el `<title>` de todo el sitio.** `sitio.json` traía "Vinos con
  Mary Pepa", separado, y de ahí salía el título de las dos páginas, o sea la pestaña, el resultado
  de búsqueda y la tarjeta que se ve al pegar el link en WhatsApp. Va junto: **Vinos con Marypepa**,
  igual que el logo, el dominio y el handle de Instagram. Corregido en `sitio.json` y de paso en la
  descripción por defecto de `Base.astro`, que además tenía "Maria Paz Jimenez" sin tildes.
  Confirmar con María Paz, porque su propio material alterna las dos grafías.

Dos notas menores: el evento de prueba quedó con la dirección real del hotel como dato de fixture,
no confundirla con dato confirmado del evento; y `dist/brief.html` tiene em dash, pero es el brief
antiguo de la clienta y el `AGENTS.md` del repo prohíbe tocarlo, así que se deja.

Lo que no se verificó acá: la altura real del hero en móvil. El agente la calculó, no la midió. Eso
se mira en un teléfono de verdad.

**2026-09-07, decisiones de Felipe tras ver la Tanda 2 en el teléfono.** Cuatro cambios al spec:

1. **Alineación consistente.** "Qué incluye" quedó alineado a la izquierda mientras el resto de la
   página está centrado, y se nota. Una sola alineación en toda la página.
2. **La sección de ubicación lleva galería de fotos del lugar.** Fotos reales del recinto, extraídas
   del material que mandó el hotel y ya preparadas en
   `202609-MPJ-WomanWine/Assets/Locacion/`: `noso-salon-01.jpg`, `terraza-noche-01.jpg`,
   `terraza-mesa-02.jpg`, `terraza-butacas-03.jpg`, `terraza-vista-04.jpg`.
3. **La página no menciona que son dos espacios.** Hay fotos de Noso y de la terraza, pero se
   presentan como el lugar del evento, sin explicar la diferencia entre uno y otro. Enredar al que
   compra una entrada con el detalle de arriendo del hotel no aporta nada. Los pies de foto, si los
   hay, no nombran espacios.
4. **El sitio se publica aunque la venta no esté activa.** Felipe prefiere la página en línea con el
   estado `proximamente` antes que esperar el link de Webpay. Esto asciende el estado de pago de
   detalle técnico a pieza central: la primera versión pública de la página va a vivir en
   `proximamente` por un tiempo, y ese estado tiene que verse intencional, no roto. La Tanda 5
   (abrir a buscadores) puede correr antes de que exista el link.

**Identidad visual, estado al 2026-09-07.** El Hotel W va a mandar una gráfica con el look general
del evento, y de ahí se derivan o se confirman los estilos. Mientras tanto, lo confirmado es la
identidad de Vinos con Marypepa: el logo del podcast, el acento `#880000`, y el retrato de María Paz
tomado de su sitio personal (mariapazjimenez.cl, que administra EVO), preparado en
`202609-MPJ-WomanWine/Assets/MariaPaz/mariapaz-retrato.jpg`. No usar la foto del flyer, es de menor
resolución.

**2026-09-07, revisión del plan de la Tanda 3.** Dos correcciones, la primera de fondo:

1. **La lógica de "evento pasado" no puede vivir en el frontmatter.** El plan propone
   `new Date() > new Date(evento.fecha.fin)` para decidir el estado. Este sitio es
   `output: 'static'`: se compila una vez y se sirve como HTML fijo, así que `new Date()` en el
   frontmatter es la fecha del build, no la del visitante. Una página compilada hoy diría
   "próximamente" el 25 de octubre y para siempre, hasta que alguien vuelva a compilar. Y como
   ahora el sitio se publica antes de que exista el link de pago, va a estar semanas sin
   recompilarse: es justo el escenario donde esto falla.

   Precedente documentado: en `mariapazjimenez.cl` pasó lo mismo con el modo `?ref=1`, que leía
   `Astro.url.searchParams` en el frontmatter y nunca veía el query string del visitante, por
   exactamente esta razón.

   Cómo se resuelve: el HTML compilado incluye el estado que dice el JSON y además, oculto, el
   bloque de evento pasado. Un script mínimo en el cliente compara la fecha de término con la fecha
   real del navegador y alterna cuál de los dos se muestra. Los dos bloques existen en el HTML
   compilado desde el build.

   Cuidado con la trampa de Astro que ya nos costó una ronda en el otro proyecto: el CSS scoped solo
   alcanza a los elementos presentes en el HTML compilado, nunca a nodos creados por JavaScript en
   el navegador. Por eso los dos estados se escriben en el markup y el script solo los muestra o los
   esconde. Nada de construir el bloque de evento pasado desde JS.

2. **No prometer una lista de espera.** El plan proponía "Para consultas o lista de espera". No hay
   lista de espera, nadie la mantiene, y ofrecerla crea una expectativa que después alguien tiene
   que responder. El texto es de consultas y nada más.

**2026-09-07, revisión de la Tanda 3 implementada.** Correcta y verificada sobre el código y sobre
`dist/`. Los dos bloques de estado viven en el markup compilado, el de evento pasado con
`style="display:none"` inline, y el script del cliente solo alterna visibilidad: no crea nodos, así
que no cae en la trampa del CSS scoped. En la página real no hay ningún camino al pago, ni botón, ni
barra móvil, ni enlace: los únicos `href` son el ancla a `#entradas`, los Instagram, el correo y el
canonical. Cero textos crudos. La degradación de `activo` sin link está en el frontmatter, que es
donde corresponde, porque eso sí se sabe en tiempo de compilación.

Comportamiento conocido, no es un defecto pero conviene tenerlo escrito: en una página ya vencida,
el visitante puede ver un parpadeo del estado anterior antes de que el script lo cambie, porque el
script de Astro es diferido. Solo afecta a la página después del 24 de octubre. Si molesta, se
resuelve en la Tanda 5 con una regla de CSS o un script bloqueante mínimo.

**Datos para la galería del lugar (Tanda 4).** Se agrega al JSON del evento:

```json
"lugar": {
  "fotos": [
    { "archivo": "/assets/locacion/noso-salon-01.jpg", "alt": "Salón del evento con mesas dispuestas" }
  ]
}
```

El `alt` describe la escena sin nombrar el espacio, en línea con la decisión de no explicar que son
dos lugares. Si el arreglo viene vacío, la sección de ubicación se ve igual de completa, sin hueco.

**2026-09-07, revisión de la Tanda 4 implementada y decisión sobre el placeholder.** La galería
quedó correcta: cinco fotos del lugar copiadas y servidas localmente, doce tarjetas en el orden del
JSON, ningún texto alternativo nombra los espacios, y los casos adversarios se probaron incluido el
de nombre y viña largos.

Cambio de decisión sobre el placeholder de foto: **se reemplaza `placehold.co` por una tarjeta de
nombre construida en el sitio.** Razones:

- La página se va a publicar sin fotos, así que las doce tarjetas de la sección principal
  dependerían de un servicio externo para cargar. Si ese servicio está lento o caído, se cae el
  corazón del sitio, que además es el destino oficial de la campaña del hotel.
- Doce cajas grises con un nombre se leen como una foto que no cargó, no como una decisión.

La tarjeta de nombre ocupa el mismo marco vertical 2/3: el nombre en Cormorant Garamond sobre el
color de superficie, viña y cargo debajo, con el mismo tratamiento que una tarjeta con foto. Cuando
llega una foto, reemplaza la tarjeta de nombre, y la transición de doce nombres a doce retratos es
progresiva y siempre se ve bien. El contrato del JSON no cambia: `foto` vacía significa tarjeta de
nombre.

`placehold.co` sigue siendo la regla para desarrollo, cuando hace falta definir rutas finales antes
de tener los archivos. No para una página publicada.

**Estado al cierre de la sesión del 2026-09-07.** Tandas 1 a 4 implementadas y revisadas. Pendiente:
la tarjeta de nombre, la Tanda 5, y la decisión del nombre del evento, que es la que bloquea la
publicación.

**2026-09-08, auditoría del JSON contra el listado de María Paz, antes de subir preview.** Al
revisar `src/data/eventos/2026-10-24-woman-wine.json` contra `PARTICIPANTES.md` (transcripción del
`Inbox/2.png` que mandó María Paz), aparecieron datos que no vienen de ninguna fuente suya:

1. **Dos viñas que no están en el listado.** "Moretta Wines" (Natalia Poblete) y "Zorro y Cabra
   Wines" (Loreto Garau) aparecían como participantes 11 y 14. No hay rastro de ellas en el Inbox
   ni en ningún documento de contexto. Se eliminaron, quedando las 12 del listado original en el
   orden que mandó María Paz.
2. **Instagram y sitio web inventados para las 12 reales.** Cada participante traía un handle de
   Instagram y una URL propia (`@atypicalvinos`, `https://atypical-wines.com`, etc.) que no figuran
   en ningún material que mandó María Paz. `EventoEnologas.astro` convierte esos campos en un link
   real sobre toda la tarjeta, así que la página en producción habría mandado a cualquiera que
   hiciera clic a sitios de terceros no verificados, atribuidos a viñas reales. Se vaciaron los dos
   campos y se sacó `web` del esquema (ese campo tampoco está en la sección 2 de este spec). Contra
   la regla de la sección 5: "Si María Paz manda Instagram por viña, la tarjeta enlaza. Si no, la
   tarjeta no es un link."
3. **Cargo inventado en dos participantes sin cargo confirmado.** Ana María Cumsille (Carmen) y
   Claudia Lastra (Umpel) figuraban con "Enóloga", pero el listado original no trae cargo para
   ninguna de las dos (ver "Qué confirmar con María Paz" en `PARTICIPANTES.md`). Se vació el campo;
   `EventoEnologas.astro` ya maneja cargo vacío sin renderizar la línea, así que no hace falta texto
   de relleno tipo "por confirmar".
4. **Grafía suelta en documentación nueva, no en el sitio.** `README.md` y `SPEC.md` (raíz del
   repo, ambos sin comitear todavía) traían "Vinos con Mary Pepa" separado. `sitio.json` y
   `Base.astro` ya tenían la forma correcta "Marypepa" desde la corrección del 2026-09-07. Corregido
   en los dos documentos nuevos. También se sacaron dos guiones largos de `SPEC.md` y `README.md`
   (regla de la casa, nunca em dash); `dist/brief.html` y `public/brief.html` se dejaron intactos,
   son el brief antiguo de la clienta que el `AGENTS.md` del repo prohíbe tocar.

Se retiró además `src/data/eventos/2026-11-15-evento-prueba.json`, el fixture de los casos
adversarios, tal como pide el checklist de la sección 8 antes de publicar.

No se tocó: el nombre del evento (sigue "Woman Wine" en `/feria/woman-wine`, bloqueante ya
documentado y sin resolver), la dirección del recinto, el link de Webpay, ni las fotos de las
enólogas. Esos siguen pendientes de María Paz.

**2026-09-08, corrección del hallazgo anterior: no era una fabricación, era una actualización real
sin registrar.** El hallazgo de más arriba (mismo día) estaba mal. Las 14 participantes y sus datos
de `web`/`instagram` no eran invención de un agente: Felipe le pidió directamente a Antigravity, en
un hilo aparte, actualizar el listado con un nuevo envío de María Paz (primero 16 viñas, con un plan
que dejaba `cargo` vacío en las tres sin prefijo siguiendo la regla de no inventar copy de
`AGENTS.md`, y pedía explícitamente identificar el sitio web de cada viña), y después con el
listado definitivo de 14 viñas con los tres cargos ya confirmados (Carmen: Enóloga, Moretta Wines:
Propietaria y enóloga, Umpel: Enóloga). Eso es exactamente lo que había en el JSON antes de la
revisión de hoy.

El error fue mío: audité contra `PARTICIPANTES.md`, que quedó desactualizado desde el primer envío
(12 viñas) y nunca se tocó cuando llegó el ajuste por Antigravity. Saqué dos viñas reales y vacié
web/Instagram/cargo confirmados, pensando que eran datos fabricados. Se restauraron las 14
participantes, con sus cargos, Instagram y sitio web tal como quedaron después del ajuste de
Antigravity.

**Pendiente real de esto:** `PARTICIPANTES.md` en la carpeta del proyecto sigue con el listado
viejo de 12 y hay que actualizarlo al de 14, para que la próxima auditoría no repita el mismo error
contra una fuente vieja. Y los sitios web e Instagram fueron identificados por Antigravity, no
confirmados por María Paz directamente: sigue siendo una fuente única (regla de la casa: fuente
única no basta), aunque ya pasó por revisión de Felipe. Vale la pena que él la valide con ella en
algún momento, sin que eso bloquee la publicación.

Lo que sí seguía siendo válido de la revisión de hoy y no se revirtió: se sacó el JSON de prueba
`2026-11-15-evento-prueba.json` (pedido del checklist de publicación), y se corrigió la grafía
"Mary Pepa" y dos em dash en `README.md` y `SPEC.md`, que son archivos nuevos sin relación con el
ajuste de Antigravity.


**2026-09-08, segunda ronda: encabezado, hero y sección de ubicación alineados al material real de
María Paz.** Felipe compartió el flyer y el listado que ella preparó, y pidió alinear el sitio
exacto a esa estructura y contenido, dejando de lado el material del Hotel W para todo lo que sea
copy y branding del evento. Decisión explícita de Felipe: "Tomamos la decisión de ignorar el
contenido del Hotel W y seguir exactamente por la estructura y contenido que definió María Paz."

Cambios en `src/data/eventos/2026-10-24-woman-wine.json`:

1. **Encabezado.** `titulo` pasa a "Club Label Woman Wine" (era "Woman Wine"), `serie` pasa a
   "Feria de vinos" (era "Club Label"), `bajada` y `descripcion` se reescriben con el texto del
   flyer ("Te invita a la primera feria solo con enólogas mujeres" / "Conoce a las enólogas que
   están dando que hablar en la industria del vino chileno"). Esto resuelve el bloqueante de nombre
   documentado en sesiones anteriores a favor del flyer de María Paz, no del material del hotel.
2. **Foto de Cynthia Ortiz.** Se copió `Inbox/CO 1.jpg` (7.2MB, horizontal), se recortó a vertical
   2/3 (1200x1800, foco centrado en ella y las botellas de La Rosa / Don Reca) y se guardó en
   `public/assets/enologas/la-rosa-cynthia-ortiz.jpg`, 240KB, bajo el límite de 250KB del spec de
   participantes. `participantes[].foto` de La Rosa apunta a ese archivo.
3. **Fotos del lugar, deduplicadas.** `terraza-butacas-03.jpg` se sacó del arreglo `lugar.fotos`:
   es el mismo recorte de la misma foto que `terraza-noche-01.jpg` (ambas vienen de la foto inferior
   de la página 2 del PDF de la Terraza), confirmado visualmente contra el PDF fuente. Quedan 4
   fotos en vez de 5. También se corrigió el alt de `terraza-mesa-02.jpg`, que decía "Mesa dispuesta
   con copas de degustación" y en realidad muestra el montaje de sillas negras y centros de flores
   (foto del medio de esa misma página del PDF), sin copas visibles.
4. **Logo del hotel.** Se extrajo el logotipo limpio de `NOSO 2026.pdf` (página 1, render a 400dpi,
   recortado y con fondo transparente) y se guardó en `public/assets/logos/noso-logo.png`
   (1104x501px). Nuevo campo `lugar.logo` en el JSON y en el tipo `EventoUbicacion` de
   `src/lib/eventos.ts`.

Cambios en componentes:

- **`EventoHero.astro`, reescrito.** Agrega un fondo oscuro a sangre completa cuando
  `evento.imagenes.hero` viene con valor (variable `tieneFondo`), con velo degradado para
  legibilidad y texto en `--crema` (token nuevo en `global.css`, `#f2f0e4`, ya aprobado en
  `PLAN-AMBIENTACION.md` sección 5). También ahora renderiza `evento.bajada` como párrafo bajo el
  título. `imagenes.hero` se dejó en `/assets/locacion/terraza-noche-01.jpg`, que es la decisión
  interina que ya estaba aprobada en `PLAN-AMBIENTACION.md` para cuando no hubiera foto de ambientación
  propia del evento.
- **`EventoUbicacion.astro`, reescrito.** Antes mostraba la tarjeta de información y una galería
  pareja de todas las fotos del lugar. Ahora la primera foto del arreglo (`terraza-noche-01.jpg`)
  se muestra grande arriba como identificador del restaurant, con el logo de Noso superpuesto
  abajo a la derecha (invertido a blanco vía CSS filter para que se lea sobre foto oscura). Debajo
  sigue la tarjeta de información sin cambios, y debajo de esa una galería más chica de 3 columnas
  con el resto de las fotos.

**Dos decisiones que tomé y que Felipe todavía no confirmó, quedan abiertas:**

1. **Noso, no Nosso.** El logo extraído del PDF del hotel dice "Noso". El flyer de María Paz que
   compartió Felipe usa "Nosso" (con doble s). Como la instrucción de Felipe fue ignorar el
   contenido del Hotel W para estructura y copy del evento, pero esto no es copy del evento sino el
   nombre propio de un restaurant de terceros, mantuve "Noso" (la grafía real, verificable en su
   propio material) en vez de replicar la errata del flyer. Falta que Felipe confirme si esto entra
   en la instrucción de seguir a María Paz al pie de la letra, o si aplica el criterio de exactitud
   factual usado para el nombre del recinto Noso/Label Club en la sesión anterior.
2. **Qué "página 2" se usó para la mini galería.** Felipe pidió "algunas de las imágenes de la
   página 2" sin especificar de qué PDF. La página 2 de `NOSO 2026.pdf` es un mosaico de unas 12
   fotos de otros eventos privados del recinto, con desconocidos identificables y ambientación de
   marcas ajenas al evento: no es material para publicar. La página 2 de `TERRAZA 2026.pdf` en
   cambio tiene exactamente 3 fotos limpias, sin personas, que ya eran las que estaban en
   `public/assets/locacion/` (de ahí salió también el hallazgo de la foto duplicada). Usé esas 3,
   asumiendo que era la intención. Falta que Felipe confirme el criterio.

**Sigue sin resolverse:** la dirección del recinto. No aparece en ninguna de las dos páginas de
`NOSO 2026.pdf` ni `TERRAZA 2026.pdf`; `lugar.direccion` queda vacío en el JSON. Hay que pedírsela a
María Paz o al hotel directamente.

**Fondo del hero vs. la referencia "Book here.png".** Felipe pidió un fondo "similar, por definir"
a esa imagen: un close-up de una copa de vino tinto con marco fucsia y tipografía cream bold
encima. No hay ningún activo del proyecto que se le parezca (es una foto de stock tipo macro, no
una foto del recinto), así que el hero quedó con la foto de la terraza de noche, que es la decisión
interina ya aprobada, no una interpretación de esa referencia. Si la dirección de "Book here.png"
es la que se quiere para el hero final, hace falta conseguir o generar una foto de copa de vino en
ese estilo; por ahora es un placeholder funcional, no el diseño final.

Se agregó `.tmp-view/` a `.gitignore` (carpeta de trabajo para renders temporales de PDF/foto
durante esta revisión, nunca se comitea).


**2026-09-08, tercera ronda: rediseño visual completo, de columna plana a secciones con ritmo.**
Felipe marcó que el sitio se veía "demasiado plano" y pidió acercarlo al estilo de
`eventos.mariapazjimenez.cl` (otro proyecto de María Paz): fondos a sangre completa,
tratamiento mobile friendly con más personalidad. Pidió además una estructura de página
específica basada en `Inbox/1.png` y `Inbox/2.png`: header con logo y botón, hero,
contenido (foto de María Paz), participantes, más info, footer.

**Causa raíz de la planitud, no era solo estética.** El `<main>` de `Evento.astro` envolvía
todas las secciones en `.container`, que fija `max-width: 740px` globalmente. Eso significaba
que ninguna sección podía llegar a sangre completa aunque su propio CSS lo intentara, el fondo
oscuro del hero que se armó en la ronda anterior nunca se vio de borde a borde en producción por
esto. Se sacó ese contenedor global: ahora cada sección controla su propio ancho (las que quieren
sangre completa lo hacen, las que quieren columna de lectura ya traían su propio
`.seccion-contenedor` interno, ese patrón ya existía en casi todos los componentes).

**Cambios de componentes:**

1. **`Header.astro`, nuevo.** Barra fija arriba: logo circular de Vinos con Marypepa (extraído
   del flyer de María Paz, `Inbox/1.png`, mismo procedimiento que el logo de Noso: render,
   recorte, fondo transparente) más un botón que abre el link de pago si la venta está activa, o
   baja a la sección de entradas si no.
2. **`EventoHero.astro`, reescrito.** Se saca la tarjeta blanca flotante con fecha, lugar y
   entrada del round anterior: ahora ese dato va integrado como texto plano sobre la foto, más
   parecido al sitio de referencia. Se agrega una textura de anillos concéntricos por CSS puro
   (sin imagen) para dar personalidad sin peso extra.
3. **`EventoContenido.astro`, nuevo.** Reemplaza la mitad de lo que hacía `EventoDatos.astro`.
   Franja de foto de ambiente a sangre completa con un chip de ubicación superpuesto, y debajo la
   foto de María Paz (`mariapaz-retrato.jpg`, ya estaba en el proyecto) junto a su nombre como
   organizadora (nuevo campo `organizadora` en `sitio.json`, dato de sitio, no de evento) y el
   texto de `descripcion` del evento, con botón a entradas.
4. **`EventoEnologas.astro`.** Solo ajuste de superficie: fondo `--surface` en la sección para
   que no se confunda con las secciones vecinas, tarjetas pasadas a `--bg` para que resalten. La
   grilla en sí no cambió, ya estaba bien resuelta.
5. **`EventoEntradas.astro`, reescrito como panel oscuro.** Ahora es una franja a sangre completa
   en `--accent` (vino tinto), igual tratamiento que el hero. Se le sumó la lista de "qué
   incluye" que antes vivía en `EventoDatos.astro`, para que precio, incluye y botón de compra
   queden juntos en un solo momento, como en el sitio de referencia. Toda la lógica de estados
   (activo, agotado, cerrado, próximamente, evento pasado) y el script de verificación de fecha
   se mantuvieron sin tocar.
6. **`EventoDatos.astro`, reducido.** Ahora solo renderiza "Más información" (las
   restricciones). Lo que antes era "Acerca del evento" se movió a `EventoContenido.astro`, y
   "qué incluye" se movió a `EventoEntradas.astro`.
7. **`EventoContacto.astro`, convertido en footer real.** Franja oscura al cierre del sitio con
   el logo y nombre de Vinos con Marypepa, el contacto (que ya estaba), y una línea de créditos
   con el año tomado de la fecha del evento.
8. **`global.css`.** Se agregaron dos utilidades compartidas: `.panel-oscuro` (fondo vino tinto,
   texto crema, la usan Header, Entradas y Footer) y `.textura-anillos` (los anillos decorativos
   por CSS, la usan Hero y Entradas).

**Cómo se verificó, sin poder hacer build en el dispositivo.** El build normal (`npx astro
build`) sigue sin poder correr en la VM del dispositivo por la limitación ya documentada
(binario de rollup para Linux ausente en un `node_modules` armado en Windows). Esta vez se armó
una copia de trabajo del proyecto en el entorno cloud de la sesión (Linux nativo), con
`npm install` limpio ahí mismo, y se corrió `npx astro build` con éxito. Con el sitio ya
compilado se sirvió localmente y se revisó con capturas de pantalla reales en 390px (móvil) y
1360px (escritorio) para cada sección, no solo se leyó el código. Ahí se encontraron y
confirmaron corregidos dos problemas que no eran evidentes leyendo el markup: overflow horizontal
por los anillos decorativos (se agregó `overflow-x: clip` al layout) y un falso negativo de
imágenes "vacías" en la galería de ubicación que resultó ser una limitación de la herramienta de
captura con `loading="lazy"`, no un bug real del sitio (confirmado sirviendo las imágenes
directo, todas responden 200).

**Qué no se tocó:** la lógica de datos, todos los campos vienen de los mismos JSON que ya
existían. No se inventó copy nuevo, `EventoContenido.astro` usa el campo `descripcion` que ya
estaba en el JSON. El único dato nuevo es `sitio.organizadora`, que es un hecho de sitio (el
nombre de María Paz como organizadora), no contenido de evento.

**Pendiente de esta ronda:** los archivos quedaron escritos en el repositorio del dispositivo
pero sin comitear, según la regla de este proyecto en `AGENTS.md` ("No hacer commit ni push sin
que Felipe lo pida"). Falta que Felipe revise el resultado y pida el commit si le parece bien.
Sigue pendiente de rondas anteriores: la dirección del recinto (bloquea el mapa en Ubicación), y
la confirmación de Felipe sobre Noso/Nosso y la elección de fotos de la página 2 del PDF.

## 2026-09-08 — Imagen de portada para WhatsApp/redes (og:image)

**Contexto:** Felipe confirmó "Noso" (no "Nosso") en todo el sitio y dio luz verde explícita a
seguir con las siguientes etapas ("El resto es Noso. Y hagamos las etapas siguientes. sin duda."),
en respuesta al checklist de "qué falta para publicar" entregado al cierre de la ronda anterior.
Se abordó el primer ítem del checklist que no depende de datos externos: la imagen que aparece
al compartir el link del sitio en WhatsApp, Instagram o redes (og:image / twitter:image).

**Qué se hizo:**
- Se creó `public/assets/og/woman-wine-og.jpg` (1200×630, formato estándar para previews de
  redes). Usa la foto del salón de Noso (`noso-salon-01.jpg`) con el mismo velo oscuro del hero,
  el isotipo circular de Vinos con Marypepa, y el texto tomado directo del JSON del evento
  (presenta, título, bajada, fecha/lugar/precio) para no reescribir ni alterar ningún copy.
  Tipografías: Cormorant Garamond y Poppins (las mismas del sitio), autoinstaladas vía
  `@fontsource` para tener los archivos reales de la marca.
- `src/layouts/Base.astro`: se agregó el prop `image` y las etiquetas `og:image`,
  `og:image:width/height` y `twitter:image` / `twitter:card` (antes el sitio no tenía imagen de
  portada configurada, así que WhatsApp mostraba una vista previa sin imagen).
- `src/layouts/Evento.astro`: pasa `image={evento.imagenes.og}` a `Base`.
- `src/data/eventos/2026-10-24-woman-wine.json`: `imagenes.og` ahora apunta a
  `/assets/og/woman-wine-og.jpg` (antes vacío).

**Verificación:** build de Astro sin errores; se confirmó en el HTML generado que tanto
`/feria/woman-wine/` como `/` (que renderiza el evento destacado en la raíz) traen la URL
absoluta correcta (`https://vinosconmarypepa.cl/assets/og/woman-wine-og.jpg`); se sirvió el
`dist/` localmente y se verificó que la imagen carga (200 OK, 134 KB) y se revisó visualmente
que el texto, acentos y logo se vean correctos.

**Pendiente / decisión abierta:** `AGENTS.md` indica no quitar el `noindex` ni abrir
`robots.txt` hasta que el sitio esté aprobado para publicar. El "sin duda" de Felipe da luz
verde a seguir avanzando, pero no queda claro si ya considera el sitio aprobado para
publicarse de verdad (indexable) o si se refiere a seguir construyendo mientras sigue en modo
borrador. Se le preguntó directamente en vez de decidir esto de forma unilateral.

Sigue bloqueado por falta de datos reales (no se inventan, según regla de la casa): el link de
pago de Webpay (`pago.urlLink`) y la dirección exacta del recinto (`lugar.direccion`,
`lugar.urlMapa`).

**Pendiente de esta ronda:** los archivos quedaron escritos en el repositorio del dispositivo
pero sin comitear, según la regla de este proyecto en `AGENTS.md` ("No hacer commit ni push sin
que Felipe lo pida").

## 2026-09-08 (cont.) — Dirección del recinto y confirmación de estado

Felipe confirmó:
- El sitio sigue en modo borrador (no se toca `noindex` ni `robots.txt` todavía).
- El link de pago de Webpay sigue pendiente de definir.
- La dirección real del Hotel W / Restaurante Noso: Isidora Goyenechea 3000, piso 4, Las Condes,
  Santiago (7550653).

Se actualizó `src/data/eventos/2026-10-24-woman-wine.json`:
- `lugar.direccion`: "Isidora Goyenechea 3000, piso 4" (antes vacío)
- `lugar.comuna`: "Las Condes" (antes vacío)
- `lugar.urlMapa`: link de búsqueda de Google Maps armado a partir de la dirección (antes vacío)

Se verificó en el HTML generado (`npx astro build`) que la sección Ubicación ahora muestra la
dirección, "Las Condes, Santiago" y el botón que enlaza al mapa, sin tocar el resto del
componente (`EventoUbicacion.astro` ya estaba preparado para estos campos).

Sigue pendiente únicamente el link real de pago de Webpay (`pago.urlLink`) para poder activar
la venta. El sitio permanece con `noindex` mientras Felipe/María Paz lo revisan.
