import requests

BASE_URL = "http://127.0.0.1:5000/api"

def verify_roles():
    print("--- Verifying Role Access ---")
    
    # 1. Login as Bursary Staff
    print("Logging in as STF/BURSARY...")
    resp = requests.post(f"{BASE_URL}/login", json={"userId": "STF/BURSARY", "password": "adminpassword", "role": "staff"})
    if resp.status_code != 200:
        print("Login failed for STF/BURSARY")
        return
        
    data = resp.json()
    dept = data.get('department')
    print(f"Logged in. Dept: {dept}")
    
    if dept != 'Bursary':
         print("FAIL: Expected Dept 'Bursary'")
    
    # 2. Check Requests - Should only see Bursary
    print("Fetching requests for STF/BURSARY...")
    # Emulate frontend call with param
    reqs = requests.get(f"{BASE_URL}/staff/requests", params={"department": dept}).json()
    
    bursary_only = all(r['office'] == 'Bursary' for r in reqs)
    if bursary_only:
        print(f"SUCCESS: Fetched {len(reqs)} requests. All are 'Bursary'.")
    else:
        print("FAIL: Found requests for other departments!")
        for r in reqs:
             if r['office'] != 'Bursary': print(f" - Found bad request: {r['office']}")

    # 3. Login as Hostel Staff
    print("\nLogging in as STF/HOSTEL...")
    resp = requests.post(f"{BASE_URL}/login", json={"userId": "STF/HOSTEL", "password": "adminpassword", "role": "staff"})
    dept = resp.json().get('department')
    print(f"Logged in. Dept: {dept}")
    
    reqs = requests.get(f"{BASE_URL}/staff/requests", params={"department": dept}).json()
    hostel_only = all(r['office'] == 'Hostel' for r in reqs)
    
    if hostel_only:
        print(f"SUCCESS: Fetched {len(reqs)} requests. All are 'Hostel'.")
    else:
        print("FAIL: Found requests for other departments!")

if __name__ == "__main__":
    verify_roles()
