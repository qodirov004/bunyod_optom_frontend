import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { cashApi } from '../../../../accounting/api/cash/cashApi';
import { CashOverview } from '../../../../accounting/types/cash.types';
import { driverApi } from '../../../api/driver/driverApi';
import dayjs from 'dayjs';

export interface DashboardStats {
  totalTrips: number;
  completedTrips: number;
  pendingTrips: number;
  totalVehicles: number;
  activeVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  totalClients: number;
  clientsWithDebt: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  yearlyRevenue: number;
  yearlyExpenses: number;
  profitMargin: number;
  totalInUZS: number;
}

export const useFinanceData = () => {
  // Use React Query to fetch cash overview data
  const { 
    data: cashOverview,
    isLoading: isLoadingCash, 
    error: cashError,
    refetch: refetchCash
  } = useQuery<CashOverview>({
    queryKey: ['cashOverview-ceo'],
    queryFn: cashApi.getCashOverview,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: activeTrips = [], isLoading: isLoadingTrips } = useQuery({
    queryKey: ['ceo-finance-active-trips'],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get('/rays/');
        const data = response.data;
        return Array.isArray(data) ? data : (data.results || []);
      } catch (err) {
        console.error('Error fetching active trips:', err);
        return [];
      }
    }
  });

  const { data: historyTrips = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['ceo-finance-history-trips'],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get('/rayshistory/');
        const data = response.data;
        return Array.isArray(data) ? data : (data.results || []);
      } catch (err) {
        console.error('Error fetching history trips:', err);
        return [];
      }
    }
  });

  const { data: driverSalaries = [], isLoading: isLoadingSalaries } = useQuery({
    queryKey: ['ceo-finance-salaries'],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get('/driversalary/');
        const data = response.data;
        return Array.isArray(data) ? data : (data.results || []);
      } catch (err) {
        console.error('Error fetching driver salaries:', err);
        return [];
      }
    }
  });

  const { data: outgoings = [], isLoading: isLoadingOutgoings } = useQuery({
    queryKey: ['ceo-finance-outgoings'],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get('/chiqimlik/');
        const data = response.data;
        return Array.isArray(data) ? data : (data.results || []);
      } catch (err) {
        console.error('Error fetching outgoings:', err);
        return [];
      }
    }
  });

  // Basic stats from other endpoints (drivers, cars, clients)
  const { data: driversData = { data: [], total: 0 } } = useQuery({
    queryKey: ['ceo-finance-drivers'],
    queryFn: async () => {
      try {
        return await driverApi.getAllDrivers({ status: 'active', page: 1, pageSize: 100 });
      } catch (error) {
        console.error('Error fetching drivers for finance stats:', error);
        return { data: [], total: 0 };
      }
    }
  });

  const drivers = driversData.data || [];

  const { data: cars = [] } = useQuery({
    queryKey: ['ceo-finance-cars'],
    queryFn: async () => {
      try {
        const resp = await axiosInstance.get('/car-active/');
        return resp.data.results || resp.data || [];
      } catch {
        return [];
      }
    }
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['ceo-finance-clients'],
    queryFn: async () => {
      try {
        const resp = await axiosInstance.get('/clients/');
        return resp.data.results || resp.data || [];
      } catch {
        return [];
      }
    }
  });

  // Aggregate stats logic
  const allTrips = [...activeTrips, ...historyTrips];
  const totalTrips = allTrips.length;
  const completedTrips = historyTrips.length;
  const pendingTrips = activeTrips.length;

  const totalVehicles = Array.isArray(cars) ? cars.length : 0;
  const activeVehicles = Array.isArray(cars) ? cars.filter((c: any) => c.status === 'in_rays' || c.holat === 'reysta').length : 0;
  
  const totalDriversNum = Array.isArray(drivers) ? drivers.length : 0;
  const activeDrivers = Array.isArray(drivers) ? drivers.filter((d: any) => d.status === 'in_rays' || d.is_active).length : 0;
  
  const totalClientsNum = Array.isArray(clients) ? clients.length : 0;

  // Revenue & Expenses aggregation (UZS)
  const now = dayjs();
  const thirtyDaysAgo = now.subtract(30, 'days');
  const startOfYear = now.startOf('year');

  // Helper to get UZS value from a record with smart detection
  const getUZSValue = (record: any, field: string) => {
    // Some fields like 'summ' or 'amount' are likely already in UZS
    const value = Number(record[field]) || 0;
    if (value === 0) return 0;

    // Smart detection: If value is > 10,000,000, it's almost certainly already in UZS
    // No one is paying 10 million USD for a single trip or salary.
    if (value > 10000000) return value;

    // Check currency object or field
    const currencyRaw = record.currency?.currency || record.currency || (record.usd_value ? 'USD' : 'UZS');
    const currency = typeof currencyRaw === 'string' ? currencyRaw.toUpperCase() : (currencyRaw === 1 ? 'USD' : 'UZS');
    
    if (currency === 'UZS' || currency === 'SO\'M' || currency === 'SOM') return value;
    if (currency === 'RUB') return value * 140;
    if (currency === 'USD') return value * 12800;

    // Last resort: if value is small, assume it's USD for standard trip prices
    return value < 1000000 ? value * 12800 : value;
  };

  const monthlyRevenue = allTrips
    .filter(t => dayjs(t.created_at).isAfter(thirtyDaysAgo))
    .reduce((sum, t) => sum + getUZSValue(t, 'price'), 0);

  const monthlyExpenses = allTrips
    .filter(t => dayjs(t.created_at).isAfter(thirtyDaysAgo))
    .reduce((sum, t) => sum + getUZSValue(t, 'dr_price'), 0) +
    driverSalaries.filter((s: any) => dayjs(s.created_at).isAfter(thirtyDaysAgo)).reduce((sum: number, s: any) => sum + getUZSValue(s, 'amount'), 0) +
    outgoings.filter((o: any) => dayjs(o.created_at).isAfter(thirtyDaysAgo)).reduce((sum: number, o: any) => sum + getUZSValue(o, 'summ'), 0);

  // Yearly/All-time for fallback
  const yearlyRevenue = allTrips
    .filter(t => dayjs(t.created_at).isAfter(startOfYear))
    .reduce((sum, t) => sum + getUZSValue(t, 'price'), 0);

  const yearlyExpenses = allTrips
    .filter(t => dayjs(t.created_at).isAfter(startOfYear))
    .reduce((sum, t) => sum + getUZSValue(t, 'dr_price'), 0) +
    driverSalaries.filter((s: any) => dayjs(s.created_at).isAfter(startOfYear)).reduce((sum: number, s: any) => sum + getUZSValue(s, 'amount'), 0) +
    outgoings.filter((o: any) => dayjs(o.created_at).isAfter(startOfYear)).reduce((sum: number, o: any) => sum + getUZSValue(o, 'summ'), 0);

  const profitMargin = yearlyRevenue > 0 ? ((yearlyRevenue - yearlyExpenses) / yearlyRevenue) * 100 : 0;

  // Greedy manual calculation of total kassa: Total Revenue - Total Expenses
  // Revenue is based on 'price' and 'history'
  const totalRevenueAllTime = allTrips.reduce((sum, t) => sum + getUZSValue(t, 'price'), 0);
  const totalExpensesAllTime = allTrips.reduce((sum, t) => sum + getUZSValue(t, 'dr_price'), 0) +
                              driverSalaries.reduce((sum: number, s: any) => sum + getUZSValue(s, 'amount'), 0) +
                              outgoings.reduce((sum: number, o: any) => sum + getUZSValue(o, 'summ'), 0);

  const manualTotalKassa = totalRevenueAllTime - totalExpensesAllTime;
  const finalTotalInUZS = cashOverview?.cashbox?.total_in_uzs || 
                          cashOverview?.cashbox?.UZS || 
                          (cashOverview?.cashbox?.total_in_usd ? cashOverview.cashbox.total_in_usd * 12800 : 0) || 
                          Math.max(0, manualTotalKassa);

  const dashboardStats: DashboardStats = {
    totalTrips,
    completedTrips,
    pendingTrips,
    totalVehicles,
    activeVehicles,
    totalDrivers: totalDriversNum,
    activeDrivers,
    totalClients: totalClientsNum,
    clientsWithDebt: 0, // Placeholder
    monthlyRevenue,
    monthlyExpenses,
    yearlyRevenue,
    yearlyExpenses,
    profitMargin,
    totalInUZS: finalTotalInUZS
  };

  // Set up last updated timestamp
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Update timestamp when data is refreshed
  const isLoading = isLoadingCash || isLoadingTrips || isLoadingHistory || isLoadingSalaries || isLoadingOutgoings;

  useEffect(() => {
    if (!isLoading) {
      setLastUpdated(new Date());
    }
  }, [isLoading]);

  return {
    cashOverview,
    isLoadingCash: isLoading,
    cashError,
    refetchCash,
    dashboardStats,
    lastUpdated
  };
};