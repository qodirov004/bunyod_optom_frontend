import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { DateRange } from '../../../types';

export interface FinancialOverview {
  cashbox: {
    USD: number;
    RUB: number;
    EUR: number;
    UZS: number;
    total_in_usd: number;
  };
  expenses: {
    dp_price_usd: number;
    salaries_usd: number;
    total_expenses_usd: number;
  };
  final_balance_usd: number;
}

export const useFinancialData = (dateRange: DateRange) => {
  const { data: financialOverview, isLoading, error } = useQuery<FinancialOverview>({
    queryKey: ['financial-overview', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      const periodType = dateRange.type || 'month';
      
      switch(periodType) {
        case 'week': params.append('period', 'week'); break;
        case 'month': params.append('period', 'month'); break;
        case 'year': params.append('period', 'year'); break;
        case 'custom': params.append('period', 'custom'); break;
        default: params.append('period', 'month');
      }
      
      if (dateRange.startDate) {
        params.append('date_from', new Date(dateRange.startDate).toISOString().split('T')[0]);
      }
      if (dateRange.endDate) {
        params.append('date_to', new Date(dateRange.endDate).toISOString().split('T')[0]);
      }
      
      const response = await axiosInstance.get(`/casa/overview/?${params.toString()}`);
      return response.data;
    },
    initialData: {
      cashbox: { USD: 0, RUB: 0, EUR: 0, UZS: 0, total_in_usd: 0 },
      expenses: { dp_price_usd: 0, salaries_usd: 0, total_expenses_usd: 0 },
      final_balance_usd: 0
    }
  });

  const monthlyIncome: any[] = []; 

  const totalRevenue = financialOverview?.cashbox?.total_in_usd || 0;
  const totalExpenses = financialOverview?.expenses?.total_expenses_usd || 0;
  const netProfit = financialOverview?.final_balance_usd || 0;

  return {
    financialOverview,
    monthlyIncome,
    isLoading,
    error,
    totalRevenue,
    totalExpenses,
    netProfit
  };
}; 
