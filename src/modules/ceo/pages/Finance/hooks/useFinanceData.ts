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
  cashPayments: number;
  bankPayments: number;
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
    const value = Number(record[field]) || 0;
    if (value === 0) return 0;

    // Detect currency
    const currencyRaw = record.currency?.currency || record.currency || (record.usd_value ? 'USD' : 'UZS');
    const currency = typeof currencyRaw === 'string' ? currencyRaw.toUpperCase() : (currencyRaw === 1 ? 'USD' : 'UZS');

    // If currency is explicitly UZS, return value
    if (currency === 'UZS' || currency === 'SO\'M' || currency === 'SOM') return value;
    
    // If currency is RUB, convert using fixed rate (approximate)
    if (currency === 'RUB') return value * 140;
    
    // If currency is USD, convert using fixed rate
    if (currency === 'USD') return value * 12800;

    // Smart detection fallback if currency is unclear:
    // 1. If value is very large (> 50,000), it's almost certainly UZS already.
    // 2. If value is small (< 10,000), it's likely USD.
    if (value > 50000) return value;
    if (value < 10000) return value * 12800;

    // Default: assume it's already in UZS to be safe (don't multiply by 12800 unless sure)
    return value;
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

  // Fetch all cash entries (active and history) for Naqt/Bank breakdown
  const { data: cashEntries = [] } = useQuery({
    queryKey: ['ceo-finance-cash-entries-combined'],
    queryFn: async () => {
      try {
        // Fetch from both active and history endpoints
        const [activeRes, historyRes] = await Promise.all([
          axiosInstance.get('/casa/'),
          axiosInstance.get('/casahistory/')
        ]);
        
        const activeData = activeRes.data;
        const historyData = historyRes.data;
        
        const activeList = Array.isArray(activeData) ? activeData : (activeData.results || []);
        const historyList = Array.isArray(historyData) ? historyData : (historyData.results || []);
        
        return [...activeList, ...historyList];
      } catch (error) {
        console.error('Error fetching cash entries for CEO:', error);
        return [];
      }
    }
  });

  // Calculate Cash vs Bank transfer totals
  const cashPayments = Array.isArray(cashEntries) 
    ? cashEntries
        .filter((entry: any) => 
          entry.payment_way === 1 || 
          entry.payment_way === '1' ||
          (entry.payment_way_name && entry.payment_way_name.toLowerCase().includes('naqd')) ||
          (entry.payment_name && entry.payment_name.toLowerCase().includes('naqd'))
        )
        .reduce((sum: number, entry: any) => sum + getUZSValue(entry, 'amount'), 0)
    : 0;

  const bankPayments = Array.isArray(cashEntries)
    ? cashEntries
        .filter((entry: any) => 
          entry.payment_way === 2 || 
          entry.payment_way === '2' ||
          (entry.payment_way_name && (entry.payment_way_name.toLowerCase().includes('bank') || entry.payment_way_name.toLowerCase().includes('o\'tkazma'))) ||
          (entry.payment_name && (entry.payment_name.toLowerCase().includes('bank') || entry.payment_name.toLowerCase().includes('o\'tkazma')))
        )
        .reduce((sum: number, entry: any) => sum + getUZSValue(entry, 'amount'), 0)
    : 0;

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
    totalInUZS: finalTotalInUZS,
    cashPayments,
    bankPayments
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