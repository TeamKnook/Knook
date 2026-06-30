# Database

This document tracks Knook's planned Firebase database design. It should be updated whenever collections, documents, indexes, or security rules change.

## Current Status

The database has not been implemented yet.

## Candidate Platform

Firebase Firestore is the expected primary database because it works well with React Native, supports real-time sync, and integrates with Firebase Authentication and Security Rules.

## Design Goals

- Keep reads predictable and affordable.
- Model data around product screens and common queries.
- Avoid exposing private data through broad client queries.
- Design security rules alongside the schema.
- Add indexes intentionally when query patterns require them.

## Proposed Core Concepts

The final model is still to be defined. Candidate collections may include:

```text
users/
organizations/
projects/
memberships/
activity/
notifications/
```

These names are placeholders until product requirements are finalized.

## Security Rules

Security rules should enforce:

- Authenticated access where required
- Ownership and membership checks
- Field-level validation for user-writable documents
- Least-privilege access to private data

Rules should be tested before production use.

## Indexes

Firestore indexes should be documented here when added:

| Collection | Fields | Purpose |
| --- | --- | --- |
| TBD | TBD | TBD |

## Migration Notes

Firebase schema changes should be backwards-compatible where possible. Any one-time data migration should be documented with:

- Reason for migration
- Affected collections
- Script or process used
- Rollback plan

