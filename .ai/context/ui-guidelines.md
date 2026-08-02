# UI Guidelines

## Design Philosophy

Create premium, modern SaaS interfaces that feel polished and professional. Every screen should convey quality through consistent spacing, thoughtful typography, subtle animations, and a cohesive color system.

## Design System

### Color Palette

Use CSS custom properties defined in Shadcn UI's theming system. Customize the palette to match the project's brand identity.

#### Light Theme
- **Background**: Clean white/off-white (`hsl(0 0% 100%)`)
- **Foreground**: Dark navy for text (`hsl(222 47% 11%)`)
- **Primary**: Brand blue (`hsl(221 83% 53%)`)
- **Secondary**: Soft gray (`hsl(210 40% 96%)`)
- **Accent**: Subtle highlight (`hsl(210 40% 96%)`)
- **Destructive**: Alert red (`hsl(0 84% 60%)`)
- **Muted**: Subdued elements (`hsl(210 40% 96%)`)
- **Border**: Subtle separators (`hsl(214 32% 91%)`)

#### Dark Theme
- **Background**: Deep charcoal (`hsl(222 47% 5%)`)
- **Foreground**: Light gray for text (`hsl(210 40% 98%)`)
- **Primary**: Bright blue (`hsl(217 91% 60%)`)
- **Card**: Elevated surface (`hsl(222 47% 8%)`)
- **Muted**: Soft contrast (`hsl(217 33% 17%)`)

### Typography

- **Font Family**: `Inter` (Google Fonts) — clean, modern, excellent readability.
- **Font Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold).
- **Line Height**: 1.5 for body text, 1.2 for headings.
- **Letter Spacing**: `tracking-tight` for headings, normal for body.

### Spacing System

Use Tailwind's 4px-based spacing scale consistently:
- **Component padding**: `p-4` (16px) for cards, `p-6` (24px) for sections.
- **Element gaps**: `gap-2` (8px) for tight, `gap-4` (16px) for standard, `gap-6` (24px) for loose.
- **Section margins**: `my-8` (32px) or `my-12` (48px) between major sections.

### Border Radius

- **Cards**: `rounded-xl` (12px)
- **Buttons**: `rounded-md` (6px) or `rounded-lg` (8px)
- **Inputs**: `rounded-md` (6px)
- **Avatars**: `rounded-full`
- **Badges/Tags**: `rounded-full`

### Shadows

```css
/* Subtle elevation */
shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);

/* Card elevation */
shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Modal/dropdown elevation */
shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* Premium primary-tinted shadow for hover states */
shadow-primary: 0 8px 25px -5px hsl(221 83% 53% / 0.2);
```

## Component Standards

### Buttons

```
Primary:     bg-primary text-primary-foreground hover:bg-primary/90
Secondary:   bg-secondary text-secondary-foreground hover:bg-secondary/80
Destructive: bg-destructive text-destructive-foreground hover:bg-destructive/90
Outline:     border border-input bg-background hover:bg-accent
Ghost:       hover:bg-accent hover:text-accent-foreground
Link:        text-primary underline-offset-4 hover:underline

States:      active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none
Sizes:       sm (h-9 px-3), default (h-10 px-4), lg (h-11 px-8), icon (h-10 w-10)
```

### Cards

```
Default:     rounded-xl border bg-card text-card-foreground shadow-sm
Interactive: hover:shadow-md hover:border-primary/50 transition-all duration-300
Glass:       bg-white/5 backdrop-blur-md border border-white/10
```

### Forms

- Labels above inputs with `text-sm font-medium`.
- Input height: `h-10` (40px) — comfortable touch target.
- Error messages below inputs in `text-sm text-destructive`.
- Required fields indicated with red asterisk.
- Validation on blur + on submit.
- Loading state disables form and shows spinner in submit button.

### Tables

- Striped rows for readability on data-heavy views.
- Sortable column headers with visual indicators.
- Pagination at the bottom with page size selector.
- Responsive: horizontal scroll on mobile, full table on desktop.
- Empty state with illustration and CTA.

### Modals/Dialogs

- Centered with `max-w-lg` for standard modals.
- Backdrop blur with `bg-black/50 backdrop-blur-sm`.
- Smooth entrance animation (scale + fade).
- Close on Escape key and backdrop click.
- Focus trap within the modal.

## Animation Guidelines

### Micro-Interactions

```typescript
// Button press feedback
whileTap={{ scale: 0.98 }}

// Card hover lift
whileHover={{ scale: 1.02, y: -2 }}

// Smooth transition defaults
transition={{ type: 'spring', stiffness: 300, damping: 24 }}
```

### Page Transitions

```typescript
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.3, ease: 'easeIn' } },
};
```

### List Stagger

```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};
```

### Loading Animations

- **Skeleton screens** for content loading (not spinners for page-level loading).
- **Spinner** only for button loading states and inline operations.
- **Progress bars** for multi-step operations.
- **Pulse animation** for skeleton placeholders.

## Responsive Design

### Breakpoints

| Breakpoint | Width | Target |
|-----------|-------|--------|
| Default | 0px+ | Mobile phones |
| sm | 640px+ | Large phones |
| md | 768px+ | Tablets |
| lg | 1024px+ | Small laptops |
| xl | 1280px+ | Desktops |
| 2xl | 1536px+ | Large desktops |

### Mobile-First Rules

1. Design for 320px width first, then enhance.
2. Touch targets: minimum 48x48px.
3. Single-column layouts on mobile.
4. Hamburger menu on mobile, full nav on desktop.
5. Bottom sheet modals on mobile, centered dialogs on desktop.
6. Swipeable carousels on mobile, grid on desktop.

## Accessibility (WCAG 2.1 AA)

1. **Color contrast**: ≥4.5:1 for normal text, ≥3:1 for large text.
2. **Focus indicators**: Visible ring outlines (`focus-visible:ring-2`).
3. **Keyboard navigation**: All functionality accessible via keyboard.
4. **Screen readers**: Proper ARIA labels, roles, and states.
5. **Semantic HTML**: Use `<main>`, `<nav>`, `<section>`, `<article>`, `<aside>`.
6. **Single H1**: One `<h1>` per page with proper heading hierarchy.
7. **Alt text**: Descriptive alt text for all meaningful images.
8. **Reduced motion**: Respect `prefers-reduced-motion` media query.
