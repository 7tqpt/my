#!/usr/bin/env python3
"""
Test: Cannot delete main admin user (re-test after fix)
Expected: DELETE /api/users/{main_admin_id} returns 403 with Arabic message
"""
import requests
import sys

BASE_URL = "https://refactor-hub-43.preview.emergentagent.com/api"

def test_cannot_delete_main_admin():
    """Test that deleting the main admin user returns 403"""
    print("=" * 80)
    print("TEST: Cannot Delete Main Admin User")
    print("=" * 80)
    
    # Step 1: Login as admin
    print("\n1. Login as admin/admin...")
    login_resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"username": "admin", "password": "admin"}
    )
    print(f"   Status: {login_resp.status_code}")
    
    if login_resp.status_code != 200:
        print(f"   ❌ Login failed: {login_resp.text}")
        return False
    
    token = login_resp.json()["access_token"]
    print(f"   ✅ Login successful, got token")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 2: GET /api/users to find main admin
    print("\n2. GET /api/users to find main admin...")
    users_resp = requests.get(f"{BASE_URL}/users", headers=headers)
    print(f"   Status: {users_resp.status_code}")
    
    if users_resp.status_code != 200:
        print(f"   ❌ Failed to get users: {users_resp.text}")
        return False
    
    users = users_resp.json()
    main_admin = None
    for user in users:
        if user.get("username") == "admin":
            main_admin = user
            break
    
    if not main_admin:
        print("   ❌ Main admin user not found in users list")
        return False
    
    main_admin_id = main_admin["id"]
    print(f"   ✅ Found main admin user: id={main_admin_id}, username={main_admin['username']}")
    
    # Step 3: Try to DELETE main admin
    print(f"\n3. DELETE /api/users/{main_admin_id} (main admin)...")
    delete_resp = requests.delete(f"{BASE_URL}/users/{main_admin_id}", headers=headers)
    
    print(f"   Status: {delete_resp.status_code}")
    print(f"   Response: {delete_resp.text}")
    
    # Verify expected behavior
    expected_status = 403
    expected_message = "لا يمكن حذف حساب مدير النظام الرئيسي"
    
    if delete_resp.status_code != expected_status:
        print(f"\n   ❌ FAILED: Expected status {expected_status}, got {delete_resp.status_code}")
        return False
    
    try:
        detail = delete_resp.json().get("detail", "")
    except:
        detail = delete_resp.text
    
    if expected_message not in detail:
        print(f"\n   ❌ FAILED: Expected detail to contain '{expected_message}'")
        print(f"   Actual detail: {detail}")
        return False
    
    print(f"\n   ✅ PASSED: Correctly returned 403 with Arabic message")
    print(f"   Detail: {detail}")
    return True

if __name__ == "__main__":
    try:
        success = test_cannot_delete_main_admin()
        print("\n" + "=" * 80)
        if success:
            print("✅ TEST PASSED: Main admin deletion correctly blocked with 403")
        else:
            print("❌ TEST FAILED: Main admin deletion did not return expected response")
        print("=" * 80)
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ TEST ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
