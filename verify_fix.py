import requests
import json
from app import app, db, User

def verify_fix():
    with app.app_context():
        # Simulate Login for HOD
        print("Simulating Login for STF/HOD...")
        try:
            # We must use the requests lib to hit the RUNNING server to trigger the route logic
            # Use 'password' as password since that's what we saw in seed_db (and likely default)
            login_data = {"userId": "STF/HOD", "password": "password"}
            response = requests.post("http://127.0.0.1:5000/api/login", json=login_data)
            
            if response.status_code == 200:
                print("Login Successful!")
                data = response.json()
                print(f"Returned Department: {data.get('department')}")
                
                # Verify DB update
                hod = User.query.filter_by(user_id="STF/HOD").first()
                print(f"DB User Department: {hod.department}")
                
                if hod.department == "HOD":
                    print("SUCCESS: Department was fixed/set correctly.")
                else:
                    print("FAILURE: Department is still incorrect in DB.")
            else:
                print(f"Login Failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"Error during verification: {e}")

if __name__ == "__main__":
    verify_fix()
