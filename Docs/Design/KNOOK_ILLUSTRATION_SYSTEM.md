# Knook Illustration System

## Source

The system is derived from the Figma Make `app.fsx` concept supplied by the product team. The fixed `kn` and `k` wordmark uses Outfit Black. Only the two `o` characters animate.

The React Native implementation lives in:

- `Mobile/src/components/illustrations/KnookIllustration.tsx`
- `Mobile/src/illustrations/knookOoAnimations.ts`

The animation runtime is `lottie-react-native`. Outfit is bundled locally through `@expo-google-fonts/outfit`; no font is downloaded at runtime.

The native launch screen is intentionally a plain Knook off-white. It hands off to the animated sleepy wordmark after the JavaScript bundle loads, without showing the former preview-provider artwork.

## State mapping

| State | Product moment | Motion |
| --- | --- | --- |
| `sleepy` | Opening splash | Quiet blink |
| `binoculars` | Empty private circle | Focus pulse |
| `hearts` | Active daily reveal | Match pop |
| `cupid` | Empty anonymous chat | Arrow sweep |
| `surprise` | Identity reveal | Eye pop |
| `unhook` | Unhook confirmation | Settle down |
| `mirror` | Profile | Mirror glint |

## Privacy boundary

The `hearts` state is restricted to the Chats experience after active matches are visible. It must not render on the Crushes screen or for a `pending_reveal` match. The private-circle binocular state remains neutral and cannot imply reciprocity.

## Accessibility

Each state has a descriptive accessibility label. When iOS or Android Reduce Motion is enabled, the component renders a representative still frame and disables autoplay and looping.

## Native build requirement

Lottie is a native dependency. After installing or upgrading it, regenerate/rebuild Knook Dev with:

```bash
cd /Users/Amoux/Documents/Knook/Mobile
APP_VARIANT=development AUTH_PROVIDER=firebase PRODUCT_DATA_PROVIDER=firebase npx expo run:ios
```

Metro reload alone is sufficient for later TypeScript or animation-data changes that do not change the installed Lottie package version.

## Figma and Lottie handoff

Future designer-produced Lottie JSON can replace one state at a time. Keep the animation canvas transparent, use a `120 x 80` composition, animate only the `oo` group, preserve the state key, and avoid embedding text or remote assets. This keeps the Outfit wordmark crisp and prevents font differences across platforms.
