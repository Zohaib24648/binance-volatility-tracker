import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.services.scheduler import refresh_loop, on_shutdown

app = FastAPI(title="Crypto-Volatility API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.on_event("startup")
async def startup():
    # kick off background task
    asyncio.create_task(refresh_loop())

@app.on_event("shutdown")
async def shutdown():
    await on_shutdown()
