"""Seed initial data: default admin user + demo data mirroring the mock data."""
from database import (
    coll_users, coll_owners, coll_properties, coll_units, coll_tenants,
    coll_contracts, coll_payments, coll_expenses, coll_maintenance, coll_settings,
    coll_utility_bills,
)
from auth import hash_password
from models import new_id
from datetime import datetime, timezone


async def _seed_utility_bills_if_empty():
    """Populate utility bills using existing tenants/units when the collection is empty."""
    if await coll_utility_bills.count_documents({}) > 0:
        return
    tenants = await coll_tenants.find().to_list(100)
    units = await coll_units.find().to_list(200)
    if not tenants or not units:
        return
    now = datetime.now(timezone.utc).isoformat()
    # Try to pair each of the first ~5 tenants with a unit (in seed order)
    samples = [
        ('electricity', 'SEC', 1200.0, 1520.0, 0.30, 96.0, 'paid', '2026-07-10'),
        ('water', 'NWC', 340.0, 385.0, 4.00, 180.0, 'pending', None),
        ('electricity', 'SEC', 800.0, 950.0, 0.30, 45.0, 'paid', '2026-07-12'),
        ('water', 'NWC', 210.0, 245.0, 4.00, 140.0, 'overdue', None),
        ('electricity', 'SEC', 500.0, 620.0, 0.30, 36.0, 'paid', '2026-07-08'),
        ('electricity', 'SEC', 4500.0, 6300.0, 0.32, 576.0, 'pending', None),
        ('water', 'NWC', 1200.0, 1450.0, 4.00, 1000.0, 'paid', '2026-07-11'),
        ('electricity', 'SEC', 2000.0, 2350.0, 0.30, 105.0, 'paid', '2026-07-15'),
    ]
    for idx, (btype, prov, prev, cur, price, amt, st, pd) in enumerate(samples):
        tenant = tenants[idx % len(tenants)]
        unit = units[idx % len(units)]
        await coll_utility_bills.insert_one({
            'id': new_id(),
            'unit_id': unit['id'],
            'tenant_id': tenant['id'],
            'bill_type': btype,
            'bill_number': f'{"ELEC" if btype == "electricity" else "WTR"}-{new_id()[:8].upper()}',
            'provider': prov,
            'period_from': '2026-06-01', 'period_to': '2026-06-30',
            'issue_date': '2026-07-05', 'due_date': '2026-07-20', 'payment_date': pd,
            'previous_reading': prev, 'current_reading': cur,
            'consumption': cur - prev,
            'unit_price': price, 'amount': amt, 'late_fee': 0,
            'status': st, 'payment_method': 'bank_transfer' if pd else None,
            'notes': None,
            'created_at': now, 'updated_at': now,
        })


async def seed_all():
    now = datetime.now(timezone.utc).isoformat()

    # --- Ensure default admin ---
    admin = await coll_users.find_one({'username': 'admin'})
    if not admin:
        admin_id = new_id()
        await coll_users.insert_one({
            'id': admin_id, 'name': 'مدير النظام', 'username': 'admin',
            'email': 'admin@propertymgmt.com', 'role': 'admin', 'is_active': True,
            'password': hash_password('admin'), 'created_at': now, 'updated_at': now,
        })
    if not await coll_users.find_one({'username': 'accountant'}):
        await coll_users.insert_one({
            'id': new_id(), 'name': 'محاسب النظام', 'username': 'accountant',
            'email': 'acc@propertymgmt.com', 'role': 'user', 'is_active': True,
            'password': hash_password('accountant'), 'created_at': now, 'updated_at': now,
        })

    # --- Settings ---
    if not await coll_settings.find_one({'key': 'settings'}):
        await coll_settings.insert_one({
            'key': 'settings',
            'company_name': 'شركة إدارة العقارات',
            'company_phone': '011-4567890',
            'company_email': 'info@propertymgmt.com',
            'company_address': 'الرياض، المملكة العربية السعودية',
            'currency': 'SAR', 'timezone': 'Asia/Riyadh',
        })

    # --- Skip demo data seeding if any owners exist ---
    if await coll_owners.count_documents({}) > 0:
        # But make sure utility bills exist even if other seed data was created earlier
        await _seed_utility_bills_if_empty()
        return

    # --- Owners ---
    owner_ids = {}
    owners_data = [
        ('o1', 'ايمن محمد حسين الحرازي', '05598310776', '2604104410', 'الجبيل البلد حي الصفاة', 'SA11111111111111111111111111111', 'active'),
        ('o2', 'وضاح عبدالله', '0530000115', '1093253191', 'الجبيل البلد حي الصفاة', None, 'active'),
        ('o3', 'محمد سعيد', '0555123456', '1122334455', 'الرياض حي النخيل', 'SA2222222222222222222222', 'active'),
        ('o4', 'سالم القحطاني', '0501234567', '2233445566', 'جدة حي الشاطئ', None, 'inactive'),
    ]
    for key, name, phone, nid, addr, bank, st in owners_data:
        oid = new_id()
        owner_ids[key] = oid
        await coll_owners.insert_one({
            'id': oid, 'name': name, 'phone': phone, 'national_id': nid,
            'address': addr, 'bank_account': bank, 'status': st, 'notes': None,
            'created_at': now, 'updated_at': now,
        })

    # --- Properties ---
    prop_ids = {}
    props_data = [
        ('p1', 'o1', 'عمارة الجبيل', 'residential', 'الجبيل', 'حي الصفاة', 'شارع عينين', 2, 155.0, 142.0),
        ('p2', 'o2', 'عمارة وضاح', 'residential', 'الجبيل', 'حي الصفاء', 'الجبيل حي الصفاء', 1, 155.0, 122.0),
        ('p3', 'o3', 'برج الرياض التجاري', 'commercial', 'الرياض', 'العليا', 'شارع الملك فهد', 12, 500.0, 4500.0),
        ('p4', 'o4', 'مجمع جدة السكني', 'residential', 'جدة', 'الشاطئ', 'كورنيش جدة', 8, 320.0, 2400.0),
    ]
    for key, okey, name, ptype, city, dist, addr, tu, la, ba in props_data:
        pid = new_id()
        prop_ids[key] = pid
        await coll_properties.insert_one({
            'id': pid, 'owner_id': owner_ids[okey], 'name': name, 'type': ptype,
            'city': city, 'district': dist, 'address': addr, 'total_units': tu,
            'land_area': la, 'built_area': ba, 'status': 'active', 'notes': None,
            'created_at': now, 'updated_at': now,
        })

    # --- Units ---
    unit_ids = {}
    units_data = [
        ('u1', 'p1', '452', '2', 43.0, 4, 1, 5000.0, 'rented'),
        ('u2', 'p1', '453', '2', 42.0, 3, 1, 1500.0, 'rented'),
        ('u3', 'p2', '55', '2', 22.0, 4, 1, 1500.0, 'rented'),
        ('u4', 'p3', '101', '1', 120.0, 0, 2, 15000.0, 'rented'),
        ('u5', 'p3', '102', '1', 90.0, 0, 1, 10000.0, 'vacant'),
        ('u6', 'p4', 'A1', '1', 150.0, 4, 3, 6500.0, 'rented'),
        ('u7', 'p4', 'A2', '1', 150.0, 4, 3, 6500.0, 'vacant'),
        ('u8', 'p4', 'B1', '2', 180.0, 5, 3, 8000.0, 'under_maintenance'),
    ]
    for key, pkey, num, fl, area, r, b, rp, st in units_data:
        uid = new_id()
        unit_ids[key] = uid
        await coll_units.insert_one({
            'id': uid, 'property_id': prop_ids[pkey], 'unit_number': num, 'floor': fl,
            'area': area, 'rooms': r, 'bathrooms': b, 'rent_price': rp, 'status': st,
            'notes': None, 'created_at': now, 'updated_at': now,
        })

    # --- Tenants ---
    tenant_ids = {}
    tenants_data = [
        ('t1', 'الاستاذ وضاح', '0501112222', '2604104410', 'البلد حي الصفاء', 'شركة مبارك'),
        ('t2', 'اسامة وضاح', '0530000115', '1093253191', None, 'شركة مبارك'),
        ('t3', 'راسل أحمد', '05598310776', '1133113546', None, 'عمارة وضاح'),
        ('t4', 'شركة النخيل التجارية', '0114567890', '4455667788', 'الرياض العليا', 'شركة النخيل'),
        ('t5', 'خالد المطيري', '0555987654', '5566778899', 'جدة الشاطئ', None),
    ]
    for key, name, phone, nid, addr, company in tenants_data:
        tid = new_id()
        tenant_ids[key] = tid
        await coll_tenants.insert_one({
            'id': tid, 'name': name, 'phone': phone, 'national_id': nid, 'address': addr,
            'company_name': company, 'status': 'active', 'notes': None,
            'created_at': now, 'updated_at': now,
        })

    # --- Contracts ---
    contract_ids = {}
    contracts_data = [
        ('c1', 'CTR-20260715-0001', 'u1', 't1', '2026-07-15', '2027-07-15', 24000.0, 0.0, 'quarterly'),
        ('c2', 'CTR-20260715-0123', 'u2', 't2', '2026-07-15', '2027-07-15', 29000.0, 0.0, 'monthly'),
        ('c3', 'CTR-20260715-0124', 'u3', 't3', '2026-07-01', '2027-07-01', 18000.0, 1500.0, 'quarterly'),
        ('c4', 'CTR-20260601-0125', 'u4', 't4', '2026-06-01', '2027-06-01', 180000.0, 30000.0, 'annual'),
        ('c5', 'CTR-20260101-0126', 'u6', 't5', '2026-01-01', '2026-08-15', 78000.0, 6500.0, 'monthly'),
    ]
    for key, cnum, ukey, tkey, sd, ed, amt, dep, freq in contracts_data:
        cid = new_id()
        contract_ids[key] = cid
        await coll_contracts.insert_one({
            'id': cid, 'contract_number': cnum, 'unit_id': unit_ids[ukey],
            'tenant_id': tenant_ids[tkey], 'start_date': sd, 'end_date': ed,
            'rent_amount': amt, 'security_deposit': dep, 'payment_frequency': freq,
            'status': 'active', 'terms': None, 'notes': None,
            'created_at': now, 'updated_at': now,
        })

    # --- Payments ---
    payments_data = [
        ('c1', 't1', 6000.0, '2026-07-01', '2026-07-01', 'rent', 'paid', 0, 'cash', 'PAY-20260715-00001', None),
        ('c3', 't3', 4500.0, '2026-07-01', '2026-07-01', 'rent', 'overdue', 150, 'cash', 'PAY-20260715-00902', 'المتبقي 3500'),
        ('c2', 't2', 2416.0, None, '2026-08-01', 'rent', 'pending', 0, 'bank_transfer', None, None),
        ('c4', 't4', 180000.0, '2026-06-01', '2026-06-01', 'rent', 'paid', 0, 'bank_transfer', 'PAY-BANK-0125', 'دفعة سنوية'),
        ('c5', 't5', 6500.0, '2026-07-05', '2026-07-01', 'rent', 'paid', 100, 'card', 'CARD-4590', None),
        ('c5', 't5', 6500.0, None, '2026-08-01', 'rent', 'pending', 0, 'card', None, None),
    ]
    for ckey, tkey, amt, pd, dd, typ, st, lf, pm, ref, nt in payments_data:
        await coll_payments.insert_one({
            'id': new_id(), 'contract_id': contract_ids[ckey], 'tenant_id': tenant_ids[tkey],
            'amount': amt, 'payment_date': pd, 'due_date': dd, 'type': typ, 'status': st,
            'late_fee': lf, 'payment_method': pm, 'reference_number': ref, 'notes': nt,
            'created_at': now, 'updated_at': now,
        })

    # --- Expenses ---
    exp_data = [
        ('p1', 'maintenance', 'صيانة المصعد', 1200.0, '2026-07-05', 'شركة الصيانة الحديثة', 'INV-2001', 'paid'),
        ('p2', 'utilities', 'فاتورة كهرباء', 850.0, '2026-07-10', 'شركة الكهرباء السعودية', 'ELEC-9876', 'paid'),
        ('p3', 'cleaning', 'خدمات النظافة الشهرية', 3000.0, '2026-07-01', 'شركة النظافة المثالية', 'CLN-100', 'paid'),
        ('p4', 'insurance', 'تأمين العقار السنوي', 12000.0, '2026-06-15', 'شركة التأمين الوطنية', 'INS-2026', 'paid'),
        ('p3', 'security', 'خدمات الحراسة', 4500.0, '2026-07-08', 'شركة الأمن المتحد', 'SEC-77', 'pending'),
    ]
    for pkey, cat, desc, amt, ed, ven, ref, st in exp_data:
        await coll_expenses.insert_one({
            'id': new_id(), 'property_id': prop_ids[pkey], 'category': cat,
            'description': desc, 'amount': amt, 'expense_date': ed, 'vendor': ven,
            'reference_number': ref, 'status': st, 'notes': None,
            'created_at': now, 'updated_at': now,
        })

    # --- Maintenance ---
    mnt_data = [
        ('u1', 'p1', 'إصلاح تسريب الحمام', 'يوجد تسريب مياه في حمام الوحدة 452', 'high', 'in_progress', '2026-07-10', None, None, 'السباك محمد'),
        ('u8', 'p4', 'صيانة شاملة', 'دهان وتجديد الوحدة B1', 'medium', 'in_progress', '2026-07-01', None, 8000.0, 'شركة الدهانات الحديثة'),
        (None, 'p3', 'صيانة نظام التكييف المركزي', 'الصيانة الدورية للنظام', 'medium', 'completed', '2026-06-20', '2026-07-01', 3500.0, 'شركة التكييف الذهبية'),
        ('u3', 'p2', 'إصلاح كهرباء', 'انقطاع الكهرباء عن غرفة النوم', 'critical', 'pending', '2026-07-14', None, None, None),
    ]
    for ukey, pkey, title, desc, prio, st, rd, cd, cost, ven in mnt_data:
        await coll_maintenance.insert_one({
            'id': new_id(), 'unit_id': unit_ids[ukey] if ukey else None,
            'property_id': prop_ids[pkey], 'title': title, 'description': desc,
            'priority': prio, 'status': st, 'reported_date': rd, 'completed_date': cd,
            'cost': cost, 'vendor': ven, 'notes': None,
            'created_at': now, 'updated_at': now,
        })

    # --- Utility Bills (Electricity + Water) ---
    utility_data = [
        # (unit_key, tenant_key, type, provider, period_from, period_to, issue, due, pay_date, prev, cur, unit_price, amount, status)
        ('u1', 't1', 'electricity', 'SEC', '2026-06-01', '2026-06-30', '2026-07-05', '2026-07-20', '2026-07-10', 1200.0, 1520.0, 0.30, 96.0, 'paid'),
        ('u1', 't1', 'water', 'NWC', '2026-06-01', '2026-06-30', '2026-07-05', '2026-07-20', None, 340.0, 385.0, 4.00, 180.0, 'pending'),
        ('u2', 't2', 'electricity', 'SEC', '2026-06-01', '2026-06-30', '2026-07-05', '2026-07-20', '2026-07-12', 800.0, 950.0, 0.30, 45.0, 'paid'),
        ('u2', 't2', 'water', 'NWC', '2026-06-01', '2026-06-30', '2026-07-05', '2026-07-20', None, 210.0, 245.0, 4.00, 140.0, 'overdue'),
        ('u3', 't3', 'electricity', 'SEC', '2026-06-01', '2026-06-30', '2026-07-05', '2026-07-20', '2026-07-08', 500.0, 620.0, 0.30, 36.0, 'paid'),
        ('u4', 't4', 'electricity', 'SEC', '2026-06-01', '2026-06-30', '2026-07-05', '2026-07-20', None, 4500.0, 6300.0, 0.32, 576.0, 'pending'),
        ('u4', 't4', 'water', 'NWC', '2026-06-01', '2026-06-30', '2026-07-05', '2026-07-20', '2026-07-11', 1200.0, 1450.0, 4.00, 1000.0, 'paid'),
        ('u6', 't5', 'electricity', 'SEC', '2026-06-01', '2026-06-30', '2026-07-05', '2026-07-20', '2026-07-15', 2000.0, 2350.0, 0.30, 105.0, 'paid'),
    ]
    for ukey, tkey, btype, prov, pf, pt, issue, due, pd, prev, cur, price, amt, st in utility_data:
        consumption = cur - prev
        await coll_utility_bills.insert_one({
            'id': new_id(),
            'unit_id': unit_ids[ukey],
            'tenant_id': tenant_ids[tkey],
            'bill_type': btype,
            'bill_number': f'{"ELEC" if btype == "electricity" else "WTR"}-{new_id()[:8].upper()}',
            'provider': prov,
            'period_from': pf, 'period_to': pt,
            'issue_date': issue, 'due_date': due, 'payment_date': pd,
            'previous_reading': prev, 'current_reading': cur,
            'consumption': consumption,
            'unit_price': price, 'amount': amt, 'late_fee': 0,
            'status': st, 'payment_method': 'bank_transfer' if pd else None,
            'notes': None,
            'created_at': now, 'updated_at': now,
        })
