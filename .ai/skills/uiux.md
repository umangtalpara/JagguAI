# UI/UX Design Skill

## Identity
- **Name**: UI/UX Design
- **Domain**: User interface design and user experience
- **Stack**: Tailwind CSS, Shadcn UI, Framer Motion

## Capabilities

### Visual Design System
- Define consistent color palettes using CSS custom properties.
- Establish typography hierarchy with Google Fonts (Inter).
- Create spacing, border radius, and shadow scales.
- Implement dark mode with theme switching.
- Build glassmorphism effects with backdrop-blur.

### Component Design
- Design reusable, composable UI components.
- Implement consistent interaction patterns (hover, focus, active states).
- Build responsive layouts using mobile-first approach.
- Create loading skeletons and empty states.
- Design error states with actionable messaging.

### Accessibility
- Ensure WCAG 2.1 AA compliance for all components.
- Implement keyboard navigation for all interactive elements.
- Use semantic HTML and ARIA attributes correctly.
- Maintain color contrast ratio ≥ 4.5:1 for text.
- Provide focus indicators with visible ring outlines.

## Design Tokens

### Colors (CSS Custom Properties)
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --primary: 221 83% 53%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --accent: 210 40% 96%;
  --accent-foreground: 222 47% 11%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 210 40% 98%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 221 83% 53%;
  --radius: 0.5rem;
}

.dark {
  --background: 222 47% 5%;
  --foreground: 210 40% 98%;
  --card: 222 47% 8%;
  --card-foreground: 210 40% 98%;
  --primary: 217 91% 60%;
  --primary-foreground: 222 47% 5%;
  --secondary: 217 33% 17%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --accent: 217 33% 17%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 63% 31%;
  --destructive-foreground: 210 40% 98%;
  --border: 217 33% 17%;
  --input: 217 33% 17%;
  --ring: 224 76% 48%;
}
```

### Typography Scale
```
Hero:     text-4xl md:text-6xl font-extrabold tracking-tight leading-none
Title:    text-3xl md:text-4xl font-bold tracking-tight
Subtitle: text-xl md:text-2xl font-semibold
Body:     text-base md:text-lg text-muted-foreground leading-relaxed
Small:    text-sm text-muted-foreground
Caption:  text-xs text-muted-foreground
```

### Spacing Scale
```
xs: 4px   (p-1)
sm: 8px   (p-2)
md: 16px  (p-4)
lg: 24px  (p-6)
xl: 32px  (p-8)
2xl: 48px (p-12)
3xl: 64px (p-16)
```

## Interaction Patterns

### Hover Effects
```
Cards:    hover:scale-[1.02] hover:-translate-y-1 hover:shadow-lg transition-all duration-300
Buttons:  hover:brightness-110 active:scale-[0.98] transition-all duration-200
Links:    hover:text-primary hover:underline transition-colors duration-200
Icons:    hover:text-primary hover:scale-110 transition-all duration-200
```

### Focus States
```
All:      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

### Loading States
```
Skeleton: animate-pulse bg-muted rounded-md
Spinner:  animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full
```

## Layout Patterns

### Dashboard Layout
```
┌──────────────────────────────────────────────┐
│                   Header                      │
├──────────┬───────────────────────────────────┤
│          │                                    │
│ Sidebar  │           Main Content             │
│ (240px)  │                                    │
│          │                                    │
│          │                                    │
├──────────┴───────────────────────────────────┤
│                   Footer (optional)           │
└──────────────────────────────────────────────┘
```

### Responsive Grid
```
Cards:    grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
Forms:    grid grid-cols-1 md:grid-cols-2 gap-4
Tables:   overflow-x-auto on mobile, full table on desktop
```

## Anti-Patterns (Never Do)

- Never use inline styles — Tailwind utilities only.
- Never use generic CSS colors (red, blue, green) — use design tokens.
- Never skip hover/focus/active states on interactive elements.
- Never use fixed widths — use responsive Tailwind utilities.
- Never skip loading and error states in data components.
- Never use placeholder images — use proper illustrations or icons.
- Never forget touch targets (minimum 48x48px) on mobile.
