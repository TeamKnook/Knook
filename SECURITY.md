# Security Policy

## Supported Versions

Knook is pre-release. Supported versions will be defined once release channels exist.

| Version | Supported |
| --- | --- |
| Pre-release | Yes |

## Reporting a Vulnerability

Do not open public issues for security vulnerabilities.

Send reports to:

```text
SECURITY_CONTACT_TBD
```

Include:

- A clear description of the vulnerability
- Steps to reproduce
- Impact and affected data or systems
- Screenshots, logs, or proof of concept if safe to share

## Response Expectations

Target response times will be finalized before production launch.

| Severity | Target First Response |
| --- | --- |
| Critical | TBD |
| High | TBD |
| Medium | TBD |
| Low | TBD |

## Secret Handling

- Never commit API keys, service account files, signing keys, or production credentials.
- Use `.env.example` for placeholders only.
- Rotate exposed credentials immediately.
- Prefer Firebase and platform-managed secret stores for deployed environments.

