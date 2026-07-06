# ADR-0001: Expo Development Build As Primary Local Runtime

## Status

Accepted

## Context

Knook began local review inside Expo Go while the Emergent-generated preview application was stabilized. As the app moves toward native capabilities and app-specific identifiers, Expo Go is no longer representative enough for primary local testing.

## Decision

Expo Go is no longer the primary Knook runtime. Knook uses Expo Development Build for local native development. Expo tooling is retained.

The development app identity is:

- `Knook Dev`
- `com.teamknook.knook.dev`
- `knook-dev`

## Consequences

- Native dependencies require rebuilding the development app.
- Local testing uses the Knook-owned app binary rather than Expo Go.
- Expo Continuous Native Generation remains the native project strategy for now.
- Firebase, Branch.io, notifications, RevenueCat, and production store setup remain future milestones.
