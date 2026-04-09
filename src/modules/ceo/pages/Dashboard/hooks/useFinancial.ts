import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { DateRange } from '../../../types';

export interface FinancialOverview {
  cashbox: {
    UZS: number;
    total_in_uzs: number;
    cash_payments_uzs: number;
    bank_payments_uzs: number;
  };
  expenses: {
    dp_price_uzs: number;
    salaries_uzs: number;
    total_expenses_uzs: number;
  };
  final_balance_uzs: number;
}

export const useFinancialData = (dateRange: DateRange) => {
  // Fetch trips data (active + history) for revenue calculation
  const { data: activeTrips = [], isLoading: isLoadingActive } = useQuery({
    queryKey: ['ceo-financial-active-trips'],
    queryFn: async () => {
      const response = await axiosInstance.get('/rays/');
      const data = response.data;
      return Array.isArray(data) ? data : (data.results || []);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: historyTrips = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['ceo-financial-history-trips'],
    queryFn: async () => {
      const response = await axiosInstance.get('/rayshistory/');
      const data = response.data;
      return Array.isArray(data) ? data : (data.results || []);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch driver salaries
  const { data: driverSalaries = [], isLoading: isLoadingSalaries } = useQuery({
    queryKey: ['ceo-financial-salaries'],
    queryFn: async () => {
      const response = await axiosInstance.get('/driversalary/');
      const data = response.data;
      return Array.isArray(data) ? data : (data.results || []);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch general outgoings
  const { data: outgoings = [], isLoading: isLoadingOutgoings } = useQuery({
    queryKey: ['ceo-financial-outgoings'],
    queryFn: async () => {
      const response = await axiosInstance.get('/chiqimlik/');
      const data = response.data;
      return Array.isArray(data) ? data : (data.results || []);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch all cash entries (active and history) for Naqt/Bank breakdown
  const { data: cashEntries = [], isLoading: isLoadingCashEntries } = useQuery({
    queryKey: ['ceo-financial-cash-entries-combined', dateRange],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (dateRange.startDate) {
          params.append('date_from', new Date(dateRange.startDate).toISOString().split('T')[0]);
        }
        if (dateRange.endDate) {
          params.append('date_to', new Date(dateRange.endDate).toISOString().split('T')[0]);
        }
        
        // Fetch from both active and history endpoints
        const [activeRes, historyRes] = await Promise.all([
          axiosInstance.get(`/casa/?${params.toString()}`),
          axiosInstance.get(`/casahistory/?${params.toString()}`)
        ]);
        
        const activeData = activeRes.data;
        const historyData = historyRes.data;
        
        const activeList = Array.isArray(activeData) ? activeData : (activeData.results || []);
        const historyList = Array.isArray(historyData) ? historyData : (historyData.results || []);
        
        // Combine both into one list for calculation
        return [...activeList, ...historyList];
      } catch (error) {
        console.error('Error fetching cash entries:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch cash overview
  const { data: cashOverview, isLoading: isLoadingCash } = useQuery({
    queryKey: ['ceo-financial-cash', dateRange],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (dateRange.startDate) {
          params.append('date_from', new Date(dateRange.startDate).toISOString().split('T')[0]);
        }
        if (dateRange.endDate) {
          params.append('date_to', new Date(dateRange.endDate).toISOString().split('T')[0]);
        }
        const response = await axiosInstance.get(`/casa/overview/?${params.toString()}`);
        return response.data;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = isLoadingActive || isLoadingHistory || isLoadingSalaries || isLoadingOutgoings || isLoadingCash || isLoadingCashEntries;

  // Combine all trips
  const allTrips = [...activeTrips, ...historyTrips];

  // Calculate revenue from all trips (sum of price field)
  const totalRevenue = allTrips.reduce((sum: number, trip: any) => sum + (Number(trip.price) || 0), 0);

  // Calculate expenses from: service costs + driver salaries + outgoings
  const tripServiceCosts = allTrips.reduce((sum: number, trip: any) => sum + (Number(trip.dr_price) || 0), 0);
  const totalSalaryExpenses = driverSalaries.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);
  const totalOutgoings = outgoings.reduce((sum: number, o: any) => sum + (Number(o.summ) || Number(o.amount) || 0), 0);

  const totalExpenses = tripServiceCosts + totalSalaryExpenses + totalOutgoings;
  const netProfit = totalRevenue - totalExpenses;

  // Build monthly income data for chart (last 6 months)
  const monthlyIncome = Array(6).fill(0).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthName = d.toLocaleString('uz-UZ', { month: 'short' });

    const monthRevenue = allTrips
      .filter((t: any) => {
        const td = new Date(t.created_at);
        return td.getMonth() === month && td.getFullYear() === year;
      })
      .reduce((sum: number, t: any) => sum + (Number(t.price) || 0), 0);

    const monthExpenses = allTrips
      .filter((t: any) => {
        const td = new Date(t.created_at);
        return td.getMonth() === month && td.getFullYear() === year;
      })
      .reduce((sum: number, t: any) => sum + (Number(t.dr_price) || 0), 0);

    return {
      month: monthName,
      daromad: monthRevenue,
      xarajat: monthExpenses,
      foyda: monthRevenue - monthExpenses
    };
  });

  // Calculate Cash vs Bank transfer totals from all entries (confirmed and pending)
  const cashPayments = Array.isArray(cashEntries) 
    ? cashEntries
        .filter((entry: any) => 
          entry.payment_way === 1 || 
          entry.payment_way === '1' ||
          (entry.payment_way_name && entry.payment_way_name.toLowerCase().includes('naqd')) ||
          (entry.payment_name && entry.payment_name.toLowerCase().includes('naqd'))
        )
        .reduce((sum: number, entry: any) => sum + (Number(entry.amount) * (Number(entry.custom_rate_to_uzs) || 1)), 0)
    : 0;

  const bankPayments = Array.isArray(cashEntries)
    ? cashEntries
        .filter((entry: any) => 
          entry.payment_way === 2 || 
          entry.payment_way === '2' ||
          (entry.payment_way_name && (entry.payment_way_name.toLowerCase().includes('bank') || entry.payment_way_name.toLowerCase().includes('o\'tkazma'))) ||
          (entry.payment_name && (entry.payment_name.toLowerCase().includes('bank') || entry.payment_name.toLowerCase().includes('o\'tkazma')))
        )
        .reduce((sum: number, entry: any) => sum + (Number(entry.amount) * (Number(entry.custom_rate_to_uzs) || 1)), 0)
    : 0;

  // Build financial overview object
  const cashUZS = cashOverview?.cashbox?.UZS || cashOverview?.cashbox?.total_in_uzs || (cashPayments + bankPayments) || 0;
  const financialOverview = {
    cashbox: {
      UZS: cashUZS,
      total_in_uzs: cashUZS,
      cash_payments_uzs: cashPayments,
      bank_payments_uzs: bankPayments,
    },
    expenses: {
      dp_price_uzs: tripServiceCosts,
      salaries_uzs: totalSalaryExpenses,
      total_expenses_uzs: totalExpenses,
    },
    final_balance_uzs: netProfit
  };

  return {
    financialOverview,
    monthlyIncome,
    isLoading,
    error: null,
    totalRevenue,
    totalExpenses,
    netProfit
  };
};
