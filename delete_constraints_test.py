#!/usr/bin/env python3
"""
Delete Constraints Test for Property Management System
Tests ONLY the new delete constraint functionality as specified in the review request.
"""
import requests
import json
from datetime import datetime

# Base URL
BASE_URL = "https://refactor-hub-43.preview.emergentagent.com/api"

# Test results tracking
test_results = {
    "passed": [],
    "failed": []
}

def log_pass(test_name, details=""):
    test_results["passed"].append(test_name)
    print(f"✅ PASS: {test_name}")
    if details:
        print(f"   {details}")

def log_fail(test_name, reason):
    test_results["failed"].append(f"{test_name}: {reason}")
    print(f"❌ FAIL: {test_name}")
    print(f"   Reason: {reason}")

print("=" * 80)
print("DELETE CONSTRAINTS TEST - Property Management System")
print("=" * 80)
print(f"Base URL: {BASE_URL}")
print(f"Test started at: {datetime.now().isoformat()}")
print("=" * 80)

# ============= AUTHENTICATION =============
print("\n[AUTH] Logging in as admin...")
try:
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "admin"
    })
    if response.status_code == 200:
        admin_token = response.json()["access_token"]
        print(f"✓ Admin login successful")
    else:
        print(f"✗ Admin login failed: {response.status_code}")
        exit(1)
except Exception as e:
    print(f"✗ Admin login exception: {str(e)}")
    exit(1)

headers = {"Authorization": f"Bearer {admin_token}"}

# ============= TEST 1: Property with linked units → cannot delete (409) =============
print("\n" + "=" * 80)
print("TEST 1: Property with linked units → cannot delete (409)")
print("=" * 80)

try:
    # Get all properties
    props_resp = requests.get(f"{BASE_URL}/properties", headers=headers)
    properties = props_resp.json()
    
    # Get all units
    units_resp = requests.get(f"{BASE_URL}/units", headers=headers)
    units = units_resp.json()
    
    # Find a property that has at least one unit
    property_with_units = None
    for prop in properties:
        prop_id = prop["id"]
        # Check if any unit references this property
        linked_units = [u for u in units if u.get("property_id") == prop_id]
        if len(linked_units) > 0:
            property_with_units = prop
            print(f"   Found property '{prop.get('name')}' (id: {prop_id}) with {len(linked_units)} unit(s)")
            break
    
    if property_with_units:
        # Try to delete this property
        delete_resp = requests.delete(f"{BASE_URL}/properties/{property_with_units['id']}", headers=headers)
        
        if delete_resp.status_code == 409:
            detail = delete_resp.json().get("detail", "")
            if "Cannot delete property" in detail:
                log_pass("Property with linked units returns 409", f"Status: {delete_resp.status_code}, Detail: {detail}")
            else:
                log_fail("Property with linked units", f"Got 409 but wrong detail message: {detail}")
        else:
            log_fail("Property with linked units", f"Expected 409, got {delete_resp.status_code}: {delete_resp.text}")
    else:
        log_fail("Property with linked units", "Could not find a property with linked units in seed data")
        
except Exception as e:
    log_fail("Property with linked units", f"Exception: {str(e)}")

# ============= TEST 2: Property with no units → can delete (200) =============
print("\n" + "=" * 80)
print("TEST 2: Property with no units → can delete (200)")
print("=" * 80)

try:
    # Get an owner_id for creating a property
    owners_resp = requests.get(f"{BASE_URL}/owners", headers=headers)
    owners = owners_resp.json()
    
    if len(owners) > 0:
        owner_id = owners[0]["id"]
        
        # Create a new property with no units
        create_resp = requests.post(f"{BASE_URL}/properties", json={
            "owner_id": owner_id,
            "name": "TEST_PROP_DEL",
            "type": "residential",
            "city": "Test City",
            "address": "Test Address",
            "total_units": 0,
            "status": "active"
        }, headers=headers)
        
        if create_resp.status_code == 200:
            new_property = create_resp.json()
            new_property_id = new_property["id"]
            print(f"   Created test property (id: {new_property_id})")
            
            # Verify no units reference this property
            units_resp = requests.get(f"{BASE_URL}/units", headers=headers)
            units = units_resp.json()
            linked_units = [u for u in units if u.get("property_id") == new_property_id]
            
            if len(linked_units) == 0:
                print(f"   Verified: No units reference this property")
                
                # Try to delete this property
                delete_resp = requests.delete(f"{BASE_URL}/properties/{new_property_id}", headers=headers)
                
                if delete_resp.status_code == 200:
                    log_pass("Property with no units can be deleted", f"Status: {delete_resp.status_code}")
                else:
                    log_fail("Property with no units", f"Expected 200, got {delete_resp.status_code}: {delete_resp.text}")
            else:
                log_fail("Property with no units", f"Test property has {len(linked_units)} linked units (should be 0)")
        else:
            log_fail("Property with no units", f"Failed to create test property: {create_resp.status_code}")
    else:
        log_fail("Property with no units", "No owners found in database")
        
except Exception as e:
    log_fail("Property with no units", f"Exception: {str(e)}")

# ============= TEST 3: Unit with linked contracts → cannot delete (409) =============
print("\n" + "=" * 80)
print("TEST 3: Unit with linked contracts → cannot delete (409)")
print("=" * 80)

try:
    # Get all contracts
    contracts_resp = requests.get(f"{BASE_URL}/contracts", headers=headers)
    contracts = contracts_resp.json()
    
    # Find a unit_id from any active contract
    unit_with_contract = None
    if len(contracts) > 0:
        for contract in contracts:
            if contract.get("unit_id"):
                unit_id = contract["unit_id"]
                unit_with_contract = unit_id
                print(f"   Found unit (id: {unit_id}) with contract (contract_id: {contract['id']})")
                break
    
    if unit_with_contract:
        # Try to delete this unit
        delete_resp = requests.delete(f"{BASE_URL}/units/{unit_with_contract}", headers=headers)
        
        if delete_resp.status_code == 409:
            detail = delete_resp.json().get("detail", "")
            if "Cannot delete unit" in detail:
                log_pass("Unit with linked contracts returns 409", f"Status: {delete_resp.status_code}, Detail: {detail}")
            else:
                log_fail("Unit with linked contracts", f"Got 409 but wrong detail message: {detail}")
        else:
            log_fail("Unit with linked contracts", f"Expected 409, got {delete_resp.status_code}: {delete_resp.text}")
    else:
        log_fail("Unit with linked contracts", "Could not find a unit with linked contracts in seed data")
        
except Exception as e:
    log_fail("Unit with linked contracts", f"Exception: {str(e)}")

# ============= TEST 4: Unit with no contracts → can delete (200) =============
print("\n" + "=" * 80)
print("TEST 4: Unit with no contracts → can delete (200)")
print("=" * 80)

try:
    # Get a property_id for creating a unit
    props_resp = requests.get(f"{BASE_URL}/properties", headers=headers)
    properties = props_resp.json()
    
    if len(properties) > 0:
        property_id = properties[0]["id"]
        
        # Create a new unit with no contracts
        create_resp = requests.post(f"{BASE_URL}/units", json={
            "property_id": property_id,
            "unit_number": "TEST_DEL_UNIT",
            "area": 50,
            "rooms": 2,
            "bathrooms": 1,
            "rent_price": 1000,
            "status": "vacant"
        }, headers=headers)
        
        if create_resp.status_code == 200:
            new_unit = create_resp.json()
            new_unit_id = new_unit["id"]
            print(f"   Created test unit (id: {new_unit_id})")
            
            # Verify no contracts reference this unit
            contracts_resp = requests.get(f"{BASE_URL}/contracts", headers=headers)
            contracts = contracts_resp.json()
            linked_contracts = [c for c in contracts if c.get("unit_id") == new_unit_id]
            
            if len(linked_contracts) == 0:
                print(f"   Verified: No contracts reference this unit")
                
                # Try to delete this unit
                delete_resp = requests.delete(f"{BASE_URL}/units/{new_unit_id}", headers=headers)
                
                if delete_resp.status_code == 200:
                    log_pass("Unit with no contracts can be deleted", f"Status: {delete_resp.status_code}")
                else:
                    log_fail("Unit with no contracts", f"Expected 200, got {delete_resp.status_code}: {delete_resp.text}")
            else:
                log_fail("Unit with no contracts", f"Test unit has {len(linked_contracts)} linked contracts (should be 0)")
        else:
            log_fail("Unit with no contracts", f"Failed to create test unit: {create_resp.status_code}")
    else:
        log_fail("Unit with no contracts", "No properties found in database")
        
except Exception as e:
    log_fail("Unit with no contracts", f"Exception: {str(e)}")

# ============= TEST 5: Regression - Owner with properties → cannot delete (409) =============
print("\n" + "=" * 80)
print("TEST 5: Regression - Owner with properties → cannot delete (409)")
print("=" * 80)

try:
    # Get all owners
    owners_resp = requests.get(f"{BASE_URL}/owners", headers=headers)
    owners = owners_resp.json()
    
    # Get all properties
    props_resp = requests.get(f"{BASE_URL}/properties", headers=headers)
    properties = props_resp.json()
    
    # Find an owner that has properties
    owner_with_properties = None
    for owner in owners:
        owner_id = owner["id"]
        # Check if any property references this owner
        linked_props = [p for p in properties if p.get("owner_id") == owner_id]
        if len(linked_props) > 0:
            owner_with_properties = owner
            print(f"   Found owner '{owner.get('name')}' (id: {owner_id}) with {len(linked_props)} property(ies)")
            break
    
    if owner_with_properties:
        # Try to delete this owner
        delete_resp = requests.delete(f"{BASE_URL}/owners/{owner_with_properties['id']}", headers=headers)
        
        if delete_resp.status_code == 409:
            detail = delete_resp.json().get("detail", "")
            if "Cannot delete owner" in detail and "property(ies) linked" in detail:
                log_pass("Owner with properties returns 409", f"Status: {delete_resp.status_code}, Detail: {detail}")
            else:
                log_fail("Owner with properties", f"Got 409 but wrong detail message: {detail}")
        else:
            log_fail("Owner with properties", f"Expected 409, got {delete_resp.status_code}: {delete_resp.text}")
    else:
        log_fail("Owner with properties", "Could not find an owner with linked properties in seed data")
        
except Exception as e:
    log_fail("Owner with properties", f"Exception: {str(e)}")

# ============= TEST 6: Regression - Tenant with contracts → cannot delete (409) =============
print("\n" + "=" * 80)
print("TEST 6: Regression - Tenant with contracts → cannot delete (409)")
print("=" * 80)

try:
    # Get all tenants
    tenants_resp = requests.get(f"{BASE_URL}/tenants", headers=headers)
    tenants = tenants_resp.json()
    
    # Get all contracts
    contracts_resp = requests.get(f"{BASE_URL}/contracts", headers=headers)
    contracts = contracts_resp.json()
    
    # Find a tenant that has contracts
    tenant_with_contracts = None
    for tenant in tenants:
        tenant_id = tenant["id"]
        # Check if any contract references this tenant
        linked_contracts = [c for c in contracts if c.get("tenant_id") == tenant_id]
        if len(linked_contracts) > 0:
            tenant_with_contracts = tenant
            print(f"   Found tenant '{tenant.get('name')}' (id: {tenant_id}) with {len(linked_contracts)} contract(s)")
            break
    
    if tenant_with_contracts:
        # Try to delete this tenant
        delete_resp = requests.delete(f"{BASE_URL}/tenants/{tenant_with_contracts['id']}", headers=headers)
        
        if delete_resp.status_code == 409:
            detail = delete_resp.json().get("detail", "")
            if "Cannot delete tenant" in detail and "contract(s) linked" in detail:
                log_pass("Tenant with contracts returns 409", f"Status: {delete_resp.status_code}, Detail: {detail}")
            else:
                log_fail("Tenant with contracts", f"Got 409 but wrong detail message: {detail}")
        else:
            log_fail("Tenant with contracts", f"Expected 409, got {delete_resp.status_code}: {delete_resp.text}")
    else:
        log_fail("Tenant with contracts", "Could not find a tenant with linked contracts in seed data")
        
except Exception as e:
    log_fail("Tenant with contracts", f"Exception: {str(e)}")

# ============= FINAL REPORT =============
print("\n" + "=" * 80)
print("TEST SUMMARY")
print("=" * 80)

total_tests = len(test_results["passed"]) + len(test_results["failed"])
pass_rate = (len(test_results["passed"]) / total_tests * 100) if total_tests > 0 else 0

print(f"\nTotal Tests: {total_tests}")
print(f"Passed: {len(test_results['passed'])} ({pass_rate:.1f}%)")
print(f"Failed: {len(test_results['failed'])}")

if test_results["failed"]:
    print("\n" + "=" * 80)
    print("FAILED TESTS:")
    print("=" * 80)
    for failure in test_results["failed"]:
        print(f"  ❌ {failure}")

print("\n" + "=" * 80)
print(f"Test completed at: {datetime.now().isoformat()}")
print("=" * 80)

# Exit with appropriate code
exit(0 if len(test_results["failed"]) == 0 else 1)
