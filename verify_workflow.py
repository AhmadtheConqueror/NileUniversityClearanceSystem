import requests
import time

BASE_URL = "http://127.0.0.1:5000/api"

def verify_workflow():
    print("--- Verifying Workflow Changes ---")
    
    # Login as Admin
    print("Logging in as Admin...")
    requests.post(f"{BASE_URL}/login", json={"userId": "STF/ADMIN", "password": "adminpassword", "role": "staff"})
    
    # 1. Create a fresh student or use existing "NU/20/CSC/1234"
    # To start clean, let's pick a step that is "pending".
    # Since we approved step 1 before, step 2 should now be 'unlocked' per our code change? 
    # Actually, if we ran the OLD code, step 2 became 'pending'.
    # So we might need to manually reset or check status.
    
    student_id = "NU/20/CSC/1234"
    print(f"Checking status for {student_id}...")
    
    # Login as student to get ID
    s_resp = requests.post(f"{BASE_URL}/login", json={"userId": student_id, "password": "password", "role": "student"})
    s_id = s_resp.json()['id']
    
    # Get status
    status_resp = requests.get(f"{BASE_URL}/student/status/{s_id}")
    steps = status_resp.json()
    
    # Check if we have an unlocked step or pending step
    unlocked = next((s for s in steps if s['status'] == 'unlocked'), None)
    pending = next((s for s in steps if s['status'] == 'pending'), None)
    
    if unlocked:
        print(f"-> Found UNLOCKED step: {unlocked['name']} (Order {unlocked['order']})")
        print("-> SUCCESS: Backend is correctly setting 'unlocked' status (or it persisted).")
        
        # Simulate Student Clicking 'Request'
        print("Simulating 'Request' click...")
        req_resp = requests.post(f"{BASE_URL}/student/request-clearance", json={"student_id": s_id, "order_index": unlocked['order']})
        
        if req_resp.status_code == 200:
            print("-> Request success.")
            # Check if it is now PENDING
            s_resp_after = requests.get(f"{BASE_URL}/student/status/{s_id}")
            updated_step = next((s for s in s_resp_after.json() if s['order'] == unlocked['order']), None)
            if updated_step['status'] == 'pending':
                print("-> SUCCESS: Status changed to 'pending' after request.")
            else:
                print(f"-> FAIL: Status is {updated_step['status']}, expected 'pending'.")
        else:
            print(f"-> FAIL: Request API call failed: {req_resp.json()}")

    elif pending:
        print(f"Found PENDING step: {pending['name']}. This might be from old test data.")
        # Approve it to see if NEXT step becomes unlocked
        print(f"Approving {pending['name']}...")
        
        # Need request ID from staff portal
        staff_reqs = requests.get(f"{BASE_URL}/staff/requests").json()
        target = next((r for r in staff_reqs if r['matric'] == student_id and r['office'] == pending['name']), None)
        
        if target:
            requests.post(f"{BASE_URL}/staff/approve", json={"id": target['id']})
            print("Approved.")
            
            # Now Check Status of NEXT step
            s_resp_after = requests.get(f"{BASE_URL}/student/status/{s_id}")
            next_step = next((s for s in s_resp_after.json() if s['order'] == pending['order'] + 1), None)
            
            if next_step and next_step['status'] == 'unlocked':
                print(f"-> SUCCESS: Next step {next_step['name']} became 'unlocked'.")
            else:
                print(f"-> FAIL: Next step status is {next_step['status'] if next_step else 'None'}, expected 'unlocked'.")
        else:
            print("Could not find pending request in staff portal to approve.")
            
    else:
        print("No interesting steps found (maybe all locked or approved?).")

if __name__ == "__main__":
    verify_workflow()
