import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Android emulators use 10.0.2.2 to point to the host machine's localhost.
// iOS simulators use localhost directly.
const BASE_URL = 'http://10.50.8.101:8000';
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Interceptor: Automatically attach the JWT token to every single request
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('bodhi_jwt');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);