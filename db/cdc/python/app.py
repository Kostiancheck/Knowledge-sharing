from fastapi import FastAPI, Request, Header, HTTPException
from starlette.status import HTTP_400_BAD_REQUEST, HTTP_500_INTERNAL_SERVER_ERROR

from typing import Optional
import json
from datetime import datetime
import atexit
import logging
import base64

app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global file handle - opened once at startup
log_file = open("/app/events.log", "a", encoding="utf-8")


def cleanup_log_file():
    if log_file:
        log_file.close()


# Register cleanup function
atexit.register(cleanup_log_file)


@app.post("/debezium")
async def receive_debezium(request: Request):
    logger.info(f"Received request from: {request.client.host if request.client else 'unknown'}")
    
    try:
        payload = await request.json()
        logger.info(f"Successfully received payload")
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

    # Write to the global file handle
    log_file.write(json.dumps(payload) + "\n")
    log_file.flush()  # Ensure data is written to disk

    logger.info("Event written to log file successfully")

    return {"status": "ok"}
