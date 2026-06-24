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

  const { data: serviceTotals = null, isLoading: isLoadingService } = useQuery({
    queryKey: ['ceo-financial-service', dateRange],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (dateRange.startDate) params.append('start_date', new Date(dateRange.startDate).toISOString().split('T')[0]);
        if (dateRange.endDate) params.append('end_date', new Date(dateRange.endDate).toISOString().split('T')[0]);
        const response = await axiosInstance.get(`/service/totals/?${params.toString()}`);
        return response.data?.totals || response.data;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch fuel expenses
  const { data: fuelData = [], isLoading: isLoadingFuel } = useQuery({
    queryKey: ['ceo-financial-fuel'],
    queryFn: async () => {
      const response = await axiosInstance.get('/fuel/');
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

  // Fetch cash overview (always get overall balance, not filtered by date)
  const { data: cashOverview, isLoading: isLoadingCash } = useQuery({
    queryKey: ['ceo-financial-cash'],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get('/casa/overview/');
        return response.data;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = isLoadingActive || isLoadingHistory || isLoadingSalaries || isLoadingOutgoings || isLoadingCash || isLoadingCashEntries || isLoadingService || isLoadingFuel;

  // Combine all trips
  const allTrips = [...activeTrips, ...historyTrips];

  // Helper to filter by date
  const isWithinDateRange = (dateString: string) => {
    if (!dateString) return false;
    if (!dateRange.startDate && !dateRange.endDate) return true;
    
    const itemDate = new Date(dateString);
    itemDate.setHours(0, 0, 0, 0);
    
    if (dateRange.startDate) {
      const start = new Date(dateRange.startDate);
      start.setHours(0, 0, 0, 0);
      if (itemDate < start) return false;
    }
    
    if (dateRange.endDate) {
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);
      if (itemDate > end) return false;
    }
    
    return true;
  };

  const filteredTrips = allTrips.filter((trip: any) => isWithinDateRange(trip.created_at));
  const filteredOutgoings = outgoings.filter((o: any) => isWithinDateRange(o.created_at || o.date));
  const filteredFuel = fuelData.filter((f: any) => isWithinDateRange(f.created_at || f.date));

  // Calculate revenue from total actual cash inflows (to match Kassa balance logic)
  const totalRevenue = cashOverview?.cashbox?.total_in_uzs || 
                       cashOverview?.cashbox?.UZS || 
                       filteredTrips.reduce((sum: number, trip: any) => sum + (Number(trip.price) || 0), 0);

  // Calculate expenses from trips (dr_price and dp_price)
  const tripServiceCosts = filteredTrips.reduce((sum: number, trip: any) => sum + (Number(trip.dr_price) || 0), 0);
  const tripDriverPayments = filteredTrips.reduce((sum: number, trip: any) => sum + (Number(trip.dp_price) || 0), 0);
  
  // Calculate expenses from general outgoings
  const totalOutgoings = filteredOutgoings.reduce((sum: number, o: any) => sum + (Number(o.summ) || Number(o.amount) || 0), 0);
  
  // Calculate fuel expenses
  const totalFuel = filteredFuel.reduce((sum: number, f: any) => sum + (Number(f.price) || 0), 0);
  
  // Get service expenses from the API totals
  const totalTexnic = (serviceTotals?.texnic || serviceTotals?.services || 0) + (serviceTotals?.optol || 0);
  const totalBalon = serviceTotals?.balon || 0;
  const totalBalonFurgon = serviceTotals?.furgon_balon || 0;
  const totalOptol = 0; // Moved to texnic

  const expensesBreakdown = {
    "Texnik xizmat": totalTexnic,
    "Ballon xarajatlari": totalBalon,
    "Furgon ballonlari": totalBalonFurgon,
    "Yoqilg'i xarajatlari": totalFuel,
    "Optol to'lovlari": totalOptol,
    "Kundalik xarajatlar": totalOutgoings,
    "Haydovchi to'lovlari (Reys)": cashOverview?.expenses?.salaries_uzs || tripDriverPayments || 0,
    "Reys xarajatlari": Math.max(0, (cashOverview?.expenses?.driver_expenses_uzs || tripServiceCosts || 0) - (cashOverview?.cashbox?.driver_returned_uzs || 0))
  };

  // Total expenses is sum of breakdown
  const totalExpenses = Object.values(expensesBreakdown).reduce((sum, val) => sum + val, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Prepare for chart distribution
  const tripsTotalRevenue = filteredTrips.reduce((sum: number, trip: any) => sum + (Number(trip.price) || 0), 0);
  const revenueRatio = tripsTotalRevenue > 0 ? totalRevenue / tripsTotalRevenue : 1;
  const backendDriverAndSalary = 
    (cashOverview?.expenses?.salaries_uzs || tripDriverPayments || 0) + 
    Math.max(0, (cashOverview?.expenses?.driver_expenses_uzs || tripServiceCosts || 0) - (cashOverview?.cashbox?.driver_returned_uzs || 0));

  // Build monthly income data for chart (last 6 months)
  const monthlyIncome = Array(6).fill(0).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthName = d.toLocaleString('uz-UZ', { month: 'short' });

    const isMatch = (dateStr: string) => {
      if (!dateStr) return false;
      const td = new Date(dateStr);
      return td.getMonth() === month && td.getFullYear() === year;
    };

    const monthTripsRevenue = allTrips
      .filter((t: any) => isMatch(t.created_at))
      .reduce((sum: number, t: any) => sum + (Number(t.price) || 0), 0);

    const daromad = tripsTotalRevenue > 0 ? monthTripsRevenue * revenueRatio : monthTripsRevenue;

    const monthOutgoings = outgoings.filter((o: any) => isMatch(o.created_at || o.date)).reduce((sum: number, o: any) => sum + (Number(o.summ) || Number(o.amount) || 0), 0);
    const monthFuel = fuelData.filter((f: any) => isMatch(f.created_at || f.date)).reduce((sum: number, f: any) => sum + (Number(f.price) || 0), 0);
    const totalBackendServices = totalTexnic + totalBalon + totalBalonFurgon + totalOptol;
    const monthService = tripsTotalRevenue > 0 ? totalBackendServices * (monthTripsRevenue / tripsTotalRevenue) : 0;
    
    // Distribute missing driver/salary expenses proportionally to this month's trip revenue
    const monthDriverAndSalary = tripsTotalRevenue > 0 ? backendDriverAndSalary * (monthTripsRevenue / tripsTotalRevenue) : 0;

    const xarajat = monthOutgoings + monthFuel + monthService + monthDriverAndSalary;

    return {
      month: monthName,
      daromad,
      xarajat,
      foyda: daromad - xarajat
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
        .reduce((sum: number, entry: any) => sum + (Number(entry.amount) || 0), 0)
    : 0;

  const bankPayments = Array.isArray(cashEntries)
    ? cashEntries
        .filter((entry: any) => 
          entry.payment_way === 2 || 
          entry.payment_way === '2' ||
          (entry.payment_way_name && (entry.payment_way_name.toLowerCase().includes('bank') || entry.payment_way_name.toLowerCase().includes('o\'tkazma'))) ||
          (entry.payment_name && (entry.payment_name.toLowerCase().includes('bank') || entry.payment_name.toLowerCase().includes('o\'tkazma')))
        )
        .reduce((sum: number, entry: any) => sum + (Number(entry.amount) || 0), 0)
    : 0;

  // Calculate actual cash salaries (for reference)
  const filteredSalaries = driverSalaries.filter((s: any) => isWithinDateRange(s.created_at || s.date));
  const totalSalaryExpenses = filteredSalaries.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0);

  // Build financial overview object
  const cashUZS = cashOverview?.cashbox?.UZS || cashOverview?.cashbox?.total_in_uzs || (cashPayments + bankPayments) || 0;
  
  // Combine all service expenses and fuel into one "Service" category for the Overview cards
  const totalServiceAndFuel = totalTexnic + totalBalon + totalBalonFurgon + totalOptol + totalFuel;
  
  const financialOverview = {
    cashbox: {
      UZS: cashUZS,
      total_in_uzs: cashUZS,
      cash_payments_uzs: cashPayments,
      bank_payments_uzs: bankPayments,
    },
    expenses: {
      dp_price_uzs: cashOverview?.expenses?.dp_price_uzs || 0,
      service_uzs: totalServiceAndFuel,
      salaries_uzs: cashOverview?.expenses?.salaries_uzs || tripDriverPayments || 0, 
      total_expenses_uzs: totalExpenses,
      driver_expenses_uzs: Math.max(0, (cashOverview?.expenses?.driver_expenses_uzs || tripServiceCosts || 0) - (cashOverview?.cashbox?.driver_returned_uzs || 0)),
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
    netProfit,
    expensesBreakdown,
    totalServiceAndFuel
  };
};
