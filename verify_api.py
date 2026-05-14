import requests
import json
from app import app, db, User, ClearanceRequest

def verify():
    with app.app_context():
        # 1. Check if HOD user exists
        hod = User.query.filter_by(user_id="STF/HOD").first()
        if not hod:
            print("ERROR: HOD user not found in DB.")
        else:
            print(f"HOD User: ID={hod.id}, Dept={hod.department}, Role={hod.role}")

        # 2. Check if any requests exist for HOD department
        reqs = ClearanceRequest.query.filter(ClearanceRequest.dept_name.contains("HOD")).all()
        print(f"Total requests matching 'HOD': {len(reqs)}")
        for r in reqs:
            print(f" - Request {r.id}: StudentID={r.student_id}, Dept={r.dept_name}, Status={r.status}")

        # 3. Test API endpoint directly
        try:
            response = requests.get("http://127.0.0.1:5000/api/staff/requests?department=HOD")
            print(f"\nAPI Response Status: {response.status_code}")
            print(f"API Response Body: {json.dumps(response.json(), indent=2)}")
        except Exception as e:
            print(f"API Request Failed: {e}")

if __name__ == "__main__":
    verify()
