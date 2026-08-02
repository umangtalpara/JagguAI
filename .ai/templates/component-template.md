# Component Template

## React Component Template

### Presentational Component

```typescript
'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

interface [ComponentName]Props {
  /** Brief description of the prop */
  title: string;
  /** Brief description */
  description?: string;
  /** Children elements */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

// ──────────────────────────────────────────
// Component
// ──────────────────────────────────────────

/**
 * [ComponentName] — [Brief description of what the component does]
 *
 * @example
 * <[ComponentName]
 *   title="Example"
 *   description="This is an example"
 *   onClick={() => console.log('clicked')}
 * />
 */
export function [ComponentName]({
  title,
  description,
  children,
  className,
  onClick,
}: [ComponentName]Props) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn(
        'rounded-xl border bg-card p-6',
        'hover:shadow-md hover:border-primary/50',
        'transition-colors duration-300',
        className,
      )}
      onClick={onClick}
    >
      <h3 className="font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {children}
    </motion.div>
  );
}
```

### Form Component

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// ──────────────────────────────────────────
// Schema
// ──────────────────────────────────────────

const [formName]Schema = z.object({
  fieldName: z
    .string()
    .min(2, 'Field must be at least 2 characters')
    .max(100, 'Field must be at most 100 characters'),
  email: z
    .string()
    .email('Invalid email address'),
});

type [FormName]Values = z.infer<typeof [formName]Schema>;

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

interface [FormName]FormProps {
  /** Called when the form is submitted with valid data */
  onSubmit: (values: [FormName]Values) => Promise<void>;
  /** Whether the form is currently submitting */
  isLoading?: boolean;
  /** Default values for editing mode */
  defaultValues?: Partial<[FormName]Values>;
}

// ──────────────────────────────────────────
// Component
// ──────────────────────────────────────────

export function [FormName]Form({
  onSubmit,
  isLoading = false,
  defaultValues,
}: [FormName]FormProps) {
  const form = useForm<[FormName]Values>({
    resolver: zodResolver([formName]Schema),
    defaultValues: {
      fieldName: '',
      email: '',
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fieldName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter value" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </Form>
  );
}
```

### Data Display Component (with React Query)

```typescript
'use client';

import { motion } from 'framer-motion';
import { useFeatures } from '@/hooks/use-features';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { FeatureCard } from './feature-card';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function FeatureList() {
  const { data, isLoading, isError, error } = useFeatures({ page: 1, limit: 20 });

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load features: {error?.message}
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (!data?.data.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No features found</p>
      </div>
    );
  }

  // Data state
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {data.data.map((feature) => (
        <motion.div key={feature.id} variants={fadeUpItem}>
          <FeatureCard feature={feature} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

## Component Checklist

- [ ] Props are strongly typed with an interface
- [ ] Component has JSDoc documentation with `@example`
- [ ] Uses `cn()` utility for className composition
- [ ] Handles all states: loading, error, empty, data
- [ ] Responsive across all breakpoints
- [ ] Accessible: ARIA labels, keyboard navigation, focus management
- [ ] Animations use Framer Motion with spring physics
- [ ] No `any` types
- [ ] No inline styles
- [ ] No hardcoded text (use constants or i18n)
