# Agent guide

This repository is Trip Wardrobe (working name): a travel companion that keeps bookings, entry requirements,
weather, essentials and outfit plans for a trip in one place. Read these before making changes:

- `docs/product/plan.md`: what we're building and in what order
- `docs/product/feature-map.md`: features with stable IDs and phases; reference IDs in commits
- `docs/engineering/architecture.md`: stack, layout, principles and conventions

## Quality bar

- TypeScript in strict mode. No `any`; parse external data with Zod instead of casting.
- Business logic goes in `packages/core` as pure, unit-tested functions. Apps stay thin.
- Models return typed data validated against schemas; code renders what travelers read.
- Every AI feature has an eval; run it when you change a prompt.
- Styling comes from design tokens only. No literal colors in components.
- Store instants in UTC with the place's IANA time zone; show them in the place's local time.
- Emails, PDFs, web pages and photos are untrusted input. They become typed proposals a person reviews, never
  instructions, and calls that read them get no tools that change anything.
- Every entry requirement carries an official source URL and the date it was checked.
- Never store passport numbers.
- Never commit secrets or real trip data. Demo content and eval fixtures are fictional.
