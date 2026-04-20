import os
import json
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

# System Prompt for the Bodhi Brain
_SYSTEM_PROMPT = """You are 'Bodhi', the advanced AI neural core for the Bodhi app. 
You are a Gen-Z financial co-pilot. Your personality is sleek, knowledgeable, and helpful.

Your job is to understand user intents from voice/text commands and return a structured response.
Intents you handle:
1. 'portfolio_check': Questions about stocks, crypto, or gains.
2. 'expense_tracking': Questions about spending or savings.
3. 'payment_check': Questions about upcoming bills or history.
4. 'general_chat': Financial advice or general conversation.

Respond ONLY with a valid JSON object.
JSON schema:
{
  "intent": "portfolio_check" | "expense_tracking" | "payment_check" | "general_chat",
  "text_response": "The text you want the AI to say back to the user",
  "suggested_action": "e.g., navigate_to_portfolio, show_expenses, or null"
}
"""

async def process_user_intent(message: str) -> Dict[str, Any]:
    """
    Analyzes user message using Gemini LLM and returns intent + response text.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        print("⚠️ GEMINI_API_KEY not set; using mock brain response.")
        return _mock_brain_response(message)

    try:
        import google.generativeai as genai
        genai.configure(api_key=gemini_key)
        
        model = genai.GenerativeModel(
            model_name=os.getenv("LLM_MODEL", "gemini-1.5-flash"),
            system_instruction=_SYSTEM_PROMPT,
        )

        print(f"🧠 Brain analyzing message: '{message}'")
        response = model.generate_content(
            message,
            generation_config={"temperature": 0.7, "response_mime_type": "application/json"}
        )
        
        raw_text = (response.text or "").strip()
        print(f"✅ Brain raw output: {raw_text}")
        
        return json.loads(raw_text)

    except Exception as exc:
        logger.exception("Bodhi Brain failed: %s", exc)
        return {
            "intent": "general_chat",
            "text_response": "My neural circuits are a bit fuzzy right now, but I'm here. What's up?",
            "suggested_action": None
        }

def _mock_brain_response(message: str) -> Dict[str, Any]:
    """Fallback if API key is missing."""
    msg_lower = message.lower()
    if "portfolio" in msg_lower or "stock" in msg_lower:
        return {
            "intent": "portfolio_check",
            "text_response": "Your portfolio is looking strong today! Most of your tech holdings are up.",
            "suggested_action": "navigate_to_portfolio"
        }
    return {
        "intent": "general_chat",
        "text_response": f"I heard you say: '{message}'. How can I help with your finances?",
        "suggested_action": None
    }
