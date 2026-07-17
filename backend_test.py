#!/usr/bin/env python3
"""
Comprehensive backend API test for Property Management System
Tests all endpoints as specified in the review request
"""
import requests
import json
from datetime import datetime, timedelta

# Base URL from frontend/.env
BASE_URL = "https://refactor-hub-43.preview.emergentagent.com/api"

# Test results tracking
test_results = {
    "passed": [],
    "failed": [],
    "warnings": []
}

def log_pass(test_name):
    test_results["passed"].append(test_name)
    print(f"✅ PASS: {test_name}")

def log_fail(test_name, reason):
    test_results["failed"].append(f"{test_name}: {reason}")
    print(f"❌ FAIL: {test_name}")
    print(f"   Reason: {reason}")

def log_warning(test_name, reason):
    test_results["warnings"].append(f"{test_name}: {reason}")
    print(f"⚠️  WARNING: {test_name}: {reason}")

# Session for maintaining state
session = requests.Session()
admin_token = None
accountant_token = None

# Store created IDs for cleanup
created_ids = {
    "owners": [],
    "properties": [],
    "units": [],
    "tenants": [],
    "contracts": [],
    "payments": [],
    "expenses": [],
    "maintenance": [],
    "users": []
}

print("=" * 80)
print("PROPERTY MANAGEMENT SYSTEM - BACKEND API TEST")
print("=" * 80)
print(f"Base URL: {BASE_URL}")
print(f"Test started at: {datetime.now().isoformat()}")
print("=" * 80)

# ============= 1. AUTHENTICATION TESTS =============
print("\n" + "=" * 80)
print("1. AUTHENTICATION TESTS")
print("=" * 80)

# Test 1.1: Login with admin credentials
print("\n[1.1] POST /auth/login with admin/admin")
try:
    response = session.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "admin"
    })
    if response.status_code == 200:
        data = response.json()
        if "access_token" in data and data.get("token_type") == "bearer" and "user" in data:
            user = data["user"]
            if user.get("role") == "admin" and "password" not in user:
                admin_token = data["access_token"]
                log_pass("Admin login successful with correct response structure")
            else:
                log_fail("Admin login", f"User role is {user.get('role')} or password field present")
        else:
            log_fail("Admin login", f"Missing required fields in response: {data}")
    else:
        log_fail("Admin login", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("Admin login", f"Exception: {str(e)}")

# Test 1.2: Login with wrong password
print("\n[1.2] POST /auth/login with wrong password")
try:
    response = session.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "wrongpassword"
    })
    if response.status_code == 401:
        log_pass("Login with wrong password correctly returns 401")
    else:
        log_fail("Login with wrong password", f"Expected 401, got {response.status_code}")
except Exception as e:
    log_fail("Login with wrong password", f"Exception: {str(e)}")

# Test 1.3: GET /auth/me with valid token
print("\n[1.3] GET /auth/me with valid Bearer token")
try:
    if admin_token:
        response = session.get(f"{BASE_URL}/auth/me", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        if response.status_code == 200:
            user = response.json()
            if "id" in user and "username" in user and "password" not in user:
                log_pass("GET /auth/me returns user object without password")
            else:
                log_fail("GET /auth/me", f"Invalid user object: {user}")
        else:
            log_fail("GET /auth/me", f"Status {response.status_code}: {response.text}")
    else:
        log_fail("GET /auth/me", "No admin token available")
except Exception as e:
    log_fail("GET /auth/me", f"Exception: {str(e)}")

# Test 1.4: GET /auth/me without token
print("\n[1.4] GET /auth/me WITHOUT token")
try:
    response = requests.get(f"{BASE_URL}/auth/me")
    if response.status_code == 401:
        log_pass("GET /auth/me without token correctly returns 401")
    else:
        log_fail("GET /auth/me without token", f"Expected 401, got {response.status_code}")
except Exception as e:
    log_fail("GET /auth/me without token", f"Exception: {str(e)}")

# Test 1.5: Login as accountant for later tests
print("\n[1.5] POST /auth/login with accountant/accountant")
try:
    response = session.post(f"{BASE_URL}/auth/login", json={
        "username": "accountant",
        "password": "accountant"
    })
    if response.status_code == 200:
        data = response.json()
        accountant_token = data.get("access_token")
        log_pass("Accountant login successful")
    else:
        log_fail("Accountant login", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("Accountant login", f"Exception: {str(e)}")

# ============= 2. CRUD TESTS FOR ALL ENTITIES =============
print("\n" + "=" * 80)
print("2. CRUD TESTS FOR ALL ENTITIES")
print("=" * 80)

def test_crud_entity(entity_name, endpoint, create_payload, update_payload, auth_token):
    """
    Test full CRUD cycle for an entity:
    1. List existing (should have seed data)
    2. Create new item
    3. GET the new item by id
    4. PUT to update it
    5. DELETE it
    6. Verify it's gone
    """
    print(f"\n--- Testing {entity_name} ---")
    headers = {"Authorization": f"Bearer {auth_token}"}
    created_id = None
    
    # List existing
    try:
        response = session.get(f"{BASE_URL}/{endpoint}", headers=headers)
        if response.status_code == 200:
            items = response.json()
            if isinstance(items, list):
                log_pass(f"{entity_name}: List existing items (count: {len(items)})")
                if len(items) == 0:
                    log_warning(f"{entity_name}", "No seed data found")
            else:
                log_fail(f"{entity_name}: List", f"Expected list, got {type(items)}")
        else:
            log_fail(f"{entity_name}: List", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        log_fail(f"{entity_name}: List", f"Exception: {str(e)}")
    
    # Create new item
    try:
        response = session.post(f"{BASE_URL}/{endpoint}", json=create_payload, headers=headers)
        if response.status_code == 200:
            item = response.json()
            if "id" in item:
                created_id = item["id"]
                created_ids[endpoint].append(created_id)
                log_pass(f"{entity_name}: Create new item (id: {created_id})")
            else:
                log_fail(f"{entity_name}: Create", f"No 'id' in response: {item}")
        else:
            log_fail(f"{entity_name}: Create", f"Status {response.status_code}: {response.text}")
            return
    except Exception as e:
        log_fail(f"{entity_name}: Create", f"Exception: {str(e)}")
        return
    
    # GET by id
    if created_id:
        try:
            response = session.get(f"{BASE_URL}/{endpoint}/{created_id}", headers=headers)
            if response.status_code == 200:
                item = response.json()
                if item.get("id") == created_id:
                    log_pass(f"{entity_name}: GET by id")
                else:
                    log_fail(f"{entity_name}: GET by id", f"ID mismatch: {item.get('id')} != {created_id}")
            else:
                log_fail(f"{entity_name}: GET by id", f"Status {response.status_code}: {response.text}")
        except Exception as e:
            log_fail(f"{entity_name}: GET by id", f"Exception: {str(e)}")
    
    # Update item
    if created_id:
        try:
            response = session.put(f"{BASE_URL}/{endpoint}/{created_id}", json=update_payload, headers=headers)
            if response.status_code == 200:
                item = response.json()
                # Verify at least one field was updated
                updated = False
                for key, value in update_payload.items():
                    if item.get(key) == value:
                        updated = True
                        break
                if updated:
                    log_pass(f"{entity_name}: Update item")
                else:
                    log_fail(f"{entity_name}: Update", f"Fields not updated: {item}")
            else:
                log_fail(f"{entity_name}: Update", f"Status {response.status_code}: {response.text}")
        except Exception as e:
            log_fail(f"{entity_name}: Update", f"Exception: {str(e)}")
    
    # Delete item
    if created_id:
        try:
            response = session.delete(f"{BASE_URL}/{endpoint}/{created_id}", headers=headers)
            if response.status_code == 200:
                result = response.json()
                if result.get("ok") or result.get("deleted"):
                    log_pass(f"{entity_name}: Delete item")
                else:
                    log_fail(f"{entity_name}: Delete", f"Unexpected response: {result}")
            else:
                log_fail(f"{entity_name}: Delete", f"Status {response.status_code}: {response.text}")
        except Exception as e:
            log_fail(f"{entity_name}: Delete", f"Exception: {str(e)}")
        
        # Verify deletion
        try:
            response = session.get(f"{BASE_URL}/{endpoint}/{created_id}", headers=headers)
            if response.status_code == 404:
                log_pass(f"{entity_name}: Verify deletion (404)")
            else:
                log_fail(f"{entity_name}: Verify deletion", f"Expected 404, got {response.status_code}")
        except Exception as e:
            log_fail(f"{entity_name}: Verify deletion", f"Exception: {str(e)}")

# Test 2.1: Owners
test_crud_entity(
    "Owners",
    "owners",
    {
        "name": "أحمد التجريبي",
        "phone": "0501234567",
        "national_id": "1234567890",
        "address": "الرياض، حي النخيل",
        "bank_account": "SA1234567890123456789012345",
        "status": "active",
        "notes": "Test owner"
    },
    {
        "name": "أحمد التجريبي المحدث",
        "phone": "0501234567",
        "national_id": "1234567890",
        "status": "inactive"
    },
    admin_token
)

# Test 2.2: Properties (need an owner_id from seed data)
print("\n[2.2] Getting owner_id for property test")
try:
    response = session.get(f"{BASE_URL}/owners", headers={"Authorization": f"Bearer {admin_token}"})
    if response.status_code == 200:
        owners = response.json()
        if len(owners) > 0:
            owner_id = owners[0]["id"]
            test_crud_entity(
                "Properties",
                "properties",
                {
                    "owner_id": owner_id,
                    "name": "عمارة الاختبار",
                    "type": "residential",
                    "city": "الرياض",
                    "address": "شارع الاختبار",
                    "total_units": 0,
                    "status": "active"
                },
                {
                    "owner_id": owner_id,
                    "name": "عمارة الاختبار المحدثة",
                    "type": "commercial",
                    "city": "جدة",
                    "address": "شارع الاختبار",
                    "status": "inactive"
                },
                admin_token
            )
        else:
            log_fail("Properties test", "No owners found in seed data")
    else:
        log_fail("Properties test", f"Failed to get owners: {response.status_code}")
except Exception as e:
    log_fail("Properties test", f"Exception: {str(e)}")

# Test 2.3: Units (need a property_id)
print("\n[2.3] Getting property_id for unit test")
try:
    response = session.get(f"{BASE_URL}/properties", headers={"Authorization": f"Bearer {admin_token}"})
    if response.status_code == 200:
        properties = response.json()
        if len(properties) > 0:
            property_id = properties[0]["id"]
            test_crud_entity(
                "Units",
                "units",
                {
                    "property_id": property_id,
                    "unit_number": "TEST-001",
                    "area": 50.0,
                    "rooms": 2,
                    "bathrooms": 1,
                    "rent_price": 1000.0,
                    "status": "vacant"
                },
                {
                    "property_id": property_id,
                    "unit_number": "TEST-001-UPDATED",
                    "area": 60.0,
                    "rooms": 3,
                    "bathrooms": 2,
                    "rent_price": 1500.0,
                    "status": "rented"
                },
                admin_token
            )
        else:
            log_fail("Units test", "No properties found in seed data")
    else:
        log_fail("Units test", f"Failed to get properties: {response.status_code}")
except Exception as e:
    log_fail("Units test", f"Exception: {str(e)}")

# Test 2.4: Tenants
test_crud_entity(
    "Tenants",
    "tenants",
    {
        "name": "محمد المستأجر التجريبي",
        "phone": "0559876543",
        "national_id": "9876543210",
        "status": "active"
    },
    {
        "name": "محمد المستأجر المحدث",
        "phone": "0559876543",
        "national_id": "9876543210",
        "status": "inactive"
    },
    admin_token
)

# Test 2.5: Contracts (need unit_id and tenant_id)
print("\n[2.5] Getting unit_id and tenant_id for contract test")
try:
    units_resp = session.get(f"{BASE_URL}/units", headers={"Authorization": f"Bearer {admin_token}"})
    tenants_resp = session.get(f"{BASE_URL}/tenants", headers={"Authorization": f"Bearer {admin_token}"})
    
    if units_resp.status_code == 200 and tenants_resp.status_code == 200:
        units = units_resp.json()
        tenants = tenants_resp.json()
        
        if len(units) > 0 and len(tenants) > 0:
            unit_id = units[0]["id"]
            tenant_id = tenants[0]["id"]
            
            test_crud_entity(
                "Contracts",
                "contracts",
                {
                    "contract_number": "CTR-TEST-001",
                    "unit_id": unit_id,
                    "tenant_id": tenant_id,
                    "start_date": "2026-01-01",
                    "end_date": "2027-01-01",
                    "rent_amount": 1000.0,
                    "payment_frequency": "monthly",
                    "status": "active"
                },
                {
                    "contract_number": "CTR-TEST-001-UPDATED",
                    "unit_id": unit_id,
                    "tenant_id": tenant_id,
                    "start_date": "2026-01-01",
                    "end_date": "2027-01-01",
                    "rent_amount": 1200.0,
                    "payment_frequency": "quarterly",
                    "status": "expired"
                },
                admin_token
            )
        else:
            log_fail("Contracts test", "No units or tenants found")
    else:
        log_fail("Contracts test", "Failed to get units or tenants")
except Exception as e:
    log_fail("Contracts test", f"Exception: {str(e)}")

# Test 2.6: Payments (need contract_id and tenant_id)
print("\n[2.6] Getting contract_id and tenant_id for payment test")
try:
    contracts_resp = session.get(f"{BASE_URL}/contracts", headers={"Authorization": f"Bearer {admin_token}"})
    tenants_resp = session.get(f"{BASE_URL}/tenants", headers={"Authorization": f"Bearer {admin_token}"})
    
    if contracts_resp.status_code == 200 and tenants_resp.status_code == 200:
        contracts = contracts_resp.json()
        tenants = tenants_resp.json()
        
        if len(contracts) > 0 and len(tenants) > 0:
            contract_id = contracts[0]["id"]
            tenant_id = tenants[0]["id"]
            
            test_crud_entity(
                "Payments",
                "payments",
                {
                    "contract_id": contract_id,
                    "tenant_id": tenant_id,
                    "amount": 1000.0,
                    "due_date": "2026-02-01",
                    "type": "rent",
                    "status": "pending",
                    "payment_method": "cash"
                },
                {
                    "contract_id": contract_id,
                    "tenant_id": tenant_id,
                    "amount": 1000.0,
                    "due_date": "2026-02-01",
                    "type": "rent",
                    "status": "paid",
                    "payment_method": "bank_transfer"
                },
                admin_token
            )
        else:
            log_fail("Payments test", "No contracts or tenants found")
    else:
        log_fail("Payments test", "Failed to get contracts or tenants")
except Exception as e:
    log_fail("Payments test", f"Exception: {str(e)}")

# Test 2.7: Expenses (need property_id)
print("\n[2.7] Getting property_id for expense test")
try:
    response = session.get(f"{BASE_URL}/properties", headers={"Authorization": f"Bearer {admin_token}"})
    if response.status_code == 200:
        properties = response.json()
        if len(properties) > 0:
            property_id = properties[0]["id"]
            test_crud_entity(
                "Expenses",
                "expenses",
                {
                    "property_id": property_id,
                    "category": "maintenance",
                    "description": "صيانة تجريبية",
                    "amount": 100.0,
                    "expense_date": "2026-02-01",
                    "status": "pending"
                },
                {
                    "property_id": property_id,
                    "category": "utilities",
                    "description": "صيانة تجريبية محدثة",
                    "amount": 150.0,
                    "expense_date": "2026-02-01",
                    "status": "paid"
                },
                admin_token
            )
        else:
            log_fail("Expenses test", "No properties found")
    else:
        log_fail("Expenses test", f"Failed to get properties: {response.status_code}")
except Exception as e:
    log_fail("Expenses test", f"Exception: {str(e)}")

# Test 2.8: Maintenance (need property_id)
print("\n[2.8] Getting property_id for maintenance test")
try:
    response = session.get(f"{BASE_URL}/properties", headers={"Authorization": f"Bearer {admin_token}"})
    if response.status_code == 200:
        properties = response.json()
        if len(properties) > 0:
            property_id = properties[0]["id"]
            test_crud_entity(
                "Maintenance",
                "maintenance",
                {
                    "property_id": property_id,
                    "title": "صيانة تجريبية",
                    "description": "وصف الصيانة التجريبية",
                    "priority": "medium",
                    "status": "pending",
                    "reported_date": "2026-02-01"
                },
                {
                    "property_id": property_id,
                    "title": "صيانة تجريبية محدثة",
                    "description": "وصف محدث",
                    "priority": "high",
                    "status": "in_progress",
                    "reported_date": "2026-02-01"
                },
                admin_token
            )
        else:
            log_fail("Maintenance test", "No properties found")
    else:
        log_fail("Maintenance test", f"Failed to get properties: {response.status_code}")
except Exception as e:
    log_fail("Maintenance test", f"Exception: {str(e)}")

# ============= 3. USERS MANAGEMENT TESTS =============
print("\n" + "=" * 80)
print("3. USERS MANAGEMENT TESTS")
print("=" * 80)

# Test 3.1: GET /users with admin token
print("\n[3.1] GET /users with admin token")
try:
    response = session.get(f"{BASE_URL}/users", headers={"Authorization": f"Bearer {admin_token}"})
    if response.status_code == 200:
        users = response.json()
        if isinstance(users, list) and len(users) >= 2:
            # Should have at least admin and accountant
            usernames = [u.get("username") for u in users]
            if "admin" in usernames and "accountant" in usernames:
                log_pass(f"GET /users returns list with seeded users (count: {len(users)})")
            else:
                log_fail("GET /users", f"Missing seeded users. Found: {usernames}")
        else:
            log_fail("GET /users", f"Expected list with at least 2 users, got {len(users) if isinstance(users, list) else 'not a list'}")
    else:
        log_fail("GET /users", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("GET /users", f"Exception: {str(e)}")

# Test 3.2: POST /users with admin token (create new user)
print("\n[3.2] POST /users with admin token")
test_user_id = None
try:
    response = session.post(f"{BASE_URL}/users", json={
        "name": "مستخدم تجريبي",
        "username": "testuser1",
        "password": "pw123",
        "role": "user",
        "is_active": True
    }, headers={"Authorization": f"Bearer {admin_token}"})
    
    if response.status_code == 200:
        user = response.json()
        if "id" in user and user.get("username") == "testuser1" and "password" not in user:
            test_user_id = user["id"]
            created_ids["users"].append(test_user_id)
            log_pass("POST /users creates new user successfully")
        else:
            log_fail("POST /users", f"Invalid response: {user}")
    else:
        log_fail("POST /users", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("POST /users", f"Exception: {str(e)}")

# Test 3.3: POST /users with duplicate username
print("\n[3.3] POST /users with duplicate username")
try:
    response = session.post(f"{BASE_URL}/users", json={
        "name": "مستخدم مكرر",
        "username": "testuser1",
        "password": "pw456",
        "role": "user",
        "is_active": True
    }, headers={"Authorization": f"Bearer {admin_token}"})
    
    if response.status_code == 400:
        log_pass("POST /users with duplicate username correctly returns 400")
    else:
        log_fail("POST /users duplicate", f"Expected 400, got {response.status_code}")
except Exception as e:
    log_fail("POST /users duplicate", f"Exception: {str(e)}")

# Test 3.4: POST /users with accountant (non-admin) token
print("\n[3.4] POST /users with accountant (non-admin) token")
try:
    if accountant_token:
        response = session.post(f"{BASE_URL}/users", json={
            "name": "مستخدم غير مصرح",
            "username": "unauthorized",
            "password": "pw789",
            "role": "user",
            "is_active": True
        }, headers={"Authorization": f"Bearer {accountant_token}"})
        
        if response.status_code == 403:
            log_pass("POST /users with non-admin token correctly returns 403")
        else:
            log_fail("POST /users non-admin", f"Expected 403, got {response.status_code}")
    else:
        log_fail("POST /users non-admin", "No accountant token available")
except Exception as e:
    log_fail("POST /users non-admin", f"Exception: {str(e)}")

# Test 3.5: Cleanup - delete test user
print("\n[3.5] DELETE /users/{id} with admin token")
try:
    if test_user_id:
        response = session.delete(f"{BASE_URL}/users/{test_user_id}", headers={"Authorization": f"Bearer {admin_token}"})
        if response.status_code == 200:
            log_pass("DELETE /users successfully deletes user")
        else:
            log_fail("DELETE /users", f"Status {response.status_code}: {response.text}")
    else:
        log_warning("DELETE /users", "No test user to delete")
except Exception as e:
    log_fail("DELETE /users", f"Exception: {str(e)}")

# ============= 4. SETTINGS TESTS =============
print("\n" + "=" * 80)
print("4. SETTINGS TESTS")
print("=" * 80)

# Test 4.1: GET /settings with admin token
print("\n[4.1] GET /settings with admin token")
try:
    response = session.get(f"{BASE_URL}/settings", headers={"Authorization": f"Bearer {admin_token}"})
    if response.status_code == 200:
        settings = response.json()
        required_keys = ["company_name", "company_phone", "company_email", "company_address", "currency", "timezone"]
        if all(key in settings for key in required_keys):
            log_pass("GET /settings returns settings with all required keys")
        else:
            log_fail("GET /settings", f"Missing keys. Got: {list(settings.keys())}")
    else:
        log_fail("GET /settings", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("GET /settings", f"Exception: {str(e)}")

# Test 4.2: PUT /settings with admin token
print("\n[4.2] PUT /settings with admin token")
try:
    response = session.put(f"{BASE_URL}/settings", json={
        "company_name": "Test Co",
        "company_phone": "111",
        "company_email": "a@b.c",
        "company_address": "X",
        "currency": "SAR",
        "timezone": "Asia/Riyadh"
    }, headers={"Authorization": f"Bearer {admin_token}"})
    
    if response.status_code == 200:
        settings = response.json()
        if settings.get("company_name") == "Test Co":
            log_pass("PUT /settings updates settings successfully")
        else:
            log_fail("PUT /settings", f"Settings not updated: {settings}")
    else:
        log_fail("PUT /settings", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("PUT /settings", f"Exception: {str(e)}")

# Test 4.3: PUT /settings with accountant (non-admin) token
print("\n[4.3] PUT /settings with accountant (non-admin) token")
try:
    if accountant_token:
        response = session.put(f"{BASE_URL}/settings", json={
            "company_name": "Unauthorized Change",
            "company_phone": "999",
            "company_email": "x@y.z",
            "company_address": "Y",
            "currency": "USD",
            "timezone": "UTC"
        }, headers={"Authorization": f"Bearer {accountant_token}"})
        
        if response.status_code == 403:
            log_pass("PUT /settings with non-admin token correctly returns 403")
        else:
            log_fail("PUT /settings non-admin", f"Expected 403, got {response.status_code}")
    else:
        log_fail("PUT /settings non-admin", "No accountant token available")
except Exception as e:
    log_fail("PUT /settings non-admin", f"Exception: {str(e)}")

# ============= 5. DASHBOARD TESTS =============
print("\n" + "=" * 80)
print("5. DASHBOARD TESTS")
print("=" * 80)

# Test 5.1: GET /dashboard/summary
print("\n[5.1] GET /dashboard/summary with valid token")
try:
    response = session.get(f"{BASE_URL}/dashboard/summary", headers={"Authorization": f"Bearer {admin_token}"})
    if response.status_code == 200:
        summary = response.json()
        required_keys = [
            "thisMonthRevenue", "thisMonthExpenses", "revenueChange", "expenseChange",
            "totalUnits", "rentedUnits", "vacantUnits", "maintenanceUnits",
            "pendingPayments", "overduePayments", "expiringContracts",
            "monthlyRevenue", "monthlyExpenses"
        ]
        
        missing_keys = [key for key in required_keys if key not in summary]
        if not missing_keys:
            # Verify array lengths
            if len(summary.get("monthlyRevenue", [])) == 12 and len(summary.get("monthlyExpenses", [])) == 12:
                log_pass("GET /dashboard/summary returns all required fields with correct structure")
                
                # Log some values for verification
                print(f"   Total Units: {summary.get('totalUnits')}")
                print(f"   Rented Units: {summary.get('rentedUnits')}")
                print(f"   Vacant Units: {summary.get('vacantUnits')}")
                print(f"   This Month Revenue: {summary.get('thisMonthRevenue')}")
                print(f"   This Month Expenses: {summary.get('thisMonthExpenses')}")
            else:
                log_fail("GET /dashboard/summary", f"Monthly arrays have wrong length: revenue={len(summary.get('monthlyRevenue', []))}, expenses={len(summary.get('monthlyExpenses', []))}")
        else:
            log_fail("GET /dashboard/summary", f"Missing keys: {missing_keys}")
    else:
        log_fail("GET /dashboard/summary", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("GET /dashboard/summary", f"Exception: {str(e)}")

# ============= 6. AUTH GUARD TESTS =============
print("\n" + "=" * 80)
print("6. AUTH GUARD TESTS")
print("=" * 80)

# Test 6.1: GET /owners without token
print("\n[6.1] GET /owners without token")
try:
    response = requests.get(f"{BASE_URL}/owners")
    if response.status_code == 401:
        log_pass("GET /owners without token correctly returns 401")
    else:
        log_fail("GET /owners without token", f"Expected 401, got {response.status_code}")
except Exception as e:
    log_fail("GET /owners without token", f"Exception: {str(e)}")

# ============= FINAL REPORT =============
print("\n" + "=" * 80)
print("TEST SUMMARY")
print("=" * 80)

total_tests = len(test_results["passed"]) + len(test_results["failed"])
pass_rate = (len(test_results["passed"]) / total_tests * 100) if total_tests > 0 else 0

print(f"\nTotal Tests: {total_tests}")
print(f"Passed: {len(test_results['passed'])} ({pass_rate:.1f}%)")
print(f"Failed: {len(test_results['failed'])}")
print(f"Warnings: {len(test_results['warnings'])}")

if test_results["failed"]:
    print("\n" + "=" * 80)
    print("FAILED TESTS:")
    print("=" * 80)
    for failure in test_results["failed"]:
        print(f"  ❌ {failure}")

if test_results["warnings"]:
    print("\n" + "=" * 80)
    print("WARNINGS:")
    print("=" * 80)
    for warning in test_results["warnings"]:
        print(f"  ⚠️  {warning}")

print("\n" + "=" * 80)
print(f"Test completed at: {datetime.now().isoformat()}")
print("=" * 80)

# Exit with appropriate code
exit(0 if len(test_results["failed"]) == 0 else 1)
