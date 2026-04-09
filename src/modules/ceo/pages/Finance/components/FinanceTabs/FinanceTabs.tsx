import React from 'react';
import { Tabs, Card, Badge } from 'antd';
import { 
  DollarCircleOutlined, 
  UserOutlined, 
  CarOutlined, 
  WalletOutlined, 
  HistoryOutlined, 
  ToolOutlined,
} from '@ant-design/icons';

import { DashboardStats } from '../../hooks/useFinanceData';

// Kassa Module Components - Integrating from accounting
import Overview from '../../../../../accounting/pages/Kassa/Overview';
import ClientAccounts from '../../../../../accounting/pages/Kassa/ClientAccounts';
import DriverPayments from '../../../../../accounting/pages/Kassa/DriverPayments';
import RaysTulovlar from '../../../../../accounting/pages/Kassa/RaysTulovlar';
import CashTransactionList from '../../../../../accounting/components/CashTransaction/CashTransactionList';
import ServiceExpenses from '../../../../../accounting/pages/Kassa/ServiceExpenses';
import DriverSalary from '../../../../../accounting/pages/DriverSalary';

interface FinanceTabsProps {
  activeTab: string;
  onTabChange: (key: string) => void;
  dashboardStats: DashboardStats;
  cashboxTotal?: number;
}

const FinanceTabs: React.FC<FinanceTabsProps> = ({ 
  activeTab, 
  onTabChange, 
  dashboardStats,
  cashboxTotal = 0 
}) => {
  const tabItems = [
    {
      key: 'overview',
      label: (
        <Badge count={Math.round(cashboxTotal) || 0} overflowCount={999999999999}>
          <span>Umumiy ko&apos;rinish</span>
        </Badge>
      ),
      icon: <DollarCircleOutlined />,
      children: (
        <Overview 
          fallbackData={{
            totalInUZS: dashboardStats.totalInUZS,
            totalExpenses: dashboardStats.yearlyExpenses,
            finalBalance: dashboardStats.totalInUZS - dashboardStats.yearlyExpenses,
            cashPayments: dashboardStats.cashPayments,
            bankPayments: dashboardStats.bankPayments
          }} 
        />
      )
    },
    {
      key: 'clients',
      label: 'Qarzdorlar',
      icon: <UserOutlined />,
      children: <ClientAccounts />
    },
    {
      key: 'rays',
      label: 'Reyslar bo\'yicha to\'lovlar',
      icon: <CarOutlined />,
      children: <RaysTulovlar />
    },
    {
      key: 'drivers',
      label: 'Haydovchilardagi pullar',
      icon: <WalletOutlined />,
      children: <DriverPayments />
    },
    {
      key: 'driver-salary',
      label: 'Haydovchilar maoshi',
      icon: <DollarCircleOutlined />,
      children: <DriverSalary />
    },
    {
      key: 'transactions',
      label: 'Operatsiyalar tarixi',
      icon: <HistoryOutlined />,
      children: <CashTransactionList />
    },
    {
      key: 'service-expenses',
      label: 'Xizmat xarajatlari',
      icon: <ToolOutlined />,
      children: <ServiceExpenses />
    },

  ];

  const safeActiveKey = tabItems.some(item => item.key === activeTab) ? activeTab : 'overview';

  return (
    <Card className="main-card" style={{ marginTop: 24 }}>
      <Tabs
        activeKey={safeActiveKey}
        onChange={onTabChange}
        items={tabItems.map(item => ({
          key: item.key,
          label: (
            <span>
              {item.icon} {item.label}
            </span>
          ),
          children: item.children
        }))}
        type="card"
        size="large"
        className="custom-tabs"
      />
    </Card>
  );
};

export default FinanceTabs;