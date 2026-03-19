# Design System — Celljevity Longevity OS

## Product Context
- **What this is:** A GDPR-compliant healthcare platform for patient management with biomarker tracking, digital intake forms, service catalog, quote/invoice generation, and document vault
- **Who it's for:** Longevity clinics worldwide — four roles: Patient, Care Coordinator, Medical Provider, Super Admin
- **Space/industry:** Longevity medicine / healthtech. Peers: Fountain Life, Longevity AI, HolistiCare
- **Project type:** Web app / clinical dashboard
- **Languages:** English (primary), Chinese (planned)

## Aesthetic Direction
- **Direction:** Luxury/Refined — warmth over clinical coldness
- **Decoration level:** Intentional — subtle grain texture on surfaces, soft shadows. Not flat, not heavy.
- **Mood:** Quiet confidence. A clinic you'd trust with your life that doesn't feel like a hospital. Premium without being stuffy, warm without being casual.
- **Reference sites:** fountainlife.com (dark luxury — too heavy), longevity-ai.com (clean SaaS — too generic), holisticare.io (closest peer — professional but forgettable)

## Typography
- **Display/Hero:** Instrument Serif — elegant, sharp serifs for headlines. Category-breaking: every competitor uses safe sans-serifs. This says "we take this seriously" in a way grotesks can't.
- **Body:** DM Sans — clean, excellent readability, modern but not overused. Pairs well with Instrument Serif's sharpness.
- **UI/Labels:** DM Sans (weight 500–600)
- **Data/Tables:** Geist Mono — crisp for biomarker numbers, lab results, dashboards. Must use `font-variant-numeric: tabular-nums` for aligned columns.
- **Code:** Geist Mono
- **Loading:** Google Fonts — `https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&family=Geist+Mono:wght@400;500;600&display=swap`
- **Scale (modular 1.25):**
  - Hero: 48px / 3rem (Instrument Serif)
  - Page Title: 32px / 2rem (Instrument Serif)
  - Section Heading: 24px / 1.5rem (Instrument Serif)
  - Card Title: 18px / 1.125rem (DM Sans 600)
  - Body: 16px / 1rem (DM Sans 400)
  - UI Label: 14px / 0.875rem (DM Sans 500)
  - Overline/Badge: 12px / 0.75rem (DM Sans 600, uppercase, 0.08em tracking)
  - Caption: 11px / 0.6875rem (DM Sans 500)

## Color
- **Approach:** Restrained — 1 bold accent + warm neutrals. Everyone in longevity goes blue or teal. Deep rose is the differentiator — it signals warmth, vitality, life.
- **Primary:** #A81B4E (Deep Rose) — brand identity, CTAs, active states, links. Hover: #8E1641. Light: #F9E8EE
- **Secondary:** #1B3A4B (Dark Teal) — navigation, headers, secondary buttons. Grounds the rose with clinical authority. Light: #E4EDF1
- **Neutrals:** Warm grays
  - Background: #F8F6F4
  - Sunken/Muted: #F0EDEA
  - Card/Elevated: #FFFFFF
  - Border: #E5E0DB
  - Border Strong: #D0C9C2
  - Text Muted: #9B9590
  - Text Secondary: #6B6560
  - Text Primary: #2D2926
- **Semantic:**
  - Success: #2D7D46 (bg: #E8F5EC) — optimal biomarker ranges
  - Warning: #C4841D (bg: #FDF4E7) — needs attention
  - Error: #B82E2E (bg: #FCEAEA) — critical values
  - Info: #2B6CB0 (bg: #E6F0FA) — informational
- **Dark mode strategy:**
  - Background: #1A1816
  - Card: #252220
  - Elevated: #2D2A27
  - Primary shifts to #D4467A (lighter rose for dark surfaces, maintains vibrancy)
  - Secondary shifts to #234B60
  - Reduce saturation on semantic colors ~15%
  - Neutral text inverts: primary #F0EDEA, secondary #A8A29E, muted #78716C

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable — medical dashboards need breathing room to reduce cognitive fatigue
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(16px) lg(24px) xl(32px) 2xl(48px) 3xl(64px)

## Layout
- **Approach:** Grid-disciplined — data-heavy dashboard app requires clean columns and predictable alignment
- **Grid:** 12 columns. Breakpoints: sm(640px) md(768px) lg(1024px) xl(1280px)
- **Max content width:** 1280px
- **Border radius:**
  - sm: 4px (inputs, small elements)
  - md: 8px (cards, buttons, alerts)
  - lg: 12px (modals, large containers)
  - full: 9999px (avatars, badges, pills)

## Motion
- **Approach:** Minimal-functional — transitions that aid comprehension only. No bouncy animations. Healthcare = trust = stability.
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50–100ms) short(150–250ms) medium(250–400ms) long(400–700ms)
- **Guidelines:**
  - Button hover/focus: micro (background color transition)
  - Page transitions: short (opacity fade)
  - Modal enter/exit: medium (scale + opacity)
  - Data loading: use skeleton placeholders, not spinners
  - Never: spring/bounce, parallax scroll, decorative entrance animations

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-19 | Initial design system created | Created by /design-consultation based on competitive research (Fountain Life, Longevity AI, HolistiCare) and product positioning as a premium global longevity platform |
| 2026-03-19 | Deep rose (#A81B4E) as primary | Category-breaking choice: every competitor uses blue/teal. Rose signals vitality and warmth, evolved from existing #bc0051 |
| 2026-03-19 | Instrument Serif for display | Serif headlines are the single biggest visual differentiator available in this space. Premium positioning without stuffiness |
| 2026-03-19 | DM Sans over Inter for body | Inter is overused across web apps. DM Sans is equally readable but less generic |
| 2026-03-19 | Geist Mono for data | Excellent tabular-nums support for biomarker dashboards and lab results |
| 2026-03-19 | Warm gray neutrals | Warm undertones (#F8F6F4 base) feel inviting vs cold clinical whites. Reinforces the "not a hospital" positioning |
