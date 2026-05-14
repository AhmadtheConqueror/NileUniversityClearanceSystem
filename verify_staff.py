import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:5000/api"

def test_staff_clearance():
    # 1. Login as new Staff
    print("1. Testing Staff Login/Registration...")
    staff_id = "STF/001"
    password = "password123"
    
    resp = requests.post(f"{BASE_URL}/login", json={
        "userId": staff_id,
        "password": password,
        "role": "staff"
    })
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"   Success: {data['status']}, Role: {data['role']}, ID: {data['id']}")
        db_id = data['id']
    else:
        print(f"   Failed: {resp.text}")
        return

    # 2. Check Status (Should have 12 stages)
    print("\n2. Checking Staff Clearance Stages...")
    resp = requests.get(f"{BASE_URL}/student/status/{db_id}") # Uses same endpoint
    if resp.status_code == 200:
        stages = resp.json()
        print(f"   Found {len(stages)} stages.")
        expected_stages = [
            "Handover (HOD)", "Company Identity and Business Card (HR)", "Company Uniform (HOD)",
            "Library Materials (Library)", "Company Provided Telephone (HOD)", 
            "Security Keys and Tags (Security Office)", "Company Vehicle (Facility)",
            "Info System Facility (IT Unit)", "Local Banking Application (Finance)",
            "Outstanding Debts (HR)", "University Accommodation Handover (Facility)",
            "Exit Interview (HR)"
        ]
        
        match = True
        for i, stage in enumerate(stages):
            if stage['name'] != expected_stages[i]:
                print(f"   Mismatch at index {i}: Expected {expected_stages[i]}, got {stage['name']}")
                match = False
        
        if match:
            print("   All 12 stages match expected list.")
    else:
        print(f"   Failed to get status: {resp.text}")

    # 3. Schedule Interview (Unlock last stage just to test, or force it)
    # Since stages are sequential, we need to unlock stage 12.
    # We can cheat by approving stages 1-11 using the staff approval endpoint?
    # Or just try to schedule even if locked (if logic allows) or use a direct update for testing.
    # Let's try scheduling for stage 12 directly (Exit Interview).
    
    print("\n3. Testing Interview Scheduling...")
    # Find Exit Interview stage index/id
    exit_interview = next(s for s in stages if "Exit Interview" in s['name'])
    print(f"   Exit Interview Order: {exit_interview['order']}")
    
    # Attempt to schedule
    schedule_time = "2026-03-01T10:00:00"
    resp = requests.post(f"{BASE_URL}/student/schedule-appointment", json={
        "student_id": db_id,
        "order_index": exit_interview['order'],
        "date": schedule_time
    })
    
    if resp.status_code == 200:
        print("   Scheduling Success!")
    else:
        print(f"   Scheduling Failed: {resp.text}")

if __name__ == "__main__":
    try:
        test_staff_clearance()
    except Exception as e:
        print(f"Error: {e}")
        print("Is the Flask server running?")
