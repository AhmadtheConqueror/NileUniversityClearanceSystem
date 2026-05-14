# CHAPTER FOUR

# IMPLEMENTATION AND DISCUSSION

## Introduction

This chapter presents the implementation and discussion of the Nile University Online Clearance System. The system was developed to reduce the manual effort involved in student graduation clearance and exiting staff clearance by providing a web-based platform where users can log in, submit clearance requests, track approval progress, and receive final clearance confirmation after all required stages have been completed.

The implemented system follows a layered web architecture. The frontend was developed with React and Vite, while the backend application layer was implemented with Flask. SQLAlchemy provides the data access layer, and SQLite was used as the database during development because it is lightweight, simple to configure, and suitable for academic project deployment and testing. The browser still communicates with the Flask server over HTTP, but the internal organization of the system is better described using layers: presentation, application logic, data access, and database. The backend exposes REST API endpoints that allow the frontend to authenticate users, retrieve clearance status, submit clearance requests, schedule appointments, and allow staff officers to approve or reject requests. The system also includes email-based one-time password verification through SMTP for additional login security after a configured number of successful logins.

The major users of the system are students, active staff approvers, and exiting staff members. Students use the platform to complete graduation clearance across departments such as Bursary, Hostel, Library, Student Services, Honoris Certification, Department, and Academic Division. Active staff members use the staff portal to review requests submitted to their offices and either approve or reject them with comments. Exiting staff members use a separate staff clearance flow to complete institutional exit requirements such as handover, return of identity cards, return of equipment, facility clearance, finance clearance, and exit interview scheduling.

The implementation emphasizes sequential clearance. A user cannot request clearance from a later office until the previous stage has been approved. This design reflects the real-world clearance process where each office must confirm completion before the next office becomes available.

## 4.1 System Requirement for Development

The system requirements describe the hardware, software, development tools, runtime environment, and configuration values needed to build, run, and test the system successfully.

### Hardware Requirements

The following hardware configuration is sufficient for development and testing:

| Component | Minimum Requirement | Recommended Requirement |
| --- | --- | --- |
| Processor | Dual-core processor | Core i3/i5 or higher |
| RAM | 4 GB | 8 GB or higher |
| Storage | 1 GB free space | 5 GB free space or higher |
| Network | Localhost access | Stable internet connection for SMTP email testing |
| Display | 1366 x 768 resolution | 1920 x 1080 resolution or higher |

The application can run locally on a single development machine because the backend server, frontend development server, and SQLite database are all lightweight.

### Software Requirements

| Software | Purpose |
| --- | --- |
| Windows, Linux, or macOS | Operating system for development and deployment |
| Python 3 | Runs the Flask backend |
| Node.js and npm | Runs the React/Vite frontend |
| Flask | Backend web framework |
| Flask-CORS | Allows frontend requests to reach the backend API |
| Flask-SQLAlchemy | Object-relational mapping for database operations |
| SQLite | Local relational database |
| React | Frontend user interface framework |
| Vite | Frontend build and development server |
| Tailwind CSS classes | Styling and layout of the user interface |
| Lucide React | Icons used in dashboard buttons and interface elements |
| SMTP email provider | Sends OTP verification messages |

### Development Dependencies

The backend dependencies are defined in `requirements.txt`. The key packages include:

| Package | Use |
| --- | --- |
| Flask | Defines API routes and handles HTTP requests |
| Flask-SQLAlchemy | Manages database models and queries |
| Flask-CORS | Enables communication between React and Flask during development |
| python-dotenv | Loads environment variables from `.env` |
| Werkzeug | Provides password hashing used for OTP verification |
| requests | Supports backend verification scripts |

The frontend dependencies are defined in `package.json`. The key packages include:

| Package | Use |
| --- | --- |
| React and React DOM | Build and render the frontend interface |
| react-router-dom | Handles page routing between login, dashboard, and certificate pages |
| lucide-react | Provides interface icons |
| axios/fetch | Supports API communication |
| jsPDF | Supports document/PDF-related frontend functionality |
| Vite | Provides fast development server and production build support |

### Environment Configuration

The system uses environment variables to control the frontend API target and SMTP configuration. The frontend can use `VITE_CLEARANCE_API_BASE_URL` to point to the Flask backend. If this value is not provided, the frontend defaults to `http://127.0.0.1:5000`.

The backend email verification feature depends on SMTP values such as:

| Variable | Purpose |
| --- | --- |
| `SMTP_HOST` | SMTP server hostname, for example `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port, commonly `587` for TLS or `465` for SSL |
| `SMTP_USERNAME` | SMTP account username |
| `SMTP_PASSWORD` | SMTP password or app password |
| `SMTP_SENDER_NAME` | Display name shown to email recipients |
| `SMTP_SENDER_EMAIL` | Sender email address |
| `SMTP_USE_TLS` | Enables STARTTLS when using port 587 |
| `SMTP_USE_SSL` | Enables SSL connection when using port 465 |
| `SMTP_TIMEOUT_SECONDS` | Maximum time allowed for SMTP connection |
| `TWO_FACTOR_LOGIN_THRESHOLD` | Number of successful logins before OTP is required |
| `OTP_TTL_MINUTES` | Number of minutes before OTP expiry |
| `OTP_MAX_ATTEMPTS` | Maximum wrong OTP attempts before invalidation |
| `LOGIN_MAX_ATTEMPTS` | Maximum failed login attempts before temporary lockout |
| `LOGIN_LOCKOUT_MINUTES` | Number of minutes a user must wait after too many failed login attempts |
| `ALLOW_OTP_CONSOLE_FALLBACK` | Allows OTP to be shown in development if SMTP fails |

For security, real SMTP passwords should not be written into documentation or committed to a public repository. For providers such as Gmail and Outlook, an application password should be used instead of the normal email account password.

### System Architecture

The system is implemented using a layered web architecture. Although the frontend and backend communicate in a client-server manner, the project structure is best explained through four layers:

| Layer | Implementation | Description |
| --- | --- | --- |
| Presentation layer | React components in `src/pages` | Handles login screens, dashboards, request actions, certificate view, and user feedback |
| Application/business logic layer | Flask routes and helper functions in `app.py` | Processes authentication, rate limiting, clearance workflow rules, approvals, rejections, OTP challenges, and profile updates |
| Data access layer | SQLAlchemy models and database session in `models.py` | Provides object-based access to users, clearance requests, and OTP challenge records |
| Database layer | SQLite database file | Stores users, clearance stages, request statuses, OTP challenges, comments, appointment dates, and login-related data |

This architecture separates interface logic from business rules and persistent storage. The frontend is responsible for displaying pages and collecting user input. The Flask application layer validates requests and enforces clearance rules. The SQLAlchemy data access layer translates Python model operations into database operations, while SQLite stores the actual records.

## 4.2 System Menus Implementation

The system menus and interfaces were implemented as React pages. Each page is designed for a particular user role or workflow. The frontend uses React Router to map URLs to pages and uses browser storage to preserve authenticated session information.

### Landing Page

The landing page is the first interface displayed to users. It presents the system as the Nile University Online Clearance System and provides three major navigation options:

| Option | Target User | Route |
| --- | --- | --- |
| Student Clearance | Graduating students | `/login?role=student` |
| Exiting Staff | Staff leaving the institution | `/login?role=staff-clearance` |
| Staff Portal | Active staff approvers | `/login?role=staff` |

This menu separates the main user groups before authentication. By doing this, each user enters the correct workflow and sees a dashboard that matches their clearance responsibility.

### Login Interface

The login interface handles role-based authentication. Students sign in using a matric number, while staff members sign in using a staff ID. The system supports both direct login and two-factor verification.

The login process follows these steps:

1. The user enters an ID and password.
2. The frontend sends the credentials to `/api/login`.
3. The backend normalizes the ID and checks whether the user is allowed to access the system.
4. If the user is valid and has not reached the OTP threshold, the backend returns a successful login response.
5. If OTP verification is required, the backend requests an email address or sends a verification code to the stored email address.
6. The user enters the six-digit OTP.
7. The frontend submits the OTP to `/api/login/verify-otp`.
8. If the OTP is valid, the user is redirected to the appropriate dashboard.

The login endpoint also applies rate limiting. After five failed login attempts for the same user ID from the same client, the system temporarily blocks further attempts and asks the user to try again later. The login page includes loading indicators, password visibility toggle, error messages, success messages, email input for OTP setup, and OTP input for verification. During development, if SMTP delivery is unavailable and fallback is enabled, the generated OTP can be displayed for testing.

### Student Dashboard

The student dashboard is used by students to complete graduation clearance. After logging in for the first time, the student is asked to complete profile setup by entering name, level, and department. This information is stored in the backend and reused in the dashboard and clearance certificate.

The main functions of the student dashboard include:

| Feature | Description |
| --- | --- |
| Profile display | Shows the student's name, matric number, department, and level |
| Passport upload | Allows a student to upload a passport photograph locally for certificate display |
| Clearance progress | Shows the number of approved stages and percentage completion |
| Clearance stage list | Displays all offices involved in the clearance process |
| Request clearance | Allows the student to submit a request for the currently unlocked office |
| Retry rejected request | Allows a rejected request to be resubmitted after reviewing the staff comment |
| Status badges | Displays locked, unlocked, pending, approved, or rejected states |
| Certificate view | Allows the student to view and print the final certificate after all stages are approved |

The student clearance sequence contains seven offices:

1. Bursary
2. Hostel
3. Library
4. Student Services
5. Honoris Certification
6. Department
7. Academic Division

Only the first stage is unlocked when a student is created. Each later stage remains locked until the previous stage has been approved by the responsible staff officer.

### Staff Portal

The staff portal is used by active staff members who approve or reject clearance requests. These approver accounts are linked to departments or offices such as Bursary, Library, HOD, HR, Facility, Finance, and Academic Division. When an approver logs in, the dashboard fetches only the requests related to that staff member's department.

The staff portal includes the following interface elements:

| Feature | Description |
| --- | --- |
| Request statistics | Shows pending, approved, and rejected request counts |
| Department request table | Lists submitted requests for the logged-in staff office |
| Search field | Allows staff to search by student name or matric number |
| Status filter | Filters requests by pending, approved, rejected, or all |
| Approve modal | Confirms request approval before updating the database |
| Reject modal | Allows staff to enter a reason for rejection |
| Reason viewer | Displays rejection comments for reviewed requests |
| Clearance pass modal | Allows staff to inspect a student's overall clearance progress |

When a staff member approves a request, the backend changes the request status to `approved` and unlocks the next clearance stage for that user. When a staff member rejects a request, the status becomes `rejected` and the rejection comment is saved for the student to review.

### Exiting Staff Clearance Dashboard

The exiting staff dashboard is a separate clearance workflow for staff members leaving the institution. Unlike the staff approver portal, an exiting staff member does not have to belong to one of the clearance offices to use this flow. A lecturer or general staff member can sign in with a numeric staff ID such as `STF/001` and complete the exit clearance process. The system uses the same backend request model but contains a different sequence of clearance stages.

The staff clearance sequence contains twelve stages:

1. Handover (HOD)
2. Company Identity and Business Card (HR)
3. Company Uniform (HOD)
4. Library Materials (Library)
5. Company Provided Telephone (HOD)
6. Security Keys and Tags (Security Office)
7. Company Vehicle (Facility)
8. Info System Facility (IT Unit)
9. Local Banking Application (Finance)
10. Outstanding Debts (HR)
11. University Accommodation Handover (Facility)
12. Exit Interview (HR)

The dashboard allows exiting staff to submit requests stage by stage. The final interview stage includes a date and time scheduling form. Once submitted, the appointment is stored on the related clearance request and is reviewed as part of the clearance process.

### Clearance Certificate Interface

The final certificate interface is displayed when all student clearance stages have been approved. It shows the student's full name, matric number, department, level, passport photograph, approved offices, issue date, and registrar signature area. The user can print the certificate or save it as a PDF using the browser print dialog.

The certificate view is important because it serves as the final evidence that the clearance process has been completed successfully.

### Frontend State Management and API Communication

The frontend stores authenticated user information in browser `sessionStorage` and `localStorage`. Separate storage keys are used for different user flows:

| Storage Key | Purpose |
| --- | --- |
| `student_user` | Stores logged-in student session data |
| `staff_user` | Stores active staff approver session data |
| `exit_staff_user` | Stores exiting staff session data |

The frontend communicates with the backend using HTTP requests. Each dashboard fetches current information from the API instead of relying only on stored data. Timestamp query values are added to some requests to reduce browser caching issues and ensure updated status information is displayed.

## 4.3 Database Implementation

The database was implemented with SQLite and SQLAlchemy. SQLAlchemy provides model classes that represent database tables and allows records to be created, queried, updated, and deleted through Python objects.

The database connection is configured in the Flask application as:

```python
sqlite:///university_clearance.db
```

During development, the physical database file is stored in the Flask instance directory. The backend creates the required database tables automatically before requests are processed. The implementation also checks for missing columns such as `school_email` and `successful_login_count` and adds them when required. This makes the development database easier to maintain as the project changes.

### User Table

The `User` model stores both student and staff accounts.

| Field | Type | Description |
| --- | --- | --- |
| `id` | Integer | Primary key |
| `user_id` | String | Unique matric number or staff ID |
| `password` | String | User password used during login |
| `name` | String | User's full name |
| `role` | String | Either `student` or `staff` |
| `department` | String | Department or office linked to the user |
| `level` | String | Student level |
| `school_email` | String | Email address used for OTP delivery |
| `successful_login_count` | Integer | Tracks logins for OTP threshold |

Students are auto-registered when they log in with an eligible student ID. Staff approver accounts can also be mapped to defined staff department IDs. Numeric staff IDs such as `STF/001` are treated as general exiting staff accounts, while office-based IDs such as `STF/HR` and `STF/BURSARY` are treated as approver accounts. This separation ensures that general staff can complete exit clearance without being given approval authority for an office.

### Clearance Request Table

The `ClearanceRequest` model stores each clearance stage for students and exiting staff.

| Field | Type | Description |
| --- | --- | --- |
| `id` | Integer | Primary key |
| `student_id` | Integer | Foreign key linked to `User.id` |
| `dept_name` | String | Name of the clearance office or stage |
| `order_index` | Integer | Position of the stage in the clearance sequence |
| `status` | String | Current request state |
| `comment` | Text | Staff rejection comment or note |
| `request_date` | DateTime | Date and time request was submitted |
| `appointment_date` | DateTime | Scheduled appointment date for interview-related stages |

The `status` field controls the clearance workflow. The main statuses are:

| Status | Meaning |
| --- | --- |
| `locked` | The stage is not yet available |
| `unlocked` | The stage is available for request |
| `pending` | The request has been submitted and awaits staff review |
| `approved` | The staff office has approved the request |
| `rejected` | The staff office rejected the request and may provide a comment |

The sequential design is enforced by the backend. When one request is approved, the backend looks for the next request belonging to the same user and changes it from `locked` to `unlocked`.

### Two-Factor Challenge Table

The `TwoFactorChallenge` model stores OTP login challenges.

| Field | Type | Description |
| --- | --- | --- |
| `id` | Integer | Primary key |
| `challenge_token` | String | Unique token used to identify the OTP challenge |
| `user_id` | Integer | Foreign key linked to `User.id` |
| `email` | String | Recipient email address |
| `otp_hash` | String | Hashed OTP value |
| `expires_at` | DateTime | Expiry date and time for the OTP |
| `attempts` | Integer | Number of verification attempts |
| `consumed` | Boolean | Indicates whether the challenge has already been used |
| `created_at` | DateTime | Date and time challenge was created |

For security, the OTP itself is not stored as plain text in the database. Instead, the backend stores a hashed version and checks the submitted code against the hash during verification. Expired, consumed, or over-attempted challenges are rejected.

### Backend API Implementation

The backend exposes the following core API endpoints:

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/login` | POST | Authenticates users and starts OTP verification when required |
| `/api/login/verify-otp` | POST | Verifies a submitted OTP challenge |
| `/api/student/update-profile` | POST | Updates student or staff profile data |
| `/api/student/status/<student_id>` | GET | Returns all clearance stages for a user |
| `/api/student/request-clearance` | POST | Submits a clearance request for an unlocked stage |
| `/api/student/schedule-appointment` | POST | Saves appointment date and time for a clearance stage |
| `/api/staff/requests` | GET | Returns requests assigned to a staff office |
| `/api/staff/approve` | POST | Approves a request and unlocks the next stage |
| `/api/staff/reject` | POST | Rejects a request and saves a rejection comment |

The backend contains validation checks to prevent users from requesting locked stages or resubmitting stages that are already approved. It also validates email addresses before sending OTP codes, limits OTP attempts, and temporarily blocks login after five failed credential attempts to reduce misuse.

### SMTP Email Implementation

The SMTP email service is implemented in `services/email_service.py`. It uses Python's built-in `smtplib` and `email.message.EmailMessage` to send verification codes.

The email service performs the following operations:

1. Reads SMTP configuration from environment variables.
2. Validates that required values are present.
3. Builds an email message containing the OTP code and expiry time.
4. Connects to the SMTP server using SSL or STARTTLS.
5. Logs into the SMTP account.
6. Sends the email to the user's verified email address.

If Gmail is used as the SMTP provider, whitespace is removed from the SMTP password because Gmail application passwords are often displayed in grouped blocks. This improves compatibility when the password is copied into the environment file.

## 4.4 System Testing

System testing was carried out to confirm that the implemented system satisfies the functional and non-functional requirements. Testing focused on authentication, role-based routing, student clearance, staff approval, rejection handling, OTP verification, database updates, and usability.

### Functional Testing

Functional testing checks whether each system feature works according to the expected behavior.

| Test Case | Test Action | Expected Result |
| --- | --- | --- |
| Student login with eligible ID | Enter valid student ID and password | Student account is created or authenticated successfully |
| Invalid ID login | Enter an ID not approved by eligibility rules | System rejects login request |
| Staff login | Enter valid staff ID and password | Staff is redirected to the staff dashboard or staff clearance dashboard |
| Failed login rate limit | Enter wrong credentials five times | System blocks further attempts and asks the user to try again later |
| First-time profile setup | Submit name, department, and level | Profile is saved and setup modal closes |
| Student status fetch | Open student dashboard | Clearance stages are displayed in correct order |
| Request unlocked stage | Click request button on unlocked stage | Stage status changes to `pending` |
| Request locked stage | Attempt backend request for locked stage | Backend rejects request |
| Staff request listing | Open staff portal | Requests for the staff department are displayed |
| Approve request | Staff approves pending request | Request becomes approved and next stage unlocks |
| Reject request | Staff enters rejection reason | Request becomes rejected and comment is saved |
| Retry rejected request | Student resubmits rejected request | Request returns to pending state |
| Certificate access | Complete all student stages | Certificate view becomes available |
| OTP email requirement | Reach configured login threshold | System requests email or sends OTP |
| OTP verification | Enter correct six-digit OTP | Login completes successfully |
| Wrong OTP | Enter incorrect OTP | System displays error and increases attempt count |
| Expired OTP | Submit OTP after expiry time | System rejects the challenge |
| Interview scheduling | Exiting staff selects date and time | Appointment date is saved and request becomes pending |

### Non-Functional Testing

Non-functional testing evaluates quality attributes such as usability, performance, reliability, security, and maintainability.

| Criterion | Evaluation |
| --- | --- |
| Usability | Interfaces use clear labels, progress indicators, color-coded statuses, modal confirmations, and direct action buttons |
| Responsiveness | React pages use responsive layouts so dashboards can be accessed on different screen sizes |
| Reliability | Backend prevents locked-stage requests, duplicate approved-stage requests, expired OTP usage, and over-attempted OTP challenges |
| Security | OTP values are hashed before storage, email addresses are validated, failed login attempts are rate-limited, and SMTP secrets are read from environment variables |
| Maintainability | Frontend pages are separated by role, backend models are centralized, and API endpoints are grouped by function |
| Compatibility | The system runs locally with Flask, React, Vite, and SQLite without requiring a complex server setup |
| Recoverability | Rejected requests can be retried, and development OTP fallback can be enabled during SMTP troubleshooting |

### Usability Testing Criteria

The system was evaluated using the following usability criteria:

| Usability Criterion | Discussion |
| --- | --- |
| Learnability | Users can identify the correct starting point from the landing page because the options are separated by user role |
| Efficiency | Students submit clearance requests directly from the dashboard without visiting each office physically |
| Visibility of status | Every stage displays a status badge, and overall progress is shown as a percentage |
| Error prevention | Locked stages cannot be requested, and approved stages cannot be submitted again |
| Feedback | The system displays notifications, loading states, success messages, rejection reasons, and OTP verification messages |
| Consistency | Similar status colors and button styles are used across student and staff dashboards |
| User control | Users can retry rejected requests, refresh status, log out, and return from OTP verification to credentials |

### Sample Test Result Discussion

A typical clearance workflow test confirms that a student can log in, update profile details, submit the first clearance request, and have that request approved by a staff member. After approval, the next clearance stage changes from `locked` to `unlocked`. This confirms that the sequential workflow is functioning correctly.

The stored test result shows the following successful outcomes:

| Result Item | Value |
| --- | --- |
| Login response status | `200` |
| Profile update response status | `200` |
| Initial request status | `pending` |
| Approval response status | `200` |
| Final request status | `approved` |
| Next request status | `unlocked` |

These results demonstrate that the main clearance loop works as intended: authentication, profile update, request submission, staff approval, and next-stage unlocking.

## 4.5 Performance Evaluation

Although the system is not an artificial intelligence or machine learning project, performance evaluation is still useful because the application must respond quickly during login, dashboard loading, request submission, and approval operations.

### Evaluation Metrics

The following performance metrics are relevant to this system:

| Metric | Description | Expected Behavior |
| --- | --- | --- |
| Login response time | Time taken to authenticate a user | Should complete within a few seconds on localhost |
| Dashboard load time | Time taken to fetch and display clearance stages | Should be fast because each user has a limited number of stages |
| Staff request fetch time | Time taken to retrieve pending requests for an office | Should remain acceptable as request volume increases |
| Approval update time | Time taken to approve a request and unlock next stage | Should complete immediately after database update |
| OTP delivery time | Time taken to send an email verification code | Depends on SMTP provider and network stability |
| Database query efficiency | Ability to retrieve records without unnecessary processing | Suitable for development and moderate records with SQLite |
| UI responsiveness | Time between user action and visible feedback | Loading indicators and status updates should appear immediately |

### Performance Discussion

The application is lightweight because it uses a small number of database tables and direct REST endpoints. Student dashboards usually retrieve only seven clearance records, while exiting staff dashboards retrieve twelve records. These are small datasets, so the response time is expected to be fast in a local or small institutional deployment.

The staff dashboard may process more records because it displays requests from multiple users. To improve performance, the backend filters requests by department before returning them to the frontend. The frontend also includes search and status filters to help staff work with request lists efficiently.

SQLite is suitable for development and demonstration because it requires no separate database server. However, for a full production deployment with many concurrent users, the database layer should be migrated to a server-based database such as PostgreSQL or MySQL. This would improve concurrency, backup management, access control, and long-term scalability.

The OTP feature introduces an external dependency because email delivery depends on SMTP connectivity and the email provider's rules. When SMTP is correctly configured, delivery should complete within a short period. If SMTP fails during development, the fallback mode can be enabled so testing can continue while email configuration is being fixed. In production, fallback mode should be disabled so that failed email delivery prevents insecure login completion.

### Scalability Considerations

For future improvement, the system can be optimized in the following ways:

| Improvement | Benefit |
| --- | --- |
| Add database indexes on `user_id`, `student_id`, `dept_name`, and `status` | Speeds up login and request filtering |
| Replace SQLite with PostgreSQL or MySQL | Supports more concurrent users |
| Add backend pagination for staff requests | Prevents large request tables from slowing the dashboard |
| Add server-side authentication tokens | Improves session security and API protection |
| Add audit logs | Tracks approvals, rejections, login attempts, and administrative actions |
| Queue email delivery | Prevents slow SMTP responses from delaying login requests |
| Add automated frontend tests | Confirms interface behavior after UI changes |

### Summary

The implementation successfully provides a role-based online clearance system with student clearance, staff approval, exiting staff clearance, OTP verification, sequential workflow control, and certificate generation. The database design supports the main entities required by the system, while the frontend provides clear interfaces for each user group. Testing confirms that the major workflows operate correctly, and the performance evaluation shows that the system is suitable for local development, academic demonstration, and small-scale institutional use.
