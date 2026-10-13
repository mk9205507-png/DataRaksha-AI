from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks
from app.models.schemas import LetterGenerateRequest, LetterResponse
from app.core.security import get_current_user_id
from app.services.letter_service import letter_service
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/letters", tags=["Data Request Letters"])


@router.post("/generate", response_model=LetterResponse)
async def generate_letter(
    payload: LetterGenerateRequest,
    background_tasks: BackgroundTasks,
    user_id: Optional[str] = Depends(get_current_user_id),
):
    """Generate a legally grounded GDPR / DPDP access or deletion notice."""
    result = letter_service.generate_letter(payload)

    if user_id:
        record = {
            "user_id": user_id,
            "company_name": payload.company_name,
            "letter_type": payload.letter_type.value,
            "recipient_email": payload.recipient_email,
            "content": result["content"],
        }
        background_tasks.add_task(supabase_service.save_letter, record)

    return LetterResponse(**result)
