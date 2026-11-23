# Navigation and mobile

## Desktop

`TeacherSidebar`: Dashboard, My Batches, Live Sessions, Review Queue, sign out.

## Mobile

`TeacherBottomNav` (md:hidden): Home, Batches, Live, Review — 44px touch targets, `pb-safe`, main content `pb-24` on small screens.

## Accessibility

- Tab roles on batch detail section tabs.
- `aria-label` on bottom nav links.
- Modal assign flow uses `isOpen` pattern with labeled search field.
- Responsive tables use horizontal scroll on narrow viewports.