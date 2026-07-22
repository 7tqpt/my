"""Pydantic models for the Property Management API."""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Literal
from datetime import datetime, date
import uuid

# ---------- Auth ----------
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    user: dict

# ---------- User ----------
class UserBase(BaseModel):
    name: str
    username: str
    email: Optional[str] = None
    role: str = 'user'
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    
class UserOut(UserBase):
    id: str

# ---------- Owner ----------
class OwnerBase(BaseModel):
    name: str
    phone: str
    national_id: str
    address: Optional[str] = None
    bank_account: Optional[str] = None
    status: str = 'active'
    notes: Optional[str] = None

class OwnerCreate(OwnerBase):
    pass

class OwnerOut(OwnerBase):
    id: str

# ---------- Property ----------
class PropertyBase(BaseModel):
    owner_id: str
    name: str
    type: str = 'residential'
    city: str
    district: Optional[str] = None
    address: str
    total_units: int = 0
    land_area: Optional[float] = None
    built_area: Optional[float] = None
    status: str = 'active'
    notes: Optional[str] = None

class PropertyOut(PropertyBase):
    id: str

# ---------- Unit ----------
class UnitBase(BaseModel):
    property_id: str
    unit_number: str
    floor: Optional[str] = None
    area: float
    rooms: int = 1
    bathrooms: int = 1
    rent_price: float
    status: str = 'vacant'
    notes: Optional[str] = None

class UnitOut(UnitBase):
    id: str

# ---------- Tenant ----------
class TenantBase(BaseModel):
    name: str
    phone: str
    national_id: str
    address: Optional[str] = None
    company_name: Optional[str] = None
    status: str = 'active'
    notes: Optional[str] = None

class TenantOut(TenantBase):
    id: str

# ---------- Contract ----------
class ContractBase(BaseModel):
    contract_number: str
    unit_id: str
    tenant_id: str
    start_date: str
    end_date: str
    rent_amount: float
    security_deposit: float = 0.0
    payment_frequency: str = 'monthly'
    status: str = 'active'
    terms: Optional[str] = None
    notes: Optional[str] = None

class ContractOut(ContractBase):
    id: str

# ---------- Payment ----------
class PaymentBase(BaseModel):
    contract_id: str
    tenant_id: str
    amount: float
    payment_date: Optional[str] = None
    due_date: str
    type: str = 'rent'
    status: str = 'pending'
    late_fee: float = 0.0
    payment_method: str = 'bank_transfer'
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class PaymentOut(PaymentBase):
    id: str

# ---------- Expense ----------
class ExpenseBase(BaseModel):
    property_id: str
    category: str
    description: str
    amount: float
    expense_date: str
    vendor: Optional[str] = None
    reference_number: Optional[str] = None
    status: str = 'pending'
    notes: Optional[str] = None

class ExpenseOut(ExpenseBase):
    id: str

# ---------- Maintenance ----------
class MaintenanceBase(BaseModel):
    unit_id: Optional[str] = None
    property_id: str
    title: str
    description: str
    priority: str = 'medium'
    status: str = 'pending'
    reported_date: str
    completed_date: Optional[str] = None
    cost: Optional[float] = None
    vendor: Optional[str] = None
    notes: Optional[str] = None

class MaintenanceOut(MaintenanceBase):
    id: str

# ---------- Utility Bill (Electricity / Water) ----------
class UtilityBillBase(BaseModel):
    unit_id: str
    tenant_id: str
    bill_type: str = 'electricity'  # 'electricity' | 'water'
    bill_number: Optional[str] = None
    provider: Optional[str] = None
    period_from: str
    period_to: str
    issue_date: str
    due_date: str
    payment_date: Optional[str] = None
    previous_reading: Optional[float] = None
    current_reading: Optional[float] = None
    consumption: Optional[float] = None
    unit_price: Optional[float] = None
    amount: float
    late_fee: float = 0.0
    status: str = 'pending'  # 'pending' | 'paid' | 'overdue'
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class UtilityBillOut(UtilityBillBase):
    id: str

# ---------- Settings ----------
class SettingsData(BaseModel):
    company_name: Optional[str] = 'Property Management'
    company_phone: Optional[str] = ''
    company_email: Optional[str] = ''
    company_address: Optional[str] = ''
    currency: Optional[str] = 'SAR'
    timezone: Optional[str] = 'Asia/Riyadh'


def new_id() -> str:
    return str(uuid.uuid4())
