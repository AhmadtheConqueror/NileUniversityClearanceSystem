import os
import re
import secrets
from datetime import datetime, timedelta

from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import inspect, text
from werkzeug.security import check_password_hash, generate_password_hash

from models import db, User, ClearanceRequest, TwoFactorChallenge
from services.email_service import send_otp_email as send_otp_email_via_smtp

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv():
        return False

load_dotenv()

app = Flask(__name__)
CORS(app)

# SQLite Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///university_clearance.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

_schema_checked = False

def get_int_env(name, default):
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default

TWO_FACTOR_LOGIN_THRESHOLD = max(1, get_int_env("TWO_FACTOR_LOGIN_THRESHOLD", 4))
OTP_TTL_MINUTES = max(1, get_int_env("OTP_TTL_MINUTES", 10))
OTP_MAX_ATTEMPTS = max(1, get_int_env("OTP_MAX_ATTEMPTS", 5))
LOGIN_MAX_ATTEMPTS = max(1, get_int_env("LOGIN_MAX_ATTEMPTS", 5))
LOGIN_LOCKOUT_MINUTES = max(1, get_int_env("LOGIN_LOCKOUT_MINUTES", 15))
ALLOW_OTP_CONSOLE_FALLBACK = os.getenv("ALLOW_OTP_CONSOLE_FALLBACK", "true").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}
_login_rate_limits = {}

def ensure_database_schema():
    global _schema_checked
    if _schema_checked:
        return

    db.create_all()

    inspector = inspect(db.engine)
    user_columns = {column["name"] for column in inspector.get_columns("user")}

    with db.engine.begin() as connection:
        if "school_email" not in user_columns:
            connection.execute(text('ALTER TABLE "user" ADD COLUMN school_email VARCHAR(120)'))
        if "successful_login_count" not in user_columns:
            connection.execute(
                text('ALTER TABLE "user" ADD COLUMN successful_login_count INTEGER NOT NULL DEFAULT 0')
            )

    _schema_checked = True

@app.before_request
def prepare_database():
    ensure_database_schema()

# --- HELPER: STAFF CLEARANCE STAGES ---
STAFF_OFFICES = [
    (1, "Handover (HOD)"),
    (2, "Company Identity and Business Card (HR)"),
    (3, "Company Uniform (HOD)"),
    (4, "Library Materials (Library)"),
    (5, "Company Provided Telephone (HOD)"),
    (6, "Security Keys and Tags (Security Office)"),
    (7, "Company Vehicle (Facility)"),
    (8, "Info System Facility (IT Unit)"),
    (9, "Local Banking Application (Finance)"),
    (10, "Outstanding Debts (HR)"),
    (11, "University Accommodation Handover (Facility)"),
    (12, "Exit Interview (HR)")
]

# --- HELPER: GRADUATION ELIGIBILITY ---
def get_eligibility(user_id):
    if user_id.startswith("STF"): return True # Staff bypass year check
    try:
        # Handle "NU/20/..." format or raw "2020..."
        # If it starts with NU/, the year is effectively the first number group after NU/
        if user_id.upper().startswith("NU/"):
            parts = user_id.split('/')
            if len(parts) >= 2:
                 # Check if the part after NU is a year-like (20) or full year (2020)
                 # Assuming "20" means "2020"
                 year_short = int(parts[1])
                 # If it's just 2 digits (e.g., 20, 21, 22), add 2000
                 prefix = year_short + 2000 if year_short < 100 else year_short
        else:
            # Fallback for old numeric style 20221912
            prefix = int(user_id[:4])
            
        # Only 2020, 2021, 2022 are eligible in 2026
        return prefix in [2020, 2021, 2022]
    except:
        return False

# --- HELPER: STAFF DEPARTMENT MAPPING ---
STAFF_DEPT_MAPPING = {
    "STF/HOD": "HOD",
    "STF/HR": "HR",
    "STF/BURSARY": "Bursary",
    "STF/HOSTEL": "Hostel",
    "STF/LIBRARY": "Library",
    "STF/SUBS": "Student Services",
    "STF/HONORIS": "Honoris Certification",
    "STF/DEPT": "Department",
    "STF/ACADEMIC": "Academic Division",
    "STF/SECURITY": "Security Office",
    "STF/FACILITY": "Facility",
    "STF/IT": "IT Unit",
    "STF/FINANCE": "Finance"
}
GENERIC_STAFF_DEPARTMENT = "General Staff"
GENERIC_STAFF_ID_PATTERN = re.compile(r"^STF/\d+$")

def normalize_user_id(value):
    return str(value or "").upper().strip()

def normalize_login_context(value):
    return str(value or "").strip().lower()

def is_generic_staff_id(user_id):
    return bool(GENERIC_STAFF_ID_PATTERN.match(user_id))

def is_acceptable_new_user_id(user_id, login_context=""):
    if user_id.startswith("STF"):
        if user_id in STAFF_DEPT_MAPPING:
            return True
        return is_generic_staff_id(user_id) and login_context == "staff-clearance"
    return get_eligibility(user_id)

EMAIL_PATTERN = re.compile(
    r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$"
)

def validate_email(email):
    normalized = str(email or "").strip().lower()
    if not normalized or len(normalized) > 254 or not EMAIL_PATTERN.match(normalized):
        return None

    local_part, domain = normalized.rsplit("@", 1)
    if len(local_part) > 64:
        return None

    domain_labels = domain.split(".")
    if any(label.startswith("-") or label.endswith("-") for label in domain_labels):
        return None

    return normalized

def mask_email(email):
    local_part, domain = email.split("@", 1)
    if len(local_part) <= 2:
        masked_local = local_part[0] + "*"
    else:
        masked_local = f"{local_part[0]}{'*' * (len(local_part) - 2)}{local_part[-1]}"
    return f"{masked_local}@{domain}"

def get_login_rate_limit_key(user_id):
    remote_addr = request.remote_addr or "unknown"
    return f"{remote_addr}:{user_id}"

def build_login_rate_limit_response(locked_until):
    retry_after_seconds = max(1, int((locked_until - datetime.utcnow()).total_seconds()))
    retry_after_minutes = max(1, (retry_after_seconds + 59) // 60)
    return jsonify({
        "status": "error",
        "message": f"Too many login attempts. Please try again later in {retry_after_minutes} minutes.",
        "retryAfterSeconds": retry_after_seconds,
    }), 429

def check_login_rate_limit(user_id):
    key = get_login_rate_limit_key(user_id)
    record = _login_rate_limits.get(key)
    if not record:
        return None

    locked_until = record.get("locked_until")
    if locked_until and locked_until > datetime.utcnow():
        return build_login_rate_limit_response(locked_until)

    if locked_until:
        _login_rate_limits.pop(key, None)

    return None

def record_failed_login_attempt(user_id):
    key = get_login_rate_limit_key(user_id)
    now = datetime.utcnow()
    record = _login_rate_limits.get(key, {"attempts": 0, "locked_until": None})

    locked_until = record.get("locked_until")
    if locked_until and locked_until > now:
        return build_login_rate_limit_response(locked_until)

    attempts = record.get("attempts", 0) + 1
    if attempts >= LOGIN_MAX_ATTEMPTS:
        locked_until = now + timedelta(minutes=LOGIN_LOCKOUT_MINUTES)
        _login_rate_limits[key] = {"attempts": attempts, "locked_until": locked_until}
        return build_login_rate_limit_response(locked_until)

    _login_rate_limits[key] = {"attempts": attempts, "locked_until": None}
    return None

def clear_failed_login_attempts(user_id):
    _login_rate_limits.pop(get_login_rate_limit_key(user_id), None)

def should_require_two_factor(user):
    login_count = user.successful_login_count or 0
    return login_count + 1 >= TWO_FACTOR_LOGIN_THRESHOLD

def generate_otp():
    return f"{secrets.randbelow(1_000_000):06d}"

def send_otp_email(recipient_email, otp):
    try:
        send_otp_email_via_smtp(recipient_email, otp, OTP_TTL_MINUTES)
    except Exception as exc:
        if ALLOW_OTP_CONSOLE_FALLBACK:
            app.logger.warning("SMTP email failed; using development OTP fallback: %s", exc)
            app.logger.warning("Development OTP for %s: %s", recipient_email, otp)
            return "console"
        raise

    return "smtp"

def build_login_payload(user):
    needs_setup = not user.name
    return {
        "status": "success",
        "role": user.role,
        "id": user.id,
        "userId": user.user_id,
        "name": user.name or "",
        "needsSetup": needs_setup,
        "dept": user.department or "",
        "level": user.level or "",
        "department": user.department or "",
        "schoolEmail": user.school_email or "",
        "successfulLoginCount": user.successful_login_count or 0,
    }

def initialize_student_clearance(user):
    offices = [
        (1, "Bursary"),
        (2, "Hostel"),
        (3, "Library"),
        (4, "Student Services"),
        (5, "Honoris Certification"),
        (6, "Department"),
        (7, "Academic Division"),
    ]
    for order, name in offices:
        db.session.add(ClearanceRequest(
            student_id=user.id,
            dept_name=name,
            order_index=order,
            status="unlocked" if order == 1 else "locked",
        ))

def initialize_staff_clearance(user):
    for order, name in STAFF_OFFICES:
        db.session.add(ClearanceRequest(
            student_id=user.id,
            dept_name=name,
            order_index=order,
            status="unlocked" if order == 1 else "locked",
        ))

def should_initialize_exit_clearance(user, login_context=""):
    return user.role == "staff" and (
        login_context == "staff-clearance" or is_generic_staff_id(user.user_id)
    )

def prepare_authenticated_user(user, login_context=""):
    if user.role == "staff":
        expected_dept = STAFF_DEPT_MAPPING.get(user.user_id)
        if expected_dept and user.department != expected_dept:
            user.department = expected_dept

        existing_req = ClearanceRequest.query.filter_by(student_id=user.id).first()
        if should_initialize_exit_clearance(user, login_context) and not existing_req:
            initialize_staff_clearance(user)

    db.session.commit()

def finalize_successful_login(user):
    user.successful_login_count = (user.successful_login_count or 0) + 1
    db.session.commit()
    return jsonify(build_login_payload(user))

def start_two_factor_challenge(user, email=None):
    if not email:
        return jsonify({
            "status": "email_required",
            "message": "Please enter your email address to continue.",
        })

    validated_email = validate_email(email)
    if not validated_email:
        return jsonify({
            "status": "error",
            "message": "Please enter a valid email address.",
        }), 400

    user.school_email = validated_email

    otp = generate_otp()
    challenge = TwoFactorChallenge(
        challenge_token=secrets.token_urlsafe(32),
        user_id=user.id,
        email=user.school_email,
        otp_hash=generate_password_hash(otp),
        expires_at=datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES),
    )

    TwoFactorChallenge.query.filter_by(user_id=user.id, consumed=False).update({"consumed": True})
    db.session.add(challenge)
    db.session.commit()

    try:
        delivery_mode = send_otp_email(user.school_email, otp)
    except Exception as exc:
        app.logger.exception("Unable to send OTP email")
        challenge.consumed = True
        db.session.commit()
        return jsonify({
            "status": "error",
            "message": "Unable to send the verification code right now. Please try again.",
            "detail": str(exc),
        }), 502

    message = f"We sent a verification code to {mask_email(user.school_email)}."
    response_payload = {
        "status": "otp_required",
        "message": message,
        "challengeToken": challenge.challenge_token,
        "email": mask_email(user.school_email),
        "expiresInMinutes": OTP_TTL_MINUTES,
    }

    if delivery_mode == "console":
        response_payload["message"] = "SMTP email is not available right now. Use the development OTP below."
        response_payload["developmentOtp"] = otp

    return jsonify(response_payload)

# --- 1. AUTHENTICATION & AUTO-REGISTRATION ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    user_id = normalize_user_id(data.get('userId'))
    password = data.get('password') or ""
    school_email = data.get('schoolEmail')
    login_context = normalize_login_context(data.get("loginContext") or data.get("role"))

    if not user_id or not password:
        return jsonify({"status": "error", "message": "Please enter your credentials to continue."}), 400

    rate_limit_response = check_login_rate_limit(user_id)
    if rate_limit_response:
        return rate_limit_response
    
    user = User.query.filter_by(user_id=user_id).first()

    if user and is_generic_staff_id(user.user_id) and login_context == "staff":
        return jsonify({
            "status": "error",
            "message": "This staff ID is for exiting staff clearance. Please use the Exiting Staff login.",
        }), 403

    if not user and not is_acceptable_new_user_id(user_id, login_context):
        if is_generic_staff_id(user_id):
            return jsonify({
                "status": "error",
                "message": "This staff ID is for exiting staff clearance. Please use the Exiting Staff login.",
            }), 401
        rate_limit_response = record_failed_login_attempt(user_id)
        if rate_limit_response:
            return rate_limit_response
        return jsonify({"status": "error", "message": "This ID is not approved for access."}), 401
    
    # Auto-register valid new students
    # Note: Added robust check to avoid crash if get_eligibility fails
    is_eligible = get_eligibility(user_id)
    
    if not user and is_eligible and not user_id.startswith("STF"):
        user = User(user_id=user_id, password=password, role="student", name=None)
        db.session.add(user)
        db.session.commit()
        
        # Initialize steps: Bursary (1) is available to request, others are locked.
        initialize_student_clearance(user)
        db.session.commit()

    # --- STAFF AUTO-REGISTRATION & CLEARANCE INIT ---
    if not user and user_id.startswith("STF"):
        # Staff is logging in for the first time
        # Determine department from mapping
        dept = STAFF_DEPT_MAPPING.get(user_id) or GENERIC_STAFF_DEPARTMENT
        
        user = User(user_id=user_id, password=password, role="staff", name=None, department=dept)
        db.session.add(user)
        db.session.commit()

        # Initialize STAFF steps (Staff also undergo clearance?)
        # Based on seed_db logic, yes, staff have clearance requests too.
        initialize_staff_clearance(user)
        db.session.commit()


    if user and user.password == password:
        clear_failed_login_attempts(user_id)
        # Final eligibility double-check for existing students
        if user.role == "student" and not get_eligibility(user.user_id):
             # If they are already in DB, maybe we should let them in? 
             pass 
        
        prepare_authenticated_user(user, login_context)

        if should_require_two_factor(user):
            return start_two_factor_challenge(user, school_email)

        return finalize_successful_login(user)
    rate_limit_response = record_failed_login_attempt(user_id)
    if rate_limit_response:
        return rate_limit_response
    return jsonify({"status": "error", "message": "Invalid ID or Password"}), 401

@app.route('/api/login/verify-otp', methods=['POST'])
def verify_login_otp():
    data = request.json or {}
    challenge_token = str(data.get("challengeToken") or "").strip()
    otp = "".join(ch for ch in str(data.get("otp") or "") if ch.isdigit())
    login_context = normalize_login_context(data.get("loginContext") or data.get("role"))

    if not challenge_token or len(otp) != 6:
        return jsonify({"status": "error", "message": "Please enter the six-digit verification code."}), 400

    challenge = TwoFactorChallenge.query.filter_by(challenge_token=challenge_token).first()

    if not challenge or challenge.consumed:
        return jsonify({"status": "error", "message": "This verification request is no longer valid."}), 400

    if challenge.expires_at < datetime.utcnow():
        challenge.consumed = True
        db.session.commit()
        return jsonify({"status": "error", "message": "This verification code has expired."}), 400

    if challenge.attempts >= OTP_MAX_ATTEMPTS:
        challenge.consumed = True
        db.session.commit()
        return jsonify({"status": "error", "message": "Too many incorrect verification attempts."}), 429

    challenge.attempts += 1

    if not check_password_hash(challenge.otp_hash, otp):
        if challenge.attempts >= OTP_MAX_ATTEMPTS:
            challenge.consumed = True
        db.session.commit()
        return jsonify({"status": "error", "message": "Incorrect verification code."}), 401

    user = User.query.get(challenge.user_id)
    if not user:
        challenge.consumed = True
        db.session.commit()
        return jsonify({"status": "error", "message": "User not found."}), 404

    challenge.consumed = True
    prepare_authenticated_user(user, login_context)
    return finalize_successful_login(user)

@app.route('/api/student/update-profile', methods=['POST'])
def update_profile():
    data = request.json
    # FIX: Try finding by ID first, then by user_id string (Matric)
    student_id = data.get('student_id')
    user = User.query.get(student_id)
    
    # Fallback search by string ID (uppercase)
    if not user:
         user = User.query.filter_by(user_id=str(student_id).upper().strip()).first()
    
    if user:
        # Update name. For staff, maybe other fields too?
        if data.get('name'): user.name = data.get('name')
        if data.get('level'): user.level = data.get('level')
        if data.get('dept'): user.department = data.get('dept')
        db.session.commit()
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "User not found"}), 404

# --- 2. STUDENT SEQUENTIAL ROUTES ---
@app.route('/api/student/status/<int:student_id>', methods=['GET'])
def get_status(student_id):
    requests = ClearanceRequest.query.filter_by(student_id=student_id).order_by(ClearanceRequest.order_index).all()
    return jsonify([{"id": r.id, "name": r.dept_name, "status": r.status, "order": r.order_index, "comment": r.comment} for r in requests])

@app.route('/api/student/request-clearance', methods=['POST'])
def initiate_request():
    data = request.json
    req = ClearanceRequest.query.filter_by(student_id=data.get('student_id'), order_index=data.get('order_index')).first()
    if req:
        if req.status == 'locked':
            return jsonify({"status": "error", "message": "This clearance step is still locked."}), 400
        if req.status == 'approved':
            return jsonify({"status": "error", "message": "This clearance step is already approved."}), 400

        req.status, req.request_date = 'pending', datetime.utcnow()
        req.comment = None
        db.session.commit()
        return jsonify({"status": "success"})
    return jsonify({"status": "error"}), 404

@app.route('/api/student/schedule-appointment', methods=['POST'])
def schedule_appointment():
    data = request.json
    req = ClearanceRequest.query.filter_by(student_id=data.get('student_id'), order_index=data.get('order_index')).first()
    if req:
        date_str = data.get('date') # Expecting ISO format or YYYY-MM-DD HH:MM
        try:
             if req.status == 'locked':
                 return jsonify({"status": "error", "message": "This clearance step is still locked."}), 400
             if req.status == 'approved':
                 return jsonify({"status": "error", "message": "This clearance step is already approved."}), 400

             # Flexible parsing or standard ISO
             appointment_dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
             req.appointment_date = appointment_dt
             req.status = 'pending' # Or keep as is? Usually scheduling means requesting.
             req.request_date = datetime.utcnow()
             req.comment = None
             db.session.commit()
             return jsonify({"status": "success"})
        except ValueError:
            return jsonify({"status": "error", "message": "Invalid date format"}), 400
    return jsonify({"status": "error"}), 404

# --- 3. STAFF DASHBOARD ROUTES ---
@app.route('/api/staff/requests', methods=['GET'])
def get_staff_requests():
    # Return only requests that were submitted or already handled by staff.
    dept_filter = request.args.get('department')
    query = ClearanceRequest.query
    
    if dept_filter and dept_filter != "All":
        # partial match to allow "HOD" to see "Handover (HOD)"
        query = query.filter(ClearanceRequest.dept_name.contains(dept_filter))
        
    all_reqs = query.all()
    data = []
    for r in all_reqs:
        if r.status in ('locked', 'unlocked'): continue
        
        student = User.query.get(r.student_id)
        if not student: continue 
        if student.user_id in STAFF_DEPT_MAPPING: continue

        # Add student_db_id for frontend logic
        data.append({
            "id": r.id, "student_db_id": student.id, "name": student.name or "Profile Pending", "matric": student.user_id,
            "office": r.dept_name, "status": r.status, "comment": r.comment,
            "date": r.request_date.strftime("%Y-%m-%d %H:%M:%S") if r.request_date else "N/A"
        })
    return jsonify(data)

@app.route('/api/staff/approve', methods=['POST'])
def approve_request():
    req = ClearanceRequest.query.get(request.json.get('id'))
    if req:
        req.status = 'approved'
        # SEQUENTIAL UNLOCK: Unlock next office for student
        next_req = ClearanceRequest.query.filter_by(student_id=req.student_id, order_index=req.order_index + 1).first()
        if next_req and next_req.status == 'locked': 
            next_req.status = 'unlocked'
            # next_req.request_date = datetime.utcnow() # Wait for student to request
        db.session.commit()
        return jsonify({"status": "success"})
    return jsonify({"status": "error"}), 404

@app.route('/api/staff/reject', methods=['POST'])
def reject_request():
    req = ClearanceRequest.query.get(request.json.get('id'))
    if req:
        req.status, req.comment = 'rejected', request.json.get('comment')
        db.session.commit()
        return jsonify({"status": "success"})
    return jsonify({"status": "error"}), 404

if __name__ == '__main__':
    with app.app_context(): ensure_database_schema()
    app.run(debug=True)
