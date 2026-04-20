import os
import httpx
from fastapi import HTTPException

# In production, ensure SARVAM_API_KEY is in your .env file
# e.g., SARVAM_API_KEY="your_actual_key_here"

async def generate_bodhi_speech(text: str) -> str:
    api_key = os.getenv("SARVAM_API_KEY")
    if not api_key:
        print("CRITICAL: SARVAM_API_KEY environment variable is missing.")
        raise HTTPException(status_code=500, detail="AI Voice is not configured on the server.")

    url = "https://api.sarvam.ai/text-to-speech"
    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "inputs": [text],
        "target_language_code": "hi-IN", # Hindi
        "speaker": "meera",              # Female voice model
        "pitch": 0,
        "pace": 1.1,
        "loudness": 1.5,
        "speech_sample_rate": 8000,
        "enable_preprocessing": True,
        "model": "bulbul:v1"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers, timeout=15.0)
            response.raise_for_status()
            data = response.json()
            
            if "audios" in data and len(data["audios"]) > 0:
                return data["audios"][0] # Returns the Base64 string
            else:
                raise HTTPException(status_code=500, detail="No audio returned from Sarvam API")
                
        except httpx.HTTPError as e:
            print(f"Sarvam API Error: {e}")
            raise HTTPException(status_code=502, detail="Bodhi's voice circuits are currently offline.")