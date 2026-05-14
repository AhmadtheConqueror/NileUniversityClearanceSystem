import requests
import json
from app import app, db, User, ClearanceRequest

# Configuration
BASE_URL = "http://127.0.0.1:5000/api"
TEST_USER_ID = "STF/EMP_TEST_2"  # Using a fresh test user
TEST_PASSWORD = "password123"

def run_test():
    session = requests.Session()
    
    # 1. Login
    print(f"--- TEST 1: Initial Login ---")
    login_payload = {"userId": TEST_USER_ID, "password": TEST_PASSWORD}
    try:
        resp = session.post(f"{BASE_URL}/login", json=login_payload)
        print(f"Login Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"Login Failed: {resp.text}")
            return
            
        user_data = resp.json()
        user_db_id = user_data['id']
        print(f"User ID: {user_db_id}, Name: {user_data.get('name')}, Needs Setup: {user_data.get('needsSetup')}")
    except Exception as e:
        print(f"Exception during login: {e}")
        return

    # 2. Update Profile
    print(f"\n--- TEST 2: Update Profile ---")
    profile_payload = {"student_id": user_db_id, "name": "Test Employee 2"}
    try:
        resp = session.post(f"{BASE_URL}/student/update-profile", json=profile_payload)
        print(f"Update Status: {resp.status_code}")
    except Exception as e:
        print(f"Exception during update: {e}")
        return

    # 3. Check Persistence
    print(f"\n--- TEST 3: Re-Login ---")
    try:
        resp = session.post(f"{BASE_URL}/login", json=login_payload)
        user_data = resp.json()
        print(f"Re-Login Name: {user_data.get('name')}")
        
        if user_data.get('name') == "Test Employee 2":
            print("SUCCESS: Name persisted.")
        else:
            print(f"FAILURE: Name is {user_data.get('name')}, expected 'Test Employee 2'")
    except Exception as e:
        print(f"Exception during re-login: {e}")

if __name__ == "__main__":
    run_test()
