# Illustration System V1

## Approved Direction

The Knook wordmark is the illustration. The fixed `kn` and final `k` use Outfit Black; only the two `oo` positions transform. The approved palette is deep purple `#3B0764`, warm yellow `#EAB308`, near-black `#111111`, white, and off-white `#F5F4EF`.

No mascot heads, detached cartoon faces, gradients, or extra decorative colors belong in V1.

## Static Source Assets

The seven Figma Make states are extracted as standalone SVG source files under `Mobile/assets/illustrations/static/`:

| State | File | Product moment |
| --- | --- | --- |
| Sleepy | `knook-opening-splash.svg` | Opening splash |
| Binoculars | `knook-private-circle.svg` | Empty Private Circle |
| Hearts | `knook-daily-reveal.svg` | Daily reveal only |
| Cupid | `knook-anonymous-chat.svg` | Anonymous chat |
| Surprise | `knook-identity-reveal.svg` | Mutual identity reveal |
| Unhook | `knook-unhook.svg` | Unhook confirmation |
| Mirror | `knook-profile.svg` | Profile |

The TypeScript metadata registry is `Mobile/src/illustrations/knookStaticIllustrations.ts`. It deliberately stores filenames and product metadata rather than importing SVGs into application screens.

## Privacy Boundaries

- The hearts state appears only after an active daily reveal.
- Home and crush cards use only neutral Private Circle artwork.
- An illustration must not indicate reciprocity, `privacy_hold`, or `pending_reveal`.
- Identity-reveal artwork must not expose a name before mutual reveal.
- Unhook artwork and copy must remain quiet and must not identify the initiator.

## Runtime Status

An earlier approved branch already introduced `lottie-react-native` and generated motion data for these states. That native dependency remains in place. The static SVGs are design-source assets and future handoff material; they are not imported into screens by this guardrail pass.

Every simulator must run the same rebuilt Knook Dev binary. Metro can update JavaScript, but it cannot add the native `LottieAnimationView` component to an app binary built before Lottie was installed. An `Unimplemented component: <LottieAnimationView>` placeholder means the simulator needs the current native app reinstalled, not a Firestore or animation-data change.

## Future Lottie Candidates

Prioritize motion refinement for:

1. Opening splash
2. Daily reveal
3. Identity reveal
4. Unhook
5. Private Circle

Anonymous chat and Profile may remain static unless motion adds clear product value. Preserve Reduce Motion behavior and descriptive accessibility labels for every animated state.

## Source Note

The SVG geometry was extracted from the Figma Make `App.tsx` code supplied in the product handoff on 2026-07-13. The referenced `Knook_Product_Rules.docx` was not present in the repository; product rules were captured from the supplied handoff text.
