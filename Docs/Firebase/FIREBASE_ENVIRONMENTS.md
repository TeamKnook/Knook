# Firebase Environments

Knook uses three named Firebase environments. Only `development` is intended to become operational in this milestone.

## Environment Matrix

| Environment | Firebase project convention | iOS bundle ID | Android package | Display name |
| --- | --- | --- | --- | --- |
| Development | `knook-e2c74` currently; future convention may be `knook-development` | `com.teamknook.knook.dev` | `com.teamknook.knook.dev` | `Knook Dev` |
| Preview | `knook-preview` | `com.teamknook.knook.preview` | `com.teamknook.knook.preview` | `Knook Preview` |
| Production | `knook-production` | `com.teamknook.knook` | `com.teamknook.knook` | `Knook` |

## Control Rules

| Capability | Development | Preview | Production |
| --- | --- | --- | --- |
| Firebase test phone numbers | Allowed | Allowed only for QA-controlled accounts | Not allowed for user-facing flows |
| Mock contacts | Allowed only with explicit dev flags | Not allowed unless behind internal QA build controls | Never |
| Manual reveal trigger | Allowed only with development build and demo flag | Not allowed | Never |
| Verbose diagnostics | Allowed with redaction | Limited and redacted | Minimal and redacted |
| Firebase emulators | Allowed | Allowed for CI/QA only when explicitly configured | Never |
| Preview FastAPI/MongoDB | Temporary local-only bridge | Not a production dependency | Never |
| Development controls | Allowed only in `APP_VARIANT=development` | Must be hidden | Must be hidden |

## Repository Configuration Policy

- Real Firebase client config files are not committed by default.
- Local files should live under `Mobile/firebase/<environment>/`.
- `GoogleService-Info.plist` and `google-services.json` are ignored by git.
- Example files and documentation may be committed.
- Service-account keys must never be committed.

## Variant Selection

Use explicit environment variables:

```env
APP_VARIANT=development
AUTH_PROVIDER=firebase
FIREBASE_AUTH_TARGET=development
```

`AUTH_PROVIDER=preview` remains available only as a reversible fallback while the FastAPI preview backend is still present.

## Production Safety Rules

- Production must never reference localhost Firebase emulators.
- Production must never show demo OTP helper text.
- Production must never show manual reveal controls.
- Production must never use mock contacts.
- Production must never accept preview JWTs.
