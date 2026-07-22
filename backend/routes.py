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
    hash_password, verify_password, create_token, get_current_user, require_admin,
    start_session, end_session,
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


# ============= UNIQUENESS ACROSS OWNERS/TENANTS/USERS =============
async def _ensure_person_unique(name=None, phone=None, national_id=None, exclude=None):
    """Ensure name (across owners/tenants/users) and phone/national_id (across
    owners/tenants) are unique system-wide.

    exclude: tuple (collection_key, id) to skip during edits.
    Raises HTTPException 409 with an Arabic message on duplicates.
    """
    def _norm(v):
        if v is None:
            return None
        s = str(v).strip()
        return s if s else None

    name = _norm(name)
    phone = _norm(phone)
    national_id = _norm(national_id)

    checks = [
        ('owners', coll_owners, 'الملاك'),
        ('tenants', coll_tenants, 'المستأجرين'),
        ('users', coll_users, 'المستخدمين'),
    ]

    for key, coll, label in checks:
        # Name: enforced across all three collections
        if name:
            q = {'name': name}
            if exclude and exclude[0] == key:
                q['id'] = {'$ne': exclude[1]}
            if await coll.find_one(q):
                raise HTTPException(409, f'الاسم "{name}" مسجل مسبقاً في {label}. لا يمكن تكرار الاسم في النظام.')

        # phone / national_id: enforced only for owners+tenants (users don't have those fields)
        if key in ('owners', 'tenants'):
            if phone:
                q = {'phone': phone}
                if exclude and exclude[0] == key:
                    q['id'] = {'$ne': exclude[1]}
                if await coll.find_one(q):
                    raise HTTPException(409, f'رقم الجوال "{phone}" مسجل مسبقاً في {label}. لا يمكن تكرار رقم الجوال في النظام.')
            if national_id:
                q = {'national_id': national_id}
                if exclude and exclude[0] == key:
                    q['id'] = {'$ne': exclude[1]}
                if await coll.find_one(q):
                    raise HTTPException(409, f'رقم الهوية "{national_id}" مسجل مسبقاً في {label}. لا يمكن تكرار رقم الهوية في النظام.')


# ============= AUTH =============
@router.get('/')
async def root():
    return {'message': 'Property Management API'}


@router.post('/auth/login', response_model=TokenResponse)
async def login(payload: LoginRequest):
    user = await coll_users.find_one({'username': payload.username})
    if not user or not verify_password(payload.password, user['password']):
        raise HTTPException(status_code=401, detail='بيانات الدخول غير صحيحة')
    if not user.get('is_active', True):
        raise HTTPException(status_code=403, detail='هذا الحساب غير نشط')
    token = create_token(user['id'], user['username'], user['role'])
    await start_session(user['id'], token)
    return TokenResponse(access_token=token, user=_clean(dict(user)))


@router.post('/auth/logout')
async def logout(user: dict = Depends(get_current_user), creds=Depends(__import__('auth').bearer)):
    if creds and creds.credentials:
        await end_session(creds.credentials)
    return {'ok': True}


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
    data = payload.dict()
    await _ensure_person_unique(name=data.get('name'), phone=data.get('phone'), national_id=data.get('national_id'))
    return await _create_doc(coll_owners, data)

@router.put('/owners/{item_id}')
async def update_owner(item_id: str, payload: OwnerBase, user: dict = Depends(get_current_user)):
    data = payload.dict()
    await _ensure_person_unique(name=data.get('name'), phone=data.get('phone'), national_id=data.get('national_id'), exclude=('owners', item_id))
    return await _update_doc(coll_owners, 'Owner', item_id, data)

@router.delete('/owners/{item_id}')
async def delete_owner(item_id: str, user: dict = Depends(get_current_user)):
    # Prevent deletion if owner has properties
    props_count = await coll_properties.count_documents({'owner_id': item_id})
    if props_count > 0:
        raise HTTPException(409, f'لا يمكن حذف المالك: يوجد {props_count} عقار مرتبط به. يجب حذف جميع العقارات أولاً.')
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
    # Prevent deletion if property has units
    units_count = await coll_units.count_documents({'property_id': item_id})
    if units_count > 0:
        raise HTTPException(409, f'لا يمكن حذف العقار: يوجد {units_count} وحدة مرتبطة به. يجب حذف جميع الوحدات أولاً.')
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
    # Verify the unit still references an existing property (integrity)
    unit = await coll_units.find_one({'id': item_id})
    if not unit:
        raise HTTPException(404, 'الوحدة غير موجودة')
    prop = await coll_properties.find_one({'id': unit.get('property_id')})
    if prop:
        # Cannot delete a unit that still belongs to an existing property until we check other links
        pass
    # Check contracts
    contracts_count = await coll_contracts.count_documents({'unit_id': item_id})
    if contracts_count > 0:
        raise HTTPException(409, f'لا يمكن حذف الوحدة: يوجد {contracts_count} عقد مرتبط بها. يجب حذف العقود أولاً.')
    # Check utility bills
    bills_count = await coll_utility_bills.count_documents({'unit_id': item_id})
    if bills_count > 0:
        raise HTTPException(409, f'لا يمكن حذف الوحدة: يوجد {bills_count} فاتورة مرافق مرتبطة بها.')
    # Check maintenance
    mnt_count = await coll_maintenance.count_documents({'unit_id': item_id})
    if mnt_count > 0:
        raise HTTPException(409, f'لا يمكن حذف الوحدة: يوجد {mnt_count} طلب صيانة مرتبط بها.')
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
    data = payload.dict()
    await _ensure_person_unique(name=data.get('name'), phone=data.get('phone'), national_id=data.get('national_id'))
    return await _create_doc(coll_tenants, data)

@router.put('/tenants/{item_id}')
async def update_tenant(item_id: str, payload: TenantBase, user: dict = Depends(get_current_user)):
    data = payload.dict()
    await _ensure_person_unique(name=data.get('name'), phone=data.get('phone'), national_id=data.get('national_id'), exclude=('tenants', item_id))
    return await _update_doc(coll_tenants, 'Tenant', item_id, data)

@router.delete('/tenants/{item_id}')
async def delete_tenant(item_id: str, user: dict = Depends(get_current_user)):
    # Prevent deletion if tenant has contracts
    contracts_count = await coll_contracts.count_documents({'tenant_id': item_id})
    if contracts_count > 0:
        raise HTTPException(409, f'لا يمكن حذف المستأجر: يوجد {contracts_count} عقد مرتبط به. يجب حذف العقود أولاً.')
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
@router.post('/payments/generate-monthly')
async def generate_monthly_payments(payload: dict, user: dict = Depends(get_current_user)):
    """Create pending rent payments for every ACTIVE contract that covers the
    given YYYY-MM period and does not already have a rent payment for it.

    Body: { "year_month": "2026-07" }
    Returns: { created, skipped_existing, skipped_inactive, total_contracts }
    """
    ym = (payload or {}).get('year_month') or datetime.now(timezone.utc).strftime('%Y-%m')
    try:
        year, month = ym.split('-')
        year_i = int(year); month_i = int(month)
        month_start = f'{year_i:04d}-{month_i:02d}-01'
        # last day of month
        if month_i == 12:
            next_month_start = f'{year_i + 1:04d}-01-01'
        else:
            next_month_start = f'{year_i:04d}-{month_i + 1:02d}-01'
    except Exception:
        raise HTTPException(400, 'صيغة الشهر غير صحيحة. يجب أن تكون YYYY-MM مثل 2026-07')

    contracts = await coll_contracts.find().to_list(5000)
    created = 0
    skipped_existing = 0
    skipped_inactive = 0
    for c in contracts:
        if c.get('status') != 'active':
            skipped_inactive += 1
            continue
        start = c.get('start_date') or ''
        end = c.get('end_date') or ''
        # contract must overlap [month_start, next_month_start)
        if start and start >= next_month_start:
            skipped_inactive += 1
            continue
        if end and end < month_start:
            skipped_inactive += 1
            continue
        # already has a rent payment for this month?
        due_prefix = f'{year_i:04d}-{month_i:02d}'
        existing = await coll_payments.find_one({
            'contract_id': c['id'],
            'type': 'rent',
            '$or': [
                {'due_date': {'$regex': f'^{due_prefix}'}},
                {'payment_date': {'$regex': f'^{due_prefix}'}},
            ],
        })
        if existing:
            skipped_existing += 1
            continue
        doc = {
            'contract_id': c['id'],
            'tenant_id': c.get('tenant_id'),
            'amount': float(c.get('rent_amount') or 0),
            'payment_date': None,
            'due_date': month_start,
            'type': 'rent',
            'status': 'pending',
            'late_fee': 0.0,
            'payment_method': 'bank_transfer',
            'reference_number': None,
            'notes': f'دفعة إيجار شهر {due_prefix} (تم إنشاؤها تلقائياً)',
            'id': new_id(),
            'created_at': _now(),
            'updated_at': _now(),
        }
        await coll_payments.insert_one(doc)
        created += 1

    return {
        'ok': True,
        'year_month': ym,
        'created': created,
        'skipped_existing': skipped_existing,
        'skipped_inactive': skipped_inactive,
        'total_contracts': len(contracts),
    }


@router.post('/payments/mark-overdue')
async def mark_overdue_payments(payload: dict = None, user: dict = Depends(get_current_user)):
    """Scan all PENDING payments whose due_date is before today (minus optional
    grace days) and flip them to status='overdue'. Optionally add a late fee.

    Body (all optional):
      { "grace_days": 0, "late_fee_flat": 0, "late_fee_percent": 0 }
    Returns: { updated, still_pending, checked }
    """
    payload = payload or {}
    try:
        grace_days = int(payload.get('grace_days') or 0)
    except Exception:
        grace_days = 0
    try:
        late_fee_flat = float(payload.get('late_fee_flat') or 0)
    except Exception:
        late_fee_flat = 0.0
    try:
        late_fee_percent = float(payload.get('late_fee_percent') or 0)
    except Exception:
        late_fee_percent = 0.0

    today = datetime.now(timezone.utc).date()
    cutoff = (today - timedelta(days=grace_days)).isoformat()

    pending = await coll_payments.find({'status': 'pending'}).to_list(10000)
    updated = 0
    still_pending = 0
    for p in pending:
        due = p.get('due_date') or ''
        if not due or due >= cutoff:
            # not overdue yet
            still_pending += 1
            continue
        add_fee = late_fee_flat + (late_fee_percent / 100.0) * float(p.get('amount') or 0)
        new_fee = float(p.get('late_fee') or 0) + add_fee
        await coll_payments.update_one(
            {'id': p['id']},
            {'$set': {
                'status': 'overdue',
                'late_fee': round(new_fee, 2),
                'updated_at': _now(),
            }},
        )
        updated += 1

    return {
        'ok': True,
        'updated': updated,
        'still_pending': still_pending,
        'checked': len(pending),
        'grace_days': grace_days,
        'late_fee_flat': late_fee_flat,
        'late_fee_percent': late_fee_percent,
    }


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
        raise HTTPException(409, 'اسم المستخدم مسجل مسبقاً')
    doc = payload.dict()
    await _ensure_person_unique(name=doc.get('name'))
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
    if update.get("username"):
    exists = await coll_users.find_one({
        "username": update["username"],
        "id": {"$ne": item_id}
    })
    if exists:
        raise HTTPException(409, "اسم المستخدم مستخدم بالفعل")
    if update.get('name'):
        await _ensure_person_unique(name=update.get('name'), exclude=('users', item_id))
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
    target = await coll_users.find_one({'id': item_id})
    if not target:
        raise HTTPException(404, 'المستخدم غير موجود')
    # Highest priority: never allow deleting the special "admin" system administrator
    if target.get('username') == 'admin':
        raise HTTPException(403, 'لا يمكن حذف حساب مدير النظام الرئيسي')
    if item_id == user['id']:
        raise HTTPException(400, 'لا يمكنك حذف حسابك الشخصي')
    # Prevent deleting the last remaining admin
    if target.get('role') == 'admin':
        admin_count = await coll_users.count_documents({'role': 'admin', 'is_active': True})
        if admin_count <= 1:
            raise HTTPException(409, 'لا يمكن حذف آخر مدير في النظام')
    res = await coll_users.delete_one({'id': item_id})
    if res.deleted_count == 0:
        raise HTTPException(404, 'المستخدم غير موجود')
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
