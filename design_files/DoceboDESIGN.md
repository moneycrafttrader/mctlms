# What is a Learning Management System, Examples and Types in 2026

## Mission
Create implementation-ready, token-driven UI guidance for What is a Learning Management System, Examples and Types in 2026 that is optimized for consistency, accessibility, and fast delivery across marketing site.

## Brand
- Product/brand: What is a Learning Management System, Examples and Types in 2026
- URL: https://www.docebo.com/learning-network/blog/what-is-a-learning-management-system-best-lms-examples-use-cases/
- Audience: buyers, teams, and decision-makers
- Product surface: marketing site

## Style Foundations
- Visual style: clean, functional, implementation-oriented
- Main font style: `font.family.primary=Figtree`, `font.family.stack=Figtree, sans-serif`, `font.size.base=16px`, `font.weight.base=400`, `font.lineHeight.base=24px`
- Typography scale: `font.size.xs=13px`, `font.size.sm=14px`, `font.size.md=16px`, `font.size.lg=20px`, `font.size.xl=24px`, `font.size.2xl=48px`
- Color palette: `color.text.primary=#2a2923`, `color.text.secondary=#f6f5f2`, `color.text.tertiary=#002b80`, `color.text.inverse=#ffffff`, `color.surface.base=#000000`, `color.surface.muted=#ece9e1`, `color.surface.strong=#7e2ee9`
- Spacing scale: `space.1=8px`, `space.2=12px`, `space.3=16px`, `space.4=20px`, `space.5=24px`, `space.6=128px`, `space.7=184.4px`
- Radius/shadow/motion tokens: `radius.xs=24px`, `radius.sm=40px` | `motion.duration.instant=200ms`, `motion.duration.fast=250ms`, `motion.duration.normal=300ms`, `motion.duration.slow=500ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
Concise, confident, implementation-focused.

## Rules: Do
- Use semantic tokens, not raw hex values, in component guidance.
- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error.
- Component behavior should specify responsive and edge-case handling.
- Interactive components must document keyboard, pointer, and touch behavior.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.
- Do not ship component guidance without explicit state rules.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and semantic tokens.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Required Output Structure
- Context and goals.
- Design tokens and foundations.
- Component-level rules (anatomy, variants, states, responsive behavior).
- Accessibility requirements and testable acceptance criteria.
- Content and tone standards with examples.
- Anti-patterns and prohibited implementations.
- QA checklist.

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.
- Include known page component density: links (217), lists (57), navigation (25), buttons (18), tables (2), cards (1).


## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.
