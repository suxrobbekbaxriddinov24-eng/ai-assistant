from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.config import get_settings
from app.database.supabase_client import init_supabase
from app.routes import chat, voice, screen, memory, billing, auth, agent

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_supabase()
    print(f"🚀 {settings.app_name} v{settings.version} started")
    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="AI Personal Assistant API — smarter than Siri, runs on your PC",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# CORS — allow Electron app and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    if settings.debug:
        traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"error": "internal_server_error", "message": str(exc)}
    )


# Register all routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(voice.router)
app.include_router(screen.router)
app.include_router(memory.router)
app.include_router(billing.router)
app.include_router(agent.router)


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": settings.version,
        "status": "running"
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
