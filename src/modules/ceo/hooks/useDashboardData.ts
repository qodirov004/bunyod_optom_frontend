import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../api/axiosInstance';
import { useCEODrivers } from './useCEODrivers';
import { useCEOCars } from './useCEOCars';
import { useCEOClients } from './useCEOClients';
import { useCEOTrips } from './useCEOTrips';
import { useHistoryTrips } from './useHistoryTrips';
import dayjs from 'dayjs';

interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  revenue30Days: number;
  expenses30Days: number;
  profit30Days: number;
}

export const useDashboardData = () => {
  // Use our newly updated hooks with real backend data
  const { total: totalDrivers, activeDriversCount, isLoading: driversLoading } = useCEODrivers();
  const { total: totalCars, inRaysCount: activeCarsCount, loading: carsLoading } = useCEOCars();
  const { total: totalClients, loading: clientsLoading } = useCEOClients();
  const { 
    trips: activeTrips = [], 
    activeTripsCount,
    loading: tripsLoading 
  } = useCEOTrips();
  const { data: historyTrips = [], isLoading: historyLoading } = useHistoryTrips();

  // Fetch financial data from backend (Driver salaries and Outgoings)
  const { data: driverSalaries = [], isLoading: salariesLoading } = useQuery({
    queryKey: ['ceo-driver-salaries'],
    queryFn: async () => {
      const response = await axiosInstance.get('/driversalary/');
      return Array.isArray(response.data) ? response.data : (response.data.results || []);
    }
  });

  const { data: outgoings = [], isLoading: outgoingsLoading } = useQuery({
    queryKey: ['ceo-outgoings'],
    queryFn: async () => {
      const response = await axiosInstance.get('/chiqimlik/');
      return Array.isArray(response.data) ? response.data : (response.data.results || []);
    }
  });

  // Aggregate all calculations
  const allTrips = [...activeTrips, ...historyTrips];
  
  const totalRevenue = allTrips.reduce((sum, trip) => sum + (Number(trip.price) || 0), 0);
  
  // Expenses = service costs (dr_price) + driver salary payments + outgoings
  const tripServiceCosts = allTrips.reduce((sum, trip) => sum + (Number(trip.dr_price) || 0), 0);
  const totalSalaries = driverSalaries.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);
  const totalOutgoings = outgoings.reduce((sum: number, o: any) => sum + (Number(o.summ) || Number(o.amount) || 0), 0);
  
  const totalExpenses = tripServiceCosts + totalSalaries + totalOutgoings;
  const profit = totalRevenue - totalExpenses;

  // Last 30 days metrics
  const thirtyDaysAgo = dayjs().subtract(30, 'days');
  const revenue30Days = allTrips
    .filter(t => dayjs(t.created_at).isAfter(thirtyDaysAgo))
    .reduce((sum, t) => sum + (Number(t.price) || 0), 0);
    
  const expenses30Days = allTrips
    .filter(t => dayjs(t.created_at).isAfter(thirtyDaysAgo))
    .reduce((sum, t) => sum + (Number(t.dr_price) || 0), 0) +
    driverSalaries.filter((s: any) => dayjs(s.created_at).isAfter(thirtyDaysAgo)).reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0) +
    outgoings.filter((o: any) => dayjs(o.created_at).isAfter(thirtyDaysAgo)).reduce((sum: number, o: any) => sum + (Number(o.summ) || Number(o.amount) || 0), 0);

  const profit30Days = revenue30Days - expenses30Days;

  // Summary metrics for the dashboard
  const summaryMetrics = {
    totalDrivers,
    activeDrivers: activeDriversCount,
    totalCars,
    activeCars: activeCarsCount,
    totalClients,
    totalTrips: allTrips.length,
    activeTrips: activeTripsCount,
    completedTrips: historyTrips.length,
    totalRevenue,
    totalExpenses,
    profit,
    revenue30Days,
    expenses30Days,
    profit30Days
  };

  // Completion rate
  const tripCompletionRate = allTrips.length > 0 ? (historyTrips.length / allTrips.length) * 100 : 0;

  return {
    summaryMetrics,
    tripCompletionRate,
    chartData: {
      revenueData: Array(6).fill(0).map((_, i) => {
        const date = dayjs().subtract(5 - i, 'month');
        const monthRev = allTrips
          .filter(t => dayjs(t.created_at).format('MMM') === date.format('MMM'))
          .reduce((sum, t) => sum + (Number(t.price) || 0), 0);
        const monthExp = allTrips
          .filter(t => dayjs(t.created_at).format('MMM') === date.format('MMM'))
          .reduce((sum, t) => sum + (Number(t.dr_price) || 0), 0);
          
        return [
          { month: date.format('MMM'), value: monthRev, type: 'Daromad' },
          { month: date.format('MMM'), value: monthExp, type: 'Xarajat' }
        ];
      }).flat(),
      expenseData: [],
      profitData: []
    },
    loading: driversLoading || carsLoading || clientsLoading || tripsLoading || historyLoading || salariesLoading || outgoingsLoading
  };
}; 