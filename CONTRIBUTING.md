# Contributing

Thanks for helping build Knook. This project should stay easy to understand, easy to run, and safe to change.

## Principles

- Keep changes focused and reviewable.
- Prefer clear names and simple structure over clever abstractions.
- Document product, architecture, and database decisions as they are made.
- Do not commit secrets, local credentials, generated build artifacts, or private Firebase keys.

## Branching

Use short, descriptive branch names:

```text
feature/mobile-auth
fix/firestore-rule-validation
docs/product-roadmap
chore/dev-environment
```

## Commits

Use concise commit messages that explain the intent:

```text
Add Firebase environment template
Document initial database model
Set up React Native linting
```

## Pull Requests

Before opening a pull request:

- Confirm the app or affected tooling runs locally.
- Run linting, formatting, and tests when available.
- Update documentation when behavior, architecture, setup, or data models change.
- Include screenshots or screen recordings for visible mobile UI changes.

## Code Style

The project will use:

- TypeScript for typed application and backend code
- ESLint for code quality checks
- Prettier for formatting

Project-specific commands will be added after the mobile and backend packages are initialized.

## Documentation

Documentation should live in the most relevant place:

- Root docs for project-wide guidance
- `Docs/Architecture/` for system design notes
- `Docs/Database/` for schema and rules notes
- `Docs/API/` for backend and integration contracts
- `Docs/Product/` for product requirements and decisions
- `Docs/Meeting Notes/` for dated working notes

