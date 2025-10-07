"""
API endpoint for the AI Tutor chat.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from loguru import logger

from app.core.database import SessionLocal
from app.ai.service import AIChatService

router = APIRouter()

@router.websocket("/chat/{user_id}")
async def websocket_chat_endpoint(websocket: WebSocket, user_id: int):
    """
    WebSocket endpoint for the AI Tutor chat.
    Manages real-time, streaming communication between the user and the AI service.
    """
    await websocket.accept()
    
    db = SessionLocal()
    try:
        chat_service = AIChatService(user_id=user_id, db=db)
        
        while True:
            message = await websocket.receive_text()
            logger.info(f"Received AI chat message from user {user_id}: {message}")
            
            try:
                # Use the streaming method and send chunks as they arrive
                async for chunk in chat_service.get_ai_response_stream(message):
                    await websocket.send_text(chunk)

            except HTTPException as e:
                error_message = {"type": "error", "detail": e.detail}
                await websocket.send_json(error_message)
                await websocket.close(code=1011)
                break
            except Exception as e:
                logger.error(f"AI Chat Error for user {user_id}: {e}")
                error_message = {"type": "error", "detail": "Sorry, an unexpected error occurred."}
                await websocket.send_json(error_message)

    except WebSocketDisconnect:
        logger.info(f"User {user_id} disconnected from AI chat.")
    except Exception as e:
        logger.error(f"Error in AI chat websocket for user {user_id}: {e}")
    finally:
        db.close()
        logger.info(f"Database session closed for user {user_id} AI chat.")