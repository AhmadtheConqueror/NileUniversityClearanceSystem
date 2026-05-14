from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), unique=True, nullable=False) # e.g. 20221912
    password = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(100))
    role = db.Column(db.String(10), default='student') # 'student' or 'staff'
    department = db.Column(db.String(100)) 
    level = db.Column(db.String(10))
    school_email = db.Column(db.String(120))
    successful_login_count = db.Column(db.Integer, default=0, nullable=False)

class TwoFactorChallenge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    challenge_token = db.Column(db.String(120), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    otp_hash = db.Column(db.String(255), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    attempts = db.Column(db.Integer, default=0, nullable=False)
    consumed = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ClearanceRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    dept_name = db.Column(db.String(50), nullable=False)
    order_index = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='pending')
    comment = db.Column(db.Text)
    request_date = db.Column(db.DateTime, nullable=True)
    appointment_date = db.Column(db.DateTime, nullable=True) # For scheduled interviews
