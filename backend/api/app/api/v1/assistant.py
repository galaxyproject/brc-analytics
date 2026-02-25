import logging

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import check_rate_limit, get_assistant_agent
from app.models.assistant import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def assistant_chat(
    request: ChatRequest,
    agent=Depends(get_assistant_agent),
    _rate_limit=Depends(check_rate_limit),
):
    """Send a message to the analysis assistant and get a reply.

    Provide a session_id to continue an existing conversation, or omit it
    to start a new session.
    """
    if not agent.is_available():
        raise HTTPException(
            status_code=503,
            detail="Analysis assistant is unavailable (LLM not configured)",
        )

    try:
        response = await agent.chat(request.message, request.session_id)
        return response
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        logger.exception("Assistant chat error")
        raise HTTPException(status_code=500, detail="Internal assistant error")
