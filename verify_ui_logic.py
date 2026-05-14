import requests
import json

BASE_URL = "http://127.0.0.1:5000/api"

def test_ui_logic():
    # 1. Login as NEW Staff (to test needsSetup)
    print("1. Testing New Staff Login (needsSetup check)...")
    staff_id = "STF/new_ui_test"
    password = "password"
    
    resp = requests.post(f"{BASE_URL}/login", json={
        "userId": staff_id, "password": password, "role": "staff"
    })
    
    data = resp.json()
    if resp.status_code == 200:
        print(f"   Login Success. ID: {data['id']}")
        if data.get('needsSetup') == True:
            print("   SUCCESS: needsSetup is True for new staff.")
        else:
            print(f"   FAILURE: needsSetup is {data.get('needsSetup')}, expected True.")
        
        db_id = data['id']
    else:
        print(f"   Login Failed: {resp.text}")
        return

    # 2. Update Profile
    print("\n2. Testing Profile Update...")
    resp = requests.post(f"{BASE_URL}/student/update-profile", json={
        "student_id": db_id,
        "name": "Test Staff Name",
        "dept": "Testing Dept"
    })
    
    if resp.status_code == 200:
        print("   Profile Update Success.")
    else:
        print(f"   Profile Update Failed: {resp.text}")
        return

    # 3. Login Again to verify needsSetup is False
    print("\n3. Verifying needsSetup is gone...")
    resp = requests.post(f"{BASE_URL}/login", json={
        "userId": staff_id, "password": password, "role": "staff"
    })
    data = resp.json()
    if data.get('needsSetup') == False and data.get('name') == "Test Staff Name":
         print("   SUCCESS: needsSetup is False and Name is updated.")
    else:
         print(f"   FAILURE: needsSetup={data.get('needsSetup')}, Name={data.get('name')}")

    # 4. Test Request Clearance (Interactive Button)
    print("\n4. Testing Request Clearance (Stage 1)...")
    # Get status first to find Stage 1 order
    resp = requests.get(f"{BASE_URL}/student/status/{db_id}")
    stages = resp.json()
    stage1 = stages[0] # Handover (HOD)
    
    print(f"   Stage 1: {stage1['name']}, Status: {stage1['status']}")
    
    # Send Request
    resp = requests.post(f"{BASE_URL}/student/request-clearance", json={
        "student_id": db_id,
        "order_index": stage1['order']
    })
    
    if resp.status_code == 200:
        print("   Request Sent Success.")
        # Verify status changed to pending
        resp = requests.get(f"{BASE_URL}/student/status/{db_id}")
        new_status = resp.json()[0]['status']
        if new_status == 'pending':
            print("   SUCCESS: Status changed to 'pending'.")
        else:
             print(f"   FAILURE: Status is {new_status}, expected 'pending'.")
    else:
        print(f"   Request Failed: {resp.text}")

if __name__ == "__main__":
    try:
        test_ui_logic()
    except Exception as e:
        print(f"Error: {e}")
