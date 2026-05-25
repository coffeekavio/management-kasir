// src/services/api.ts

import axios, { AxiosInstance } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://idol-audience-belongs-towards.trycloudflare.com';

// Buat instance axios dengan baseURL
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Otomatis menempelkan token jika ada
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  console.log('API Request:', {
    url: `${config.baseURL}${config.url}`,
    method: config.method,
    hasToken: !!config.headers.Authorization,
  });
  return config;
});

// Handle error response (misal token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log network/server errors
    console.error('API Error Details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
    });

    if (error.response?.status === 401) {
      // Token expired atau invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    // Handle network errors
    if (error.code === 'ERR_NETWORK' || !error.response) {
      const networkErr = new Error('Network Error - Pastikan API Server sedang berjalan') as Error & { response?: unknown; detail?: string };
      networkErr.response = error.response;
      networkErr.detail = error.message;
      throw networkErr;
    }

    // Throw error dengan format yang lebih baik untuk client
    const errorResponse = error.response?.data || {};
    const err = new Error(
      typeof errorResponse === 'object' && errorResponse !== null && 'detail' in errorResponse
        ? (errorResponse as { detail: string }).detail
        : error.message || 'Terjadi kesalahan pada server'
    ) as Error & { response?: unknown; detail?: string | null };
    err.response = error.response;
    err.detail = typeof errorResponse === 'object' && errorResponse !== null && 'detail' in errorResponse ? (errorResponse as { detail: string }).detail : null;
    throw err;
  }
);