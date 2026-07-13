# Firestore Console Setup

Firebase project: `knook-e2c74`

Firestore must be enabled by a human in the Firebase Console before relying on the development project.

## Steps

1. Open Firebase Console.
2. Select project `knook-e2c74`.
3. Open Firestore Database.
4. Create a database if one does not already exist.
5. Use development/test setup only for initial local validation.
6. Select the closest appropriate development region and record it below.
7. Deploy the repository Firestore rules before storing real user profile data.

## Region

Selected development region: `TBD by human console setup`

Do not invent or change this value in code until the Console selection is known.

## Required Rule Posture

The repository rules allow users to read and write only their own `users/{uid}` profile document. All other collections are denied until their dedicated migration milestones.
