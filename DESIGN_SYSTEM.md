# Intently Design System

This document defines the design patterns and UI standards for the Intently web application. Following these guidelines ensures visual consistency and maintainability across the entire project.

## Table of Contents

1. [Design Principles](#design-principles)
2. [CSS Variables](#css-variables)
3. [Component Library](#component-library)
4. [Typography](#typography)
5. [Spacing](#spacing)
6. [Colors](#colors)
7. [Layout Patterns](#layout-patterns)
8. [Common Mistakes to Avoid](#common-mistakes-to-avoid)

---

## Design Principles

1. **Mobile-First**: All designs start with mobile and progressively enhance for larger screens
2. **Accessibility**: Minimum 44px touch targets, semantic HTML, proper ARIA labels
3. **Performance**: Scoped component styles, minimal CSS, no CSS frameworks
4. **Consistency**: Use CSS variables for all design tokens
5. **Material 3 Influence**: Shadows, border radius, and elevation follow Material 3 design language

---

## CSS Variables

**CRITICAL**: All design tokens are defined in `/src/styles/design-system.css`. Always use these variables instead of hardcoded values.

### Brand Colors

```css
/* Primary Colors */
--intently-blue: #2196F3        /* Primary brand color, CTAs, links */
--intently-blue-dark: #1976D2   /* Hover states, active states */
--intently-blue-light: #BBDEFB  /* Backgrounds, accents */

/* Success & Positive */
--intently-green: #4CAF50       /* Success states, goals achieved */
--intently-green-dark: #388E3C
--intently-green-light: #C8E6C9

/* Warning */
--intently-orange: #FF9800      /* Approaching limits */
--intently-orange-dark: #F57C00
--intently-orange-light: #FFE0B2

/* Urgent & Error */
--intently-red: #F44336         /* Limits exceeded, errors */
--intently-red-dark: #D32F2F
--intently-red-light: #FFCDD2

/* Milestone & Achievement */
--intently-purple: #9C27B0      /* Achievements, milestones */
--intently-purple-dark: #7B1FA2
--intently-purple-light: #E1BEE7
```

### Neutral Colors (9-Step Scale)

```css
--intently-gray-50: #FAFAFA    /* Lightest backgrounds */
--intently-gray-100: #F5F5F5   /* Light backgrounds */
--intently-gray-200: #EEEEEE   /* Borders, dividers */
--intently-gray-300: #E0E0E0
--intently-gray-400: #BDBDBD
--intently-gray-500: #9E9E9E   /* Hints, placeholders */
--intently-gray-600: #757575   /* Secondary text */
--intently-gray-700: #616161
--intently-gray-800: #424242
--intently-gray-900: #212121   /* Primary text */
```

### Semantic Colors

```css
--intently-bg-primary: #FFFFFF      /* Main background */
--intently-bg-secondary: #F5F7FA    /* Secondary sections */
--intently-bg-accent: #E3F2FD       /* Accent backgrounds */

--intently-text-primary: #212121    /* Primary text */
--intently-text-secondary: #757575  /* Secondary text */
--intently-text-hint: #9E9E9E       /* Hints, disabled text */
```

### Spacing Scale

```css
--intently-space-xs: 0.25rem   /* 4px */
--intently-space-sm: 0.5rem    /* 8px */
--intently-space-md: 1rem      /* 16px */
--intently-space-lg: 1.5rem    /* 24px */
--intently-space-xl: 2rem      /* 32px */
--intently-space-2xl: 3rem     /* 48px */
--intently-space-3xl: 4rem     /* 64px */
--intently-space-4xl: 6rem     /* 96px */
```

### Shadows (Material 3 Elevation)

```css
--intently-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08)     /* Subtle lift */
--intently-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1)     /* Card elevation */
--intently-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12)    /* Modal, popover */
--intently-shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.15)   /* Maximum elevation */
```

### Border Radius

```css
--intently-radius-sm: 8px      /* Small elements, buttons */
--intently-radius-md: 12px     /* Cards, containers */
--intently-radius-lg: 16px     /* Large cards */
--intently-radius-xl: 24px     /* Hero sections */
--intently-radius-full: 9999px /* Pills, badges, circles */
```

### Transitions

```css
--intently-transition-fast: 150ms ease     /* Micro-interactions */
--intently-transition-normal: 250ms ease   /* Standard transitions */
--intently-transition-slow: 350ms ease     /* Complex animations */
```

### Breakpoints

```css
--breakpoint-mobile: 0px       /* Base (mobile-first) */
--breakpoint-tablet: 768px     /* Tablets and up */
--breakpoint-desktop: 1024px   /* Desktops and up */
--breakpoint-wide: 1280px      /* Large desktops */
```

---

## Component Library

### Available Components

All reusable components are in `/src/components/`:

#### UI Components (`/src/components/ui/`)

1. **Button.astro**
   - Variants: `primary`, `secondary`, `ghost`
   - Sizes: `sm`, `md`, `lg`
   - Usage: `<Button variant="primary" size="md">Click Me</Button>`

2. **Card.astro**
   - Variants: `default`, `elevated`, `outlined`
   - Props: `hover` (boolean)
   - Usage: `<Card variant="elevated" hover={true}>Content</Card>`

3. **PageHeader.astro**
   - Props: `title`, `description`
   - Usage: `<PageHeader title="Page Title" description="Description" />`
   - Consistent gradient background for all pages

4. **CTABox.astro**
   - Props: `title`, `description`, `buttonText`, `buttonLink`
   - Usage: `<CTABox title="..." description="..." buttonText="Download" buttonLink="/download" />`

5. **ResourceCard.astro**
   - Props: `href`, `title`, `description`, `tag` (optional)
   - Usage: `<ResourceCard href="/blog/post" title="..." description="..." tag="Guide" />`

6. **StoreButton.astro**
   - Platform-specific download buttons
   - Types: App Store, Play Store, Chrome Web Store

#### Marketing Components (`/src/components/marketing/`)

- **Hero.astro** - Homepage hero with phone mockup
- **FeatureCard.astro** - Feature showcase cards
- **PlatformCard.astro** - Platform-specific cards

---

## Typography

### Font Family

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
```

### Scale

```css
/* Body Text */
font-size: 1rem;           /* 16px - base */
line-height: 1.6;

/* Headings */
h1: 2rem (mobile) → 2.5rem (tablet) → 3rem (desktop)
h2: 1.75rem (mobile) → 2rem (desktop)
h3: 1.5rem (mobile) → 1.75rem (desktop)
h4: 1.25rem
h5: 1.125rem
h6: 1rem

/* Section Titles */
.section-title: 1.75rem (mobile) → 2.5rem (desktop)
```

### Font Weights

```css
Regular: 400
Medium: 500
Semibold: 600
Bold: 700
```

---

## Spacing

### Consistent Spacing Patterns

#### Page Padding

```css
/* Mobile */
padding: var(--intently-space-3xl) var(--intently-space-md);

/* Tablet & Desktop */
@media (min-width: 768px) {
  padding: var(--intently-space-4xl) var(--intently-space-xl);
}
```

#### Section Spacing

```css
margin-bottom: var(--intently-space-4xl);  /* Between sections */
margin-bottom: var(--intently-space-xl);   /* Within sections */
```

#### Card Padding

```css
/* Desktop */
padding: var(--intently-space-xl);

/* Mobile */
padding: var(--intently-space-lg);
```

---

## Colors

### Color Usage Guidelines

| Color | Use Cases | Avoid |
|-------|-----------|-------|
| **Blue** | Primary CTAs, links, active states, brand elements | Body text, backgrounds |
| **Green** | Success states, positive trends, "After" states, download CTAs | Warnings, errors |
| **Orange** | Approaching limits, "Coming Soon" badges | Success, primary actions |
| **Red** | Urgent states, errors, "Before" comparisons | Success, navigation |
| **Purple** | Milestones, achievements, gradient accents | Primary CTAs |
| **Gray 50-200** | Backgrounds, subtle borders | Text |
| **Gray 600-900** | Body text, headings | Backgrounds |

---

## Layout Patterns

### Page Structure

All pages follow this structure:

```astro
---
import BaseHead from '../components/BaseHead.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import PageHeader from '../components/ui/PageHeader.astro';
---

<!doctype html>
<html lang="en">
  <head>
    <BaseHead title="..." description="..." />
  </head>
  <body>
    <Header />
    <PageHeader title="..." description="..." />
    <main class="content">
      <!-- Page content -->
    </main>
    <Footer />
  </body>
</html>
```

### Container Pattern

```css
.content {
  max-width: 1000px;  /* or 1100px, 1200px depending on page */
  margin: 0 auto;
  padding: var(--intently-space-3xl) var(--intently-space-md);
}

@media (min-width: 768px) {
  .content {
    padding: var(--intently-space-4xl) var(--intently-space-xl);
  }
}
```

### Grid Layouts

```css
/* Mobile-First Grid */
.grid {
  display: grid;
  gap: var(--intently-space-xl);
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 3 columns */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## Common Mistakes to Avoid

### ❌ DON'T

```css
/* Don't use undefined CSS variables */
color: var(--color-primary);         /* WRONG */
background: var(--color-bg-light);   /* WRONG */
box-shadow: var(--box-shadow);       /* WRONG */

/* Don't hardcode spacing */
padding: 4rem 0;                     /* WRONG */
margin-bottom: 3rem;                 /* WRONG */
gap: 1.5rem;                         /* WRONG */

/* Don't hardcode colors */
color: #2196F3;                      /* WRONG */
background: #F5F5F5;                 /* WRONG */

/* Don't hardcode border radius */
border-radius: 12px;                 /* WRONG */

/* Don't hardcode transitions */
transition: all 0.3s ease;           /* WRONG */
```

### ✅ DO

```css
/* Use correct CSS variables from design system */
color: var(--intently-blue);
background: var(--intently-bg-secondary);
box-shadow: var(--intently-shadow-md);

/* Use spacing variables */
padding: var(--intently-space-4xl) 0;
margin-bottom: var(--intently-space-3xl);
gap: var(--intently-space-xl);

/* Use color variables */
color: var(--intently-blue);
background: var(--intently-gray-100);

/* Use radius variables */
border-radius: var(--intently-radius-md);

/* Use transition variables */
transition: all var(--intently-transition-normal);
```

### Component Reuse

```astro
<!-- ❌ DON'T create inline styles for common patterns -->
<div class="cta-box">
  <h3>Download Now</h3>
  <p>Get started today</p>
  <a href="/download">Download</a>
</div>

<!-- ✅ DO use existing components -->
<CTABox
  title="Download Now"
  description="Get started today"
  buttonText="Download"
  buttonLink="/download"
/>
```

---

## Responsive Design

### Mobile-First Approach

Always write base styles for mobile, then enhance for larger screens:

```css
/* Base (Mobile) */
.element {
  font-size: 1rem;
  padding: var(--intently-space-md);
}

/* Tablet */
@media (min-width: 768px) {
  .element {
    font-size: 1.125rem;
    padding: var(--intently-space-lg);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .element {
    font-size: 1.25rem;
    padding: var(--intently-space-xl);
  }
}
```

### Touch Targets

```css
/* Minimum touch target size */
min-height: var(--touch-target-min);      /* 44px */

/* Comfortable touch target */
min-height: var(--touch-target-comfortable); /* 48px */
```

---

## Quick Reference

### Most Common Patterns

```css
/* Card Hover Effect */
.card:hover {
  border-color: var(--intently-blue);
  transform: translateY(-2px);
  box-shadow: var(--intently-shadow-md);
}

/* Button Hover */
.button:hover {
  transform: translateY(-2px);
  box-shadow: var(--intently-shadow-sm);
}

/* Section Heading */
h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: var(--intently-space-lg);
  color: var(--intently-text-primary);
}

@media (min-width: 768px) {
  h2 {
    font-size: 2rem;
  }
}

/* Section Description */
.description {
  color: var(--intently-text-secondary);
  line-height: 1.7;
  margin-bottom: var(--intently-space-xl);
}
```

---

## Maintenance

When adding new pages or components:

1. ✅ Use `PageHeader` component for all page headers
2. ✅ Use `CTABox` component for call-to-action sections
3. ✅ Use `ResourceCard` component for link cards
4. ✅ Always reference CSS variables from `design-system.css`
5. ✅ Never hardcode colors, spacing, or other design tokens
6. ✅ Follow mobile-first responsive patterns
7. ✅ Test on mobile, tablet, and desktop viewports

---

## Resources

- Design System Variables: `/src/styles/design-system.css`
- Global Styles: `/src/styles/global.css`
- UI Components: `/src/components/ui/`
- Marketing Components: `/src/components/marketing/`
- SEO Components: `/src/components/SEO/`

---

**Last Updated**: 2026-01-24

For questions or suggestions about the design system, please create an issue in the project repository.
