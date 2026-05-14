import requests
import json
from app import app, db, User, ClearanceRequest

# Configuration
BASE_URL = "http://127.0.0.1:5000/api"
TEST_USER_ID = "STF/EMP_TEST_4" 
TEST_PASSWORD = "password123"

def run_test():
    results = {}
    session = requests.Session()
    
    try:
        # 1. Login
        resp = session.post(f"{BASE_URL}/login", json={"userId": TEST_USER_ID, "password": TEST_PASSWORD})
        user_id = resp.json()['id']
        results['login_1_status'] = resp.status_code
        results['user_id'] = user_id

        # 2. Update Profile
        resp = session.post(f"{BASE_URL}/student/update-profile", json={"student_id": user_id, "name": "Test User 4"})
        results['update_status'] = resp.status_code

        # 3. Re-Login
        resp = session.post(f"{BASE_URL}/login", json={"userId": TEST_USER_ID, "password": TEST_PASSWORD})
        data = resp.json()
        results['relogin_name'] = data.get('name')
        results['relogin_needsSetup'] = data.get('needsSetup')

        # 4. Request Status
        resp = session.get(f"{BASE_URL}/student/status/{user_id}")
        reqs = resp.json()
        first_req_id = reqs[0]['id']
        results['initial_req_status'] = reqs[0]['status']

        # 5. Approve
        resp = session.post(f"{BASE_URL}/staff/approve", json={"id": first_req_id})
        results['approve_status'] = resp.status_code

        # 6. Re-Login and Check Status
        resp = session.post(f"{BASE_URL}/login", json={"userId": TEST_USER_ID, "password": TEST_PASSWORD})
        resp = session.get(f"{BASE_URL}/student/status/{user_id}")
        reqs = resp.json()
        results['final_req_status'] = reqs[0]['status']
        results['second_req_status'] = reqs[1]['status'] # Should be unlocked?

    except Exception as e:
        results['error'] = str(e)
    
    with open('test_results.json', 'w') as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    run_test()
