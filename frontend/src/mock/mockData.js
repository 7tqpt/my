// Mock data for Property Management System
export const mockUser = {
  id: 1,
  name: 'مدير النظام',
  username: 'admin',
  role: 'admin',
};

export const mockOwners = [
  { id: 17, name: 'ايمن محمد حسين الحرازي', phone: '05598310776', national_id: '2604104410', address: 'الجبيل البلد حي الصفاة', bank_account: 'SA11111111111111111111111111111', status: 'active', notes: null },
  { id: 18, name: 'وضاح عبدالله', phone: '0530000115', national_id: '1093253191', address: 'الجبيل البلد حي الصفاة', bank_account: null, status: 'active', notes: null },
  { id: 19, name: 'محمد سعيد', phone: '0555123456', national_id: '1122334455', address: 'الرياض حي النخيل', bank_account: 'SA2222222222222222222222', status: 'active', notes: null },
  { id: 20, name: 'سالم القحطاني', phone: '0501234567', national_id: '2233445566', address: 'جدة حي الشاطئ', bank_account: null, status: 'inactive', notes: 'غير متواجد حالياً' },
];

export const mockProperties = [
  { id: 37, owner_id: 17, name: 'عمارة الجبيل', type: 'residential', city: 'الجبيل', district: 'حي الصفاة', address: 'شارع عينين', total_units: 2, land_area: 155.0, built_area: 142.0, status: 'active', notes: null },
  { id: 38, owner_id: 18, name: 'عمارة وضاح', type: 'residential', city: 'الجبيل', district: 'حي الصفاء', address: 'الجبيل حي الصفاء', total_units: 1, land_area: 155.0, built_area: 122.0, status: 'active', notes: null },
  { id: 39, owner_id: 19, name: 'برج الرياض التجاري', type: 'commercial', city: 'الرياض', district: 'العليا', address: 'شارع الملك فهد', total_units: 12, land_area: 500.0, built_area: 4500.0, status: 'active', notes: null },
  { id: 40, owner_id: 20, name: 'مجمع جدة السكني', type: 'residential', city: 'جدة', district: 'الشاطئ', address: 'كورنيش جدة', total_units: 8, land_area: 320.0, built_area: 2400.0, status: 'active', notes: null },
];

export const mockUnits = [
  { id: 251, property_id: 37, unit_number: '452', floor: '2', area: 43.0, rooms: 4, bathrooms: 1, rent_price: 5000.0, status: 'rented', notes: null },
  { id: 252, property_id: 37, unit_number: '453', floor: '2', area: 42.0, rooms: 3, bathrooms: 1, rent_price: 1500.0, status: 'rented', notes: null },
  { id: 253, property_id: 38, unit_number: '55', floor: '2', area: 22.0, rooms: 4, bathrooms: 1, rent_price: 1500.0, status: 'rented', notes: null },
  { id: 254, property_id: 39, unit_number: '101', floor: '1', area: 120.0, rooms: 0, bathrooms: 2, rent_price: 15000.0, status: 'rented', notes: 'مكتب تجاري' },
  { id: 255, property_id: 39, unit_number: '102', floor: '1', area: 90.0, rooms: 0, bathrooms: 1, rent_price: 10000.0, status: 'vacant', notes: null },
  { id: 256, property_id: 40, unit_number: 'A1', floor: '1', area: 150.0, rooms: 4, bathrooms: 3, rent_price: 6500.0, status: 'rented', notes: null },
  { id: 257, property_id: 40, unit_number: 'A2', floor: '1', area: 150.0, rooms: 4, bathrooms: 3, rent_price: 6500.0, status: 'vacant', notes: null },
  { id: 258, property_id: 40, unit_number: 'B1', floor: '2', area: 180.0, rooms: 5, bathrooms: 3, rent_price: 8000.0, status: 'under_maintenance', notes: 'صيانة شاملة' },
];

export const mockTenants = [
  { id: 121, name: 'الاستاذ وضاح', phone: '0501112222', national_id: '2604104410', address: 'البلد حي الصفاء', company_name: 'شركة مبارك', status: 'active', notes: null },
  { id: 122, name: 'اسامة وضاح', phone: '0530000115', national_id: '1093253191', address: null, company_name: 'شركة مبارك', status: 'active', notes: null },
  { id: 123, name: 'راسل أحمد', phone: '05598310776', national_id: '1133113546', address: null, company_name: 'عمارة وضاح', status: 'active', notes: null },
  { id: 124, name: 'شركة النخيل التجارية', phone: '0114567890', national_id: '4455667788', address: 'الرياض العليا', company_name: 'شركة النخيل', status: 'active', notes: 'مستأجر تجاري' },
  { id: 125, name: 'خالد المطيري', phone: '0555987654', national_id: '5566778899', address: 'جدة الشاطئ', company_name: null, status: 'active', notes: null },
];

export const mockContracts = [
  { id: 122, contract_number: 'CTR-20260715-0001', unit_id: 251, tenant_id: 121, start_date: '2026-07-15', end_date: '2027-07-15', rent_amount: 24000.0, security_deposit: 0, payment_frequency: 'quarterly', status: 'active', terms: 'الدفع كل 3 اشهر', notes: null },
  { id: 123, contract_number: 'CTR-20260715-0123', unit_id: 252, tenant_id: 122, start_date: '2026-07-15', end_date: '2027-07-15', rent_amount: 29000.0, security_deposit: 0, payment_frequency: 'monthly', status: 'active', terms: 'دفع شهري', notes: null },
  { id: 124, contract_number: 'CTR-20260715-0124', unit_id: 253, tenant_id: 123, start_date: '2026-07-01', end_date: '2027-07-01', rent_amount: 18000.0, security_deposit: 1500, payment_frequency: 'quarterly', status: 'active', terms: 'دفع ربع سنوي', notes: null },
  { id: 125, contract_number: 'CTR-20260601-0125', unit_id: 254, tenant_id: 124, start_date: '2026-06-01', end_date: '2027-06-01', rent_amount: 180000.0, security_deposit: 30000, payment_frequency: 'annual', status: 'active', terms: 'دفع سنوي', notes: null },
  { id: 126, contract_number: 'CTR-20260101-0126', unit_id: 256, tenant_id: 125, start_date: '2026-01-01', end_date: '2026-08-15', rent_amount: 78000.0, security_deposit: 6500, payment_frequency: 'monthly', status: 'active', terms: 'دفع شهري', notes: null },
];

export const mockPayments = [
  { id: 901, contract_id: 122, tenant_id: 121, amount: 6000.0, payment_date: '2026-07-01', due_date: '2026-07-01', type: 'rent', status: 'paid', late_fee: 0, payment_method: 'cash', reference_number: 'PAY-20260715-00001', notes: null },
  { id: 902, contract_id: 124, tenant_id: 123, amount: 4500.0, payment_date: '2026-07-01', due_date: '2026-07-01', type: 'rent', status: 'overdue', late_fee: 150, payment_method: 'cash', reference_number: 'PAY-20260715-00902', notes: 'المتبقي 3500' },
  { id: 903, contract_id: 123, tenant_id: 122, amount: 2416.0, payment_date: null, due_date: '2026-08-01', type: 'rent', status: 'pending', late_fee: 0, payment_method: 'bank_transfer', reference_number: null, notes: null },
  { id: 904, contract_id: 125, tenant_id: 124, amount: 180000.0, payment_date: '2026-06-01', due_date: '2026-06-01', type: 'rent', status: 'paid', late_fee: 0, payment_method: 'bank_transfer', reference_number: 'PAY-BANK-0125', notes: 'دفعة سنوية' },
  { id: 905, contract_id: 126, tenant_id: 125, amount: 6500.0, payment_date: '2026-07-05', due_date: '2026-07-01', type: 'rent', status: 'paid', late_fee: 100, payment_method: 'card', reference_number: 'CARD-4590', notes: null },
  { id: 906, contract_id: 126, tenant_id: 125, amount: 6500.0, payment_date: null, due_date: '2026-08-01', type: 'rent', status: 'pending', late_fee: 0, payment_method: 'card', reference_number: null, notes: null },
];

export const mockExpenses = [
  { id: 51, property_id: 37, category: 'maintenance', description: 'صيانة المصعد', amount: 1200.0, expense_date: '2026-07-05', vendor: 'شركة الصيانة الحديثة', reference_number: 'INV-2001', status: 'paid', notes: null },
  { id: 52, property_id: 38, category: 'utilities', description: 'فاتورة كهرباء', amount: 850.0, expense_date: '2026-07-10', vendor: 'شركة الكهرباء السعودية', reference_number: 'ELEC-9876', status: 'paid', notes: null },
  { id: 53, property_id: 39, category: 'cleaning', description: 'خدمات النظافة الشهرية', amount: 3000.0, expense_date: '2026-07-01', vendor: 'شركة النظافة المثالية', reference_number: 'CLN-100', status: 'paid', notes: null },
  { id: 54, property_id: 40, category: 'insurance', description: 'تأمين العقار السنوي', amount: 12000.0, expense_date: '2026-06-15', vendor: 'شركة التأمين الوطنية', reference_number: 'INS-2026', status: 'paid', notes: null },
  { id: 55, property_id: 39, category: 'security', description: 'خدمات الحراسة', amount: 4500.0, expense_date: '2026-07-08', vendor: 'شركة الأمن المتحد', reference_number: 'SEC-77', status: 'pending', notes: null },
];

export const mockMaintenance = [
  { id: 31, unit_id: 251, property_id: 37, title: 'إصلاح تسريب الحمام', description: 'يوجد تسريب مياه في حمام الوحدة 452', priority: 'high', status: 'in_progress', reported_date: '2026-07-10', completed_date: null, cost: null, vendor: 'السباك محمد', notes: null },
  { id: 32, unit_id: 258, property_id: 40, title: 'صيانة شاملة', description: 'دهان وتجديد الوحدة B1', priority: 'medium', status: 'in_progress', reported_date: '2026-07-01', completed_date: null, cost: 8000, vendor: 'شركة الدهانات الحديثة', notes: null },
  { id: 33, unit_id: null, property_id: 39, title: 'صيانة نظام التكييف المركزي', description: 'الصيانة الدورية للنظام', priority: 'medium', status: 'completed', reported_date: '2026-06-20', completed_date: '2026-07-01', cost: 3500, vendor: 'شركة التكييف الذهبية', notes: 'تم بنجاح' },
  { id: 34, unit_id: 253, property_id: 38, title: 'إصلاح كهرباء', description: 'انقطاع الكهرباء عن غرفة النوم', priority: 'critical', status: 'pending', reported_date: '2026-07-14', completed_date: null, cost: null, vendor: null, notes: null },
];

export const mockUsers = [
  { id: 1, name: 'مدير النظام', username: 'admin', role: 'admin', is_active: true, email: 'admin@propertymgmt.com' },
  { id: 2, name: 'محاسب النظام', username: 'accountant', role: 'user', is_active: true, email: 'acc@propertymgmt.com' },
];

export const mockSettings = {
  company_name: 'شركة إدارة العقارات',
  company_phone: '011-4567890',
  company_email: 'info@propertymgmt.com',
  company_address: 'الرياض، المملكة العربية السعودية',
  currency: 'SAR',
  timezone: 'Asia/Riyadh',
};

// Dashboard aggregates
export const mockDashboard = {
  thisMonthRevenue: 199000,
  thisMonthExpenses: 21550,
  revenueChange: 15.2,
  expenseChange: -8.4,
  totalUnits: 8,
  rentedUnits: 5,
  vacantUnits: 2,
  maintenanceUnits: 1,
  pendingPayments: 2,
  overduePayments: 1,
  expiringContracts: 1,
  monthlyRevenue: [12000, 15000, 18000, 22000, 25000, 35000, 199000, 0, 0, 0, 0, 0],
  monthlyExpenses: [3000, 4500, 6200, 5800, 7100, 8500, 21550, 0, 0, 0, 0, 0],
};
