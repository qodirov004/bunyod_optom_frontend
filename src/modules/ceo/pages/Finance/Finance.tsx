"use client"

import React, { useState } from 'react';
import { Spin } from 'antd';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useFinanceData } from './hooks/useFinanceData';

// Import our new components
import FinanceHeader from './components/Header/FinanceHeader';
import FinanceAlerts from './components/Alerts/FinanceAlerts';
import SummaryCards from './components/SummaryCards/SummaryCards';
import FinanceTabs from './components/FinanceTabs/FinanceTabs';

// Import CSS
import '../../../accounting/pages/Kassa/styles.css';

const Finance: React.FC = () => {
  const {
    cashOverview,
    isLoadingCash,
    cashError,
    refetchCash,
    dashboardStats
  } = useFinanceData();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };
  const handleRefresh = () => {
    refetchCash();
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
            <SummaryCards
              cashOverview={cashOverview}
            />

            {/* Main Tabs Section */}
            <FinanceTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              dashboardStats={dashboardStats}
              cashboxTotal={cashOverview?.cashbox?.total_in_usd}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Finance; 