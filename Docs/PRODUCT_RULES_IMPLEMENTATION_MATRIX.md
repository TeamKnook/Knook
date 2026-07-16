# Product Rules Implementation Matrix

This matrix accompanies `Docs/PRODUCT_RULES_V1_1.md`. It records the current boundary without treating temporary preview behavior as product truth.

| Area | Status | Current evidence or gap | Next owner |
| --- | --- | --- | --- |
| Firebase phone identity | Enforced | Firebase Phone Auth and UID-backed account mapping are active in development. | Auth maintenance |
| One phone, one account | Enforced | Verified Firebase phone claim maps to one account. | Auth maintenance |
| Private Firestore profiles | Enforced | Owner-only profile reads/writes and rules exist. | Profile maintenance |
| No partial onboarding save | Enforced | Profile writes occur at final confirmation. | Profile maintenance |
| No photos / public profiles | Enforced | V1 profile schema has no photo or public-profile collection. | Product guardrail |
| Home hides reciprocity | Enforced by current guardrail | Home must render every non-expired crush identically and show no matched count. | Home tests |
| Pre-reveal match invisibility | Enforced | Pending matches are hidden from client-visible match lists and covered by tests. | Matching tests |
| Anonymous identity | Enforced | Anonymous labels remain until mutual reveal. | Chat tests |
| One-sided reveal privacy | Enforced | First names unlock only after both users reveal. | Reveal tests |
| Unhook and stale access | Enforced | Access is revoked for both users; stale access is rejected. | Chat tests |
| Development-control gating | Enforced | Demo controls and mock contacts are development-only. | Variant tests |
| Raw-contact privacy | Guardrail | Mock contacts are current development input. Production contacts and hashing are not implemented. | Contacts milestone |
| Minimum three active crushes | Implemented; deployment pending | Cloud Functions count both users' active crushes during reciprocal detection and again at reveal. | Blaze deployment verification |
| Free limit of five | Implemented; deployment pending | Server-authoritative crush requests enforce five active crushes without trusting the client. | Blaze deployment verification |
| `privacy_hold` state | Implemented; deployment pending | Reciprocal matches remain hidden on `privacy_hold` until both users meet the threshold. | Blaze deployment verification |
| 6:30 PM authoritative schedule | Implemented; deployment pending | The scheduled Function runs at 6:30 PM IST and re-checks privacy eligibility transactionally. | Blaze deployment verification |
| Character-name library | Deferred | `Mystery Match` remains the safe fallback. | Character-name milestone |
| 48-hour progress UI | Partial | Backend expiry behavior exists; final progress treatment needs product verification. | Chat milestone |
| Real contact picker and hashing | Deferred | No production contact upload or matching path is shipped. | Contacts milestone |
| Waitlist and invites | Deferred | No production access gate. | Waitlist milestone |
| Notifications | Deferred | No V1 push policy is implemented. | Notifications milestone |
| Payments and Premium | Deferred | No real monetization. | Later milestone |
| Screenshot protection | Deferred | Requires real-device feasibility work. | Native investigation |
| Account deletion | Required before launch | Sign-out exists; complete irreversible deletion remains pending. | Account milestone |
| Static illustration sources | Enforced | Seven approved SVG states are versioned as design-source assets. | Design maintenance |
| Lottie runtime | Implemented earlier | Native Lottie requires the same rebuilt Knook Dev binary on every simulator. | Native build maintenance |

## Scope Rule

Documentation may describe future behavior, but only deployed code, rules, backend authority, and tests may claim it is operational. This branch includes the authoritative match and reveal transitions; they remain deployment-pending until the Firebase project is on Blaze and the Functions are deployed. `privacy_hold` must never be exposed in user-facing clients.
