import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';

export interface ClientPaymentData {
  total_clients: number;
  paid_clients: number;
  unpaid_clients: number;
  percent_paid: number;
  percent_unpaid: number;
}

export const useClientPaymentData = () => {
  const { data: clientPaymentData, isLoading, error } = useQuery<ClientPaymentData>({
    queryKey: ['client-payment-data'],
    queryFn: async () => {
      const response = await axiosInstance.get('/casa/cash-pay-present/');
      console.log('Client payment data:', response.data);
      return response.data;
    },
    initialData: {
      total_clients: 0,
      paid_clients: 0,
      unpaid_clients: 0,
      percent_paid: 0,
      percent_unpaid: 0
    }
  });

  return { 
    clientPaymentData, 
    isLoading,
    error 
  };
}; 
