import requests
import json
from app import app, db, User

BASE_URL = "http://127.0.0.1:5000/api"

def test_case_sensitivity():
    session = requests.Session()
    
    # 1. Login with proper case (should exist from seed or previous tests if matching)
    # Actually, let's use a NEW seeded-like user concept or just test STF/HOD
    # STF/HOD exists from seed (if seed was run) or from my verify_fix which updated it.
    
    print("--- Test 1: Uppercase Login (STF/HOD) ---")
    resp = session.post(f"{BASE_URL}/login", json={"userId": "STF/HOD", "password": "password"})
    data = resp.json()
    print(f"ID: {data.get('id')}, Name: '{data.get('name')}'")
    id_upper = data.get('id')

    print("\n--- Test 2: Lowercase Login (stf/hod) ---")
    resp = session.post(f"{BASE_URL}/login", json={"userId": "stf/hod", "password": "password"})
    data = resp.json()
    print(f"ID: {data.get('id')}, Name: '{data.get('name')}'")
    id_lower = data.get('id')

    if id_upper != id_lower:
        print("\nFAILURE: IDs are different! Case sensitivity is creating duplicate accounts.")
    else:
        print("\nSUCCESS: IDs match. Case sensitivity is handled.")

if __name__ == "__main__":
    test_case_sensitivity()
