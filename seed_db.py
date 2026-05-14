from app import app
from models import db, User

def seed_staff():
    with app.app_context():
        db.drop_all()
        db.create_all()

        # Only seed the Staff. Students will register themselves via login!
        # Specific Staff for each Department
        staff_accounts = [
            # Existing Student Clearance Staff
            User(user_id="STF/BURSARY", password="password", name="Bursary Staff", role="staff", department="Bursary"),
            User(user_id="STF/HOSTEL", password="password", name="Hostel Staff", role="staff", department="Hostel"),
            User(user_id="STF/LIBRARY", password="password", name="Library Staff", role="staff", department="Library"),
            User(user_id="STF/SUBS", password="password", name="Student Services", role="staff", department="Student Services"),
            User(user_id="STF/HONORIS", password="password", name="Honoris Staff", role="staff", department="Honoris Certification"),
            User(user_id="STF/DEPT", password="password", name="Department Staff", role="staff", department="Department"),
            User(user_id="STF/ACADEMIC", password="password", name="Academic Staff", role="staff", department="Academic Division"),

            # New Staff Clearance Approvers
            User(user_id="STF/HOD", password="password", name="Head of Department", role="staff", department="HOD"),
            User(user_id="STF/HR", password="password", name="Human Resources", role="staff", department="HR"),
            User(user_id="STF/SECURITY", password="password", name="Security Office", role="staff", department="Security Office"),
            User(user_id="STF/FACILITY", password="password", name="Facility Manager", role="staff", department="Facility"),
            User(user_id="STF/IT", password="password", name="IT Unit", role="staff", department="IT Unit"),
            User(user_id="STF/FINANCE", password="password", name="Finance Office", role="staff", department="Finance")
        ]

        db.session.add_all(staff_accounts)
        db.session.commit()
        print("Staff accounts ready. Students can now login with their 2020/2021/2022 IDs!")

if __name__ == "__main__":
    seed_staff()