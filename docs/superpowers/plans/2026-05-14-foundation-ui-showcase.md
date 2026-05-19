# Meytle PWA — Foundation + UI Component Showcase

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a Vite + React + TypeScript + Tailwind PWA with every reusable UI component built and displayed on a `/showcase` page that visually proves the design system is correct before any feature work begins.

**Architecture:** CSS custom properties carry all design tokens (colors, spacing, radius). Tailwind is configured to reference those properties so components use `var(--color-amber)` natively. Every component is a typed React function component in `src/components/ui/`. The showcase page imports all components and renders them in sections — buttons, inputs, chips, badges, cards, nav, onboarding progress — so a designer can sign off visually.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Tailwind CSS 3, Tabler Icons React, React Router 6, clsx + tailwind-merge, Zustand, vite-plugin-pwa

---

## File Map

| File | Responsibility |
|---|---|
| `meytle-pwa/` | Project root (this is the PWA, not the existing frontend) |
| `index.html` | Vite entry, font import |
| `vite.config.ts` | Vite + PWA plugin config |
| `tailwind.config.ts` | Tailwind referencing CSS vars |
| `tsconfig.json` | Strict TypeScript config |
| `src/index.css` | CSS custom properties (all design tokens) + Tailwind base |
| `src/main.tsx` | React root mount |
| `src/App.tsx` | Router setup — `/` → Homepage, `/showcase` → UIShowcase |
| `src/lib/cn.ts` | `clsx` + `tailwind-merge` utility |
| `src/types/index.ts` | Shared TypeScript types (Companion, Experience, etc.) |
| `src/components/ui/Button.tsx` | Primary / ghost / outline variants, all states |
| `src/components/ui/Input.tsx` | Text input with label, error, disabled states |
| `src/components/ui/Chip.tsx` | Filter chip, active/inactive toggle |
| `src/components/ui/Badge.tsx` | Availability pill, verified badge |
| `src/components/ui/Avatar.tsx` | Circle avatar — photo or initials fallback |
| `src/components/ui/CompanionCard.tsx` | Full companion card with photo, name, location, bio, price |
| `src/components/ui/ExperienceCard.tsx` | Experience category card with photo bg and label overlay |
| `src/components/ui/ProgressBar.tsx` | Segmented onboarding progress bar |
| `src/components/ui/BottomNav.tsx` | Mobile bottom tab bar |
| `src/components/ui/TopBar.tsx` | Mobile sticky top bar with location + search |
| `src/components/ui/index.ts` | Re-exports all UI components |
| `src/pages/UIShowcase.tsx` | Full showcase page rendering every component |
| `src/pages/Homepage.tsx` | Stub — just a placeholder for now |

---

## Task 1: Scaffold Vite React TypeScript project

**Files:**
- Create: `meytle-pwa/package.json`
- Create: `meytle-pwa/vite.config.ts`
- Create: `meytle-pwa/tsconfig.json`
- Create: `meytle-pwa/tailwind.config.ts`
- Create: `meytle-pwa/postcss.config.js`
- Create: `meytle-pwa/index.html`

- [ ] **Step 1: Initialise Vite project in the meytle-pwa directory**

```bash
cd d:\adizx\meytle\meytle-pwa
npm create vite@latest . -- --template react-ts
```

When asked "Current directory is not empty. Remove existing files and continue?", select **Yes** (the directory only has the DOCX and docs/).

- [ ] **Step 2: Install all dependencies**

```bash
npm install
npm install react-router-dom zustand axios clsx tailwind-merge
npm install @tabler/icons-react
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa
npx tailwindcss init -p --ts
```

- [ ] **Step 3: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Meytle',
        short_name: 'Meytle',
        description: 'Find meaningful company for every experience',
        theme_color: '#BA7517',
        background_color: '#FAF9F7',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
```

- [ ] **Step 4: Write `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        amber: {
          DEFAULT: 'var(--color-amber)',
          light: 'var(--color-amber-light)',
          dark: 'var(--color-amber-dark)',
        },
        dark: 'var(--color-dark)',
        gray: {
          DEFAULT: 'var(--color-gray)',
          light: 'var(--color-gray-light)',
        },
        border: 'var(--color-border)',
        bg: 'var(--color-bg)',
        success: {
          DEFAULT: 'var(--color-success)',
          bg: 'var(--color-success-bg)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          bg: 'var(--color-error-bg)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 5: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#BA7517" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
    <title>Meytle</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: `http://localhost:5173` returns the default Vite React page. No errors in terminal.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold vite react ts pwa with tailwind and tabler icons"
```

---

## Task 2: Design tokens and global CSS

**Files:**
- Create: `src/index.css`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write `src/index.css` with all design tokens**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Primary */
    --color-amber:        #BA7517;
    --color-amber-light:  #FAEEDA;
    --color-amber-dark:   #633806;

    /* Neutrals */
    --color-dark:         #1A1A1A;
    --color-gray:         #666666;
    --color-gray-light:   #F5F2EC;
    --color-border:       #E8E4DC;
    --color-bg:           #FAF9F7;
    --color-white:        #FFFFFF;

    /* Semantic */
    --color-success:      #0F6E56;
    --color-success-bg:   #E1F5EE;
    --color-error:        #A32D2D;
    --color-error-bg:     #FCEBEB;

    /* Spacing */
    --space-xs:   4px;
    --space-sm:   8px;
    --space-md:   12px;
    --space-lg:   16px;
    --space-xl:   24px;
    --space-2xl:  32px;
    --space-3xl:  48px;

    /* Radius */
    --radius-sm:   6px;
    --radius-md:   8px;
    --radius-lg:   12px;
    --radius-xl:   16px;
    --radius-full: 9999px;
  }

  html {
    font-family: Inter, system-ui, sans-serif;
    background-color: var(--color-bg);
    color: var(--color-dark);
    -webkit-font-smoothing: antialiased;
  }

  * {
    box-sizing: border-box;
  }

  /* Focus ring — all interactive elements */
  :focus-visible {
    outline: 2px solid var(--color-amber);
    outline-offset: 2px;
  }

  /* Screen reader utility */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
}
```

- [ ] **Step 2: Update `src/main.tsx` to import CSS**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: Verify tokens load in browser**

Run `npm run dev`, open browser, open DevTools → Elements → `<html>` → verify `--color-amber: #BA7517` appears in computed styles.

- [ ] **Step 4: Commit**

```bash
git add src/index.css src/main.tsx
git commit -m "feat: add design tokens as css custom properties"
```

---

## Task 3: Shared utilities and types

**Files:**
- Create: `src/lib/cn.ts`
- Create: `src/types/index.ts`

- [ ] **Step 1: Write `src/lib/cn.ts`**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: Write `src/types/index.ts`**

```ts
export type ExperienceType =
  | 'coffee'
  | 'dining'
  | 'concert'
  | 'travel'
  | 'fitness'
  | 'culture'
  | 'nature'
  | 'movies'
  | 'shopping'
  | 'gaming'

export interface Service {
  type: ExperienceType
  label: string
  pricePerHour: number
}

export interface Companion {
  id: string
  name: string
  age: number
  city: string
  neighbourhood: string
  bio: string          // max 80 chars on card
  avatarUrl: string | null
  initials: string
  services: Service[]
  rating: number
  reviewCount: number
  isVerified: boolean
  isAvailableNow: boolean
  priceFrom: number    // lowest hourly rate across services
}

export interface Experience {
  type: ExperienceType
  label: string
  imageUrl: string
}

export type NavTab = 'home' | 'map' | 'messages' | 'bookings' | 'profile'

export type ButtonVariant = 'primary' | 'ghost' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type InputState = 'default' | 'focus' | 'error' | 'disabled'
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/cn.ts src/types/index.ts
git commit -m "feat: add cn utility and shared typescript types"
```

---

## Task 4: Button component

**Files:**
- Create: `src/components/ui/Button.tsx`

- [ ] **Step 1: Write `src/components/ui/Button.tsx`**

```tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import type { ButtonVariant, ButtonSize } from '../../types'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-amber)] text-white border-transparent hover:bg-[#9E6313] active:scale-[0.98]',
  ghost:
    'bg-transparent text-[var(--color-gray)] border-[0.5px] border-[#CCC] hover:bg-[var(--color-bg)]',
  outline:
    'bg-transparent text-[var(--color-amber)] border-[1.5px] border-[var(--color-amber)] hover:bg-[var(--color-amber-light)]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[12px] gap-1.5',
  md: 'h-10 px-4 text-[13px] gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-[var(--radius-md)]',
          'border transition-all duration-150 cursor-pointer select-none',
          'disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {icon && iconPosition === 'left' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'
export default Button
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Button.tsx
git commit -m "feat: add Button component with primary/ghost/outline variants"
```

---

## Task 5: Input component

**Files:**
- Create: `src/components/ui/Input.tsx`

- [ ] **Step 1: Write `src/components/ui/Input.tsx`**

```tsx
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, disabled, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-medium text-[var(--color-dark)] uppercase tracking-[0.06em]"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3 text-[var(--color-gray)] flex items-center pointer-events-none">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full h-11 px-3 text-[13px] rounded-[var(--radius-md)]',
              'border-[0.5px] border-[#D8D4CC] bg-[var(--color-bg)]',
              'text-[var(--color-dark)] placeholder:text-[var(--color-gray)]',
              'transition-all duration-150',
              'focus:outline-none focus:border-[var(--color-amber)]',
              'focus:shadow-[0_0_0_3px_rgba(186,117,23,0.15)]',
              error && 'border-[var(--color-error)] bg-[var(--color-error-bg)]',
              disabled && 'opacity-50 bg-[var(--color-gray-light)] cursor-not-allowed',
              icon && 'pl-9',
              className,
            )}
            {...props}
          />
        </div>

        {error && (
          <p className="text-[11px] text-[var(--color-error)]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-[11px] text-[var(--color-gray)]">{hint}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Input.tsx
git commit -m "feat: add Input component with label, error, hint, icon states"
```

---

## Task 6: Chip component

**Files:**
- Create: `src/components/ui/Chip.tsx`

- [ ] **Step 1: Write `src/components/ui/Chip.tsx`**

```tsx
import { type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  label: string
}

export default function Chip({ active = false, label, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex-shrink-0 px-3 py-[5px] rounded-[var(--radius-full)]',
        'text-[11px] border transition-all duration-150 cursor-pointer whitespace-nowrap',
        active
          ? 'bg-[var(--color-amber-light)] border-[var(--color-amber)] text-[var(--color-amber-dark)] font-medium'
          : 'bg-white border-[#D8D4CC] text-[#555555] hover:border-[var(--color-amber)]',
        className,
      )}
      aria-pressed={active}
      {...props}
    >
      {label}
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/Chip.tsx
git commit -m "feat: add Chip component with active/inactive states"
```

---

## Task 7: Badge and Avatar components

**Files:**
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Avatar.tsx`

- [ ] **Step 1: Write `src/components/ui/Badge.tsx`**

```tsx
import { cn } from '../../lib/cn'

type BadgeVariant = 'available' | 'verified' | 'pending' | 'away'

interface BadgeProps {
  variant: BadgeVariant
  className?: string
}

const variantConfig: Record<BadgeVariant, { label: string; classes: string }> = {
  available: {
    label: 'Available Now',
    classes: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
  },
  verified: {
    label: 'Verified',
    classes: 'bg-[var(--color-amber-light)] text-[var(--color-amber-dark)]',
  },
  pending: {
    label: 'Pending Review',
    classes: 'bg-[#FFF8E1] text-[#795548]',
  },
  away: {
    label: 'Away',
    classes: 'bg-[var(--color-gray-light)] text-[var(--color-gray)]',
  },
}

export default function Badge({ variant, className }: BadgeProps) {
  const { label, classes } = variantConfig[variant]
  return (
    <span
      className={cn(
        'text-[10px] font-medium px-2 py-[2px] rounded-[var(--radius-full)]',
        classes,
        className,
      )}
    >
      {label}
    </span>
  )
}
```

- [ ] **Step 2: Write `src/components/ui/Avatar.tsx`**

```tsx
import { cn } from '../../lib/cn'

interface AvatarProps {
  src?: string | null
  initials: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  alt?: string
}

const sizeClasses = {
  sm:  'w-8 h-8 text-[12px]',
  md:  'w-10 h-10 text-[14px]',
  lg:  'w-14 h-14 text-[20px]',
  xl:  'w-20 h-20 text-[28px]',
}

const bgColors = [
  'bg-[#c8a96e]', 'bg-[#8fa8c8]', 'bg-[#c8a0a0]',
  'bg-[#90c8a0]', 'bg-[#a0a0c8]', 'bg-[#c8b090]',
]

function pickBg(initials: string) {
  const code = initials.charCodeAt(0) % bgColors.length
  return bgColors[code]
}

export default function Avatar({ src, initials, size = 'md', className, alt }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? initials}
        className={cn(
          'rounded-full object-cover flex-shrink-0',
          sizeClasses[size],
          className,
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0',
        'font-bold text-white',
        pickBg(initials),
        sizeClasses[size],
        className,
      )}
      aria-label={alt ?? initials}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Badge.tsx src/components/ui/Avatar.tsx
git commit -m "feat: add Badge and Avatar components"
```

---

## Task 8: ProgressBar component

**Files:**
- Create: `src/components/ui/ProgressBar.tsx`

- [ ] **Step 1: Write `src/components/ui/ProgressBar.tsx`**

```tsx
import { cn } from '../../lib/cn'

interface ProgressBarProps {
  total: number
  current: number   // 1-based current step
  className?: string
}

export default function ProgressBar({ total, current, className }: ProgressBarProps) {
  return (
    <div
      className={cn('flex gap-1', className)}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'flex-1 h-[3px] rounded-full transition-all duration-300',
            i < current
              ? 'bg-[var(--color-amber)]'
              : 'bg-[#EEEBE4]',
          )}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/ProgressBar.tsx
git commit -m "feat: add ProgressBar component for onboarding steps"
```

---

## Task 9: CompanionCard component

**Files:**
- Create: `src/components/ui/CompanionCard.tsx`

- [ ] **Step 1: Write `src/components/ui/CompanionCard.tsx`**

```tsx
import { IconMapPin, IconCheck } from '@tabler/icons-react'
import { cn } from '../../lib/cn'
import type { Companion } from '../../types'
import Avatar from './Avatar'
import Badge from './Badge'

interface CompanionCardProps {
  companion: Companion
  onClick?: () => void
  className?: string
}

export default function CompanionCard({ companion, onClick, className }: CompanionCardProps) {
  const bio = companion.bio.length > 80
    ? companion.bio.slice(0, 80) + '…'
    : companion.bio

  return (
    <article
      className={cn(
        'bg-white border-[0.5px] border-[var(--color-border)] rounded-[var(--radius-lg)]',
        'overflow-hidden cursor-pointer transition-all duration-150',
        'hover:border-[var(--color-amber)] hover:-translate-y-0.5',
        className,
      )}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      role="button"
      aria-label={`View ${companion.name}'s profile`}
    >
      {/* Avatar area */}
      <div className="relative h-[90px] flex items-center justify-center bg-[var(--color-gray-light)]">
        <Avatar
          src={companion.avatarUrl}
          initials={companion.initials}
          size="xl"
          alt={companion.name}
        />

        {companion.isVerified && (
          <div
            className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full bg-[var(--color-amber)] flex items-center justify-center"
            aria-label="Verified companion"
          >
            <IconCheck size={10} stroke={2.5} color="white" />
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="p-2">
        <div className="text-[13px] font-medium text-[var(--color-dark)] leading-tight">
          {companion.name}, {companion.age}
        </div>

        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#888888]">
          <IconMapPin size={10} stroke={1.5} />
          {companion.neighbourhood}
        </div>

        {bio && (
          <p className="mt-1.5 text-[11px] text-[#555555] leading-[1.5] border-l-2 border-[var(--color-amber-light)] pl-2">
            {bio}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {companion.services.slice(0, 3).map((s) => (
            <span
              key={s.type}
              className="text-[10px] bg-[#F5F2EC] rounded-full px-[7px] py-[2px] text-[var(--color-gray)]"
            >
              {s.label}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F0ECE4]">
          <span className="text-[13px] font-medium text-[var(--color-dark)]">
            ${companion.priceFrom}
            <span className="text-[10px] font-normal text-[var(--color-gray)]">/hr</span>
          </span>

          {companion.isAvailableNow && (
            <Badge variant="available" />
          )}
        </div>
      </div>
    </article>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/CompanionCard.tsx
git commit -m "feat: add CompanionCard component"
```

---

## Task 10: ExperienceCard component

**Files:**
- Create: `src/components/ui/ExperienceCard.tsx`

- [ ] **Step 1: Write `src/components/ui/ExperienceCard.tsx`**

```tsx
import {
  IconCoffee, IconChefHat, IconMusic, IconPlane,
  IconRun, IconBuildingArch, IconTree, IconMovie,
  IconShoppingBag, IconDeviceGamepad2,
} from '@tabler/icons-react'
import { cn } from '../../lib/cn'
import type { ExperienceType } from '../../types'

interface ExperienceCardProps {
  type: ExperienceType
  label: string
  imageUrl?: string
  onClick?: () => void
  className?: string
}

const iconMap: Record<ExperienceType, React.ReactNode> = {
  coffee:   <IconCoffee size={18} stroke={1.5} color="white" />,
  dining:   <IconChefHat size={18} stroke={1.5} color="white" />,
  concert:  <IconMusic size={18} stroke={1.5} color="white" />,
  travel:   <IconPlane size={18} stroke={1.5} color="white" />,
  fitness:  <IconRun size={18} stroke={1.5} color="white" />,
  culture:  <IconBuildingArch size={18} stroke={1.5} color="white" />,
  nature:   <IconTree size={18} stroke={1.5} color="white" />,
  movies:   <IconMovie size={18} stroke={1.5} color="white" />,
  shopping: <IconShoppingBag size={18} stroke={1.5} color="white" />,
  gaming:   <IconDeviceGamepad2 size={18} stroke={1.5} color="white" />,
}

const gradientMap: Record<ExperienceType, string> = {
  coffee:   'from-[#c8a060] to-[#7a5020]',
  dining:   'from-[#607880] to-[#2a4858]',
  concert:  'from-[#8060a8] to-[#402060]',
  travel:   'from-[#6080c8] to-[#203080]',
  fitness:  'from-[#c07060] to-[#802030]',
  culture:  'from-[#508870] to-[#205840]',
  nature:   'from-[#6a9860] to-[#2a5820]',
  movies:   'from-[#887060] to-[#483828]',
  shopping: 'from-[#c080a0] to-[#804060]',
  gaming:   'from-[#6060a8] to-[#202068]',
}

export default function ExperienceCard({
  type,
  label,
  imageUrl,
  onClick,
  className,
}: ExperienceCardProps) {
  return (
    <div
      className={cn(
        'flex-shrink-0 w-[150px] h-[120px] rounded-[10px] overflow-hidden',
        'relative cursor-pointer transition-transform duration-200 hover:scale-[1.03]',
        className,
      )}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      role="button"
      aria-label={`Browse ${label} experiences`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className={cn('w-full h-full bg-gradient-to-br', gradientMap[type])} />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Label */}
      <div className="absolute bottom-0 left-0 p-2 flex flex-col gap-1">
        {iconMap[type]}
        <span className="text-[12px] font-medium text-white leading-tight">{label}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/ExperienceCard.tsx
git commit -m "feat: add ExperienceCard component with gradient fallback"
```

---

## Task 11: TopBar and BottomNav components

**Files:**
- Create: `src/components/ui/TopBar.tsx`
- Create: `src/components/ui/BottomNav.tsx`

- [ ] **Step 1: Write `src/components/ui/TopBar.tsx`**

```tsx
import { IconSearch, IconBell, IconChevronDown, IconMapPin } from '@tabler/icons-react'

interface TopBarProps {
  location: string
  onLocationClick?: () => void
  onSearchFocus?: () => void
  hasNotification?: boolean
}

export default function TopBar({
  location,
  onLocationClick,
  onSearchFocus,
  hasNotification = false,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[0.5px] border-[var(--color-border)]">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        {/* Location selector */}
        <button
          type="button"
          className="flex flex-col items-start"
          onClick={onLocationClick}
          aria-label="Change location"
        >
          <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-[var(--color-amber)]">
            Your area
          </span>
          <span className="flex items-center gap-1 text-[13px] font-semibold text-[var(--color-dark)]">
            <IconMapPin size={13} stroke={1.5} color="var(--color-amber)" />
            {location}
            <IconChevronDown size={13} stroke={1.5} color="var(--color-amber)" />
          </span>
        </button>

        {/* Notification bell */}
        <button
          type="button"
          className="relative w-8 h-8 rounded-full bg-[var(--color-bg)] border border-[0.5px] border-[var(--color-border)] flex items-center justify-center"
          aria-label={hasNotification ? 'Notifications — new alerts' : 'Notifications'}
        >
          <IconBell size={16} stroke={1.5} color="var(--color-gray)" />
          {hasNotification && (
            <span className="absolute top-1 right-1 w-[7px] h-[7px] rounded-full bg-[var(--color-amber)] border-[1.5px] border-white" />
          )}
        </button>
      </div>

      {/* Search bar */}
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={onSearchFocus}
          className="w-full flex items-center gap-2 h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-bg)] border-[0.5px] border-[var(--color-border)] text-left"
          aria-label="Search companions and experiences"
        >
          <IconSearch size={14} stroke={1.5} color="#BBBBBB" />
          <span className="text-[12px] text-[var(--color-gray)]">
            Search companions, experiences…
          </span>
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Write `src/components/ui/BottomNav.tsx`**

```tsx
import {
  IconHome, IconMap, IconMessageCircle,
  IconCalendar, IconUser,
} from '@tabler/icons-react'
import { cn } from '../../lib/cn'
import type { NavTab } from '../../types'

interface NavItem {
  tab: NavTab
  label: string
  icon: React.ReactNode
  activeIcon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    tab: 'home',
    label: 'Home',
    icon:       <IconHome size={22} stroke={1.5} />,
    activeIcon: <IconHome size={22} stroke={2} />,
  },
  {
    tab: 'map',
    label: 'Map',
    icon:       <IconMap size={22} stroke={1.5} />,
    activeIcon: <IconMap size={22} stroke={2} />,
  },
  {
    tab: 'messages',
    label: 'Messages',
    icon:       <IconMessageCircle size={22} stroke={1.5} />,
    activeIcon: <IconMessageCircle size={22} stroke={2} />,
  },
  {
    tab: 'bookings',
    label: 'Bookings',
    icon:       <IconCalendar size={22} stroke={1.5} />,
    activeIcon: <IconCalendar size={22} stroke={2} />,
  },
  {
    tab: 'profile',
    label: 'Profile',
    icon:       <IconUser size={22} stroke={1.5} />,
    activeIcon: <IconUser size={22} stroke={2} />,
  },
]

interface BottomNavProps {
  active: NavTab
  onChange: (tab: NavTab) => void
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-[0.5px] border-[var(--color-border)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center h-[52px]">
        {navItems.map(({ tab, label, icon, activeIcon }) => {
          const isActive = tab === active
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              className={cn(
                'flex flex-col items-center gap-[3px] min-w-[52px] py-1',
                'transition-colors duration-150',
              )}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className={cn(
                  isActive ? 'text-[var(--color-amber)]' : 'text-[#999999]',
                )}
              >
                {isActive ? activeIcon : icon}
              </span>
              <span
                className={cn(
                  'text-[9px]',
                  isActive
                    ? 'text-[var(--color-amber)] font-semibold'
                    : 'text-[#999999]',
                )}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/TopBar.tsx src/components/ui/BottomNav.tsx
git commit -m "feat: add TopBar and BottomNav components"
```

---

## Task 12: Component barrel export

**Files:**
- Create: `src/components/ui/index.ts`

- [ ] **Step 1: Write `src/components/ui/index.ts`**

```ts
export { default as Button } from './Button'
export { default as Input } from './Input'
export { default as Chip } from './Chip'
export { default as Badge } from './Badge'
export { default as Avatar } from './Avatar'
export { default as ProgressBar } from './ProgressBar'
export { default as CompanionCard } from './CompanionCard'
export { default as ExperienceCard } from './ExperienceCard'
export { default as TopBar } from './TopBar'
export { default as BottomNav } from './BottomNav'
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/index.ts
git commit -m "feat: add ui component barrel export"
```

---

## Task 13: UI Showcase page

**Files:**
- Create: `src/pages/UIShowcase.tsx`

- [ ] **Step 1: Write `src/pages/UIShowcase.tsx`**

```tsx
import { useState } from 'react'
import { IconSearch, IconMail } from '@tabler/icons-react'
import {
  Button, Input, Chip, Badge, Avatar, ProgressBar,
  CompanionCard, ExperienceCard, TopBar, BottomNav,
} from '../components/ui'
import type { Companion, ExperienceType, NavTab } from '../types'

const MOCK_COMPANION: Companion = {
  id: '1',
  name: 'Aanya',
  age: 26,
  city: 'Mumbai',
  neighbourhood: 'Bandra West',
  bio: 'Love exploring the city, cafe hopping, and live music. Always up for a good conversation.',
  avatarUrl: null,
  initials: 'A',
  services: [
    { type: 'coffee', label: 'Coffee Dates', pricePerHour: 800 },
    { type: 'concert', label: 'Concerts', pricePerHour: 1200 },
    { type: 'culture', label: 'Cultural Events', pricePerHour: 1000 },
  ],
  rating: 4.9,
  reviewCount: 42,
  isVerified: true,
  isAvailableNow: true,
  priceFrom: 800,
}

const MOCK_COMPANION_2: Companion = {
  ...MOCK_COMPANION,
  id: '2',
  name: 'Rohan',
  age: 29,
  neighbourhood: 'Andheri',
  initials: 'R',
  isAvailableNow: false,
  priceFrom: 1200,
}

const EXPERIENCE_TYPES: Array<{ type: ExperienceType; label: string }> = [
  { type: 'coffee',   label: 'Coffee Dates' },
  { type: 'dining',   label: 'Fine Dining' },
  { type: 'concert',  label: 'Concerts' },
  { type: 'travel',   label: 'Travel' },
  { type: 'fitness',  label: 'Fitness' },
  { type: 'culture',  label: 'Culture' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-[11px] font-semibold text-[var(--color-amber)] uppercase tracking-[0.06em] mb-1">
        Component
      </h2>
      <h3 className="text-[22px] font-semibold text-[var(--color-dark)] mb-6">{title}</h3>
      {children}
    </section>
  )
}

export default function UIShowcase() {
  const [activeChips, setActiveChips] = useState<Set<ExperienceType>>(new Set(['coffee']))
  const [activeTab, setActiveTab] = useState<NavTab>('home')
  const [progressStep, setProgressStep] = useState(2)
  const [inputValue, setInputValue] = useState('')

  function toggleChip(type: ExperienceType) {
    setActiveChips((prev) => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  return (
    <div className="bg-[var(--color-bg)] min-h-screen pb-32">
      {/* Page header */}
      <div className="bg-white border-b border-[var(--color-border)] px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--color-amber)] mb-2">
            Meytle Design System
          </div>
          <h1 className="text-[32px] font-semibold text-[var(--color-dark)]">
            UI Component Showcase
          </h1>
          <p className="text-[14px] text-[var(--color-gray)] mt-2">
            Every reusable component. All states. All variants.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-10">

        {/* ── Buttons ── */}
        <Section title="Buttons">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-[11px] text-[var(--color-gray)] uppercase tracking-[0.06em] mb-3">Variants</p>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="primary">Explore Companions</Button>
                <Button variant="outline">Become a Companion</Button>
                <Button variant="ghost">Log In</Button>
              </div>
            </div>
            <div>
              <p className="text-[11px] text-[var(--color-gray)] uppercase tracking-[0.06em] mb-3">Sizes</p>
              <div className="flex flex-wrap gap-3 items-center">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            <div>
              <p className="text-[11px] text-[var(--color-gray)] uppercase tracking-[0.06em] mb-3">With icon</p>
              <div className="flex flex-wrap gap-3 items-center">
                <Button icon={<IconSearch size={14} stroke={1.5} />}>
                  Search
                </Button>
                <Button variant="outline" icon={<IconMail size={14} stroke={1.5} />} iconPosition="right">
                  Get invite
                </Button>
              </div>
            </div>
            <div>
              <p className="text-[11px] text-[var(--color-gray)] uppercase tracking-[0.06em] mb-3">States</p>
              <div className="flex flex-wrap gap-3 items-center">
                <Button disabled>Disabled primary</Button>
                <Button variant="outline" disabled>Disabled outline</Button>
                <Button fullWidth>Full width button</Button>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Inputs ── */}
        <Section title="Inputs">
          <div className="grid grid-cols-1 gap-5 max-w-sm">
            <Input
              label="Email address"
              placeholder="you@example.com"
              type="email"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input
              label="Search"
              placeholder="City, neighbourhood…"
              icon={<IconSearch size={14} stroke={1.5} />}
            />
            <Input
              label="Email"
              placeholder="you@example.com"
              error="Please enter a valid email address"
            />
            <Input
              label="Disabled field"
              placeholder="Not editable"
              disabled
            />
            <Input
              label="With hint"
              placeholder="Your rate"
              hint="Set a competitive rate to get more bookings"
            />
          </div>
        </Section>

        {/* ── Chips ── */}
        <Section title="Filter Chips">
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_TYPES.map(({ type, label }) => (
              <Chip
                key={type}
                label={label}
                active={activeChips.has(type)}
                onClick={() => toggleChip(type)}
              />
            ))}
          </div>
          <p className="text-[11px] text-[var(--color-gray)] mt-3">
            {activeChips.size} selected — click to toggle
          </p>
        </Section>

        {/* ── Badges ── */}
        <Section title="Badges">
          <div className="flex flex-wrap gap-3 items-center">
            <Badge variant="available" />
            <Badge variant="verified" />
            <Badge variant="pending" />
            <Badge variant="away" />
          </div>
        </Section>

        {/* ── Avatars ── */}
        <Section title="Avatars">
          <div className="flex flex-wrap gap-4 items-end">
            <Avatar initials="A" size="sm" />
            <Avatar initials="RK" size="md" />
            <Avatar initials="P" size="lg" />
            <Avatar initials="KM" size="xl" />
            <Avatar
              initials="JD"
              size="xl"
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop"
              alt="Jane Doe"
            />
          </div>
        </Section>

        {/* ── Progress bar ── */}
        <Section title="Onboarding Progress Bar">
          <div className="max-w-sm">
            <ProgressBar total={6} current={progressStep} className="mb-4" />
            <p className="text-[12px] text-[var(--color-gray)] mb-3">
              Step {progressStep} of 6
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setProgressStep((s) => Math.max(1, s - 1))}
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={() => setProgressStep((s) => Math.min(6, s + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </Section>

        {/* ── Companion Cards ── */}
        <Section title="Companion Cards">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <CompanionCard companion={MOCK_COMPANION} />
            <CompanionCard companion={MOCK_COMPANION_2} />
            <CompanionCard companion={{ ...MOCK_COMPANION, id: '3', name: 'Priya', age: 24, initials: 'P', neighbourhood: 'Juhu', priceFrom: 950, isAvailableNow: true }} />
          </div>
        </Section>

        {/* ── Experience Cards ── */}
        <Section title="Experience Category Cards">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {EXPERIENCE_TYPES.map(({ type, label }) => (
              <ExperienceCard key={type} type={type} label={label} />
            ))}
          </div>
        </Section>

        {/* ── Top Bar ── */}
        <Section title="Top Bar (Mobile)">
          <div className="max-w-sm border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
            <TopBar location="Bandra West" hasNotification />
          </div>
        </Section>

        {/* ── Bottom Nav ── */}
        <Section title="Bottom Navigation (Mobile)">
          <div className="max-w-sm border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
            <BottomNav active={activeTab} onChange={setActiveTab} />
          </div>
          <p className="text-[11px] text-[var(--color-gray)] mt-2">
            Active: <strong>{activeTab}</strong> — click tabs above to switch
          </p>
        </Section>

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/UIShowcase.tsx
git commit -m "feat: add UIShowcase page rendering all components"
```

---

## Task 14: Router and App entry

**Files:**
- Modify: `src/App.tsx`
- Create: `src/pages/Homepage.tsx`

- [ ] **Step 1: Write stub `src/pages/Homepage.tsx`**

```tsx
import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

export default function Homepage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--color-bg)]">
      <h1 className="text-[32px] font-semibold text-[var(--color-dark)]">
        Find Meaningful Company For Every{' '}
        <span className="text-[var(--color-amber)]">Experience</span>
      </h1>
      <Link to="/showcase">
        <Button>View UI Showcase →</Button>
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Write `src/App.tsx` with router**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Homepage from './pages/Homepage'
import UIShowcase from './pages/UIShowcase'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/showcase" element={<UIShowcase />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Run dev server and verify**

```bash
npm run dev
```

- Open `http://localhost:5173` — see homepage with "View UI Showcase" button
- Click → `/showcase` shows all components
- Verify: buttons hover correctly, chips toggle, progress bar advances, companion cards have hover lift, bottom nav switches tabs

- [ ] **Step 4: Final commit**

```bash
git add src/App.tsx src/pages/Homepage.tsx
git commit -m "feat: wire router with homepage stub and showcase route"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| CSS design tokens | Task 2 |
| Inter font, all type scales | Task 2 (CSS) + Tasks 4–11 (applied) |
| Button: primary / ghost / outline / disabled / hover | Task 4 |
| Input: default / focus / error / disabled / hint | Task 5 |
| Filter chips: active / inactive toggle | Task 6 |
| Availability + verified badges | Task 7 |
| Avatar with initials fallback | Task 7 |
| Companion card: bio 80-char, verified badge, hover lift, tags, price | Task 9 |
| Experience category cards: gradient fallback, icon overlay, hover scale | Task 10 |
| Onboarding progress bar (segmented, 6 steps) | Task 8 |
| Mobile TopBar: location selector + search | Task 11 |
| Mobile BottomNav: 5 tabs, active state | Task 11 |
| No emojis — Tabler Icons throughout | Tasks 4, 9, 10, 11 |
| PWA manifest | Task 1 |
| Tailwind referencing CSS vars | Task 1 |
| Barrel export | Task 12 |
| Showcase page with all components interactive | Task 13 |
| Routing: `/` and `/showcase` | Task 14 |

**No placeholders found.** All code blocks are complete.

**Type consistency check:** `Companion`, `ExperienceType`, `NavTab`, `ButtonVariant`, `ButtonSize` — all defined in Task 3 and used consistently in Tasks 4, 9, 10, 11, 13. `Service` type used in `Companion`. Mock data in Task 13 satisfies all required fields. No mismatches.
