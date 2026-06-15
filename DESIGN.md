---
name: MovEat
description: Aplicación de fitness y nutrición con seguimiento diario de calorías, macros, entrenamientos y progreso.
colors:
  primary: "#f97316"
  secondary: "#ea580c"
  accent: "#fb923c"
  background: "#fff7ed"
  foreground: "#431407"
  card-bg: "#ffffff"
  card-border: "#0000000f"
  muted: "#ffedd5"
  muted-foreground: "#fdba74"
  subtle: "#fb923c"
  danger: "#cf4141"
  water: "#93c5e6"
typography:
  display:
    fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.1
  headline:
    fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.15
  title:
    fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.1em"
    textTransform: "uppercase"
rounded:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "16px 24px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "16px 24px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "16px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "16px 24px"
  card:
    backgroundColor: "{colors.card-bg}"
    rounded: "{rounded.xl}"
    padding: "24px"
  input:
    backgroundColor: "{colors.card-bg}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "16px 24px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.subtle}"
    rounded: "{rounded.sm}"
    padding: "12px 12px"
---

# Design System: MovEat

## 1. Overview

**Creative North Star: "El Compañero de Fitness"**

MovEat se siente como un compañero de entrenamiento en el bolsillo: cercano, motivador y siempre disponible. La interfaz prioriza la claridad sobre la densidad, usando tarjetas redondeadas, colores cálidos y microinteracciones suaves para acompañar al usuario sin abrumarlo. El sistema visual rechaza lo corporativo gris, lo agresivo y lo sobrecargado.

**Key Characteristics:**
- Mobile-first con targets táctiles generosos.
- Paleta temática con 4 acentos posibles (naranja, verde, azul, violeta), todos con rampas 50–950.
- Tipografía display audaz (Plus Jakarta Sans) para títulos, Inter para lectura; carga con display=swap.
- Tokens semánticos de tipografía, espaciado y radios centralizados en src/index.css.
- Superficies suavemente elevadas mediante sombras con tinte del color primario.
- Componentes refinados y contenidos, con estados claros pero sin exageración.

## 2. Colors

La paleta es cálida, temática y accesible. El tema por defecto es naranja (`pumpkin`); los temas verde, azul y violeta usan sus propias rampas para `primary`, `secondary`, `accent`, fondos y superficies.

### Primary
- **Naranja Vitamina** (`#f97316`): botones primarios, acentos de estado activo, iconos seleccionados, valores destacados. Es el color de la acción y la energía.

### Secondary
- **Naranja Quemado** (`#ea580c`): hover de primario, estados de énfasis secundario, rellenos de badges activos.

### Accent
- **Naranja Suave** (`#fb923c`): gráficos, indicadores de progreso, iconos de celebración. Usado para llamadas de atención más ligeras que el primary.

### Neutral
- **Fondo Cálido** (`#fff7ed`): fondo general en tema claro.
- **Texto Oscuro Térmico** (`#431407`): texto principal y títulos.
- **Superficie Tarjeta** (`#ffffff`): fondo de tarjetas y modales en tema claro.
- **Borde Sutil** (`#0000000f`): bordes de tarjetas y contenedores.
- **Apagado** (`#ffedd5`): fondos de estados hover, superficies secundarias.
- **Texto Apagado** (`#fdba74`): etiquetas, hints, metadatos.
- **Sutil** (`#fb923c`): iconos inactivos, elementos decorativos.

### Functional
- **Agua** (`#93c5e6`): indicador de hidratación.
- **Peligro** (`#cf4141`): errores, acciones destructivas, exceso de calorías.

### Named Rules
**The One Voice Rule.** El color primario nunca cubre más del ~10% de una pantalla; su función es acentuar, no dominar.

**The Theme-Locked Rule.** Cuando el usuario cambia de tema, todas las superficies (`background`, `muted`, `borders`, `shadows`) deben venir de la misma escala 50–950 que el acento. Nunca mezclar rampas entre temas.

**The Spacing-Via-Tokens Rule.** El espaciado y los radios se toman del sistema semántico (`--spacing-page`, `--spacing-card`, `--radius-button`, `--radius-card`, etc.), no de valores arbitrarios. Esto garantiza ritmo y predecibilidad.

## 3. Typography

**Display Font:** Plus Jakarta Sans (con ui-sans-serif, system-ui, sans-serif)  
**Body Font:** Inter (con ui-sans-serif, system-ui, sans-serif)

**Character:** Display audaz y geométrico para títulos que comunican energía; body neutro y legible para datos diarios. Se eliminó la carga de Fraunces porque no se usaba; las fuentes ahora cargan con `display=swap`.

La escala tipográfica se expresa como tokens semánticos en `src/index.css`: `text-caption`, `text-secondary`, `text-body`, `text-subheading`, `text-heading`, `text-display`, `text-hero`. Esto mantiene la jerarquía consistente sin depender de clases de tamaño arbitrarias.

### Hierarchy
- **Hero** (extrabold 800, 3rem/48px, line-height 1.1): títulos grandes de bienvenida en onboarding.
- **Display** (extrabold 800, 2.25rem/36px, line-height 1.1): títulos de pasos en onboarding y valores grandes.
- **Headline** (extrabold 800, 1.875rem/30px, line-height 1.15): encabezados de página (Dashboard, Nutrición, etc.).
- **Title** (bold 700, 1.25rem/20px, line-height 1.2): títulos de tarjetas y modales.
- **Body** (regular 400, 1rem/16px, line-height 1.5): párrafos, descripciones y contenido general.
- **Secondary** (medium 500, 0.875rem/14px, line-height 1.5): subtítulos, hints, metadatos.
- **Label** (bold 700, 0.875rem/14px, letter-spacing 0.1em, uppercase): etiquetas de sección, unidades, tags.
- **Caption** (bold 700, 0.75rem/12px, line-height 1.5): leyendas pequeñas, extremos de slider.

### Named Rules
**The One Display Rule.** Solo `Plus Jakarta Sans` en extrabold se usa para display/headline; nunca en body.

**The Uppercase Label Rule.** Las etiquetas funcionales siempre van en mayúsculas, tracking amplio y tamaño pequeño.

## 4. Elevation

El sistema usa sombras suaves y difusas para crear profundidad sin competir con el color. Las sombras llevan el tinte del color primario del tema activo.

### Shadow Vocabulary
- **Ambient Low** (`0 1px 2px 0 {colors.primary}/5%`): sutil separación de controles pequeños.
- **Lifted** (`0 10px 15px -3px {colors.primary}/10%, 0 4px 6px -4px {colors.primary}/10%`): tarjetas y botones primarios.
- **Modal** (`0 20px 25px -5px {colors.primary}/10%, 0 8px 10px -6px {colors.primary}/10%`): modales y overlays flotantes.

### Named Rules
**The Tinted Shadow Rule.** Todas las sombras usan el color primario del tema como tinte, nunca gris puro.

**The Flat-By-Default Rule.** Las superficies en reposo son planas; las sombras aparecen como respuesta a jerarquía (tarjetas, botones, modales).

## 5. Components

### Buttons
- **Shape:** radio `rounded-button` (16px), padding 16px 24px en tamaño md.
- **Primary:** fondo `primary`, texto blanco, sombra `shadow-lg shadow-primary/20`, hover `secondary`.
- **Secondary:** fondo `secondary`, texto blanco.
- **Outline:** fondo transparente, borde `card-border`, texto `foreground`, hover `muted`.
- **Ghost:** fondo transparente, texto `foreground`, hover `muted`.
- **Muted:** fondo `muted`, texto `foreground`, hover `on-subtle`.
- **States:** `active:scale-95`, transición 200ms, disabled opacidad 40%.

### Cards / Containers
- **Corner Style:** jerarquía de radios semánticos:
  - `rounded-card-lg` (32px) para modales y barra de navegación móvil.
  - `rounded-card` (24px) para tarjetas principales.
- **Background:** `card-bg` (#ffffff en claro, escala 900 en oscuro).
- **Shadow Strategy:** `shadow-sm` en reposo; `shadow-md shadow-primary/10` cuando está seleccionada.
- **Border:** `card-border` (negro 6% alpha en claro, blanco 8% alpha en oscuro).
- **Internal Padding:** `spacing-card` (24px) por defecto; `spacing-card-sm` (20px) para tarjetas compactas.

### Inputs / Fields
- **Style:** fondo `card-bg`, borde `card-border`, radio `rounded-button` (16px), padding 16px 24px.

### Inputs / Fields
- **Style:** fondo `card-bg`, borde `card-border`, radio 16px, padding 16px 24px.
- **Focus:** borde `primary`.
- **Error:** texto/borde `danger`.

### Navigation
- **Mobile:** barra flotante inferior con fondo `card-bg/60`, backdrop-blur, borde sutil, radio `rounded-card-lg` (32px); ítem activo elevado con círculo primario.
- **Desktop:** sidebar vertical de 96px con íconos y labels pequeños; activo en `primary`, inactivo en `subtle`.

### Option Cards
- Tarjeta seleccionable con borde 2px y radio `rounded-button` (16px); seleccionada usa `border-primary bg-primary/5 shadow-md shadow-primary/10`; no seleccionada usa `border-card-border bg-card-bg hover:border-primary/30`.
- Layout compacto usa `spacing-card-sm` (20px); layout expandido usa `spacing-card` (24px) vertical.
- IconBadge interior: 48px, radio 12px; activo `bg-primary text-white`, inactivo `bg-muted text-subtle`.

## 6. Do's and Don'ts

### Do:
- **Do** usar el tema activo de forma consistente: `primary`, `background`, `muted` y `shadows` de la misma escala 50–950.
- **Do** mantener generosos espacios internos en tarjetas (`spacing-card`) y targets táctiles mínimos de 44px.
- **Do** usar los tokens semánticos de espaciado y radio en lugar de valores arbitrarios.
- **Do** usar `Plus Jakarta Sans` extrabold para display y `Inter` para body.
- **Do** usar sombras con tinte del color primario para mantener la atmósfera cálida.
- **Do** respetar `prefers-reduced-motion` y asegurar contraste suficiente.
- **Do** usar el token `danger` para errores, acciones destructivas y estados de exceso.

### Don't:
- **Don't** usar interfaces fitness agresivas, oscuras o sobrecargadas de notificaciones/charts.
- **Don't** caer en una estética corporativa gris/monótona sin personalidad.
- **Don't** priorizar métricas crudas sobre claridad y emoción.
- **Don't** usar modales, upsells o badges excesivos que interrumpan el flujo.
- **Don't** mezclar rampas de color entre temas.
- **Don't** cargar fuentes que no forman parte del sistema tipográfico activo.
- **Don't** usar clases Tailwind inválidas (p. ej. `bg-white-500/5`); usar `bg-white/5` o tokens semánticos.