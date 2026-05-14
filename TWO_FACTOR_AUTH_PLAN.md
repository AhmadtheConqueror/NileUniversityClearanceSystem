# Two-Factor Authentication Rollout Plan

## Goal

Add email-based 2FA to the clearance login flow.

The intended flow is:

1. User enters their matric/staff ID and password.
2. Backend checks the ID against the configured acceptable IDs/rules.
3. For the first few successful logins, access continues normally.
4. Starting at the configured threshold, the user must provide their school Outlook email.
5. Backend sends a one-time password (OTP) to that email through Microsoft Graph.
6. Access is granted only after the OTP is verified.

## Current System Shape

- Frontend: React + Vite login page at `src/pages/LoginPage.jsx`.
- Backend: Flask API in `app.py`.
- Database: SQLite with SQLAlchemy models in `models.py`.
- Existing login route: `POST /api/login`.
- Existing acceptable ID logic:
  - Student IDs are validated by `get_eligibility(user_id)`.
  - Staff IDs are mapped in `STAFF_DEPT_MAPPING`.

## Microsoft Setup

Create an app registration in Microsoft Entra ID and use Microsoft Graph to send OTP emails.

Required Microsoft configuration:

1. Register an application in Microsoft Entra admin center.
2. Create a client secret under the app registration's certificates/secrets area.
3. Add Microsoft Graph application permission: `Mail.Send`.
4. Grant admin consent for the tenant.
5. Choose a sender mailbox, for example `clearance-otp@school.edu`.
6. Restrict the app's mailbox access in Exchange Online where possible.

Useful official docs:

- Microsoft identity client credentials flow: https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow
- Microsoft Graph `sendMail`: https://learn.microsoft.com/en-us/graph/api/user-sendmail
- Microsoft Graph permissions reference for `Mail.Send`: https://learn.microsoft.com/en-us/graph/permissions-reference
- MSAL/client application secret guidance: https://learn.microsoft.com/en-us/entra/msal/msal-client-applications
- Exchange app access scoping guidance: https://learn.microsoft.com/en-us/exchange/permissions-exo/application-access-policies

## Environment Variables

Add these to the backend environment before using real Microsoft email delivery:

```env
MICROSOFT_TENANT_ID=your-tenant-id
MICROSOFT_CLIENT_ID=your-app-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_SENDER_USER=clearance-otp@school.edu
SCHOOL_EMAIL_DOMAINS=school.edu,students.school.edu
TWO_FACTOR_LOGIN_THRESHOLD=4
OTP_TTL_MINUTES=10
OTP_MAX_ATTEMPTS=5
```

Notes:

- Keep `MICROSOFT_CLIENT_SECRET` only on the Flask server. Never expose it in React.
- `SCHOOL_EMAIL_DOMAINS` should be replaced with the actual Outlook-backed school domain(s).
- With `TWO_FACTOR_LOGIN_THRESHOLD=4`, the first 3 successful logins are normal; the 4th and later require OTP.
- If Microsoft variables are missing in local development, the backend can print the OTP to the Flask console for testing.

## Backend Changes

Models:

- Add `school_email` to `User`.
- Add `successful_login_count` to `User`.
- Add a `TwoFactorChallenge` table:
  - `challenge_token`
  - `user_id`
  - `email`
  - `otp_hash`
  - `expires_at`
  - `attempts`
  - `consumed`
  - `created_at`

Routes:

- Update `POST /api/login`.
  - Validate credentials.
  - If below threshold, return normal login response.
  - If at/above threshold and school email is missing, return `school_email_required`.
  - If school email is provided or already stored, create OTP challenge and return `otp_required`.
- Add `POST /api/login/verify-otp`.
  - Validate challenge token.
  - Validate OTP, expiry, attempt count, and consumed state.
  - Return the same login payload as normal login only after successful OTP verification.

Security:

- Store only hashed OTP values.
- Expire OTPs quickly.
- Limit OTP attempts.
- Consume OTP after one successful use.
- Keep Microsoft credentials server-side.
- In a later pass, replace plain text passwords with password hashes.

## Frontend Changes

Update `src/pages/LoginPage.jsx` to support stages:

1. Credentials stage: user ID and password.
2. School email stage: email input shown only when backend requires it.
3. OTP stage: six-digit code input after the email is sent.

The frontend should not generate OTPs and should not call Microsoft Graph directly.

## Implementation Order

1. Add the database fields and `TwoFactorChallenge` model.
2. Add backend helpers for:
   - acceptable ID validation
   - login payload formatting
   - OTP generation/hash/check
   - Microsoft Graph token request
   - Microsoft Graph `sendMail`
3. Update `/api/login`.
4. Add `/api/login/verify-otp`.
5. Update the React login page.
6. Run backend syntax checks and frontend build.
7. Configure Microsoft Entra credentials and test real Outlook delivery.

## Test Cases

- Invalid ID is rejected.
- Valid ID and wrong password is rejected.
- Valid ID below threshold logs in normally.
- Valid ID at threshold asks for school email.
- Invalid school email domain is rejected.
- Valid school email creates OTP challenge.
- Wrong OTP increments attempts and rejects access.
- Expired OTP rejects access.
- Correct OTP returns normal login payload and marks challenge consumed.
- Reusing a consumed OTP is rejected.
