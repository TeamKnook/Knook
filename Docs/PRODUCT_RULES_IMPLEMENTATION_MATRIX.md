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
| Minimum three active crushes | Not implemented | `privacy_hold` and reveal-time eligibility re-check require authoritative Firebase logic. | Private Circle milestone |
| Free limit of five | Not implemented | Current UI/backend limits do not yet represent the approved free plan. | Private Circle milestone |
| `privacy_hold` state | Not implemented | Current match model predates the V1.1 state machine. | Matching milestone |
| 6:30 PM authoritative schedule | Partially implemented | Development reveal exists; production scheduler and V1.1 re-check remain pending. | Cloud Functions milestone |
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

Documentation may describe future behavior, but only a dedicated implementation branch may claim it is shipped. In particular, do not expose `privacy_hold` to clients or add a partial three-crush check in UI without the authoritative match and reveal transitions.
