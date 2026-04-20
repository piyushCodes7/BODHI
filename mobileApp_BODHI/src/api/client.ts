import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

// Falls back to localhost if the env var is missing for any reason
const BASE_URL = API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Interceptor: Automatically attach the JWT token to every single request
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('bodhi_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const PaymentAPI = {
  createIntent: async (data: { user_id: number; amount: number; currency: string; description: string }) => {
    // Assuming 'apiClient' is your Axios instance
    const res = await apiClient.post('/payments/intent', data);
    return res.data;
  }
};

export const InsuranceAPI = {
  ingest: async (uri: string, name: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      name: name,
      type: 'application/pdf'
    } as any);

    const res = await apiClient.post('/insurance/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  query: async (question: string, documentId?: string) => {
    const res = await apiClient.post('/insurance/query', {
      question,
      document_id: documentId
    });
    return res.data;
  },
  listDocuments: async () => {
    const res = await apiClient.get('/insurance/documents');
    return res.data;
  }
};

/**
 * Text-to-Speech via backend → Sarvam TTS.
 * Returns a data URI string (base64 audio) or null on failure.
 */
export const fetchBodhiVoice = async (text: string): Promise<string | null> => {
  try {
    const response = await fetch(`${BASE_URL}/ai/speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return `data:audio/mp3;base64,${data.audio_base64}`;
    
  } catch (error) {
    console.error("API Client Error fetching voice:", error);
    return null;
  }
};

/**
 * Speech-to-Text via backend → Sarvam STT.
 * Uploads a recorded audio file to the backend /ai/transcribe endpoint.
 * Returns the transcript string or null on failure.
 */
export const transcribeAudio = async (fileUri: string): Promise<string | null> => {
  try {
    // Ensure the URI has the correct scheme for iOS
    const uri = Platform.OS === 'ios' && !fileUri.startsWith('file://') 
      ? `file://${fileUri}` 
      : fileUri;

    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'audio/mp4',
      name: 'audio.mp4',
    } as any);

    console.log("🚀 Sending audio to backend /ai/transcribe...");
    const response = await fetch(`${BASE_URL}/ai/transcribe`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type — fetch sets the correct multipart boundary automatically
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`Backend /ai/transcribe returned ${response.status}:`, errBody);
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Transcription received:", data.transcript);
    return data.transcript || null;

  } catch (error) {
    console.error("API Client Error transcribing audio:", error);
    return null;
  }
};

export interface VoiceCommandResponse {
  transcript: string;
  intent: string;
  text_response: string;
  suggested_action: string | null;
  audio_base64: string | null;
}

/**
 * Unified Voice Command Processor.
 * Takes recorded audio -> returns full AI logic payload.
 */
export const processVoiceCommand = async (fileUri: string): Promise<VoiceCommandResponse | null> => {
  try {
    const uri = Platform.OS === 'ios' && !fileUri.startsWith('file://') 
      ? `file://${fileUri}` 
      : fileUri;

    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'audio/mp4',
      name: 'audio.mp4',
    } as any);

    console.log("🚀 Sending audio to backend /ai/command...");
    const response = await fetch(`${BASE_URL}/ai/command`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ AI Command processed:", data.intent);
    return data;
    
  } catch (error) {
    console.error("API Client Error in voice command:", error);
    return null;
  }
};

export { BASE_URL };