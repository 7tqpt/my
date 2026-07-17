"""MongoDB connection module."""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# Named collections for convenience
coll_users = db.users
coll_owners = db.owners
coll_properties = db.properties
coll_units = db.units
coll_tenants = db.tenants
coll_contracts = db.contracts
coll_payments = db.payments
coll_expenses = db.expenses
coll_maintenance = db.maintenance
coll_settings = db.settings
coll_utility_bills = db.utility_bills
