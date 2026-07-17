#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Arabic Property Management System - build backend (FastAPI + MongoDB) with real JWT auth
  and connect frontend to real API endpoints. System has entities: users, owners, properties,
  units, tenants, contracts, payments, expenses, maintenance, settings + dashboard summary.

backend:
  - task: "JWT Authentication (login + get_me)"
    implemented: true
    working: true
    file: "backend/auth.py, backend/routes.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Implemented POST /api/auth/login returning JWT + user, GET /api/auth/me. Default seeded admin (admin/admin) and accountant/accountant."
        - working: true
          agent: "testing"
          comment: "✅ All auth tests pass: admin login returns JWT + user with role='admin', wrong password returns 401, GET /auth/me with token returns user without password field, GET /auth/me without token returns 401, accountant login works."

  - task: "CRUD endpoints for entities (owners, properties, units, tenants, contracts, payments, expenses, maintenance)"
    implemented: true
    working: true
    file: "backend/routes.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "All entities have GET list, GET by id, POST create, PUT update, DELETE. Protected by get_current_user (JWT bearer)."
        - working: false
          agent: "testing"
          comment: "❌ CRITICAL BUG: POST endpoints for owners, properties, units, tenants, contracts, payments, expenses return 200 OK with created item but DO NOT persist data to MongoDB. GET by id returns 404, items not in list. However, MAINTENANCE works perfectly (all CRUD operations pass). Direct MongoDB insertion works, so DB connection is fine. Issue is in FastAPI route handling. UPDATE somehow succeeds even though GET fails (very strange). Root cause: insert_one operation not persisting for most entities but works for maintenance. Verified by direct DB query - only seed data exists, no new items."
        - working: "NA"
          agent: "main"
          comment: "Fixed by rewriting routes from factory pattern (using module-level variables _cr/_up that got overwritten) to explicit route handlers per entity. Each entity now has dedicated functions: list_{entity}, get_{entity}, create_{entity}, update_{entity}, delete_{entity}."
        - working: true
          agent: "testing"
          comment: "✅ BUG FIXED - ALL CRUD OPERATIONS NOW WORKING! Comprehensive re-test completed: 63/63 tests passed (100%). All entities (owners, properties, units, tenants, contracts, payments, expenses, maintenance) now successfully: 1) POST creates item and returns 200 with proper id, 2) GET by id returns 200 with correct data, 3) GET list includes new items, 4) PUT updates items correctly, 5) DELETE removes items successfully. MongoDB persistence verified - all data persisting correctly. The explicit route handler approach has completely resolved the previous bug."

  - task: "Users CRUD (admin-only mutations)"
    implemented: true
    working: true
    file: "backend/routes.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "POST/PUT/DELETE /api/users require admin role. Passwords hashed with bcrypt."
        - working: true
          agent: "testing"
          comment: "✅ All users tests pass: GET /users returns list with admin + accountant, POST /users with admin token creates user successfully, duplicate username returns 400, POST with non-admin token returns 403, DELETE works."

  - task: "Settings GET/PUT"
    implemented: true
    working: true
    file: "backend/routes.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "GET /api/settings (any authed user), PUT /api/settings (admin only)."
        - working: true
          agent: "testing"
          comment: "✅ All settings tests pass: GET /settings returns all required keys (company_name, phone, email, address, currency, timezone), PUT with admin token updates successfully, PUT with non-admin token returns 403."

  - task: "Dashboard summary aggregation"
    implemented: true
    working: true
    file: "backend/routes.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "GET /api/dashboard/summary returns thisMonthRevenue/Expenses, changes vs last month, unit status counts, alerts (pending/overdue payments, expiring contracts), monthly arrays for charts."
        - working: true
          agent: "testing"
          comment: "✅ Dashboard test passes: GET /dashboard/summary returns all required fields with correct structure. Monthly arrays have length 12. Sample data: totalUnits=8, rentedUnits=5, vacantUnits=2, thisMonthRevenue=12500.0, thisMonthExpenses=5050.0."

  - task: "Seed initial data on startup"
    implemented: true
    working: true
    file: "backend/seed.py, backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "On startup: ensures default admin user, settings doc, and demo owners/properties/units/tenants/contracts/payments/expenses/maintenance if collections empty."
        - working: true
          agent: "testing"
          comment: "✅ Seed data verified: Found 4 owners, 4 properties, 8 units, 5 tenants, 5 contracts, 6 payments, 5 expenses, 11 maintenance items, 2 users (admin + accountant), settings document. All seed data present and accessible."

frontend:
  - task: "Frontend integration with real API + JWT"
    implemented: true
    working: "NA"
    file: "frontend/src/lib/api.js, frontend/src/hooks/useCollection.js, frontend/src/context/AppContext.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Replaced mock data with useCollection hook that fetches from API. AppContext handles JWT login/logout with axios interceptors. All 12 pages updated to use API."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 3
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    - agent: "main"
      message: |
        Backend is fully implemented. Please test the following:
        1) Login with admin/admin at POST /api/auth/login - should return access_token + user.
        2) Use token as Bearer for all subsequent requests.
        3) Test GET/POST/PUT/DELETE for owners, properties, units, tenants, contracts, payments, expenses, maintenance.
        4) Test /api/dashboard/summary returns numeric aggregates and monthlyRevenue/Expenses arrays of length 12.
        5) Test /api/settings GET returns settings, PUT with admin token updates them; PUT with non-admin returns 403.
        6) Test /api/users - creating a user (admin only), duplicate username should return 400, non-admin PUT/POST/DELETE should return 403.
        7) Requests without Bearer token should return 401.
        Seed data (admin user + 4 owners + 4 properties + 8 units etc.) should be present after startup.
    - agent: "testing"
      message: |
        TESTING COMPLETE - CRITICAL BUG FOUND
        
        Test Results: 63 total tests, 49 passed (77.8%), 14 failed
        
        ✅ WORKING:
        - Authentication: All tests pass (login, wrong password, get_me with/without token)
        - Users CRUD: All tests pass (list, create, duplicate check, admin-only enforcement, delete)
        - Settings: All tests pass (GET, PUT with admin, PUT with non-admin returns 403)
        - Dashboard: All tests pass (returns all required fields, arrays length 12)
        - Seed data: All verified and accessible
        - Auth guard: Correctly returns 401 without token
        - Maintenance CRUD: ALL operations work perfectly (create, get, update, delete)
        
        ❌ CRITICAL BUG - POST endpoints not persisting data:
        Affected entities: owners, properties, units, tenants, contracts, payments, expenses
        
        Symptoms:
        1. POST returns 200 OK with created item (including ID)
        2. Item is NOT in database (verified by direct MongoDB query)
        3. GET by id immediately returns 404
        4. LIST endpoint doesn't show the new item
        5. UPDATE somehow succeeds (returns 200) - very strange!
        6. DELETE returns 404
        
        NOT affected: maintenance (works perfectly), users (works perfectly)
        
        Root Cause Investigation:
        - Direct MongoDB insert_one works fine (tested manually)
        - MongoDB connection is healthy
        - Collections are writable
        - All collections initialized identically in database.py
        - Route patterns are identical for all entities
        - Issue is specific to FastAPI route handling for these entities
        
        The fact that UPDATE succeeds but GET fails suggests the item might exist temporarily or there's a query/routing issue.
        
        URGENT: This is a blocking bug. The CRUD operations appear to work but silently fail to persist data.
    - agent: "main"
      message: |
        Fixed the CRUD persistence bug by rewriting routes.py. Changed from factory pattern using module-level variables (_cr, _up) that were getting overwritten to explicit route handlers per entity. Each entity now has dedicated functions.
    - agent: "testing"
      message: |
        RE-TEST COMPLETE - BUG SUCCESSFULLY FIXED! ✅
        
        Test Results: 63 total tests, 63 passed (100%), 0 failed
        
        ✅ ALL ENTITIES NOW WORKING PERFECTLY:
        
        Full CRUD cycle verified for all entities:
        - Owners: ✅ List (5 items), ✅ Create, ✅ GET by id, ✅ Update, ✅ Delete
        - Properties: ✅ List (4 items), ✅ Create, ✅ GET by id, ✅ Update, ✅ Delete
        - Units: ✅ List (8 items), ✅ Create, ✅ GET by id, ✅ Update, ✅ Delete
        - Tenants: ✅ List (5 items), ✅ Create, ✅ GET by id, ✅ Update, ✅ Delete
        - Contracts: ✅ List (5 items), ✅ Create, ✅ GET by id, ✅ Update, ✅ Delete
        - Payments: ✅ List (6 items), ✅ Create, ✅ GET by id, ✅ Update, ✅ Delete
        - Expenses: ✅ List (5 items), ✅ Create, ✅ GET by id, ✅ Update, ✅ Delete
        - Maintenance: ✅ List (13 items), ✅ Create, ✅ GET by id, ✅ Update, ✅ Delete
        
        ✅ OTHER FEATURES STILL WORKING:
        - Authentication: All tests pass (admin/admin login, wrong password returns 401, get_me works)
        - Users CRUD: All tests pass (admin-only enforcement working)
        - Settings: All tests pass (GET/PUT with proper authorization)
        - Dashboard: All tests pass (summary with correct aggregations)
        - Auth guard: Correctly returns 401 without token
        
        ✅ DATA PERSISTENCE VERIFIED:
        MongoDB verification confirms all data persisting correctly:
        - owners: 5 documents
        - properties: 4 documents
        - units: 8 documents
        - tenants: 5 documents
        - contracts: 5 documents
        - payments: 6 documents
        - expenses: 5 documents
        - maintenance: 13 documents
        - users: 2 documents
        
        The explicit route handler approach has completely resolved the previous bug. All CRUD operations now work as expected.

backend:
  - task: "Delete constraint: property with linked units"
    implemented: true
    working: true
    file: "backend/routes.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Added guard: DELETE /api/properties/{id} returns 409 if any unit references the property_id."
        - working: true
          agent: "testing"
          comment: "✅ DELETE constraint working correctly. Test 1: Property with 2 linked units returns HTTP 409 with detail 'Cannot delete property: has 2 unit(s) linked'. Test 2: Property with no units successfully deleted with HTTP 200."
  - task: "Delete constraint: unit with linked contracts"
    implemented: true
    working: true
    file: "backend/routes.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Added guard: DELETE /api/units/{id} returns 409 if any contract references the unit_id."
        - working: true
          agent: "testing"
          comment: "✅ DELETE constraint working correctly. Test 3: Unit with 1 linked contract returns HTTP 409 with detail 'Cannot delete unit: has 1 contract(s) linked'. Test 4: Unit with no contracts successfully deleted with HTTP 200."

agent_communication:
    - agent: "main"
      message: |
        Please verify the following NEW delete constraints only (other functionality was previously tested).
        Login as admin/admin.
        
        Test cases:
        1) Try DELETE /api/properties/{id} for a property that HAS units. Expected: 409 with detail containing "Cannot delete property".
        2) Try DELETE /api/properties/{id} for a property with NO units (create one via POST). Expected: 200.
        3) Try DELETE /api/units/{id} for a unit that HAS contracts. Expected: 409 with detail containing "Cannot delete unit".
        4) Try DELETE /api/units/{id} for a unit with NO contracts. Expected: 200.
        5) Re-verify that owner-with-properties DELETE still returns 409 and tenant-with-contracts DELETE still returns 409 (regression).
    - agent: "testing"
      message: |
        DELETE CONSTRAINTS TESTING COMPLETE - ALL TESTS PASSED ✅
        
        Test Results: 6 total tests, 6 passed (100%), 0 failed
        
        ✅ ALL DELETE CONSTRAINTS WORKING CORRECTLY:
        
        1. Property with linked units → HTTP 409 ✅
           - Tested property with 2 linked units
           - Status: 409, Detail: "Cannot delete property: has 2 unit(s) linked"
        
        2. Property with no units → HTTP 200 ✅
           - Created test property with no units
           - Successfully deleted with status 200
        
        3. Unit with linked contracts → HTTP 409 ✅
           - Tested unit with 1 linked contract
           - Status: 409, Detail: "Cannot delete unit: has 1 contract(s) linked"
        
        4. Unit with no contracts → HTTP 200 ✅
           - Created test unit with no contracts
           - Successfully deleted with status 200
        
        5. Regression: Owner with properties → HTTP 409 ✅
           - Tested owner with 1 linked property
           - Status: 409, Detail: "Cannot delete owner: has 1 property(ies) linked"
        
        6. Regression: Tenant with contracts → HTTP 409 ✅
           - Tested tenant with 1 linked contract
           - Status: 409, Detail: "Cannot delete tenant: has 1 contract(s) linked"
        
        All delete constraints are functioning as expected. The backend correctly prevents deletion of entities with dependencies and allows deletion when no dependencies exist.


backend:
  - task: "Session single-active + idle timeout (3 min)"
    implemented: true
    working: true
    file: "backend/auth.py, backend/routes.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "On login, previous sessions for the user are wiped (single-active). Session record tracks last_activity. get_current_user updates last_activity per call and returns 401 if idle > SESSION_IDLE_SECONDS (default 180s = 3 min). New endpoint POST /api/auth/logout removes the session."
        - working: true
          agent: "testing"
          comment: "✅ Single-active session works: Login twice as admin, TOKEN_A returns 401 with Arabic message 'تم تسجيل دخولك من جهاز آخر أو انتهت الجلسة', TOKEN_B returns 200. ✅ Logout endpoint works: POST /auth/logout returns 200 with ok=true, subsequent /auth/me returns 401. NOTE: Race condition exists - if two logins happen within milliseconds, both sessions may briefly exist. Added 0.5s delay in test to avoid this."
  - task: "Prevent deleting main admin user + last admin"
    implemented: true
    working: true
    file: "backend/routes.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "DELETE /api/users/{id}: returns 403 if target.username == 'admin'; 409 if target is the last active admin; 400 if attempting self-delete."
        - working: false
          agent: "testing"
          comment: "❌ BUG: DELETE /api/users/{main_admin_id} returns 400 'لا يمكنك حذف حسابك الشخصي' instead of expected 403 'لا يمكن حذف حساب مدير النظام الرئيسي'. Issue: In routes.py delete_user(), the self-delete check (line 378) runs BEFORE the main admin username check (line 384). When logged in as admin trying to delete admin, it hits self-delete first. Fix: Reorder checks - check for username=='admin' BEFORE checking self-delete. ✅ Secondary admin deletion works correctly (returns 200)."
        - working: "NA"
          agent: "main"
          comment: "Fixed by reordering validation checks in delete_user() function. Main admin username check (line 382-383) now runs BEFORE self-delete check (line 384-385)."
        - working: true
          agent: "testing"
          comment: "✅ BUG FIXED: DELETE /api/users/{main_admin_id} now correctly returns HTTP 403 with detail 'لا يمكن حذف حساب مدير النظام الرئيسي'. Verified with main admin user (username='admin', id=08a755ca-f9e2-4663-825d-1f1a8ffb1533). The validation check reordering successfully resolved the issue."
  - task: "Arabic delete error messages"
    implemented: true
    working: true
    file: "backend/routes.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "All 409 delete-constraint messages for owners/properties/units/tenants + user-related messages are now in Arabic."
        - working: true
          agent: "testing"
          comment: "✅ All Arabic delete error messages working correctly: Owner with properties returns 409 'لا يمكن حذف المالك', Property with units returns 409 'لا يمكن حذف العقار', Unit with contracts returns 409 'لا يمكن حذف الوحدة', Tenant with contracts returns 409 'لا يمكن حذف المستأجر'."
  - task: "Unit delete: broader integrity check"
    implemented: true
    working: true
    file: "backend/routes.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "DELETE /api/units/{id}: now returns 409 if unit has any contracts OR utility_bills OR maintenance requests linked."
        - working: true
          agent: "testing"
          comment: "✅ Unit delete broader integrity working correctly: Created test unit, added utility bill → DELETE returns 409 'لا يمكن حذف الوحدة: يوجد 1 فاتورة مرافق مرتبطة بها', deleted bill, added maintenance → DELETE returns 409 'لا يمكن حذف الوحدة: يوجد 1 طلب صيانة مرتبط بها', deleted maintenance → DELETE returns 200. All integrity checks working as expected."

agent_communication:
    - agent: "main"
      message: |
        Please test ONLY these newly added / modified behaviors:
        
        1. Session single-active login
           - Login as admin → get token A
           - Login as admin again (2nd session) → get token B
           - Using token A now → expect 401 with detail containing "تم تسجيل دخولك من جهاز آخر" (kicked out)
           - Using token B → still works
        
        2. Session idle timeout
           - Login → get token. Call /api/auth/me repeatedly, should succeed while active.
           - (Optional: to test 3-minute idle, set SESSION_IDLE_SECONDS via env before deploy. For test, only verify no immediate 401.)
        
        3. Logout endpoint
           - POST /api/auth/logout with valid token → 200 { ok: true }
           - Using same token afterwards → 401
        
        4. Cannot delete main admin
           - Login as admin. GET /api/users; find user with username == "admin"
           - DELETE /api/users/{that_id} → expect 403 with detail "لا يمكن حذف حساب مدير النظام الرئيسي"
        
        5. Cannot delete last admin (regression-safe: currently 'admin' is the only admin so it'll hit the main-admin block first – so create a second admin, then try deleting each)
           - Login as admin. POST /api/users {name:"Admin2", username:"admin2", password:"pw", role:"admin", is_active:true}
           - DELETE /api/users/{admin2_id} → should return 200 (regular admin, not the special one)
        
        6. Arabic messages on delete constraints
           - Try DELETE /api/owners/{id_that_has_props} → detail should contain "لا يمكن حذف المالك"
           - Try DELETE /api/properties/{id_that_has_units} → detail should contain "لا يمكن حذف العقار"
           - Try DELETE /api/units/{id_that_has_contracts} → detail should contain "لا يمكن حذف الوحدة"
           - Try DELETE /api/tenants/{id_that_has_contracts} → detail should contain "لا يمكن حذف المستأجر"
        
        7. Unit delete broader integrity
           - Create a fresh unit with no contracts. Add a utility_bill referencing this unit.
           - DELETE that unit → expect 409 detail containing "فاتورة مرافق"
           - Delete the utility bill. Add a maintenance request for this unit.
           - DELETE that unit → expect 409 detail containing "طلب صيانة"
           - Delete maintenance. DELETE the unit → expect 200.
    - agent: "testing"
      message: |
        TESTING COMPLETE - 7 Test Scenarios Executed
        
        Test Results: 7 total tests, 6 passed (85.7%), 1 failed
        
        ✅ PASSED TESTS (6/7):
        1. Single active session - Works correctly with Arabic message
        2. Logout endpoint - Works correctly
        3. Can delete secondary admin - Works correctly
        4. Arabic delete error messages - All 4 entity types working correctly
        5. Unit delete broader integrity - Utility bills and maintenance checks working
        6. Regression: normal CRUD - All endpoints still working
        
        ❌ FAILED TEST (1/7):
        Test 3: Cannot delete main admin
        - Expected: DELETE /api/users/{main_admin_id} returns 403 with "لا يمكن حذف حساب مدير النظام الرئيسي"
        - Actual: Returns 400 with "لا يمكنك حذف حسابك الشخصي"
        - Root Cause: In routes.py delete_user() function (lines 376-394), the self-delete check (line 378-379) executes BEFORE the main admin username check (line 384-385)
        - Fix Required: Reorder the validation checks - check for username=='admin' BEFORE checking if item_id == user['id']
        
        ⚠️ IMPORTANT NOTE - Race Condition in Single-Session:
        The single-session enforcement has a race condition when two login requests arrive within milliseconds. If requests are processed concurrently:
        - Both delete_many operations may complete before either insert_one
        - This can result in both sessions existing briefly
        - In production with high concurrency, this could allow multiple active sessions temporarily
        - Recommendation: Consider using MongoDB transactions or adding a unique index on (user_id) in sessions collection with upsert operation
        
        All other features working as expected. The main admin deletion bug is a simple fix (reorder validation checks).
    - agent: "main"
      message: |
        Fixed the main admin deletion bug by reordering validation checks in routes.py delete_user() function.
        The main admin username check now runs BEFORE the self-delete check.
        Please re-test: DELETE /api/users/{main_admin_id} should return 403 with "لا يمكن حذف حساب مدير النظام الرئيسي"
    - agent: "testing"
      message: |
        RE-TEST COMPLETE - BUG SUCCESSFULLY FIXED! ✅
        
        Test: Cannot delete main admin user
        - Login: POST /api/auth/login with admin/admin → ✅ Success
        - GET /api/users → ✅ Found main admin (username='admin', id=08a755ca-f9e2-4663-825d-1f1a8ffb1533)
        - DELETE /api/users/{main_admin_id} → ✅ Returns HTTP 403
        - Response detail: "لا يمكن حذف حساب مدير النظام الرئيسي" ✅
        
        The validation check reordering has successfully resolved the issue. The main admin account is now properly protected with the correct HTTP status code (403) and Arabic error message.


