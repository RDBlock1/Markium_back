import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_NEW_BACKEND_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
