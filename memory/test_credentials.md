# Test Credentials

## Property Management System
- **URL:** value of `REACT_APP_BACKEND_URL` in `/app/frontend/.env`
- **Login page:** `/` (redirects to `/login`)

### Admin Account (system administrator — cannot be deleted from UI)
- **Username:** `admin`
- **Password:** `admin`
- **Role:** admin

### Notes
- Single active session per user: signing in on a second device invalidates the previous token.
- Idle sessions expire after 3 minutes.
- The `admin` username is protected — its Users-page row shows a Shield icon instead of a Delete button, and the backend returns 403 on delete attempts.
- Uniqueness rules: name is unique across owners/tenants/users; phone and national_id are unique across owners/tenants (users don't carry those fields).
