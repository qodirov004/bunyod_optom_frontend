import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';

export const useFinancialData = (dateRange) => {
  const { data: financialOverview, isLoading, error } = useQuery({
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
        params.append('date_from', dateRange.startDate.toISOString().split('T')[0]);
      }
      if (dateRange.endDate) {
        params.append('date_to', dateRange.endDate.toISOString().split('T')[0]);
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

  const monthlyIncome = []; 

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