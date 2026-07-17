#!/usr/bin/env python3
"""
Test NEW/MODIFIED backend behavior for Property Management System
Tests 7 specific scenarios as requested:
1. Single active session
2. Logout endpoint
3. Cannot delete main admin
4. Can delete secondary admin
5. Arabic error messages on delete constraints
6. Unit delete broader integrity (utility_bills + maintenance)
7. Regression: normal CRUD still works
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "https://refactor-hub-43.preview.emergentagent.com/api"

print("=" * 80)
print("PROPERTY MANAGEMENT SYSTEM - NEW FEATURES TEST")
print("=" * 80)
print(f"Base URL: {BASE_URL}")
print(f"Test started at: {datetime.now().isoformat()}")
print("=" * 80)

# Track results
results = []

def log_result(test_num, test_name, passed, details):
    status = "✅ PASS" if passed else "❌ FAIL"
    results.append({
        "test": f"Test {test_num}: {test_name}",
        "passed": passed,
        "details": details
    })
    print(f"\n{status} - Test {test_num}: {test_name}")
    print(f"Details: {details}")

# ============= Test 1 - Single active session =============
print("\n" + "=" * 80)
print("TEST 1 - Single active session")
print("=" * 80)

try:
    # Login as admin → save token as TOKEN_A
    print("\n[1a] Login as admin (first session)")
    resp_a = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin"})
    if resp_a.status_code != 200:
        log_result(1, "Single active session", False, f"First login failed: {resp_a.status_code} {resp_a.text}")
    else:
        TOKEN_A = resp_a.json()["access_token"]
        print(f"TOKEN_A obtained: {TOKEN_A[:20]}...")
        
        # Small delay to avoid race condition
        time.sleep(0.5)
        
        # Login as admin again → save token as TOKEN_B
        print("\n[1b] Login as admin again (second session)")
        resp_b = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin"})
        if resp_b.status_code != 200:
            log_result(1, "Single active session", False, f"Second login failed: {resp_b.status_code} {resp_b.text}")
        else:
            TOKEN_B = resp_b.json()["access_token"]
            print(f"TOKEN_B obtained: {TOKEN_B[:20]}...")
            
            # GET /api/auth/me with TOKEN_A → expect 401 with detail containing "تم تسجيل دخولك من جهاز آخر"
            print("\n[1c] GET /auth/me with TOKEN_A (should be kicked out)")
            resp_me_a = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {TOKEN_A}"})
            print(f"Status: {resp_me_a.status_code}")
            print(f"Response: {resp_me_a.text}")
            
            if resp_me_a.status_code == 401:
                detail = resp_me_a.json().get("detail", "")
                if "تم تسجيل دخولك من جهاز آخر" in detail or "تم تسجيل" in detail:
                    print("✓ TOKEN_A correctly returns 401 with Arabic message about other device")
                    
                    # GET /api/auth/me with TOKEN_B → expect 200
                    print("\n[1d] GET /auth/me with TOKEN_B (should work)")
                    resp_me_b = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {TOKEN_B}"})
                    print(f"Status: {resp_me_b.status_code}")
                    
                    if resp_me_b.status_code == 200:
                        log_result(1, "Single active session", True, 
                                 f"TOKEN_A returns 401 ('{detail}'), TOKEN_B returns 200")
                    else:
                        log_result(1, "Single active session", False, 
                                 f"TOKEN_B should return 200 but got {resp_me_b.status_code}: {resp_me_b.text}")
                else:
                    log_result(1, "Single active session", False, 
                             f"TOKEN_A returns 401 but detail doesn't contain expected Arabic text. Got: '{detail}'")
            else:
                log_result(1, "Single active session", False, 
                         f"TOKEN_A should return 401 but got {resp_me_a.status_code}: {resp_me_a.text}")
except Exception as e:
    log_result(1, "Single active session", False, f"Exception: {str(e)}")

# ============= Test 2 - Logout endpoint =============
print("\n" + "=" * 80)
print("TEST 2 - Logout endpoint")
print("=" * 80)

try:
    # Login as admin → TOKEN_C
    print("\n[2a] Login as admin")
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin"})
    if resp.status_code != 200:
        log_result(2, "Logout endpoint", False, f"Login failed: {resp.status_code} {resp.text}")
    else:
        TOKEN_C = resp.json()["access_token"]
        print(f"TOKEN_C obtained: {TOKEN_C[:20]}...")
        
        # POST /api/auth/logout with TOKEN_C → expect 200 {"ok": true}
        print("\n[2b] POST /auth/logout with TOKEN_C")
        resp_logout = requests.post(f"{BASE_URL}/auth/logout", headers={"Authorization": f"Bearer {TOKEN_C}"})
        print(f"Status: {resp_logout.status_code}")
        print(f"Response: {resp_logout.text}")
        
        if resp_logout.status_code == 200:
            data = resp_logout.json()
            if data.get("ok") == True:
                print("✓ Logout returns 200 with ok=true")
                
                # GET /api/auth/me with TOKEN_C → expect 401
                print("\n[2c] GET /auth/me with TOKEN_C (should be logged out)")
                resp_me = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {TOKEN_C}"})
                print(f"Status: {resp_me.status_code}")
                
                if resp_me.status_code == 401:
                    log_result(2, "Logout endpoint", True, 
                             f"Logout returns 200 with ok=true, subsequent /auth/me returns 401")
                else:
                    log_result(2, "Logout endpoint", False, 
                             f"After logout, /auth/me should return 401 but got {resp_me.status_code}")
            else:
                log_result(2, "Logout endpoint", False, f"Logout returns 200 but ok != true: {data}")
        else:
            log_result(2, "Logout endpoint", False, f"Logout should return 200 but got {resp_logout.status_code}: {resp_logout.text}")
except Exception as e:
    log_result(2, "Logout endpoint", False, f"Exception: {str(e)}")

# ============= Test 3 - Cannot delete main admin =============
print("\n" + "=" * 80)
print("TEST 3 - Cannot delete main admin")
print("=" * 80)

try:
    # Login as admin
    print("\n[3a] Login as admin")
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin"})
    if resp.status_code != 200:
        log_result(3, "Cannot delete main admin", False, f"Login failed: {resp.status_code} {resp.text}")
    else:
        TOKEN = resp.json()["access_token"]
        
        # GET /api/users; find user with username == "admin"
        print("\n[3b] GET /users to find main admin id")
        resp_users = requests.get(f"{BASE_URL}/users", headers={"Authorization": f"Bearer {TOKEN}"})
        if resp_users.status_code != 200:
            log_result(3, "Cannot delete main admin", False, f"GET /users failed: {resp_users.status_code}")
        else:
            users = resp_users.json()
            main_admin = next((u for u in users if u.get("username") == "admin"), None)
            if not main_admin:
                log_result(3, "Cannot delete main admin", False, "Could not find user with username='admin'")
            else:
                main_admin_id = main_admin["id"]
                print(f"Main admin id: {main_admin_id}")
                
                # DELETE /api/users/{main_admin_id} → expect 403 with detail "لا يمكن حذف حساب مدير النظام الرئيسي"
                print(f"\n[3c] DELETE /users/{main_admin_id}")
                resp_del = requests.delete(f"{BASE_URL}/users/{main_admin_id}", headers={"Authorization": f"Bearer {TOKEN}"})
                print(f"Status: {resp_del.status_code}")
                print(f"Response: {resp_del.text}")
                
                if resp_del.status_code == 403:
                    detail = resp_del.json().get("detail", "")
                    if "لا يمكن حذف حساب مدير النظام الرئيسي" in detail:
                        log_result(3, "Cannot delete main admin", True, 
                                 f"DELETE returns 403 with correct Arabic message: '{detail}'")
                    else:
                        log_result(3, "Cannot delete main admin", False, 
                                 f"DELETE returns 403 but detail doesn't match. Got: '{detail}'")
                else:
                    log_result(3, "Cannot delete main admin", False, 
                             f"DELETE should return 403 but got {resp_del.status_code}: {resp_del.text}")
except Exception as e:
    log_result(3, "Cannot delete main admin", False, f"Exception: {str(e)}")

# ============= Test 4 - Can delete secondary admin =============
print("\n" + "=" * 80)
print("TEST 4 - Can delete secondary admin")
print("=" * 80)

try:
    # Login as admin
    print("\n[4a] Login as admin")
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin"})
    if resp.status_code != 200:
        log_result(4, "Can delete secondary admin", False, f"Login failed: {resp.status_code} {resp.text}")
    else:
        TOKEN = resp.json()["access_token"]
        
        # POST /api/users with body {"name":"Admin2","username":"admin2","password":"pw12345","role":"admin","is_active":true}
        print("\n[4b] POST /users to create secondary admin")
        resp_create = requests.post(f"{BASE_URL}/users", 
                                    json={"name": "Admin2", "username": "admin2", "password": "pw12345", 
                                          "role": "admin", "is_active": True},
                                    headers={"Authorization": f"Bearer {TOKEN}"})
        print(f"Status: {resp_create.status_code}")
        
        if resp_create.status_code != 200:
            log_result(4, "Can delete secondary admin", False, 
                     f"Failed to create secondary admin: {resp_create.status_code} {resp_create.text}")
        else:
            admin2_id = resp_create.json()["id"]
            print(f"Admin2 created with id: {admin2_id}")
            
            # DELETE /api/users/{admin2_id} → expect 200
            print(f"\n[4c] DELETE /users/{admin2_id}")
            resp_del = requests.delete(f"{BASE_URL}/users/{admin2_id}", headers={"Authorization": f"Bearer {TOKEN}"})
            print(f"Status: {resp_del.status_code}")
            print(f"Response: {resp_del.text}")
            
            if resp_del.status_code == 200:
                log_result(4, "Can delete secondary admin", True, 
                         f"Secondary admin created and deleted successfully")
            else:
                log_result(4, "Can delete secondary admin", False, 
                         f"DELETE should return 200 but got {resp_del.status_code}: {resp_del.text}")
except Exception as e:
    log_result(4, "Can delete secondary admin", False, f"Exception: {str(e)}")

# ============= Test 5 - Arabic error messages on delete constraints =============
print("\n" + "=" * 80)
print("TEST 5 - Arabic error messages on delete constraints")
print("=" * 80)

try:
    # Login as admin
    print("\n[5a] Login as admin")
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin"})
    if resp.status_code != 200:
        log_result(5, "Arabic delete error messages", False, f"Login failed: {resp.status_code} {resp.text}")
    else:
        TOKEN = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {TOKEN}"}
        
        test_5_results = []
        
        # 5.1: Owner with properties
        print("\n[5.1] Test owner with properties")
        resp_owners = requests.get(f"{BASE_URL}/owners", headers=headers)
        resp_props = requests.get(f"{BASE_URL}/properties", headers=headers)
        if resp_owners.status_code == 200 and resp_props.status_code == 200:
            owners = resp_owners.json()
            properties = resp_props.json()
            # Find an owner that has properties
            owner_with_props = None
            for owner in owners:
                if any(p.get("owner_id") == owner["id"] for p in properties):
                    owner_with_props = owner
                    break
            
            if owner_with_props:
                print(f"Found owner with properties: {owner_with_props['id']}")
                resp_del = requests.delete(f"{BASE_URL}/owners/{owner_with_props['id']}", headers=headers)
                print(f"DELETE owner status: {resp_del.status_code}")
                print(f"Response: {resp_del.text}")
                
                if resp_del.status_code == 409:
                    detail = resp_del.json().get("detail", "")
                    if "لا يمكن حذف المالك" in detail:
                        test_5_results.append("✓ Owner: 409 with 'لا يمكن حذف المالك'")
                    else:
                        test_5_results.append(f"✗ Owner: 409 but wrong message: '{detail}'")
                else:
                    test_5_results.append(f"✗ Owner: Expected 409, got {resp_del.status_code}")
            else:
                test_5_results.append("⚠ Owner: No owner with properties found to test")
        
        # 5.2: Property with units
        print("\n[5.2] Test property with units")
        resp_props = requests.get(f"{BASE_URL}/properties", headers=headers)
        resp_units = requests.get(f"{BASE_URL}/units", headers=headers)
        if resp_props.status_code == 200 and resp_units.status_code == 200:
            properties = resp_props.json()
            units = resp_units.json()
            # Find a property that has units
            prop_with_units = None
            for prop in properties:
                if any(u.get("property_id") == prop["id"] for u in units):
                    prop_with_units = prop
                    break
            
            if prop_with_units:
                print(f"Found property with units: {prop_with_units['id']}")
                resp_del = requests.delete(f"{BASE_URL}/properties/{prop_with_units['id']}", headers=headers)
                print(f"DELETE property status: {resp_del.status_code}")
                print(f"Response: {resp_del.text}")
                
                if resp_del.status_code == 409:
                    detail = resp_del.json().get("detail", "")
                    if "لا يمكن حذف العقار" in detail:
                        test_5_results.append("✓ Property: 409 with 'لا يمكن حذف العقار'")
                    else:
                        test_5_results.append(f"✗ Property: 409 but wrong message: '{detail}'")
                else:
                    test_5_results.append(f"✗ Property: Expected 409, got {resp_del.status_code}")
            else:
                test_5_results.append("⚠ Property: No property with units found to test")
        
        # 5.3: Unit with contracts
        print("\n[5.3] Test unit with contracts")
        resp_contracts = requests.get(f"{BASE_URL}/contracts", headers=headers)
        if resp_contracts.status_code == 200:
            contracts = resp_contracts.json()
            if contracts:
                unit_id = contracts[0].get("unit_id")
                if unit_id:
                    print(f"Found unit with contract: {unit_id}")
                    resp_del = requests.delete(f"{BASE_URL}/units/{unit_id}", headers=headers)
                    print(f"DELETE unit status: {resp_del.status_code}")
                    print(f"Response: {resp_del.text}")
                    
                    if resp_del.status_code == 409:
                        detail = resp_del.json().get("detail", "")
                        if "لا يمكن حذف الوحدة" in detail:
                            test_5_results.append("✓ Unit: 409 with 'لا يمكن حذف الوحدة'")
                        else:
                            test_5_results.append(f"✗ Unit: 409 but wrong message: '{detail}'")
                    else:
                        test_5_results.append(f"✗ Unit: Expected 409, got {resp_del.status_code}")
                else:
                    test_5_results.append("⚠ Unit: Contract has no unit_id")
            else:
                test_5_results.append("⚠ Unit: No contracts found to test")
        
        # 5.4: Tenant with contracts
        print("\n[5.4] Test tenant with contracts")
        resp_contracts = requests.get(f"{BASE_URL}/contracts", headers=headers)
        if resp_contracts.status_code == 200:
            contracts = resp_contracts.json()
            if contracts:
                tenant_id = contracts[0].get("tenant_id")
                if tenant_id:
                    print(f"Found tenant with contract: {tenant_id}")
                    resp_del = requests.delete(f"{BASE_URL}/tenants/{tenant_id}", headers=headers)
                    print(f"DELETE tenant status: {resp_del.status_code}")
                    print(f"Response: {resp_del.text}")
                    
                    if resp_del.status_code == 409:
                        detail = resp_del.json().get("detail", "")
                        if "لا يمكن حذف المستأجر" in detail:
                            test_5_results.append("✓ Tenant: 409 with 'لا يمكن حذف المستأجر'")
                        else:
                            test_5_results.append(f"✗ Tenant: 409 but wrong message: '{detail}'")
                    else:
                        test_5_results.append(f"✗ Tenant: Expected 409, got {resp_del.status_code}")
                else:
                    test_5_results.append("⚠ Tenant: Contract has no tenant_id")
            else:
                test_5_results.append("⚠ Tenant: No contracts found to test")
        
        # Evaluate overall test 5
        failures = [r for r in test_5_results if r.startswith("✗")]
        if not failures:
            log_result(5, "Arabic delete error messages", True, " | ".join(test_5_results))
        else:
            log_result(5, "Arabic delete error messages", False, " | ".join(test_5_results))
except Exception as e:
    log_result(5, "Arabic delete error messages", False, f"Exception: {str(e)}")

# ============= Test 6 - Unit delete broader integrity (utility_bills + maintenance) =============
print("\n" + "=" * 80)
print("TEST 6 - Unit delete broader integrity")
print("=" * 80)

try:
    # Login as admin
    print("\n[6a] Login as admin")
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin"})
    if resp.status_code != 200:
        log_result(6, "Unit delete broader integrity", False, f"Login failed: {resp.status_code} {resp.text}")
    else:
        TOKEN = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {TOKEN}"}
        
        test_6_results = []
        
        # Step A - Setup: Create a fresh unit
        print("\n[6.A] Setup: Create a fresh unit")
        resp_props = requests.get(f"{BASE_URL}/properties", headers=headers)
        if resp_props.status_code != 200 or not resp_props.json():
            test_6_results.append("✗ Setup: No properties available")
        else:
            property_id = resp_props.json()[0]["id"]
            print(f"Using property_id: {property_id}")
            
            resp_create_unit = requests.post(f"{BASE_URL}/units", 
                                            json={"property_id": property_id, "unit_number": "INTEG_TEST",
                                                  "area": 50, "rooms": 2, "bathrooms": 1, 
                                                  "rent_price": 1000, "status": "vacant"},
                                            headers=headers)
            print(f"Create unit status: {resp_create_unit.status_code}")
            
            if resp_create_unit.status_code != 200:
                test_6_results.append(f"✗ Setup: Failed to create unit: {resp_create_unit.text}")
            else:
                unit_id = resp_create_unit.json()["id"]
                print(f"Created unit_id: {unit_id}")
                test_6_results.append(f"✓ Setup: Created unit {unit_id}")
                
                # Step B - Utility bill blocks delete
                print("\n[6.B] Utility bill blocks delete")
                resp_tenants = requests.get(f"{BASE_URL}/tenants", headers=headers)
                if resp_tenants.status_code != 200 or not resp_tenants.json():
                    test_6_results.append("✗ Step B: No tenants available")
                else:
                    tenant_id = resp_tenants.json()[0]["id"]
                    print(f"Using tenant_id: {tenant_id}")
                    
                    resp_create_bill = requests.post(f"{BASE_URL}/utility_bills",
                                                    json={"unit_id": unit_id, "tenant_id": tenant_id,
                                                          "bill_type": "electricity", "period_from": "2026-06-01",
                                                          "period_to": "2026-06-30", "issue_date": "2026-07-01",
                                                          "due_date": "2026-07-20", "amount": 100, "status": "pending"},
                                                    headers=headers)
                    print(f"Create utility bill status: {resp_create_bill.status_code}")
                    
                    if resp_create_bill.status_code != 200:
                        test_6_results.append(f"✗ Step B: Failed to create utility bill: {resp_create_bill.text}")
                    else:
                        bill_id = resp_create_bill.json()["id"]
                        print(f"Created bill_id: {bill_id}")
                        
                        # Try to delete unit - should fail with 409
                        resp_del_unit = requests.delete(f"{BASE_URL}/units/{unit_id}", headers=headers)
                        print(f"DELETE unit (with bill) status: {resp_del_unit.status_code}")
                        print(f"Response: {resp_del_unit.text}")
                        
                        if resp_del_unit.status_code == 409:
                            detail = resp_del_unit.json().get("detail", "")
                            if "فاتورة مرافق" in detail:
                                test_6_results.append("✓ Step B: Unit delete blocked by utility bill with correct Arabic message")
                            else:
                                test_6_results.append(f"✗ Step B: 409 but wrong message: '{detail}'")
                        else:
                            test_6_results.append(f"✗ Step B: Expected 409, got {resp_del_unit.status_code}")
                        
                        # Delete the utility bill
                        resp_del_bill = requests.delete(f"{BASE_URL}/utility_bills/{bill_id}", headers=headers)
                        print(f"DELETE utility bill status: {resp_del_bill.status_code}")
                        if resp_del_bill.status_code == 200:
                            test_6_results.append("✓ Step B: Utility bill deleted")
                        else:
                            test_6_results.append(f"✗ Step B: Failed to delete bill: {resp_del_bill.status_code}")
                        
                        # Step C - Maintenance blocks delete
                        print("\n[6.C] Maintenance blocks delete")
                        resp_create_mnt = requests.post(f"{BASE_URL}/maintenance",
                                                       json={"property_id": property_id, "unit_id": unit_id,
                                                             "title": "Test", "description": "test",
                                                             "priority": "low", "status": "pending",
                                                             "reported_date": "2026-07-01"},
                                                       headers=headers)
                        print(f"Create maintenance status: {resp_create_mnt.status_code}")
                        
                        if resp_create_mnt.status_code != 200:
                            test_6_results.append(f"✗ Step C: Failed to create maintenance: {resp_create_mnt.text}")
                        else:
                            mnt_id = resp_create_mnt.json()["id"]
                            print(f"Created maintenance_id: {mnt_id}")
                            
                            # Try to delete unit - should fail with 409
                            resp_del_unit = requests.delete(f"{BASE_URL}/units/{unit_id}", headers=headers)
                            print(f"DELETE unit (with maintenance) status: {resp_del_unit.status_code}")
                            print(f"Response: {resp_del_unit.text}")
                            
                            if resp_del_unit.status_code == 409:
                                detail = resp_del_unit.json().get("detail", "")
                                if "طلب صيانة" in detail:
                                    test_6_results.append("✓ Step C: Unit delete blocked by maintenance with correct Arabic message")
                                else:
                                    test_6_results.append(f"✗ Step C: 409 but wrong message: '{detail}'")
                            else:
                                test_6_results.append(f"✗ Step C: Expected 409, got {resp_del_unit.status_code}")
                            
                            # Delete the maintenance
                            resp_del_mnt = requests.delete(f"{BASE_URL}/maintenance/{mnt_id}", headers=headers)
                            print(f"DELETE maintenance status: {resp_del_mnt.status_code}")
                            if resp_del_mnt.status_code == 200:
                                test_6_results.append("✓ Step C: Maintenance deleted")
                            else:
                                test_6_results.append(f"✗ Step C: Failed to delete maintenance: {resp_del_mnt.status_code}")
                            
                            # Step D - Now clean unit deletes
                            print("\n[6.D] Clean unit delete")
                            resp_del_unit = requests.delete(f"{BASE_URL}/units/{unit_id}", headers=headers)
                            print(f"DELETE unit (clean) status: {resp_del_unit.status_code}")
                            
                            if resp_del_unit.status_code == 200:
                                test_6_results.append("✓ Step D: Clean unit deleted successfully")
                            else:
                                test_6_results.append(f"✗ Step D: Expected 200, got {resp_del_unit.status_code}: {resp_del_unit.text}")
        
        # Evaluate overall test 6
        failures = [r for r in test_6_results if r.startswith("✗")]
        if not failures:
            log_result(6, "Unit delete broader integrity", True, " | ".join(test_6_results))
        else:
            log_result(6, "Unit delete broader integrity", False, " | ".join(test_6_results))
except Exception as e:
    log_result(6, "Unit delete broader integrity", False, f"Exception: {str(e)}")

# ============= Test 7 - Regression: normal CRUD still works =============
print("\n" + "=" * 80)
print("TEST 7 - Regression: normal CRUD still works")
print("=" * 80)

try:
    # Login as admin
    print("\n[7a] Login as admin")
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin"})
    if resp.status_code != 200:
        log_result(7, "Regression: normal CRUD", False, f"Login failed: {resp.status_code} {resp.text}")
    else:
        TOKEN = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {TOKEN}"}
        
        test_7_results = []
        
        # GET /api/owners → 200 with list
        print("\n[7.1] GET /owners")
        resp_owners = requests.get(f"{BASE_URL}/owners", headers=headers)
        print(f"Status: {resp_owners.status_code}")
        if resp_owners.status_code == 200 and isinstance(resp_owners.json(), list):
            test_7_results.append(f"✓ GET /owners returns 200 with list ({len(resp_owners.json())} items)")
        else:
            test_7_results.append(f"✗ GET /owners: Expected 200 with list, got {resp_owners.status_code}")
        
        # GET /api/dashboard/summary → 200 with expected keys
        print("\n[7.2] GET /dashboard/summary")
        resp_dash = requests.get(f"{BASE_URL}/dashboard/summary", headers=headers)
        print(f"Status: {resp_dash.status_code}")
        if resp_dash.status_code == 200:
            summary = resp_dash.json()
            required_keys = ["thisMonthRevenue", "monthlyRevenue", "monthlyExpenses"]
            missing = [k for k in required_keys if k not in summary]
            if not missing:
                monthly_rev_len = len(summary.get("monthlyRevenue", []))
                if monthly_rev_len == 12:
                    test_7_results.append(f"✓ GET /dashboard/summary returns 200 with all keys, monthlyRevenue length=12")
                else:
                    test_7_results.append(f"✗ Dashboard: monthlyRevenue length={monthly_rev_len}, expected 12")
            else:
                test_7_results.append(f"✗ Dashboard: Missing keys: {missing}")
        else:
            test_7_results.append(f"✗ GET /dashboard/summary: Expected 200, got {resp_dash.status_code}")
        
        # Evaluate overall test 7
        failures = [r for r in test_7_results if r.startswith("✗")]
        if not failures:
            log_result(7, "Regression: normal CRUD", True, " | ".join(test_7_results))
        else:
            log_result(7, "Regression: normal CRUD", False, " | ".join(test_7_results))
except Exception as e:
    log_result(7, "Regression: normal CRUD", False, f"Exception: {str(e)}")

# ============= FINAL SUMMARY =============
print("\n" + "=" * 80)
print("FINAL TEST SUMMARY")
print("=" * 80)

passed = sum(1 for r in results if r["passed"])
failed = sum(1 for r in results if not r["passed"])
total = len(results)

print(f"\nTotal Tests: {total}")
print(f"Passed: {passed}")
print(f"Failed: {failed}")

print("\n" + "=" * 80)
print("DETAILED RESULTS:")
print("=" * 80)
for r in results:
    status = "✅ PASS" if r["passed"] else "❌ FAIL"
    print(f"\n{status} - {r['test']}")
    print(f"  {r['details']}")

print("\n" + "=" * 80)
print(f"Test completed at: {datetime.now().isoformat()}")
print("=" * 80)

# Exit with appropriate code
exit(0 if failed == 0 else 1)
