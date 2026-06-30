# Service Documentation

This document describes planned client and Firebase service boundaries. It does not define a traditional REST API.

## AuthService

### Purpose

Handles authentication state, sign-in, sign-out, and account bootstrap.

### Inputs

- Email, phone, OAuth provider, or auth credential
- Optional invite or waitlist token

### Outputs

- Authenticated Firebase user
- Auth state change events
- Initial user profile reference

### Errors

- Invalid credentials
- Account disabled
- Network unavailable
- Provider unavailable
- Missing profile after auth success

## UserService

### Purpose

Reads and updates user profile data.

### Inputs

- User ID
- Profile fields
- Privacy or discovery preferences

### Outputs

- User profile
- Update confirmation
- Public discovery profile where allowed

### Errors

- User not found
- Permission denied
- Invalid profile field
- Profile update conflict

## CrushService

### Purpose

Creates, withdraws, and evaluates expressions of interest between users.

### Inputs

- Current user ID
- Target user ID
- Crush action: create, withdraw

### Outputs

- Crush record
- Match result when mutual interest exists
- No-op result for duplicate actions

### Errors

- Target user not found
- Duplicate crush
- Permission denied
- User blocked or unavailable

## MatchService

### Purpose

Lists and manages active matches between users.

### Inputs

- Current user ID
- Match ID
- Match action: archive, block, unmatch

### Outputs

- Match list
- Match detail
- Updated match status

### Errors

- Match not found
- Current user is not a participant
- Match is blocked or archived
- Invalid state transition

## NotificationService

### Purpose

Manages push notification registration, preferences, and event-triggered notifications.

### Inputs

- Device token
- Notification preferences
- Event type
- Recipient user ID

### Outputs

- Registered device token
- Updated notification preferences
- Delivery attempt status

### Errors

- Invalid device token
- Permission denied
- User opted out
- Notification provider failure

## ChatService

### Purpose

Sends, reads, and marks messages within a match.

### Inputs

- Match ID
- Sender user ID
- Message body
- Message type
- Pagination cursor

### Outputs

- Message record
- Paginated message list
- Read receipt state

### Errors

- Match not found
- User is not a participant
- Message body invalid
- Match is blocked or archived
- Rate limit exceeded

