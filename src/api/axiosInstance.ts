import axios from "axios";
import { getToken, removeToken, syncTokenStatus } from "@/auth/authUtils";

export const baseURL = 'http://127.0.0.1:8000'; // Removed trailing slash to prevent double // in queries

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

            // Sync token status whenever a request is made
            syncTokenStatus();
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

        // Sync token on successful API calls
        syncTokenStatus();

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

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401) {
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
            const isLoginRequest = error.config?.url?.includes('/login');
            
            // Skip automated actions for login attempts specifically
            if (!isLoginRequest && !currentPath.includes('/login') && !currentPath.includes('/auth/login')) {
                console.warn('Session invalid or expired (401)');
                
                // Only clear token if we're reasonably sure it's the right thing to do
                // but DON'T force a page reload which is what's annoying the user
                if (typeof window !== 'undefined') {
                    const redirectInProgress = sessionStorage.getItem('redirect_in_progress');
                    
                    if (!redirectInProgress) {
                        sessionStorage.setItem('redirect_in_progress', 'true');
                        
                        // We still remove the token as it's invalid anyway
                        // removeToken(); // Not removing immediately, let AuthProvider decide
                        
                        console.log('Auth check failed (401), but skipping automatic redirect to prevent page jump.');
                        
                        // Clear flag after a delay
                        setTimeout(() => {
                            sessionStorage.removeItem('redirect_in_progress');
                        }, 2000);
                    }
                }
            } else if (isLoginRequest) {
                console.warn('Auth Error (401) on login attempt - Invalid credentials');
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
