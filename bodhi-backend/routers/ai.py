from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.sarvam_service import generate_bodhi_speech

router = APIRouter(prefix="/ai", tags=["AI Integration"])

class SpeechRequest(BaseModel):
    text: str

class SpeechResponse(BaseModel):
    audio_base64: str

@router.post("/speak", response_model=SpeechResponse)
async def get_bodhi_voice(request: SpeechRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    base64_audio = await generate_bodhi_speech(request.text)
    return {"audio_base64": base64_audio}