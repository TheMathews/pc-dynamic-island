import asyncio
import subprocess
import psutil
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.services.media_controller import MediaController
from app.services.clipboard import add_clipboard_item, get_clipboard_history

app = FastAPI(title="PC Dynamic Island Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ActionPayload(BaseModel):
    action_id: str
    target: str

class MediaPayload(BaseModel):
    command: str

class ClipboardPayload(BaseModel):
    content: str

class NotificationPayload(BaseModel):
    title: str
    message: str
    type: str

latest_notification = None

@app.post("/api/v1/actions/trigger")
async def trigger_shortcut(payload: ActionPayload):
    """Ejecuta aplicaciones o comandos del sistema de forma asíncrona."""
    allowed_commands = {
        "terminal": ["wt.exe"],
        "calculator": ["calc.exe"],
        "taskmgr": ["taskmgr.exe"],
    }
    cmd = allowed_commands.get(payload.target)
    if not cmd:
        return {"status": "error", "detail": "Target no permitido"}
    
    subprocess.Popen(cmd, shell=False)
    return {"status": "executed", "target": payload.target}

@app.get("/api/v1/media/current")
async def get_current_media():
    return await MediaController.get_media_info()

@app.post("/api/v1/media/control")
async def control_media(payload: MediaPayload):
    success = await MediaController.send_command(payload.command)
    return {"status": "success" if success else "failed"}

@app.get("/api/v1/clipboard/history")
async def fetch_clipboard_history():
    return {"items": get_clipboard_history()}

@app.post("/api/v1/clipboard/save")
async def save_clipboard_item(payload: ClipboardPayload):
    add_clipboard_item(payload.content)
    return {"status": "saved"}

@app.post("/api/v1/notifications/push")
async def push_notification(payload: NotificationPayload):
    global latest_notification
    latest_notification = {
        "title": payload.title,
        "message": payload.message,
        "type": payload.type
    }
    return {"status": "dispatched"}

@app.websocket("/ws/telemetry")
async def telemetry_stream(websocket: WebSocket):
    """Transmite métricas de hardware, estado multimedia y notificaciones."""
    global latest_notification
    await websocket.accept()
    try:
        while True:
            media_info = await MediaController.get_media_info()
            battery_info = psutil.sensors_battery()
            
            payload = {
                "type": "TELEMETRY_UPDATE",
                "cpu_percent": psutil.cpu_percent(interval=None),
                "ram_percent": psutil.virtual_memory().percent,
                "battery": battery_info.percent if battery_info else 100,
                "media": media_info,
                "notification": latest_notification,
            }
            # Limpiamos la notificación tras enviarla para que sea un evento único
            latest_notification = None
            
            await websocket.send_json(payload)
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        pass