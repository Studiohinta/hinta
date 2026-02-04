# HINTA – Design System & Grafisk Profil

Detta dokument beskriver den grafiska profilen, designprinciper, UI-komponenter och UX-mönster i HINTA-plattformen, med fokus på "Nordic Cinematic" estetik och ett "Image-First" gränssnitt.


---

## 1. Färgpalett och Varumärke

### 🎨 Huvudpalett (Core)

| Roll | Namn | Hex-kod | Användning |
| :--- | :--- | :--- | :--- |
| **Canvas** | Off-White | `#F9F9F9` | Huvudbakgrund. Mjukare än ren vit. |
| **Ink** | Off-Black | `#0F0F0F` | Text, rubriker, mörka sektioner. (Ersätter Brand Primary) |
| **The Glow** | Digital Lavender | `#C8C6F5` | Din Signaturfärg. Hover, knappar, tech-feeling. (Ersätter Brand Accent) |
| **Nature** | Soft Sage | `#D8E2DC` | Komplement. Används för lugn och "grönska". |

### 🧱 Sekundär (Material)

| Roll | Namn | Hex-kod | Användning |
| :--- | :--- | :--- | :--- |
| **Structure** | Warm Stone | `#D1CDC7` | Borders, linjer, inaktiva element. (Greige). |
| **Glass** | Frost | `rgba(255,255,255,0.7)` | För "Liquid"-effekten ovanpå bilder. |

### Tailwind Tokens

- `bg-brand-primary` / `text-brand-primary` → **Ink** (#0F0F0F)
- `bg-brand-accent` / `text-brand-accent` → **The Glow** (#C8C6F5)
- `bg-brand-canvas` → **Canvas** (#F9F9F9)
- `bg-brand-nature` → **Nature** (#D8E2DC)
- `bg-brand-muted` / `border-brand-muted` → **Structure** (#D1CDC7)

---

## 2. Typografi

### Fontfamilj

- **Primär font (Rubrik)**: Barlow (Google Fonts)
- **Primär font (Avsnitt)**: Inter (Google Fonts)
- **Vikter**: 300, 400, 500, 600, 700, 800
- **Font-family (Rubrik)**: `'Barlow', sans-serif`
- **Font-family (Avsnitt)**: `'Inter', sans-serif`

### Typografiska Hierarkier

#### Rubriker
- **Font**: Barlow
- **Letter Spacing**: 15% (`tracking-[0.15em]`)

- **H1**: 
  ```css
  text-4xl md:text-6xl font-black uppercase tracking-[0.15em]
  ```
  - Används för: Huvudrubriker, hero-text

- **H2**: 
  ```css
  text-2xl md:text-3xl font-black uppercase tracking-[0.15em]
  ```
  - Används för: Sektioner, kortsidor

- **H3**: 
  ```css
  text-xl font-black uppercase tracking-[0.15em]
  ```
  - Används för: Underrubriker

#### Body Text

- **Stor text**: `text-base font-medium`
- **Normal text**: `text-sm font-medium`
- **Liten text**: `text-xs font-bold`

#### Special

- **Labels/Badges**: 
  ```css
  text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em]
  ```
  - Används för: Status-badges, metadata

- **Navigation**: 
  ```css
  text-[10px] font-black uppercase
  ```

- **Metadata**: 
  ```css
  text-xs font-bold uppercase tracking-[0.2em]
  ```

### Letter Spacing

- **Tight**: `tracking-tighter` (för rubriker)
- **Wide**: `tracking-wider` (för knappar)
- **Extra Wide**: `tracking-[0.3em]` (för badges)

---

## 3. Designfilosofi: Nordic Cinematic & Image-First

### Kärnvärden
1. **Minimalistisk**: Fokus på innehåll, subtila effekter, inga onödiga overlays på bilden.
2. **Premium**: Glassmorphism, mjuka transitions, högkvalitativa visualiseringar.
3. **Immersiv (Image-First)**: Bilden är hjälten. Allt UI ska komplettera, inte konkurrera med visualiseringen.

### Gränssnittsprinciper
- **Obruten bild**: Bilden ska aldrig klippas (contain/fit-to-screen). Inga tunga barer i nederkant som täcker bilden.
- **Kontextuell Navigation**: Menyer och listor placeras i sidofält (desktop) eller i ett naturligt vertikalt flöde (mobil) för att behålla bildens fokus.
- **Subtil Interaktion**: Hotspots är osynliga som standard och framträder endast vid interaktion. Ingen text direkt på bilden.

### Glassmorphism (Liquid Glass)


#### `.glass-panel`
Huvudpaneler med backdrop-blur:

**Light Mode:**
```css
background: rgba(255, 255, 255, 0.65);
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.3);
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.08);
```

**Dark Mode:**
```css
background: rgba(26, 26, 26, 0.7);
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.05);
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2);
```

#### `.glass-card`
Kort med hover-effekter:

**Light Mode:**
```css
background: rgba(255, 255, 255, 0.4);
backdrop-filter: blur(12px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.5);
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.08);
```

**Hover State:**
```css
background: rgba(255, 255, 255, 0.6);
transform: translateY(-4px);
box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08);
```

### Border Radius

- **Små element**: `rounded-xl` (0.75rem / 12px)
- **Medel**: `rounded-2xl` (1rem / 16px)
- **Stora**: `rounded-3xl` (1.5rem / 24px)
- **Extra stora**: `rounded-4xl` (2rem / 32px), `rounded-5xl` (3rem / 48px)

### Shadows (Material Design-inspirerade)

**Level 2 (Standard):**
```css
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.08);
```

**Level 8 (Hover/Elevated):**
```css
/* Light */
box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08);

/* Dark */
box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3);
```

**Extra Large (Modals):**
```css
box-shadow: 0 0 100px rgba(0, 0, 0, 0.5);
```

---

## 4. UI-komponenter

### Knappar

#### Primär Knapp
```tsx
className="bg-brand-primary dark:bg-brand-accent 
           text-white dark:text-brand-primary 
           font-black rounded-2xl shadow-lg 
           hover:shadow-xl hover:scale-[1.02] 
           active:scale-95 transition-all 
           uppercase tracking-wider text-sm"
```

#### Sekundär Knapp
```tsx
className="bg-white dark:bg-gray-700 
           border border-gray-300 dark:border-gray-600 
           text-gray-700 dark:text-gray-200 
           rounded-lg hover:bg-gray-50 
           dark:hover:bg-gray-600 transition"
```

#### Icon Knapp
```tsx
className="p-3.5 rounded-2xl 
           hover:bg-black/50 transition-all 
           border border-white/10 shadow-2xl"
```

#### Disabled State
```tsx
className="... disabled:opacity-50 
           disabled:cursor-not-allowed 
           disabled:hover:scale-100"
```

### Input-fält

```tsx
className="w-full px-5 py-4 
           bg-gray-50 dark:bg-gray-900 
           border-2 border-gray-200 dark:border-gray-700 
           rounded-2xl text-gray-900 dark:text-white 
           placeholder-gray-400 dark:placeholder-gray-500 
           focus:outline-none focus:ring-2 
           focus:ring-brand-primary dark:focus:ring-brand-accent 
           focus:border-transparent transition-all font-medium"
```

### Kort/Cards

- Glassmorphism-bakgrund
- Hover: `transform: translateY(-4px)` + elevation level 8
- Transition: `cubic-bezier(0.4, 0, 0.2, 1)`
- Border radius: `rounded-2xl` eller `rounded-3xl`

### Modaler

**Backdrop:**
```tsx
className="fixed inset-0 bg-black/60 backdrop-blur-md 
           flex items-center justify-center animate-fadeIn"
```

**Container:**
```tsx
className="glass-panel rounded-[2.5rem] shadow-2xl 
           w-full max-w-lg relative max-h-[90vh] 
           flex flex-col border border-white/40 
           transform animate-scaleIn"
```

**Bottom Sheet (Mobile):**
```tsx
className="w-full bg-white dark:bg-gray-900 
           rounded-t-3xl p-6 max-h-[70vh] 
           overflow-y-auto animate-slideInUp"
```

### Badges/Tags

**Status Badge:**
```tsx
className="inline-block text-[8px] font-black 
           uppercase tracking-widest px-2 py-1 
           rounded-full"
```

**Färgkodning:**
- Success: `bg-green-100 text-green-800` / `bg-green-900/40 text-green-300`
- Warning: `bg-amber-100 text-amber-800` / `bg-amber-900/40 text-amber-300`
- Default: `bg-gray-100 text-gray-800` / `bg-slate-800/40 text-slate-300`

---

## 5. UX-mönster och Interaktioner

### Navigation

#### Sidebar
- Kollapsbar med glassmorphism
- Ikoner + text när expanderad
- Endast ikoner när kollapsad
- Active state: `bg-brand-primary dark:bg-white` med accentfärg

#### Bottom Navigation (Viewer - Utfasad)
> [!NOTE]
> Den fasta menybaren i underkanten fasas ut till förmån för en sidofälts-baserad layout för att maximera bildfokus.

#### Split-Panel Layout (Viewer)
- **Desktop**: Bilden till vänster, flexibelt sidofält till höger (360px+).
- **Mobil**: Bilden överst (full bredd), bostadslistan statiskt under bilden.
- **Glassmorphism-sidofält**: Filtreringsalternativ och "Start/Navigering/Galleri" knappar integreras i toppen av sidofältet.


#### Breadcrumbs
- Visar hierarki i navigation modal
- Klickbara länkar till tidigare vyer
- Current view: `bg-brand-primary/10 dark:bg-white/10` med border

### Transitions och Animationer

#### Standard Transition
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

#### Hover Effects
- Scale: `hover:scale-[1.02]`
- Active: `active:scale-95`
- Translate: `hover:translateY(-4px)`

#### Keyframe Animations

**Fade In:**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
```

**Slide In Up:**
```css
@keyframes slideInUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slideInUp {
  animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Scrollbar

**Custom Thin Scrollbar:**
```css
/* Firefox */
scrollbar-width: thin;
scrollbar-color: rgba(0, 0, 0, 0.1) transparent;

/* Webkit */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.dark ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}
```

### Dark Mode

- Toggle i sidebar
- Sparas i localStorage (`hinta_theme`)
- Systempreferens som fallback
- Alla komponenter stödjer dark mode
- Smooth transition: `transition-colors duration-500`

---

## 6. Layout och Spacing

### Grid System

**Responsive Grid:**
```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
```

### Padding

- **Container**: `p-6 md:p-10`
- **Cards**: `p-4 md:p-6`
- **Kompakt**: `p-3 md:p-4`
- **Extra**: `p-8 md:p-14`

### Spacing Scale

- `space-y-2` (8px)
- `space-y-4` (16px)
- `space-y-6` (24px)
- `space-y-8` (32px)

### Gap

- `gap-4` (16px)
- `gap-6` (24px)
- `gap-x-12 gap-y-12` (48px)

---

## 7. Viewer-specifika UI-element

> [!IMPORTANT]
> **Public Viewer (Besöksvy):** Ska vara strikt **Monokrom (Black & White)**.
> Inga färgade accenter (som Digital Lavender) eller statusfärger (grön/röd) ska användas i den publika vyn.
> Endast svart, vit och gråskalor för att maximera fokus på bilderna (Cinematic Feel).


### Hotspot-visualisering

#### Polygon Hotspots
- **Osynliga som standard**: `fillOpacity` och `strokeOpacity` är 0 (eller nära 0).
- **Hover/Highlight**: Framträder med `stroke="white" strokeWidth="2" strokeOpacity="0.8"` och subtil fyllning.
- **Inga etiketter**: Enhetsnamn visas INTE direkt på bilden. De visas i sidofältet eller i ett hover-card.


#### Circle Hotspots
- Vita cirklar: `fill="white" fillOpacity="0.85"` (0.95 vid hover)
- Ikoner: CameraIcon eller InfoIcon
- Storlek: 24px ikon, 20px radius (25px vid hover)
- Shadow: `shadow-lg`

### Hover Card (Unit Info)

**Positionering:**
- Följer musen
- Positioneras utanför hotspot-område
- Max width: 200px på desktop, 40% av skärmbredd på mobile

**Styling:**
```tsx
className="rounded-[2rem] p-3 md:p-4 
           min-w-[160px] max-w-[200px] animate-fadeIn"
style={{
  background: isDarkMode 
    ? 'rgba(26, 26, 26, 0.5)' 
    : 'rgba(255, 255, 255, 0.3)',
  backdropFilter: 'blur(24px) saturate(180%)',
  boxShadow: isDarkMode
    ? '0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)'
    : '0 8px 16px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
}}
```

**Innehåll:**
- Status badge (överst)
- Unit name (H3-stil)
- Stats med border-left accent: `border-l-[3px] border-brand-primary/20`
- Labels: `text-[8px] font-bold uppercase tracking-widest`
- Values: `text-xs md:text-sm font-black`

### Unit Detail Modal

**Layout:**
- Fullscreen overlay: `bg-black/60 backdrop-blur-md`
- Container: `max-w-xl`, `max-h-[92vh]`
- Border radius: `rounded-3xl md:rounded-[3.5rem]`
- Shadow: `shadow-[0_0_100px_rgba(0,0,0,0.5)]`

**Innehåll:**
- Status badge
- Huge title: `text-3xl md:text-6xl font-black`
- Grid stats: `grid-cols-1 md:grid-cols-2 gap-6 md:gap-x-12`
- Border-left accent för varje stat
- CTA-knapp längst ner: `bg-gray-950 dark:bg-white`

---

## 8. Ikoner

- **Custom SVG-ikoner** i `components/icons/`
- **Standardstorlek**: `w-5 h-5` (20px)
- **Större**: `w-6 h-6` (24px)
- **Färg**: Ärvs från parent, kan overridas med `text-*` classes
- **Transition**: `transition-colors` för hover-states

---

## 9. Formulär och Inputs

### Form Layout

```tsx
className="grid grid-cols-1 md:grid-cols-2 gap-6"
```

### Labels

```tsx
className="block text-sm font-medium 
           text-gray-700 dark:text-gray-300 mb-1"
```

### Error States

```tsx
className="mt-2 text-sm text-red-600 
           dark:text-red-400 font-medium"
```

### Select/Dropdown

Samma styling som input-fält med custom styling för dark mode.

---

## 10. Status och Feedback

### Toast Notifications

- Position: Top-right eller bottom (beroende på implementation)
- Glassmorphism-stil
- Färgkodning: success (green), error (red), info (blue)

### Loading States

**Spinner:**
```tsx
className="animate-spin rounded-full h-12 w-12 
           border-b-2 border-gray-900 dark:border-white"
```

**Loading Text:**
```tsx
className="mt-4 text-gray-600 dark:text-gray-400"
```

---

## 11. Responsiv Design

### Breakpoints

- **Mobile-first** approach
- **`md:`** breakpoint för tablet/desktop (768px+)
- Användning: `text-base md:text-lg`, `p-4 md:p-6`

### Mobile-specifika

- **Sidebar**: Döljs på mobile, overlay när öppen
- **Modals**: Fullscreen eller bottom sheet på mobile
- **Navigation**: Bottom bar på mobile
- **Cards**: Full width på mobile, grid på desktop

---

## 12. Bakgrund och Atmosfär

### Mesh Gradient Background

**Light Mode:**
```css
background-color: #f8fafc;
background-image: 
  radial-gradient(at 0% 0%, hsla(142,5%,95%,1) 0, transparent 50%), 
  radial-gradient(at 50% 0%, hsla(210,10%,92%,1) 0, transparent 50%), 
  radial-gradient(at 100% 0%, hsla(330,5%,95%,1) 0, transparent 50%), 
  radial-gradient(at 0% 100%, hsla(200,5%,95%,1) 0, transparent 50%), 
  radial-gradient(at 100% 100%, hsla(160,5%,95%,1) 0, transparent 50%);
filter: blur(80px);
opacity: 0.6;
```

**Dark Mode:**
```css
background-color: #0d1117;
background-image: 
  radial-gradient(at 0% 0%, hsla(210,10%,15%,1) 0, transparent 50%), 
  radial-gradient(at 50% 0%, hsla(210,10%,10%,1) 0, transparent 50%), 
  radial-gradient(at 100% 0%, hsla(210,10%,15%,1) 0, transparent 50%), 
  radial-gradient(at 0% 100%, hsla(210,10%,10%,1) 0, transparent 50%), 
  radial-gradient(at 100% 100%, hsla(210,10%,15%,1) 0, transparent 50%);
opacity: 1;
```

**Position:**
- `position: fixed`
- `z-index: -1`
- Covers entire viewport

---

## 13. Designfilosofi

### Kärnvärden

1. **Minimalistisk**: Fokus på innehåll, subtila effekter
2. **Premium**: Glassmorphism, mjuka transitions, tydlig hierarki
3. **Modern**: Material Design-inspirerade elevation, Apple-inspirerad glassmorphism
4. **Professionell**: Stark typografi, konsekvent spacing, tydlig färgpalett

### Designprinciper

- **Konsistens**: Alla komponenter följer samma designprinciper
- **Hierarki**: Tydlig visuell hierarki med typografi och spacing
- **Feedback**: Alla interaktioner ger visuell feedback
- **Tillgänglighet**: Dark mode, keyboard navigation, focus states

---

## 14. Tillgänglighet

### Dark Mode Support
- Alla komponenter stödjer dark mode
- Smooth transitions mellan modes

### Keyboard Navigation
- ESC för att stänga modals
- Tab-navigation för formulär
- Enter för att submita formulär

### Focus States
- Tydliga focus rings på interaktiva element
- `focus:ring-2 focus:ring-brand-primary`

### Semantisk HTML
- Korrekt användning av semantiska taggar
- ARIA-labels där nödvändigt

---

## 15. Teknisk Implementation

### Tailwind Config

```javascript
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1a1a1a',
          accent: '#e5d0b1',
          muted: '#4b5563',
        },
        gray: {
          750: '#2d3748',
          850: '#1a202c',
          950: '#1a1a1a',
        }
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
      },
      backdropBlur: {
        'xs': '2px',
      }
    }
  }
}
```

### Custom CSS Classes

Definierade i `index.html`:
- `.glass-panel`
- `.glass-card`
- `.mesh-gradient`
- `.animate-fadeIn`
- `.animate-slideInUp`
- `.ripple` (Material Design ripple effect)

---

## 16. Exempel på Komponenter

### Projekt Card

```tsx
<div className="glass-card rounded-3xl p-6 hover:translateY(-4px)">
  <h3 className="text-xl font-black uppercase tracking-tighter">
    {project.name}
  </h3>
  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
    {project.description}
  </p>
</div>
```

### Status Badge

```tsx
<span className="inline-block text-[8px] font-black uppercase 
                 tracking-widest px-2 py-1 rounded-full 
                 bg-green-100 text-green-800 
                 dark:bg-green-900/40 dark:text-green-300">
  TILL SALU
</span>
```

### Primär Knapp

```tsx
<button className="bg-brand-primary dark:bg-brand-accent 
                   text-white dark:text-brand-primary 
                   font-black rounded-2xl shadow-lg 
                   hover:shadow-xl hover:scale-[1.02] 
                   active:scale-95 transition-all 
                   uppercase tracking-wider px-6 py-3">
  Skicka
</button>
```

---

## 17. Checklista för Nya Komponenter

När du skapar nya komponenter, se till att:

- [ ] Stödjer dark mode
- [ ] Använder glassmorphism där lämpligt
- [ ] Följer typografiska hierarkier
- [ ] Har hover-states med transitions
- [ ] Använder korrekt border radius
- [ ] Har Material Design elevation shadows
- [ ] Är responsiv (mobile-first)
- [ ] Har keyboard navigation support
- [ ] Följer färgpaletten
- [ ] Använder korrekt spacing

---

**Senast uppdaterad**: 2024
**Version**: 1.0
**Författare**: Studio HINTA
