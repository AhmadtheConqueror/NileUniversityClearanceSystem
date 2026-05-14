import requests
import json
from app import app, db, User, ClearanceRequest

# Configuration
BASE_URL = "http://127.0.0.1:5000/api"
TEST_USER_ID = "STF/EMP_TEST_3" 
TEST_PASSWORD = "password123"

def run_test():
    session = requests.Session()
    
    print(f"--- TEST 1: Login & Auto-Register ---")
    resp = session.post(f"{BASE_URL}/login", json={"userId": TEST_USER_ID, "password": TEST_PASSWORD})
    user_id = resp.json()['id']
    print(f"Created User ID: {user_id}")

    print(f"--- TEST 2: Update Profile ---")
    resp = session.post(f"{BASE_URL}/student/update-profile", json={"student_id": user_id, "name": "Test User 3"})
    print(f"Update Status: {resp.status_code}")

    print(f"--- TEST 3: Re-Login & Check NeedsSetup ---")
    resp = session.post(f"{BASE_URL}/login", json={"userId": TEST_USER_ID, "password": TEST_PASSWORD})
    data = resp.json()
    print(f"Name: '{data.get('name')}'")
    print(f"NeedsSetup: {data.get('needsSetup')}")
    
    if data.get('needsSetup') is True:
        print("BUG FOUND: needsSetup is True but name is set!")
    else:
        print("needsSetup is False (Correct).")

    print(f"--- TEST 4: Request Status Persistence ---")
    # 1. Get Status
    resp = session.get(f"{BASE_URL}/student/status/{user_id}")
    reqs = resp.json()
    first_req_id = reqs[0]['id']
    print(f"Initial Status: {reqs[0]['status']}")

    # 2. Approve (Simulate HOD approval)
    print("Approving first request...")
    resp = session.post(f"{BASE_URL}/staff/approve", json={"id": first_req_id})
    print(f"Approve Status: {resp.status_code}")

    # 3. Check Status immediately
    resp = session.get(f"{BASE_URL}/student/status/{user_id}")
    reqs = resp.json()
    print(f"Status After Approve: {reqs[0]['status']}")

    # 4. Re-Login and Check Status
    print("Re-logging in...")
    resp = session.post(f"{BASE_URL}/login", json={"userId": TEST_USER_ID, "password": TEST_PASSWORD})
    
    resp = session.get(f"{BASE_URL}/student/status/{user_id}")
    reqs = resp.json()
    print(f"Status After Re-Login: {reqs[0]['status']}")
    
    if reqs[0]['status'] != 'approved':
         print("BUG FOUND: Status reverted to pending/locked!")

if __name__ == "__main__":
    run_test()
