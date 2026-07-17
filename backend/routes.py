"""All API routes grouped by domain."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta

from database import (
    coll_users, coll_owners, coll_properties, coll_units, coll_tenants,
    coll_contracts, coll_payments, coll_expenses, coll_maintenance, coll_settings,
    coll_utility_bills,
)
from models import (
    LoginRequest, TokenResponse, UserCreate, UserUpdate,
    OwnerBase, PropertyBase, UnitBase, TenantBase, ContractBase,
    PaymentBase, ExpenseBase, MaintenanceBase, UtilityBillBase, SettingsData, new_id,
)
from auth import (
    hash_password, verify_password, create_token, get_current_user, require_admin
)

router = APIRouter(prefix='/api')


def _now():
    return datetime.now(timezone.utc).isoformat()


def _clean(doc):
    if doc is None:
        return None
    doc.pop('_id', None)
    doc.pop('password', None)
    return doc


async def _list_docs(coll):
    docs = await coll.find().to_list(2000)
    return [_clean(d) for d in docs]


async def _get_doc(coll, name, item_id):
    doc = await coll.find_one({'id': item_id})
    if not doc:
        raise HTTPException(404, f'{name} not found')
    return _clean(doc)


async def _create_doc(coll, data):
    doc = {**data, 'id': new_id(), 'created_at': _now(), 'updated_at': _now()}
    await coll.insert_one(doc)
    return _clean(dict(doc))


async def _update_doc(coll, name, item_id, data):
    existing = await coll.find_one({'id': item_id})
    if not existing:
        raise HTTPException(404, f'{name} not found')
    update = {k: v for k, v in data.items()}
    update['updated_at'] = _now()
    await coll.update_one({'id': item_id}, {'$set': update})
    doc = await coll.find_one({'id': item_id})
    return _clean(doc)


async def _delete_doc(coll, name, item_id):
    res = await coll.delete_one({'id': item_id})
    if res.deleted_count == 0:
        raise HTTPException(404, f'{name} not found')
    return {'ok': True, 'deleted': item_id}


# ============= AUTH =============
@router.get('/')
async def root():
    return {'message': 'Property Management API'}


@router.post('/auth/login', response_model=TokenResponse)
async def login(payload: LoginRequest):
    user = await coll_users.find_one({'username': payload.username})
    if not user or not verify_password(payload.password, user['password']):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    if not user.get('is_active', True):
        raise HTTPException(status_code=403, detail='User inactive')
    token = create_token(user['id'], user['username'], user['role'])
    return TokenResponse(access_token=token, user=_clean(dict(user)))


@router.get('/auth/me')
async def get_me(user: dict = Depends(get_current_user)):
    return user


# ============= OWNERS =============
@router.get('/owners')
async def list_owners(user: dict = Depends(get_current_user)):
    return await _list_docs(coll_owners)

@router.get('/owners/{item_id}')
async def get_owner(item_id: str, user: dict = Depends(get_current_user)):
    return await _get_doc(coll_owners, 'Owner', item_id)

@router.post('/owners')
async def create_owner(payload: OwnerBase, user: dict = Depends(get_current_user)):
    return await _create_doc(coll_owners, payload.dict())

@router.put('/owners/{item_id}')
async def update_owner(item_id: str, payload: OwnerBase, user: dict = Depends(get_current_user)):
    return await _update_doc(coll_owners, 'Owner', item_id, payload.dict())

@router.delete('/owners/{item_id}')
async def delete_owner(item_id: str, user: dict = Depends(get_current_user)):
    # Prevent deletion if owner has properties
    props_count = await coll_properties.count_documents({'owner_id': item_id})
    if props_count > 0:
        raise HTTPException(409, f'Cannot delete owner: has {props_count} property(ies) linked')
    return await _delete_doc(coll_owners, 'Owner', item_id)


# ============= PROPERTIES =============
@router.get('/properties')
async def list_properties(user: dict = Depends(get_current_user)):
    return await _list_docs(coll_properties)

@router.get('/properties/{item_id}')
async def get_property(item_id: str, user: dict = Depends(get_current_user)):
    return await _get_doc(coll_properties, 'Property', item_id)

@router.post('/properties')
async def create_property(payload: PropertyBase, user: dict = Depends(get_current_user)):
    return await _create_doc(coll_properties, payload.dict())

@router.put('/properties/{item_id}')
async def update_property(item_id: str, payload: PropertyBase, user: dict = Depends(get_current_user)):
    return await _update_doc(coll_properties, 'Property', item_id, payload.dict())

@router.delete('/properties/{item_id}')
async def delete_property(item_id: str, user: dict = Depends(get_current_user)):
    return await _delete_doc(coll_properties, 'Property', item_id)


# ============= UNITS =============
@router.get('/units')
async def list_units(user: dict = Depends(get_current_user)):
    return await _list_docs(coll_units)

@router.get('/units/{item_id}')
async def get_unit(item_id: str, user: dict = Depends(get_current_user)):
    return await _get_doc(coll_units, 'Unit', item_id)

@router.post('/units')
async def create_unit(payload: UnitBase, user: dict = Depends(get_current_user)):
    return await _create_doc(coll_units, payload.dict())

@router.put('/units/{item_id}')
async def update_unit(item_id: str, payload: UnitBase, user: dict = Depends(get_current_user)):
    return await _update_doc(coll_units, 'Unit', item_id, payload.dict())

@router.delete('/units/{item_id}')
async def delete_unit(item_id: str, user: dict = Depends(get_current_user)):
    return await _delete_doc(coll_units, 'Unit', item_id)


# ============= TENANTS =============
@router.get('/tenants')
async def list_tenants(user: dict = Depends(get_current_user)):
    return await _list_docs(coll_tenants)

@router.get('/tenants/{item_id}')
async def get_tenant(item_id: str, user: dict = Depends(get_current_user)):
    return await _get_doc(coll_tenants, 'Tenant', item_id)

@router.post('/tenants')
async def create_tenant(payload: TenantBase, user: dict = Depends(get_current_user)):
    return await _create_doc(coll_tenants, payload.dict())

@router.put('/tenants/{item_id}')
async def update_tenant(item_id: str, payload: TenantBase, user: dict = Depends(get_current_user)):
    return await _update_doc(coll_tenants, 'Tenant', item_id, payload.dict())

@router.delete('/tenants/{item_id}')
async def delete_tenant(item_id: str, user: dict = Depends(get_current_user)):
    # Prevent deletion if tenant has contracts
    contracts_count = await coll_contracts.count_documents({'tenant_id': item_id})
    if contracts_count > 0:
        raise HTTPException(409, f'Cannot delete tenant: has {contracts_count} contract(s) linked')
    return await _delete_doc(coll_tenants, 'Tenant', item_id)


# ============= CONTRACTS =============
@router.get('/contracts')
async def list_contracts(user: dict = Depends(get_current_user)):
    return await _list_docs(coll_contracts)

@router.get('/contracts/{item_id}')
async def get_contract(item_id: str, user: dict = Depends(get_current_user)):
    return await _get_doc(coll_contracts, 'Contract', item_id)

@router.post('/contracts')
async def create_contract(payload: ContractBase, user: dict = Depends(get_current_user)):
    return await _create_doc(coll_contracts, payload.dict())

@router.put('/contracts/{item_id}')
async def update_contract(item_id: str, payload: ContractBase, user: dict = Depends(get_current_user)):
    return await _update_doc(coll_contracts, 'Contract', item_id, payload.dict())

@router.delete('/contracts/{item_id}')
async def delete_contract(item_id: str, user: dict = Depends(get_current_user)):
    return await _delete_doc(coll_contracts, 'Contract', item_id)


# ============= PAYMENTS =============
@router.get('/payments')
async def list_payments(user: dict = Depends(get_current_user)):
    return await _list_docs(coll_payments)

@router.get('/payments/{item_id}')
async def get_payment(item_id: str, user: dict = Depends(get_current_user)):
    return await _get_doc(coll_payments, 'Payment', item_id)

@router.post('/payments')
async def create_payment(payload: PaymentBase, user: dict = Depends(get_current_user)):
    return await _create_doc(coll_payments, payload.dict())

@router.put('/payments/{item_id}')
async def update_payment(item_id: str, payload: PaymentBase, user: dict = Depends(get_current_user)):
    return await _update_doc(coll_payments, 'Payment', item_id, payload.dict())

@router.delete('/payments/{item_id}')
async def delete_payment(item_id: str, user: dict = Depends(get_current_user)):
    return await _delete_doc(coll_payments, 'Payment', item_id)


# ============= EXPENSES =============
@router.get('/expenses')
async def list_expenses(user: dict = Depends(get_current_user)):
    return await _list_docs(coll_expenses)

@router.get('/expenses/{item_id}')
async def get_expense(item_id: str, user: dict = Depends(get_current_user)):
    return await _get_doc(coll_expenses, 'Expense', item_id)

@router.post('/expenses')
async def create_expense(payload: ExpenseBase, user: dict = Depends(get_current_user)):
    return await _create_doc(coll_expenses, payload.dict())

@router.put('/expenses/{item_id}')
async def update_expense(item_id: str, payload: ExpenseBase, user: dict = Depends(get_current_user)):
    return await _update_doc(coll_expenses, 'Expense', item_id, payload.dict())

@router.delete('/expenses/{item_id}')
async def delete_expense(item_id: str, user: dict = Depends(get_current_user)):
    return await _delete_doc(coll_expenses, 'Expense', item_id)


# ============= MAINTENANCE =============
@router.get('/maintenance')
async def list_maintenance(user: dict = Depends(get_current_user)):
    return await _list_docs(coll_maintenance)

@router.get('/maintenance/{item_id}')
async def get_maintenance(item_id: str, user: dict = Depends(get_current_user)):
    return await _get_doc(coll_maintenance, 'Maintenance', item_id)

@router.post('/maintenance')
async def create_maintenance(payload: MaintenanceBase, user: dict = Depends(get_current_user)):
    return await _create_doc(coll_maintenance, payload.dict())

@router.put('/maintenance/{item_id}')
async def update_maintenance(item_id: str, payload: MaintenanceBase, user: dict = Depends(get_current_user)):
    return await _update_doc(coll_maintenance, 'Maintenance', item_id, payload.dict())

@router.delete('/maintenance/{item_id}')
async def delete_maintenance(item_id: str, user: dict = Depends(get_current_user)):
    return await _delete_doc(coll_maintenance, 'Maintenance', item_id)


# ============= UTILITY BILLS (Electricity / Water) =============
@router.get('/utility_bills')
async def list_utility_bills(user: dict = Depends(get_current_user)):
    return await _list_docs(coll_utility_bills)

@router.get('/utility_bills/{item_id}')
async def get_utility_bill(item_id: str, user: dict = Depends(get_current_user)):
    return await _get_doc(coll_utility_bills, 'Utility Bill', item_id)

@router.post('/utility_bills')
async def create_utility_bill(payload: UtilityBillBase, user: dict = Depends(get_current_user)):
    data = payload.dict()
    # auto-calculate consumption if readings provided but consumption not set
    if data.get('previous_reading') is not None and data.get('current_reading') is not None and data.get('consumption') in (None, 0):
        try:
            data['consumption'] = float(data['current_reading']) - float(data['previous_reading'])
        except Exception:
            pass
    return await _create_doc(coll_utility_bills, data)

@router.put('/utility_bills/{item_id}')
async def update_utility_bill(item_id: str, payload: UtilityBillBase, user: dict = Depends(get_current_user)):
    data = payload.dict()
    if data.get('previous_reading') is not None and data.get('current_reading') is not None and data.get('consumption') in (None, 0):
        try:
            data['consumption'] = float(data['current_reading']) - float(data['previous_reading'])
        except Exception:
            pass
    return await _update_doc(coll_utility_bills, 'Utility Bill', item_id, data)

@router.delete('/utility_bills/{item_id}')
async def delete_utility_bill(item_id: str, user: dict = Depends(get_current_user)):
    return await _delete_doc(coll_utility_bills, 'Utility Bill', item_id)


# ============= USERS =============
@router.get('/users')
async def list_users(user: dict = Depends(get_current_user)):
    docs = await coll_users.find().to_list(2000)
    return [_clean(d) for d in docs]

@router.post('/users')
async def create_user(payload: UserCreate, user: dict = Depends(require_admin)):
    if await coll_users.find_one({'username': payload.username}):
        raise HTTPException(400, 'Username already exists')
    doc = payload.dict()
    doc['password'] = hash_password(doc['password'])
    doc['id'] = new_id()
    doc['created_at'] = _now(); doc['updated_at'] = _now()
    await coll_users.insert_one(doc)
    return _clean(dict(doc))

@router.put('/users/{item_id}')
async def update_user(item_id: str, payload: UserUpdate, user: dict = Depends(require_admin)):
    existing = await coll_users.find_one({'id': item_id})
    if not existing:
        raise HTTPException(404, 'User not found')
    update = payload.dict(exclude_unset=True)
    if 'password' in update and update['password']:
        update['password'] = hash_password(update['password'])
    elif 'password' in update:
        update.pop('password', None)
    update['updated_at'] = _now()
    await coll_users.update_one({'id': item_id}, {'$set': update})
    doc = await coll_users.find_one({'id': item_id})
    return _clean(doc)

@router.delete('/users/{item_id}')
async def delete_user(item_id: str, user: dict = Depends(require_admin)):
    if item_id == user['id']:
        raise HTTPException(400, 'Cannot delete yourself')
    res = await coll_users.delete_one({'id': item_id})
    if res.deleted_count == 0:
        raise HTTPException(404, 'User not found')
    return {'ok': True}


# ============= SETTINGS =============
@router.get('/settings')
async def get_settings(user: dict = Depends(get_current_user)):
    doc = await coll_settings.find_one({'key': 'settings'})
    if not doc:
        return SettingsData().dict()
    _clean(doc)
    doc.pop('key', None)
    return doc

@router.put('/settings')
async def update_settings(payload: SettingsData, user: dict = Depends(require_admin)):
    update = payload.dict()
    await coll_settings.update_one({'key': 'settings'}, {'$set': update}, upsert=True)
    return update


# ============= DASHBOARD =============
@router.get('/dashboard/summary')
async def dashboard_summary(user: dict = Depends(get_current_user)):
    units = await coll_units.find().to_list(2000)
    payments = await coll_payments.find().to_list(5000)
    expenses = await coll_expenses.find().to_list(5000)
    contracts = await coll_contracts.find().to_list(2000)

    total_units = len(units)
    rented_units = sum(1 for u in units if u.get('status') == 'rented')
    vacant_units = sum(1 for u in units if u.get('status') == 'vacant')
    maint_units = sum(1 for u in units if u.get('status') == 'under_maintenance')
    reserved_units = sum(1 for u in units if u.get('status') == 'reserved')

    now = datetime.now(timezone.utc)
    ym = now.strftime('%Y-%m')

    this_month_revenue = sum(
        float(p.get('amount', 0)) for p in payments
        if p.get('status') == 'paid' and (p.get('payment_date') or '').startswith(ym)
    )
    this_month_expenses = sum(
        float(e.get('amount', 0)) for e in expenses
        if e.get('status') == 'paid' and (e.get('expense_date') or '').startswith(ym)
    )

    last_month = (now.replace(day=1) - timedelta(days=1)).strftime('%Y-%m')
    last_rev = sum(float(p.get('amount', 0)) for p in payments if p.get('status') == 'paid' and (p.get('payment_date') or '').startswith(last_month))
    last_exp = sum(float(e.get('amount', 0)) for e in expenses if e.get('status') == 'paid' and (e.get('expense_date') or '').startswith(last_month))

    def pct(cur, prev):
        if prev == 0:
            return 0
        return round(((cur - prev) / prev) * 100, 1)

    revenue_change = pct(this_month_revenue, last_rev)
    expense_change = pct(this_month_expenses, last_exp)

    pending_payments = sum(1 for p in payments if p.get('status') == 'pending')
    overdue_payments = sum(1 for p in payments if p.get('status') == 'overdue')

    horizon = (now + timedelta(days=60)).date().isoformat()
    today = now.date().isoformat()
    expiring_contracts = sum(
        1 for c in contracts
        if c.get('status') == 'active' and c.get('end_date') and today <= c['end_date'] <= horizon
    )

    year = now.year
    monthly_revenue = [0.0] * 12
    monthly_expenses = [0.0] * 12
    for p in payments:
        pd = p.get('payment_date') or ''
        if p.get('status') == 'paid' and pd.startswith(f'{year}-'):
            try:
                m = int(pd.split('-')[1]) - 1
                monthly_revenue[m] += float(p.get('amount', 0))
            except Exception:
                pass
    for e in expenses:
        ed = e.get('expense_date') or ''
        if e.get('status') == 'paid' and ed.startswith(f'{year}-'):
            try:
                m = int(ed.split('-')[1]) - 1
                monthly_expenses[m] += float(e.get('amount', 0))
            except Exception:
                pass

    return {
        'thisMonthRevenue': this_month_revenue,
        'thisMonthExpenses': this_month_expenses,
        'revenueChange': revenue_change,
        'expenseChange': expense_change,
        'totalUnits': total_units,
        'rentedUnits': rented_units,
        'vacantUnits': vacant_units,
        'maintenanceUnits': maint_units,
        'reservedUnits': reserved_units,
        'pendingPayments': pending_payments,
        'overduePayments': overdue_payments,
        'expiringContracts': expiring_contracts,
        'monthlyRevenue': monthly_revenue,
        'monthlyExpenses': monthly_expenses,
    }
