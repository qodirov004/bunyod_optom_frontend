"use client"

import React, { useState } from 'react';
import { Spin } from 'antd';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useFinancialData } from '../Dashboard/hooks/useFinancial';
import { DateRange } from '../../types';

// Import our new components
import FinanceHeader from './components/Header/FinanceHeader';
import FinanceAlerts from './components/Alerts/FinanceAlerts';
import FinanceTabs from './components/FinanceTabs/FinanceTabs';

// Import CSS
import '../../../accounting/pages/Kassa/styles.css';

const Finance: React.FC = () => {
  // Pass an all-time default date range since DateRangeSelector is removed
  const defaultDateRange: DateRange = {
    startDate: new Date(2000, 0, 1),
    endDate: new Date(2100, 0, 1),
    type: 'custom'
  };

  const {
    financialOverview: cashOverview,
    isLoading: isLoadingCash,
    error: cashError,
    totalRevenue,
    totalExpenses,
    totalServiceAndFuel,
  } = useFinancialData(defaultDateRange);

  const dashboardStats: any = {
    totalInUZS: cashOverview?.cashbox?.total_in_uzs || 0,
    cashPayments: cashOverview?.cashbox?.cash_payments_uzs || 0,
    bankPayments: cashOverview?.cashbox?.bank_payments_uzs || 0,
    yearlyExpenses: totalExpenses || 0,
    serviceExpenses: totalServiceAndFuel || 0,
    salariesExpenses: cashOverview?.expenses?.salaries_uzs || 0,
    driverExpenses: cashOverview?.expenses?.driver_expenses_uzs || 0,
    totalExpenses: cashOverview?.expenses?.total_expenses_uzs || totalExpenses || 0,
    finalBalance: cashOverview?.final_balance_uzs || 0,
  };

  const [activeTab, setActiveTab] = useState<string>('overview');
  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };
  const handleRefresh = () => {
    window.location.reload();
  };
  const handlePrint = () => {
    window.print();
  };
  const error = cashError 
    ? (cashError as any).response?.data?.detail || (cashError as any).message || 'Ma\'lumotlarni yuklashda xatolik yuz berdi' 
    : null;
  const isLoading = isLoadingCash;
  return (
    <DashboardLayout title="Moliya va Buxgalteriya">
      <div className="kassa-page finance-dashboard">
        <FinanceHeader
          onRefresh={handleRefresh}
          onPrint={handlePrint}
          isLoading={isLoading}
        />
        <FinanceAlerts
          cashOverview={cashOverview}
          error={error}
        />
        {isLoading && !cashOverview ? (
          <div className="loading-container">
            <Spin size="large">
              <div style={{ padding: '30px', textAlign: 'center' }}>
                Ma&apos;lumotlar yuklanmoqda...
              </div>
            </Spin>
          </div>
        ) : (
          <>
            {/* Main Tabs Section */}
            <FinanceTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              dashboardStats={dashboardStats}
              cashboxTotal={cashOverview?.cashbox?.total_in_uzs || cashOverview?.cashbox?.UZS || (cashOverview?.cashbox?.total_in_usd || 0) * 12800}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Finance; 