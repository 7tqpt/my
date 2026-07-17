from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from database import client
from routes import router as api_router
from seed import seed_all

app = FastAPI(title='Property Management API')

# Downloadable source-code package (available only in preview environment)
DOWNLOAD_ZIP = '/app/download/property_management_system.zip'


@app.get('/api/download-project')
async def download_project():
    if not os.path.exists(DOWNLOAD_ZIP):
        raise HTTPException(404, 'Package not found')
    return FileResponse(DOWNLOAD_ZIP, media_type='application/zip', filename='property_management_system.zip')


app.include_router(api_router)

# CORS — tighten in production by setting FRONTEND_ORIGIN
frontend_origin = os.environ.get('FRONTEND_ORIGIN')
allow_origins = [frontend_origin] if frontend_origin else ['*']
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allow_origins,
    allow_methods=['*'],
    allow_headers=['*'],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event('startup')
async def on_startup():
    try:
        await seed_all()
        logger.info('Seed complete')
    except Exception as e:
        logger.error(f'Seed error: {e}')


@app.on_event('shutdown')
async def shutdown_db_client():
    client.close()
