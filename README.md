# Nile University Online Clearance System

This is a simple web-based clearance system for Nile University. It supports student graduation clearance, staff request approval, and exiting staff clearance.

The app uses a layered web architecture:

- Frontend: React + Vite
- Backend: Flask
- Data access: Flask-SQLAlchemy
- Database: SQLite
- Email/OTP: SMTP

## Main Features

- Student login and auto-registration for eligible student IDs.
- Student profile setup with name, level, and department.
- Sequential student clearance stages.
- Staff approver dashboard for approving or rejecting requests.
- Exiting staff clearance for general staff IDs like `STF/001`.
- OTP email verification after the configured login threshold.
- Login rate limiting after 5 failed attempts.
- Final clearance certificate view and print option.

## Accepted Login IDs

### Student IDs

Students can log in with eligible 2020, 2021, or 2022 IDs.

Examples:

```text
20201234
20211234
20221234
```

New valid students are created automatically on first login. The password used on first login becomes their password for later logins.

### Staff Approver Profiles

These staff approver profiles are created by `seed_db.py`. They all use:

```text
Password: password
```

| Staff ID | Profile | Dashboard Purpose |
| --- | --- | --- |
| `STF/BURSARY` | Bursary Staff | Bursary clearance approvals |
| `STF/HOSTEL` | Hostel Staff | Hostel clearance approvals |
| `STF/LIBRARY` | Library Staff | Library clearance approvals |
| `STF/SUBS` | Student Services | Student Services approvals |
| `STF/HONORIS` | Honoris Staff | Honoris Certification approvals |
| `STF/DEPT` | Department Staff | Department approvals |
| `STF/ACADEMIC` | Academic Staff | Academic Division approvals |
| `STF/HOD` | Head of Department | HOD approvals |
| `STF/HR` | Human Resources | HR approvals |
| `STF/SECURITY` | Security Office | Security approvals |
| `STF/FACILITY` | Facility Manager | Facility approvals |
| `STF/IT` | IT Unit | IT approvals |
| `STF/FINANCE` | Finance Office | Finance approvals |

Use these IDs from the **Staff Portal** login.

### Exiting Staff IDs

General staff members who are leaving the institution can use numeric IDs such as:

```text
STF/001
STF/002
STF/123
```

Use these IDs from the **Exiting Staff Login** page. They are not office approver accounts. On first login, the account is created automatically, and the password entered becomes the staff member's password.

## Setup Instructions

### 1. Install Python Dependencies

From the project folder:

```bash
python -m pip install -r requirements.txt
```

### 2. Install Frontend Dependencies

```bash
npm install
```

On Windows PowerShell, if `npm` is blocked by script policy, use:

```bash
npm.cmd install
```

### 3. Create or Update `.env`

Create a `.env` file in the project root. Use your own SMTP details:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-app-password
SMTP_SENDER_NAME=Clearance System
SMTP_SENDER_EMAIL=your-email@example.com
SMTP_USE_TLS=true
SMTP_USE_SSL=false
SMTP_TIMEOUT_SECONDS=20

ALLOW_OTP_CONSOLE_FALLBACK=true
TWO_FACTOR_LOGIN_THRESHOLD=4
OTP_TTL_MINUTES=10
OTP_MAX_ATTEMPTS=5

LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCKOUT_MINUTES=15
```

For Gmail or Outlook, use an app password instead of your normal email password.

While testing, keep:

```env
ALLOW_OTP_CONSOLE_FALLBACK=true
```

This lets the system show or log the OTP if SMTP email fails. In production, set it to `false`.

### 4. Seed Staff Approver Accounts

Run this only when you want to reset the database and recreate the default staff profiles:

```bash
python seed_db.py
```

Important: `seed_db.py` drops the existing database tables before creating the default staff accounts. Do not run it if you want to keep existing student or staff clearance data.

### 5. Run the Flask Backend

```bash
python app.py
```

Expected result:

```text
Running on http://127.0.0.1:5000
```

### 6. Run the React Frontend

Open another terminal:

```bash
npm run dev
```

Or on Windows PowerShell:

```bash
npm.cmd run dev
```

Expected result:

```text
Local: http://localhost:5173/
```

Open the frontend URL in your browser.

## Expected App Outcomes

### Student Flow

1. Open `http://localhost:5173/`.
2. Choose **Student Clearance**.
3. Log in with an eligible student ID, for example `NU/20/CSC/1234`.
4. Complete the profile setup form.
5. Request clearance from the first unlocked office.
6. Wait for the staff office to approve or reject the request.
7. After approval, the next clearance stage unlocks.
8. After all stages are approved, the final certificate becomes available.

### Staff Approver Flow

1. Choose **Access Staff Portal**.
2. Log in with an approver ID such as `STF/BURSARY`.
3. Use password `password` if the database was seeded.
4. View requests assigned to that staff office.
5. Approve a request to unlock the user's next stage.
6. Reject a request with a comment if the user needs to correct something.

Staff approver accounts should not create exiting-staff clearance requests. The dashboard filters out old office-account clearance records.

### Exiting Staff Flow

1. Choose **Exiting Staff**.
2. Log in with a numeric staff ID such as `STF/001`.
3. Complete the name setup if it is the first login.
4. Submit each exit clearance stage in order.
5. Schedule the exit interview when the interview stage becomes available.

## Security and Login Rules

- OTP is required after the configured login threshold.
- OTP expires after `OTP_TTL_MINUTES`.
- OTP verification allows up to `OTP_MAX_ATTEMPTS` wrong attempts.
- Normal login allows up to `LOGIN_MAX_ATTEMPTS` failed attempts.
- After 5 failed login attempts, the user is asked to try again later.
- Default lockout duration is 15 minutes.

## Optional HTTPS

For local testing, Flask can run with a temporary HTTPS certificate:

```bash
flask run --cert=adhoc
```

For real deployment, use a reverse proxy such as Nginx or Apache with a valid SSL certificate, for example from Let's Encrypt.

## Useful Files

| File | Purpose |
| --- | --- |
| `app.py` | Flask backend routes and business logic |
| `models.py` | Database models |
| `seed_db.py` | Creates default staff approver profiles |
| `services/email_service.py` | SMTP OTP email sending |
| `src/pages/LoginPage.jsx` | Login and OTP frontend |
| `src/pages/StudentDashboard.jsx` | Student dashboard |
| `src/pages/StaffDashboard.jsx` | Staff approver dashboard |
| `src/pages/StaffClearanceDashboard.jsx` | Exiting staff dashboard |
| `CHAPTER_FOUR_IMPLEMENTATION_AND_DISCUSSION.md` | Project documentation chapter |
