# Components

This document tracks expected UI components before implementation.

## Foundation Components

| Component | Purpose | Notes |
| --- | --- | --- |
| Button | Primary, secondary, and destructive actions | Include disabled and loading states |
| TextInput | Forms and profile editing | Include validation and helper text |
| Avatar | User identity | Support initials and image fallback |
| Card | Group related profile or match content | Keep layout simple |
| ListRow | Settings, matches, and messages | Support leading and trailing accessories |
| Modal | Focused decisions and confirmations | Avoid for long workflows |
| Toast | Lightweight feedback | Do not use for critical errors |

## Product Components

| Component | Purpose | Notes |
| --- | --- | --- |
| ProfilePreview | Shows public user info | Must handle missing photos |
| CrushAction | Express interest | Requires clear feedback |
| MatchCard | Active match summary | Include latest activity |
| MessageBubble | Chat messages | Include sent, delivered, read states if supported |
| EmptyState | No content states | Should give a useful next action |

## States

Every component should define:

- Default
- Loading
- Empty
- Error
- Disabled where interactive

