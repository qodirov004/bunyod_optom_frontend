import { User } from './types';

// Extend window object to add our custom property
declare global {
  interface Window {
    __tokenRefreshInterval?: NodeJS.Timeout;
  }
}

// Debug log for session tracking
const debug = (message: string, ...params: unknown[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUTH] ${message}`, ...params);
  }
};

// Session duration in milliseconds (24 hours)
const SESSION_DURATION = 24 * 60 * 60 * 1000; 

// Parse JWT token to get user data
export const parseToken = (token: string): { user: User | null; exp: number | null } => {
  if (!token || !token.includes('.')) return { user: null, exp: null };
  try {
    // JWT token format: header.payload.signature
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    return {
      user: payload.user || null,
      exp: payload.exp || null,
    };
  } catch (error) {
    console.error('Error parsing token:', error);
    return { user: null, exp: null };
  }
};

// Check if token is expired, using our custom expiration if available
export const isTokenExpired = (): boolean => {
  // First check our custom expiration time from localStorage
  if (typeof window !== 'undefined') {
    const customExpiry = localStorage.getItem('token_expires');
    if (customExpiry) {
      // Compare with current time
      try {
        const expiryTime = parseInt(customExpiry, 10);
        const now = Date.now();
        const isExpired = now >= expiryTime;
        
        // Log token status
        if (isExpired) {
          debug('Token expired', { 
            expiryTime: new Date(expiryTime).toLocaleString(),
            now: new Date(now).toLocaleString(),
            timeLeft: 'Expired'
          });
        } else {
          const timeLeft = Math.floor((expiryTime - now) / (60 * 1000)); // minutes
          debug('Token valid', { 
            expiryTime: new Date(expiryTime).toLocaleString(),
            now: new Date(now).toLocaleString(),
            timeLeft: `${timeLeft} minutes`
          });
        }
        
        return isExpired;
      } catch (e) {
        console.error('Error parsing token expiry:', e);
      }
    }
  }
  
  // IMPORTANT: Always prioritize our custom expiration over JWT
  // Ignore JWT expiration as we're managing it ourselves
  return false;
};

// Function to refresh session status locally (just for cookies/storage sync)
export const syncTokenStatus = (): void => {
  if (typeof window === 'undefined') return;
  
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    // Sync the auth-token cookie to ensure it's still present
    document.cookie = `auth-token=${token}; path=/; max-age=${SESSION_DURATION / 1000}; SameSite=Lax`;
    
    // Set activity tracker
    sessionStorage.setItem('last_activity', Date.now().toString());
    
    debug('Token status synced locally');
  } catch (e) {
    console.error('Error syncing token:', e);
  }
};

// Setup session activity monitoring (minimal overhead)
export const setupTokenRefresh = (): void => {
  if (typeof window === 'undefined') return;
  
  debug('Setting up session sync system');
  
  // Update cookie on visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      debug('Document became visible, syncing token');
      syncTokenStatus();
    }
  });
  
  // Update cookie on app focus
  window.addEventListener('focus', () => {
    debug('Window focused, syncing token');
    syncTokenStatus();
  });
  
  // Periodic sync every 15 minutes
  const refreshInterval = setInterval(() => {
    debug('Periodic session sync');
    syncTokenStatus();
  }, 15 * 60 * 1000);
  
  // Initial sync
  syncTokenStatus();
  
  window.__tokenRefreshInterval = refreshInterval;
};

// Get token from localStorage
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('token');
  if (token) {
    // Check if we should refresh based on last activity
    const lastActivity = parseInt(sessionStorage.getItem('last_activity') || '0');
    const now = Date.now();
    
    // If more than 5 minutes have passed since last activity, sync status
    if (now - lastActivity > 5 * 60 * 1000) {
      debug('Token accessed, syncing session status');
      syncTokenStatus();
    }
    
    return token;
  }
  return null;
};

// Get token from cookie (fallback)
export const getTokenFromCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith('auth-token=')) {
      const token = cookie.substring('auth-token='.length, cookie.length);
      debug('Retrieved token from cookie');
      return token;
    }
  }
  return null;
};

// Save token to both localStorage and cookie
export const saveToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('token', token);
  
  // Set custom expiry
  const expiresAt = new Date();
  expiresAt.setTime(expiresAt.getTime() + SESSION_DURATION);
  localStorage.setItem('token_expires', expiresAt.getTime().toString());
  
  // Set cookie with extended lifetime
  document.cookie = `auth-token=${token}; path=/; max-age=${SESSION_DURATION / 1000}; SameSite=Lax`;
  
  // Set backup activity tracker
  sessionStorage.setItem('last_activity', Date.now().toString());
  
  debug('Token saved with expiry', {
    expires: expiresAt.toLocaleString(),
    duration: `${SESSION_DURATION / (1000 * 60 * 60)} hours`
  });
};

// Remove token from both localStorage and cookie
export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('token');
  localStorage.removeItem('token_expires');
  sessionStorage.removeItem('last_activity');
  document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  
  // Clear any refresh intervals
  if (window.__tokenRefreshInterval) {
    clearInterval(window.__tokenRefreshInterval);
  }
  
  debug('Token removed and sessions cleared');
};