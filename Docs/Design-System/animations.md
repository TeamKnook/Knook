# Animations

This document defines placeholder animation guidance for Knook.

## Principles

- Use motion to clarify state changes, not distract from them.
- Keep common transitions quick and predictable.
- Respect reduced motion settings.

## Durations

| Token | Value | Usage |
| --- | --- | --- |
| motion.fast | 120ms | Taps, toggles, small feedback |
| motion.base | 200ms | Screen elements and cards |
| motion.slow | 320ms | Larger transitions |

## Easing

| Token | Placeholder | Usage |
| --- | --- | --- |
| motion.ease.standard | TBD | General movement |
| motion.ease.enter | TBD | Elements entering |
| motion.ease.exit | TBD | Elements leaving |

## Candidate Lottie Uses

- Onboarding moments
- Empty states
- Match celebration
- Loading states only when brief and controlled

## Accessibility

- Provide reduced-motion alternatives.
- Avoid flashing or rapid repeated motion.
- Do not block core workflows behind decorative animation.

