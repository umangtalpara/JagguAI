# Frontend Development Skill

## Identity
- **Name**: Frontend Development
- **Domain**: Client-side application development
- **Stack**: Next.js, React, TypeScript, Tailwind CSS, Shadcn UI

## Capabilities

### Next.js App Router Development
- Build pages using the App Router with file-based routing.
- Implement server components for data fetching and SEO.
- Use client components for interactive UI elements.
- Configure layouts, loading states, error boundaries, and not-found pages.
- Implement middleware for authentication guards and redirects.

### React Component Architecture
- Build functional components with TypeScript interfaces for props.
- Implement custom hooks for reusable logic (useAuth, useDebounce, useMediaQuery).
- Use React.memo() for performance-critical components.
- Implement error boundaries for graceful error handling.
- Build compound components for complex UI patterns.

### Tailwind CSS Styling
- Use utility-first CSS with Tailwind for responsive layouts.
- Implement the `cn()` utility function using `clsx` + `tailwind-merge`.
- Follow mobile-first responsive design (sm, md, lg, xl, 2xl breakpoints).
- Implement dark mode with CSS custom properties.
- Create consistent design tokens (colors, spacing, typography, shadows).

### Shadcn UI Component System
- Install and configure Shadcn UI primitives.
- Customize Shadcn components with project-specific styles.
- Build form components using React Hook Form + Zod + Shadcn Form.
- Implement accessible modal, dropdown, popover, and toast patterns.

### State Management
- Server state: TanStack React Query for API data (queries, mutations, cache).
- Client state: Zustand for UI state (sidebar, theme, modals).
- Form state: React Hook Form with Zod validation schemas.
- URL state: Next.js searchParams for filterable/sortable views.

### Animation & Motion
- Framer Motion for page transitions and component animations.
- Staggered list animations for card grids and list views.
- Spring-based hover effects for interactive elements.
- Loading state animations (skeleton screens, spinners).

## Patterns

### Component Structure
```
components/
├── ui/          → Shadcn UI primitives (button, input, card, dialog)
├── layout/      → Header, sidebar, footer, mobile-nav
└── features/    → Feature-specific components grouped by domain
    ├── auth/    → LoginForm, RegisterForm, ForgotPasswordForm
    └── [name]/  → FeatureList, FeatureCard, FeatureForm
```

### Data Fetching Pattern
```
1. Define API service functions in services/[feature].service.ts
2. Create custom hooks in hooks/use-[feature].ts using React Query
3. Use hooks in components for automatic caching, refetching, and loading states
4. Handle loading, error, and empty states in every data component
```

### Form Pattern
```
1. Define Zod schema for validation
2. Create form with useForm() + zodResolver
3. Use Shadcn Form components for accessible field rendering
4. Handle submission with useMutation() from React Query
5. Show loading state during submission
6. Display server errors with toast notifications
```

### Responsive Pattern
```
1. Mobile-first: design for 320px width first
2. Progressive enhancement: add complexity at larger breakpoints
3. Use Tailwind responsive prefixes (sm:, md:, lg:, xl:)
4. Test at: 320px, 640px, 768px, 1024px, 1280px, 1536px
5. Touch targets minimum 48x48px on mobile
```

### Environment & API Pattern
```
1. Create a `.env` and `.env.example` file in the frontend root.
2. Read the backend API gateway base URL from the `NEXT_PUBLIC_API_URL` environment variable.
3. Configure the HTTP/Axios base client in `lib/api-client.ts` to use `process.env.NEXT_PUBLIC_API_URL`.
4. Never hardcode backend server URLs directly in the API service files.
```

## Anti-Patterns (Never Do)

- Never use `any` type — always define proper TypeScript interfaces.
- Never use inline styles — use Tailwind utilities exclusively.
- Never put API calls directly in components — use service + hook pattern.
- Never use class components — functional components with hooks only.
- Never skip loading and error states — every data component handles all states.
- Never hardcode text — use constants or i18n keys for user-facing text.
- Never skip accessibility — all interactive elements need ARIA labels and keyboard support.
- Never use `useEffect` for data fetching — use React Query.
- Never put business logic in components — extract to hooks or utilities.
- Never hardcode API base URLs — always configure via the `NEXT_PUBLIC_API_URL` environment variable.
