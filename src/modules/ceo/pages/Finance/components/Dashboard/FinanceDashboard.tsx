import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { RiseOutlined, FallOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { DashboardStats } from '../../hooks/useFinanceData';
import { formatCurrency } from '@/utils/formatCurrency';

interface FinanceDashboardProps {
  dashboardStats: DashboardStats;
}

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ dashboardStats }) => {
  return (
    <div className="dashboard-content">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Oylik daromad"
              value={dashboardStats.monthlyRevenue}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#3f8600' }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Oylik xarajatlar"
              value={dashboardStats.monthlyExpenses}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#cf1322' }}
              prefix={<FallOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Yillik daromad"
              value={dashboardStats.yearlyRevenue}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#3f8600' }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Yillik xarajatlar"
              value={dashboardStats.yearlyExpenses}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#cf1322' }}
              prefix={<FallOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12} lg={8}>
          <Card className="stat-card">
            <Statistic
              title="Foyda marjasi"
              value={dashboardStats.profitMargin}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card className="stat-card">
            <Statistic
              title="Jami mijozlar"
              value={dashboardStats.totalClients}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <span style={{ color: '#cf1322' }}>
                {dashboardStats.clientsWithDebt} ta qarzdor mijoz
              </span>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card className="stat-card">
            <Statistic
              title="Jami haydovchilar"
              value={dashboardStats.totalDrivers}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <span style={{ color: '#3f8600' }}>
                {dashboardStats.activeDrivers} ta faol haydovchi
              </span>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FinanceDashboard;