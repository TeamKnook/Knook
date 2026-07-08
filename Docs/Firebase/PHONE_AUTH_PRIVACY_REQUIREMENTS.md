# Phone Auth Privacy Requirements

Firebase Phone Authentication processes the user's own account phone number. This is separate from Knook's contact privacy promise.

Knook must not claim that Firebase Phone Auth keeps the account phone number only on device.

## User Consent

Before launch, the app and privacy policy must explain:

- Phone number is used to verify account ownership.
- Firebase/Google processes the phone number for authentication.
- SMS or carrier verification may be used.
- Standard carrier messaging rates may apply.

## Contact Privacy Separation

Knook's product rule remains unchanged:

- Full contacts must not be uploaded.
- Raw contact names remain on device.
- Contact phone numbers should be normalized and hashed for matching.

Account phone authentication is a separate identity/security flow.

## Launch Requirements

- Privacy policy disclosure for Firebase Phone Auth.
- Account deletion process.
- Phone-number change policy.
- Abuse prevention and rate-limiting plan.
- SMS-region policy.
- Test-number management policy.
- Real-device verification plan.
- Support path for users who cannot receive SMS.

## Test Numbers

Development Firebase test numbers may be used only in development. Test codes must not be committed, logged, or shown in preview/production builds.
