# SPEC.md: vinosconmarypepa.cl

Estado técnico del sitio. Actualizado el 21 de julio de 2026.

---

## Qué es

Sitio de **Vinos con Marypepa**, el podcast de María Paz Jiménez.
Cliente: María Paz Jiménez. Desarrollo: EVO Creative Lab.

En esta primera etapa el sitio es una plataforma de comunicación de eventos:
información del evento, mapa de ubicación, contacto por correo e inscripción con
pago vía link externo (Mercado Pago o Transbank). No es todavía el hub del
podcast, esa decisión sigue abierta.

Proyecto hermano: `mariapazjimenez.cl`, el sitio personal de la misma clienta.

---

## Stack

| Pieza | Elección |
|---|---|
| Framework | Astro 4, `output: 'static'` |
| Estilos | CSS plano con custom properties, sin framework |
| Tipografías | Cormorant Garamond (display) y Poppins (texto), vía Google Fonts |
| Build | `npm run build` a `dist/` |
| Node | 20 |

Sin React, sin Tailwind, sin CMS por ahora. Si el sitio crece a hub del podcast
se evalúa un CMS, igual que en `mariapazjimenez.cl`.

---

## Infraestructura

- **Repo:** github.com/felipeaguilera/vinosconmarypepa.cl, rama `main`
- **Hosting:** Netlify, proyecto `vinosconmarypepa`
  https://app.netlify.com/projects/vinosconmarypepa/overview
- **DNS:** Cloudflare, zona `vinosconmarypepa.cl`
  https://dash.cloudflare.com/7c43fc7a0737bb8d103518c90d807655/vinosconmarypepa.cl/dns/records
- **Dominios activos:** `vinosconmarypepa.cl` y `www.vinosconmarypepa.cl`
- Se retiró el redirect antiguo a YouTube que tenía este dominio.

Deploy automático desde `main`. `netlify.toml` fija comando, carpeta de
publicación y versión de Node.

---

## Estructura

```
src/
  data/
    sitio.json             Datos globales: nombre, tagline, contacto
    evento.example.json    Plantilla de datos de evento, sin usar aún
  layouts/Base.astro       <head>, metadatos, fuentes, canonical, noindex
  pages/index.astro        Página "próximamente" actual
  styles/global.css        Tokens de color, tipografía y reset
  components/              Vacío por ahora
public/
  brief.html               Brief del proyecto para la clienta, /brief.html
  robots.txt               Bloquea indexación mientras esté en construcción
  assets/                  Imágenes y flyers
_legacy/
  index-coming-soon.html   HTML original antes de migrar a Astro, referencia
```

---

## Paleta

Tomada de la presentación del podcast, **a confirmar** cuando llegue el brief
visual completo.

| Token | Valor | Uso |
|---|---|---|
| `--accent` | `#880000` | Burdeos, wordmark y acentos |
| `--accent-lt` | `#F7EDEF` | Fondo suave del acento |
| `--bg` | `#FAFAF7` | Fondo general |
| `--surface` | `#F2EEE8` | Tarjetas y píldoras |
| `--text` | `#1A1A1A` | Texto principal |
| `--muted` | `#6B6B6B` | Texto secundario |
| `--border` | `#E4DED4` | Bordes |

---

## Estado actual

**Listo**

- Dominio, DNS y hosting funcionando
- Página "próximamente" publicada, migrada a Astro sin cambio visual
- Brief del proyecto disponible en `/brief.html`
- Carpeta local montada y conectada al repo

**Pendiente de la clienta**

- Definir foco: evento puntual vs. hub del podcast
- Detalles del primer evento: fecha, lugar, precio, cupos, material gráfico
- Textos definitivos
- Confirmar paleta y tipografías

**Pendiente de decisión técnica**

- Proveedor de pago: Mercado Pago o Transbank. Ambos se integran como link
  externo, sin backend. Si más adelante se necesita checkout embebido, hay que
  evaluar Netlify Functions.
- Formulario de inscripción: la opción por defecto es Netlify Forms, que no
  requiere backend y notifica por correo. Alternativa: `mailto:` simple.
- Mapa: la opción por defecto es un enlace a Google Maps más una imagen estática,
  para evitar el iframe de Maps y su costo en rendimiento y privacidad. Se
  evalúa embed solo si la clienta lo pide.

---

## Cómo levantar el proyecto

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # genera dist/
npm run preview  # sirve dist/ localmente
```

---

## Decisiones tomadas

**Migrar a Astro en vez de mantener HTML plano.** El sitio va a tener varias
páginas de evento con la misma estructura y datos distintos. Astro permite
plantillas y datos separados sin agregar peso al resultado, y deja el proyecto
alineado con el resto de los sitios de EVO.

**Los datos de evento viven en JSON, no en el markup.** Cada evento es un
archivo de datos, la plantilla es una sola. Así agregar un evento no implica
duplicar HTML ni arriesgar que se desincronicen los estilos.

**El sitio arranca con `noindex` y `robots.txt` cerrado.** Mientras esté la
página de construcción no queremos que Google indexe un placeholder y lo deje
cacheado. Al publicar el sitio real hay que quitar el `noindex` de `index.astro`
y abrir el `robots.txt`.
