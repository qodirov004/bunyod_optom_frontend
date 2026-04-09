"use client" 

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DateRangeSelector } from '../../components/DateRangeSelector';
import { DateRange } from '../../types';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import './styles/Dashboard.css';
// Import custom hooks
import { useFinancialData } from './hooks/useFinancial';
import { useClientPaymentData } from './hooks/useClientPayment';
import { useCars, useCarStatus } from '../../../accounting/hooks/useCars';
import { useFurgons, useFurgonStatus } from '../../../accounting/hooks/useFurgon';
import { useTrips } from '../../../accounting/hooks/useTrips';
import { useCEODrivers } from '../../hooks/useCEODrivers';
import { usePopularRoutes } from '../../hooks/usePopularRoutes';
import { useHistory } from '../../../accounting/hooks/useHistory';
import { useExpenseTotals } from '../../hooks/useExpenseTotals';

// Import components
import FinancialSummary from './components/financial/FinancialSummary';
import MonthlyIncomeChart from './components/financial/MonthlyIncomeChart';
import CashboxSummary from './components/financial/CashboxSummary';
import ExpensesSummary from './components/financial/ExpensesSummary';
import ExpensesBreakdownSection from './components/financial/ExpensesBreakdownSection';
import ClientPaymentsSection from './components/clients/ClientPaymentsSection';
import VehicleSection from './components/fleet/VehicleSection';
import TopDriversSection from './components/drivers/TopDriversSection';
import TripStatisticsSection from './components/trips/TripStatisticsSection';

// Import CSS
import './styles/Dashboard.css';

const Dashboard = ({ hideLayout = false }: { hideLayout?: boolean }) => {
  const router = useRouter();
  
  // Initialize date range state for six months
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - 6);

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate,
    endDate,
    type: 'custom',
  });

  // Use custom hooks for data fetching
  const { 
    financialOverview, 
    monthlyIncome, 
    isLoading: isLoadingFinancials,
    totalRevenue,
    totalExpenses,
    netProfit
  } = useFinancialData(dateRange);
  
  const { clientPaymentData, isLoading: isLoadingPayments } = useClientPaymentData();
  
  // Car and furgon statistics
  const { cars = [], isLoading: isLoadingCars } = useCars();
  const { inRaysCount: activeCars, availableCount: waitingCars } = useCarStatus();
  const { furgons = [], isLoading: isLoadingFurgons } = useFurgons();
  const { inRaysCount: activeFurgons, availableCount: waitingFurgons } = useFurgonStatus();
  
  // Trip statistics
  const { data: trips = [], isLoading: isLoadingTrips } = useTrips();
  const { data: historyData = [], isLoading: isLoadingHistory } = useHistory();
  
  // Driver and route statistics
  const { drivers: allDrivers = [], isLoading: isLoadingDrivers } = useCEODrivers();
  const { data: popularRoutesData = [], loading: isLoadingPopularRoutes } = usePopularRoutes();

  // Process drivers to include their trip counts from local trips & history
  const processedTopDrivers = useMemo(() => {
    if (!allDrivers || allDrivers.length === 0) return [];
    
    // allDrivers already has computed rays_count from useCEODrivers
    return [...allDrivers]
      .sort((a, b) => (Number(b.rays_count) || 0) - (Number(a.rays_count) || 0))
      .slice(0, 5);
  }, [allDrivers]);

  // Expenses data
  const { data: expenseTotalsData, isLoading: isLoadingExpenseTotals } = useExpenseTotals();

  // Optimized statistics calculation with useMemo
  const fleetStats = useMemo(() => {
    const carsInMaintenance = cars.filter(car => car.holat === 'tamirda').length || 0;
    const carsInUsePercentage = cars.length > 0 ? (activeCars / cars.length) * 100 : 0;
    const furgonsInUsePercentage = furgons.length > 0 ? (activeFurgons / furgons.length) * 100 : 0;
    const averageKilometers = cars.reduce((sum, car) => sum + (car.kilometer || 0), 0) / (cars.length || 1) || 0;
    
    return {
      carsInMaintenance,
      fleetUtilization: carsInUsePercentage,
      furgonUtilization: furgonsInUsePercentage,
      averageKilometers
    };
  }, [cars, activeCars, activeFurgons, furgons.length]);
  
  const tripStats = useMemo(() => {
    const activeTripsCount = trips.filter(trip => !trip.is_completed).length;
    const completedTripsCount = Array.isArray(historyData) ? historyData.length : 0;
    return { 
      activeTripsCount, 
      completedTripsCount, 
      totalTripsCount: activeTripsCount + completedTripsCount 
    };
  }, [trips, historyData]);

  const expensesDataResult = useMemo(() => {
    const colors = ['#6c5ce7', '#2ed573', '#ff9f43', '#00d2d3', '#ef5da8', '#4834d4', '#13c2c2', '#eb2f96'];
    const items = expenseTotalsData ? 
      Object.entries(expenseTotalsData).map(([key, value], index) => ({
        name: key,
        value: typeof value === 'number' ? value : 0,
        color: colors[index % colors.length]
      })) : [];
    const total = items.reduce((sum, item) => sum + item.value, 0);
    return { items, total };
  }, [expenseTotalsData]);

  // Event handlers
  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };

  const viewAll = (path: string) => {
    router.push(`/modules/ceo/${path}`);
  };

  const dashboardContent = (
    <div className="dashboard-container" style={{ padding: hideLayout ? '0' : '8px' }}>
        {/* Date Range Selector */}
        <div className="date-range-container">
          <DateRangeSelector
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>

        {/* Financial Overview Section */}
        <FinancialSummary
          financialOverview={financialOverview}
          monthlyIncome={monthlyIncome}
          totalRevenue={totalRevenue}
          totalExpenses={totalExpenses}
          netProfit={netProfit}
          dateRange={dateRange}
          isLoading={isLoadingFinancials}
        />

        <MonthlyIncomeChart 
          monthlyData={monthlyIncome}
          isLoading={isLoadingFinancials}
        />

        <div className="dashboard-row">
          <div className="dashboard-column left">
            <CashboxSummary 
              cashbox={financialOverview.cashbox} 
              isLoading={isLoadingFinancials} 
            />
              </div>
          <div className="dashboard-column right">
            <ExpensesSummary 
              expenses={financialOverview.expenses} 
              isLoading={isLoadingFinancials} 
            />
          </div>
                </div>

        {/* Expenses Breakdown Section */}
        <ExpensesBreakdownSection
          expensesData={expensesDataResult.items}
          realTotalExpenses={expensesDataResult.total}
          isLoading={isLoadingExpenseTotals}
        />

        {/* Client Payments Section */}
        <div className="dashboard-row">
          <div className="dashboard-column full-width">
            <ClientPaymentsSection
              clientPaymentData={clientPaymentData}
              isLoading={isLoadingPayments}
            />
                </div>
                </div>
                
        <VehicleSection
          activeCars={activeCars}
          waitingCars={waitingCars}
          carsInMaintenance={fleetStats.carsInMaintenance}
          fleetUtilization={fleetStats.fleetUtilization}
          activeFurgons={activeFurgons}
          waitingFurgons={waitingFurgons}
          furgonUtilization={fleetStats.furgonUtilization}
          averageKilometers={fleetStats.averageKilometers}
          isLoadingCars={isLoadingCars}
          isLoadingFurgons={isLoadingFurgons}
          viewAll={viewAll}
        />

        <TopDriversSection
          topDriversData={processedTopDrivers}
          isLoading={isLoadingDrivers || isLoadingTrips || isLoadingHistory}
          viewAll={viewAll}
        />

        <TripStatisticsSection
          activeTripsCount={tripStats.activeTripsCount}
          completedTripsCount={tripStats.completedTripsCount}
          totalTripsCount={tripStats.totalTripsCount}
          popularRoutesData={popularRoutesData}
          isLoadingPopularRoutes={isLoadingPopularRoutes}
          viewAll={viewAll}
        />
    </div>
  );

  if (hideLayout) return dashboardContent;

  return (
    <DashboardLayout title="Boshqaruv paneli">
      {dashboardContent}
    </DashboardLayout>
  );
};

export default Dashboard; 