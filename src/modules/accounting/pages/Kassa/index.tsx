'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, Card, Typography, Row, Col, Spin, Badge, Alert, Divider, Button, Space, Tooltip, message, Empty } from 'antd';
import {
  DollarOutlined,
  UserOutlined,
  CarOutlined,
  WalletOutlined,
  HistoryOutlined,
  BankOutlined,
  LineChartOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useCash } from '../../hooks/useCash';
import { useFinancialData } from '../../../ceo/pages/Dashboard/hooks/useFinancial';
import Overview from './Overview';
import ClientAccounts from './ClientAccounts';
import DriverPayments from './DriverPayments';
import RaysTulovlar from './RaysTulovlar';
import CashTransactionList from '../../components/CashTransaction/CashTransactionList';
import './styles.css';

const { Title, Text } = Typography;

const KassaPage: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Pass messageApi to useCash hook for React 19 compatibility
  const { loading, isLoading, fetchCashOverview } = useCash(messageApi);

  // Use CEO's robust financial calculator which processes actual DB records instead of relying on the broken /overview/ API
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(end.getMonth() - 12);
    return {
      startDate: start,
      endDate: end,
      type: 'custom',
    };
  }, []);

  const { financialOverview, totalRevenue, isLoading: isLoadingFinancial } = useFinancialData(dateRange as any);
  
  useEffect(() => {
    fetchCashOverview();
  }, []);

  const handleRefresh = () => {
    fetchCashOverview();
    setLastUpdated(new Date());
    messageApi.success('Ma\'lumotlar yangilandi');
  };

  const overviewFallbackData = {
    totalInUZS: financialOverview?.cashbox?.total_in_uzs || financialOverview?.cashbox?.UZS || totalRevenue || 0,
    totalExpenses: financialOverview?.expenses?.total_expenses_uzs || ((financialOverview?.expenses?.dp_price_uzs || 0) + (financialOverview?.expenses?.salaries_uzs || 0)) || 0,
    finalBalance: financialOverview?.final_balance_uzs || ( (financialOverview?.cashbox?.total_in_uzs || financialOverview?.cashbox?.UZS || totalRevenue || 0) - (financialOverview?.expenses?.total_expenses_uzs || ((financialOverview?.expenses?.dp_price_uzs || 0) + (financialOverview?.expenses?.salaries_uzs || 0))) ),
    serviceExpenses: financialOverview?.expenses?.dp_price_uzs || 0,
    salariesExpenses: financialOverview?.expenses?.salaries_uzs || 0,
  };

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>Umumiy ko`rinish</span>
      ),
      icon: <DollarOutlined />,
      children: <Overview fallbackData={overviewFallbackData} />
    },
    {
      key: 'clients',
      label: 'Qarzdorlar',
      icon: <UserOutlined />,
      children: <ClientAccounts />
    },
    {
      key: 'rays',
      label: 'Reyslar boyicha to`lovlar',
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
      key: 'transactions',
      label: 'Operatsiyalar tarixi',
      icon: <HistoryOutlined />,
      children: <CashTransactionList />
    }
  ];

  if (isLoading || loading || isLoadingFinancial) {
    return (
      <div className="loading-container" style={{ textAlign: 'center', padding: '50px 0' }}>
        {contextHolder}
        <div className="spin-content" style={{
          padding: '30px',
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          borderRadius: '4px',
          height: 200,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Spin size="large" />
          <div style={{ marginTop: '15px' }}>Ma'lumotlar yuklanmoqda...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="kassa-page">
      {contextHolder}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <Title level={4}>
            <BankOutlined /> Kassa boshqaruvi
          </Title>
          <Text type="secondary">
            Kompaniya moliyaviy holati va hisobotlari
          </Text>
        </div>
        <div className="dashboard-actions">
          <Space>
            <Tooltip title="Yangilash">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
              >
                Yangilash
              </Button>
            </Tooltip>
          </Space>
        </div>
      </div>

      {financialOverview?.final_balance_uzs < 0 && (
        <Alert
          message="Diqqat! Moliyaviy holat salbiy!"
          description="Hozirgi vaqtda kassada mablag' yetarli emas. Iltimos, balansni tekshiring."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 5 Indikator bitta qatorda */}
      <Row gutter={[16, 16]} className="dashboard-stats-row five-col-grid">
        {/* Sanitization Logic Helper */}
        {(() => {
          // Use totalRevenue as the primary source for income if cashbox API is empty
          const totalIn = financialOverview?.cashbox?.total_in_uzs || financialOverview?.cashbox?.UZS || totalRevenue || 0;
          
          // Service expenses should include trip costs and potentially other outgoings
          const serviceExp = financialOverview?.expenses?.dp_price_uzs || 0;
          const salariesExp = financialOverview?.expenses?.salaries_uzs || 0;
          const sanitizedTotalExp = financialOverview?.expenses?.total_expenses_uzs || (serviceExp + salariesExp) || 0;
          const sanitizedBalance = financialOverview?.final_balance_uzs || (totalIn - sanitizedTotalExp);

          return (
            <>
              {/* 2. Jami Kirim (Total In) */}
              <Col xs={24} sm={12} md={12} lg={6} className="four-col-item">
                <Card className="summary-card total-card" hoverable variant="borderless" style={{ height: '100%', margin: 0 }}>
                  <div className="summary-card-title">Jami kirim</div>
                  <div className="summary-card-value" style={{ fontSize: '20px' }}>
                    {totalIn.toLocaleString()} so'm
                  </div>
                  <LineChartOutlined className="summary-card-icon" />
                </Card>
              </Col>

              {/* 3. Xizmat xarajatlari (Service Expenses) */}
              <Col xs={24} sm={12} md={12} lg={6} className="four-col-item">
                <Card className="summary-card expenses-card" hoverable variant="borderless" style={{ height: '100%', margin: 0 }}>
                  <div className="summary-card-title">Xizmat xarajatlari</div>
                  <div className="summary-card-value" style={{ fontSize: '20px', color: '#fa8c16' }}>
                    {serviceExp.toLocaleString()} so'm
                  </div>
                  <WalletOutlined className="summary-card-icon" />
                </Card>
              </Col>

              {/* 4. Maoshlar (Salaries) */}
              <Col xs={24} sm={12} md={12} lg={6} className="four-col-item">
                <Card className="summary-card salaries-card" hoverable variant="borderless" style={{ height: '100%', margin: 0, borderTop: '4px solid #722ed1' }}>
                  <div className="summary-card-title">Maoshlar</div>
                  <div className="summary-card-value" style={{ fontSize: '20px', color: '#722ed1' }}>
                    {salariesExp.toLocaleString()} so'm
                  </div>
                  <UserOutlined className="summary-card-icon" />
                </Card>
              </Col>

              {/* 5. Balans (Sanitized) */}
              <Col xs={24} sm={12} md={12} lg={6} className="four-col-item">
                <Card
                  className="summary-card balance-card"
                  hoverable
                  variant="borderless"
                  style={{
                    height: '100%',
                    margin: 0,
                    borderTop: sanitizedBalance >= 0 ? '4px solid #52c41a' : '4px solid #f5222d'
                  }}
                >
                  <div className="summary-card-title">Qolgan balans</div>
                  <div
                    className="summary-card-value"
                    style={{
                      fontSize: '20px',
                      color: sanitizedBalance >= 0 ? '#52c41a' : '#f5222d'
                    }}
                  >
                    {sanitizedBalance.toLocaleString()} so'm
                  </div>
                </Card>
              </Col>
            </>
          );
        })()}
      </Row>

      <Card className="main-card" style={{ marginTop: 24 }} variant="borderless">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
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
          tabBarExtraContent={
            <Text type="secondary" className="non-printable">
              So`nggi yangilanish: {lastUpdated.toLocaleTimeString()}
            </Text>
          }
        />
      </Card>

      <div className="dashboard-footer">
        <Divider />
        <Row justify="space-between" align="middle">
          <Col>
            <Text type="secondary">© {new Date().getFullYear()} RBL LOGISTCS | Kassa boshqaruv tizimi</Text>
          </Col>
          <Col>
            <Text type="secondary">
              Ma`lumotlar vaqti: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </Text>
          </Col>
        </Row>
      </div>
    </div>
  );
};
export default KassaPage;