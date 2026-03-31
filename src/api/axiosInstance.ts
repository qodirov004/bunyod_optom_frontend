import axios from "axios";
import { getToken, removeToken, refreshTokenExpiration } from "@/auth/authUtils";

export const baseURL = 'http://127.0.0.1:8000/';

export const formatImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) {
        // If it's a full URL with 127.0.0.1 or localhost but we're not on localhost, 
        // try to fix it by using the correct baseURL
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            if (url.includes('127.0.0.1') || url.includes('localhost')) {
                const parts = url.split(':8000/');
                const path = parts.length > 1 ? parts[1] : (url.split(':8000')[1] || '');
                if (path) return `${baseURL}${path.startsWith('/') ? path.substring(1) : path}`;
            }
        }
        return url;
    }
    return `${baseURL}${url.startsWith('/') ? url : '/' + url}`;
};

const axiosInstance = axios.create({
    baseURL: baseURL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Request interceptor to add token to each request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;

            // Refresh token expiration whenever a request is made
            refreshTokenExpiration();
        }

        // FormData bilan ishlaganda Content-Type ni majburan qo'ymaymiz,
        // aks holda boundary'lar buziladi va backend faylni qabul qilolmaydi.
        if (config.data instanceof FormData) {
            if (config.headers) {
                delete (config.headers as any)['Content-Type'];
                delete (config.headers as any)['content-type'];
            }
        }

        if (process.env.NODE_ENV === 'development') {
            console.log('Request:', config.method?.toUpperCase(), config.url);

            if (config.data instanceof FormData) {
                console.log('FormData entries:', [...config.data.entries()].map(e => `${e[0]}: ${typeof e[1] === 'object' ? 'File/Object' : e[1]}`));
            } else {
                console.log('Request data:', config.data);
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
    (response) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('Response:', response.status, response.data);
        }

        // Refresh token on successful API calls
        refreshTokenExpiration();

        return response;
    },
    (error) => {
        if (process.env.NODE_ENV === 'development') {
            const isDriverSalary403 = error.response?.status === 403 && error.config?.url?.includes('driversalary');

            // Don't log 401s or driver-salary-403s as loud errors
            if (error.response?.status !== 401 && !isDriverSalary403) {
                console.error('Response Error:', error.response?.status, error.response?.data);
            } else if (error.response?.status === 401) {
                console.warn('Auth Error (401): Session expired or invalid');
            }
        }

        // Important: ONLY redirect to login if the URL is NOT already /auth/login or /login
        if (error.response?.status === 401) {
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

            // FAQATGINA token haqiqatan eskirgan yoki noto'g'ri bo'lsagina tizimdan chiqarish
            const isTokenInvalid =
                error.response?.data?.code === 'token_not_valid' ||
                error.response?.data?.detail?.includes('given token not valid') ||
                error.response?.data?.detail?.includes('Authentication credentials were not provided') ||
                error.config?.url?.includes('/login');

            if (isTokenInvalid && !currentPath.includes('/login') && !currentPath.includes('/auth/login')) {
                console.log('Token eskirgan (401), sessiya tozalanib login sahifasiga yo\'naltirilmoqda');
                removeToken();

                const redirectInProgress = sessionStorage.getItem('redirect_in_progress');
                if (!redirectInProgress) {
                    sessionStorage.setItem('redirect_in_progress', 'true');
                    window.location.href = '/login';

                    setTimeout(() => {
                        sessionStorage.removeItem('redirect_in_progress');
                    }, 5000);
                }
            } else if (!isTokenInvalid) {
                // Bu shunchaki backend tarafidan yuborilgan 401 (huquq yetishmasligi), logout qilinmaydi
                console.warn('Backend ruxsat xatosi qaytardi (401/403), lekin token amalda.');
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
