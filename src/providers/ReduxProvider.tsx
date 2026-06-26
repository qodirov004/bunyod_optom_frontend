"use client"
import React, { useMemo } from "react"
import { Provider } from "react-redux"
import { store } from "@/store/store"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Suppress Ant Design React 19 compatibility warning
if (typeof console !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('antd v5 support React is 16 ~ 18')) {
      return;
    }
    originalError(...args);
  };
}

// Create QueryClient outside the component to prevent recreating it on each render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Use React.memo to prevent unnecessary re-renders
export const ReduxProvider = React.memo(({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        {children}
      </Provider>
    </QueryClientProvider>
  )
});