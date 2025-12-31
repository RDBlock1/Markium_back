import axios from 'axios';
import { fa } from 'zod/v4/locales';

export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_NEW_BACKEND_URL}/api` || 'http://localhost:4000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  proxy:false
});
