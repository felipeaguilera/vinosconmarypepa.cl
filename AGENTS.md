# AGENTS.md

Reglas de trabajo para agentes de código en este proyecto.
Lo leen Antigravity, Claude Code y Cursor desde la raíz del repo.

Antes de tocar cualquier archivo, lee también `SPEC.md`, que describe el estado
técnico actual del sitio.

---

## Cómo trabajamos

**Felipe aprueba, el agente implementa.** No se hace commit ni push sin que
Felipe lo pida explícitamente.

**Planificar antes de programar.** Para cualquier cambio que toque más de un
archivo o que introduzca un servicio externo, escribe primero el plan y espera a
que esté aprobado. El plan debe explicar el diseño, no solo los pasos.

**Cuando algo se rehace, decirlo.** Si una decisión anterior resultó equivocada,
mejor cambiarla que defenderla. Pero explica qué cambió y por qué.

**Idioma:** español para comentarios, mensajes de commit y textos de interfaz.
Sin em dash en ningún texto de cara al usuario.

---

## Reglas técnicas de la casa

### 1. Los datos de evento van en JSON, nunca en el markup

Cada evento es un archivo de datos, la plantilla es una sola. Si duplicas HTML
para un evento nuevo, los estilos se desincronizan y nadie se entera hasta que
la clienta lo ve.

### 2. Fechas siempre con zona horaria explícita

Chile cambia de horario dos veces al año. Una fecha de evento sin offset se
corre una hora sin avisar. Usa ISO 8601 con offset (`-04:00` o `-03:00`) en los
JSON, y guarda aparte el texto que se muestra en pantalla.

### 3. Los montos de pago nunca se calculan en el front

El precio que se muestra sale del JSON, y el cobro real lo define el link de
Mercado Pago o Transbank. Si los dos no coinciden, el problema es de datos, no
de código. Nunca sumar, convertir ni aplicar descuentos en el cliente.

### 4. `readdirSync` no ordena igual en Windows que en Linux

Windows ordena sin distinguir mayúsculas, Linux las pone primero. Netlify
compila en Linux. Cualquier lista generada leyendo un directorio tiene que
ordenarse explícitamente, o el resultado cambia según dónde se corra.

### 5. Verificar fin de línea antes de cada commit

```bash
git diff --stat --ignore-all-space
```

Si sale vacío mientras `git diff --stat` muestra archivos, son solo finales de
línea y no se commitean. Este repo tiene `.gitattributes` con `eol=lf`.

Commitear ese ruido rompe `git blame` de forma permanente.

### 6. Verificar el formato real de las imágenes

Los flyers y fotos de la clienta vienen con extensiones mentirosas. Comprueba el
tipo real con `file`, no la extensión. Un HEIC de iPhone renombrado a `.jpg` no
lo muestra ningún navegador.

### 7. Servicios externos: avisar antes

Cualquier dependencia de terceros se propone antes de integrarla, con su modo de
falla explicado. Para pagos y formularios esto es especialmente importante: si
el servicio cae, tiene que quedar visible un correo de contacto como salida.

### 8. Probar la segunda pasada, no solo la primera

- ¿Qué pasa cuando el evento ya ocurrió y la página sigue publicada?
- ¿Qué pasa si el link de pago expira o se agotan los cupos?
- ¿Qué pasa en Linux, si lo probé en Windows?

---

## Antes de dar algo por terminado

- [ ] `npx astro build` pasa sin errores ni warnings nuevos
- [ ] `git diff --stat --ignore-all-space` muestra solo lo que tocaste
- [ ] Los links de pago y de mapa se abrieron a mano y funcionan
- [ ] La página se revisó en móvil, es donde llega la mayoría del tráfico de IG
- [ ] `SPEC.md` quedó actualizado si cambió la arquitectura

---

## Qué NO hacer

- No inventar ni completar copy. Los textos los escribe María Paz.
- No inventar fechas, precios, direcciones ni cupos. Si falta el dato, se deja
  vacío y se pregunta.
- No modificar `public/assets/` sin confirmar con Felipe.
- No tocar `public/brief.html`, es el documento de estado que ve la clienta.
- No quitar el `noindex` ni abrir `robots.txt` hasta que el sitio real esté
  aprobado para publicar.
- No procesar datos de tarjeta ni de pago en el sitio. El cobro es siempre en el
  dominio del proveedor.
- No hacer commit ni push sin que Felipe lo pida.
