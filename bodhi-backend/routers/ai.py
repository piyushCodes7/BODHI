from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from services.sarvam_service import generate_bodhi_speech, transcribe_audio
from services.brain_service import process_user_intent

router = APIRouter(prefix="/ai", tags=["AI Integration"])

class SpeechRequest(BaseModel):
    text: str

class SpeechResponse(BaseModel):
    audio_base64: str

class TranscribeResponse(BaseModel):
    transcript: str

class AICommandResponse(BaseModel):
    transcript: str
    intent: str
    text_response: str
    suggested_action: str | None
    audio_base64: str | None

@router.post("/speak", response_model=SpeechResponse)
async def get_bodhi_voice(request: SpeechRequest):
    print(f"🎙️ AI Speak requested for text: '{request.text[:50]}...'")
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    base64_audio = await generate_bodhi_speech(request.text)
    print("✅ Voice generated successfully.")
    return {"audio_base64": base64_audio}

@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_speech(file: UploadFile = File(...)):
    """Accepts an audio file upload and returns the Sarvam STT transcript."""
    print(f"📡 Incoming audio for transcription: {file.filename}")
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    
    transcript = await transcribe_audio(contents, file.filename or "audio.mp4")
    print(f"📝 Transcription result: '{transcript}'")
    return {"transcript": transcript}

@router.post("/command", response_model=AICommandResponse)
async def process_voice_command(file: UploadFile = File(...)):
    """Unified endpoint: Audio -> Text -> Intent -> Response Text + Voice."""
    print(f"🚀 Processing full AI Command for {file.filename}...")
    
    # 1. Transcription (STT)
    audio_bytes = await file.read()
    transcript = await transcribe_audio(audio_bytes, file.filename or "audio.mp4")
    print(f"  [1/3] Transcribed: '{transcript}'")
    
    # 2. Brain Analysis (LLM)
    brain_result = await process_user_intent(transcript)
    print(f"  [2/3] Brain Result: {brain_result['intent']} - '{brain_result['text_response'][:50]}...'")
    
    # 3. Voice Generation (TTS) - Optional/Auto
    audio_response = await generate_bodhi_speech(brain_result['text_response'])
    print(f"  [3/3] Audio response generated.")
    
    return {
        "transcript": transcript,
        "intent": brain_result["intent"],
        "text_response": brain_result["text_response"],
        "suggested_action": brain_result.get("suggested_action"),
        "audio_base64": audio_response
    }