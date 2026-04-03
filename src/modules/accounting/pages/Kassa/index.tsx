'use client';
import React, { useState, useEffect } from 'react';
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
  const { cashOverview, loading, isLoading, fetchCashOverview } = useCash(messageApi);
  
  useEffect(() => {
    fetchCashOverview();
  }, []);

  const handleRefresh = () => {
    fetchCashOverview();
    setLastUpdated(new Date());
    messageApi.success('Ma\'lumotlar yangilandi');
  };



  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>Umumiy ko`rinish</span>
      ),
      icon: <DollarOutlined />,
      children: <Overview />
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

  if (isLoading || loading) {
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

      {cashOverview?.final_balance_usd < 0 && (
        <Alert
          message="Diqqat! Moliyaviy holat salbiy!"
          description="Hozirgi vaqtda kassada mablag' yetarli emas. Iltimos, balansni tekshiring."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 5 Indikator bitta qatorda */}
      <Row gutter={[16, 16]} className="dashboard-stats-row">
        {/* Sanitization Logic Helper */}
        {(() => {
          const totalIn = cashOverview?.cashbox?.total_in_uzs || cashOverview?.cashbox?.UZS || (cashOverview?.cashbox?.total_in_usd || 0) * 12800;
          
          const serviceExp = cashOverview?.expenses?.dp_price_uzs || (cashOverview?.expenses?.dp_price_usd || 0) * 12800;
          const salariesExp = cashOverview?.expenses?.salaries_uzs || (cashOverview?.expenses?.salaries_usd || 0) * 12800;
          const sanitizedTotalExp = cashOverview?.expenses?.total_expenses_uzs || (cashOverview?.expenses?.total_expenses_usd || 0) * 12800 || (serviceExp + salariesExp) || 0;
          const sanitizedBalance = cashOverview?.final_balance_uzs || (cashOverview?.final_balance_usd || 0) * 12800;

          return (
            <>
              {/* 1. Kassadagi naqd UZS */}
              <Col xs={24} sm={12} md={8} lg={4} style={{ flex: '1 0 20%', maxWidth: '100%' }}>
                <Card className="currency-card uzs-card" hoverable variant="borderless" style={{ height: '100%', margin: 0 }}>
                  <div className="currency-card-header">
                    <span className="currency-icon">so'm</span>
                    <div className="currency-title">UZS (Kassada)</div>
                  </div>
                  <div className="currency-amount" style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {cashOverview?.cashbox?.UZS?.toLocaleString() || 0}
                  </div>
                </Card>
              </Col>

              {/* 2. Jami Kirim (Total In) */}
              <Col xs={24} sm={12} md={8} lg={4} style={{ flex: '1 0 20%', maxWidth: '100%' }}>
                <Card className="summary-card total-card" hoverable variant="borderless" style={{ height: '100%', margin: 0 }}>
                  <div className="summary-card-title">Jami kirim</div>
                  <div className="summary-card-value" style={{ fontSize: '20px' }}>
                    {totalIn.toLocaleString()} so'm
                  </div>
                  <LineChartOutlined className="summary-card-icon" />
                </Card>
              </Col>

              {/* 3. Xizmat xarajatlari (Service Expenses) */}
              <Col xs={24} sm={12} md={8} lg={4} style={{ flex: '1 0 20%', maxWidth: '100%' }}>
                <Card className="summary-card expenses-card" hoverable variant="borderless" style={{ height: '100%', margin: 0 }}>
                  <div className="summary-card-title">Xizmat xarajatlari</div>
                  <div className="summary-card-value" style={{ fontSize: '20px', color: '#fa8c16' }}>
                    {serviceExp.toLocaleString()} so'm
                  </div>
                  <WalletOutlined className="summary-card-icon" />
                </Card>
              </Col>

              {/* 4. Maoshlar (Salaries) */}
              <Col xs={24} sm={12} md={8} lg={4} style={{ flex: '1 0 20%', maxWidth: '100%' }}>
                <Card className="summary-card salaries-card" hoverable variant="borderless" style={{ height: '100%', margin: 0, borderTop: '4px solid #722ed1' }}>
                  <div className="summary-card-title">Maoshlar</div>
                  <div className="summary-card-value" style={{ fontSize: '20px', color: '#722ed1' }}>
                    {salariesExp.toLocaleString()} so'm
                  </div>
                  <UserOutlined className="summary-card-icon" />
                </Card>
              </Col>

              {/* 5. Balans (Sanitized) */}
              <Col xs={24} sm={12} md={8} lg={4} style={{ flex: '1 0 20%', maxWidth: '100%' }}>
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