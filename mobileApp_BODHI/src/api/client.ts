import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Android emulators use 10.0.2.2 to point to the host machine's localhost.
// iOS simulators use localhost directly.
const BASE_URL = 'http://localhost:8000';
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