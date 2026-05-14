import requests
import time

BASE_URL = "http://127.0.0.1:5000/api"

def verify_retry():
    print("--- Verifying Retry Logic ---")
    
    # 1. Login as Admin
    requests.post(f"{BASE_URL}/login", json={"userId": "STF/ADMIN", "password": "adminpassword", "role": "staff"})
    
    student_id = "NU/20/CSC/1234"
    
    # Login as student to get ID
    s_resp = requests.post(f"{BASE_URL}/login", json={"userId": student_id, "password": "password", "role": "student"})
    s_id = s_resp.json()['id']
    
    # Find a pending step or create one
    # Let's assume there is at least something.
    status_resp = requests.get(f"{BASE_URL}/student/status/{s_id}")
    steps = status_resp.json()
    
    pending = next((s for s in steps if s['status'] == 'pending'), None)
    
    if not pending:
        print("No pending steps to reject. Automation stops here.")
        # Try to find one we can play with?
        return

    print(f"Rejecting step: {pending['name']}...")
    
    # Get staff request ID
    reqs = requests.get(f"{BASE_URL}/staff/requests").json()
    target = next((r for r in reqs if r['matric'] == student_id and r['office'] == pending['name']), None)
    
    if target:
        requests.post(f"{BASE_URL}/staff/reject", json={"id": target['id'], "comment": "Fix your documents"})
        print("Rejected.")
        
        # Verify Student sees 'rejected'
        s_resp_after = requests.get(f"{BASE_URL}/student/status/{s_id}")
        rej_step = next((s for s in s_resp_after.json() if s['order'] == pending['order']), None)
        
        if rej_step['status'] == 'rejected':
            print(f"-> SUCCESS: Status is 'rejected'. Comment: {rej_step['comment']}")
        else:
            print(f"-> FAIL: Status is {rej_step['status']}")
            
        # Simulate Retry
        print("Simulating Retry (Frontend logic calls request-clearance)...")
        retry_resp = requests.post(f"{BASE_URL}/student/request-clearance", json={"student_id": s_id, "order_index": pending['order']})
        
        if retry_resp.status_code == 200:
            print("Retry request sent.")
            s_resp_final = requests.get(f"{BASE_URL}/student/status/{s_id}")
            final_step = next((s for s in s_resp_final.json() if s['order'] == pending['order']), None)
            
            if final_step['status'] == 'pending':
                print("-> SUCCESS: Status reset to 'pending' after retry.")
            else:
                print(f"-> FAIL: Status is {final_step['status']}")
        else:
            print("-> FAIL: Retry request failed.")
            
    else:
        print("Could not find request in staff portal.")

if __name__ == "__main__":
    verify_retry()
