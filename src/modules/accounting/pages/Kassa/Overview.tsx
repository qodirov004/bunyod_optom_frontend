import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Progress, Spin, Alert, Button, Space } from 'antd';
import { 
  SyncOutlined, 
  DollarOutlined, 
  WalletOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';
import { cashApi } from '../../api/cash/cashApi';
import { CashOverview as ICashOverview } from '../../types/cash.types';
import { formatCurrency } from '@/utils/formatCurrency';
import './styles-clean.css';

const { Title, Text } = Typography;

interface OverviewProps {
  fallbackData?: {
    totalInUZS?: number;
    totalExpenses?: number;
    finalBalance?: number;
  };
}

const Overview: React.FC<OverviewProps> = ({ fallbackData }) => {
  const [overview, setOverview] = useState<ICashOverview | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const data = await cashApi.getCashOverview();
      setOverview(data);
    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <div className="loading-text">Ma`lumotlar yuklanmoqda...</div>
      </div>
    );
  }

  if (!overview) {
    return (
      <Alert
        type="info"
        message="Ma'lumotlar mavjud emas"
        description="Kassa ma'lumotlari yuklanmadi. Qaytadan urinib ko'ring."
        action={
          <Button type="primary" onClick={fetchOverview} icon={<SyncOutlined />}>
            Qayta yuklash
          </Button>
        }
      />
    );
  }

  // Use UZS values directly or fallback to USD conversion or provided fallbackData
  const totalInUZS = overview?.cashbox?.total_in_uzs || 
                     overview?.cashbox?.UZS || 
                     (overview?.cashbox?.total_in_usd ? overview.cashbox.total_in_usd * 12800 : 0) || 
                     fallbackData?.totalInUZS || 0;
  
  const dpPayments = overview?.expenses?.dp_price_uzs || (overview?.expenses?.dp_price_usd || 0) * 12800;
  const salariesExp = overview?.expenses?.salaries_uzs || (overview?.expenses?.salaries_usd || 0) * 12800;
  
  // Total expenses in UZS
  const totalExpenses = overview?.expenses?.total_expenses_uzs || 
                        (overview?.expenses?.total_expenses_usd ? overview.expenses.total_expenses_usd * 12800 : 0) || 
                        fallbackData?.totalExpenses || 
                        (dpPayments + salariesExp);

  const finalBalance = fallbackData?.finalBalance ?? (totalInUZS - totalExpenses);
  
  const expenseRatio = Math.min(Math.round((totalExpenses / (totalInUZS + 0.01)) * 100), 100);

  return (
    <div className="overview-container">
      <div className="page-header">
        <div>
          <Title level={3}>Kassa holati</Title>
          <Text type="secondary">
            Kassadagi mablag`lar va xarajatlar to`g`risida umumiy ma`lumot
          </Text>
        </div>
        <Button 
          type="primary" 
          onClick={fetchOverview} 
          icon={<SyncOutlined />}
        >
          Yangilash
        </Button>
      </div>

      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} md={8} lg={4} style={{ flex: '1 0 20%', maxWidth: '100%' }}>
          <div className="stat-box income-box" style={{ height: '100%' }}>
            <div className="stat-icon">
              <DollarOutlined />
            </div>
            <div className="stat-content">
              <div className="stat-title">Jami mablag'</div>
              <div className="stat-value" style={{ fontSize: '18px' }}>{formatCurrency(totalInUZS)}</div>
              <div className="stat-description">
                <ArrowUpOutlined /> Barcha kirimlar
              </div>
            </div>
          </div>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={4} style={{ flex: '1 0 20%', maxWidth: '100%' }}>
          <div className="stat-box expense-box" style={{ height: '100%' }}>
            <div className="stat-icon">
              <ArrowDownOutlined />
            </div>
            <div className="stat-content">
              <div className="stat-title">Jami xarajatlar</div>
              <div className="stat-value" style={{ fontSize: '18px' }}>{formatCurrency(totalExpenses)}</div>
              <div className="stat-description">
                <ArrowDownOutlined /> {expenseRatio}% xarajat
              </div>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} md={8} lg={4} style={{ flex: '1 0 20%', maxWidth: '100%' }}>
          <div className="stat-box service-box" style={{ height: '100%' }}>
            <div className="stat-icon">
              <WalletOutlined />
            </div>
            <div className="stat-content">
              <div className="stat-title">Service xarajatlari</div>
              <div className="stat-value" style={{ fontSize: '18px' }}>{formatCurrency(dpPayments)}</div>
              <div className="stat-description">
                Texnik xarajatlar
              </div>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={12} md={8} lg={4} style={{ flex: '1 0 20%', maxWidth: '100%' }}>
          <div className="stat-box salaries-box" style={{ 
            height: '100%', 
            borderLeft: '4px solid #722ed1', 
            background: 'linear-gradient(135deg, #f9f0ff, #ffffff)', 
            padding: '20px', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <div className="stat-icon" style={{ 
              background: 'rgba(114, 46, 209, 0.1)', 
              color: '#722ed1', 
              width: '48px', 
              height: '48px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '20px', 
              marginRight: '16px' 
            }}>
              <WalletOutlined />
            </div>
            <div className="stat-content">
              <div className="stat-title" style={{ color: 'rgba(0,0,0,0.45)', fontSize: '14px' }}>Ish haqi (Maosh)</div>
              <div className="stat-value" style={{ fontSize: '18px', fontWeight: 'bold', color: '#722ed1' }}>{formatCurrency(salariesExp)}</div>
            </div>
          </div>
        </Col>
        
        <Col xs={24} sm={12} md={8} lg={4} style={{ flex: '1 0 20%', maxWidth: '100%' }}>
          <div className={`stat-box ${finalBalance >= 0 ? 'balance-positive-box' : 'balance-negative-box'}`} style={{ height: '100%' }}>
            <div className="stat-icon">
              {finalBalance >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            </div>
            <div className="stat-content">
              <div className="stat-title">Qolgan balans</div>
              <div className="stat-value" style={{ fontSize: '18px' }}>{formatCurrency(finalBalance)}</div>
              <div className="stat-description">
                Hozirgi qoldiq
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <div className="section-container">
        <div className="section-header">
           To&apos;lovlar tahlili (so&apos;m)
        </div>
        
        <Card variant="borderless" className="analysis-card">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div className="analysis-item">
              <div className="analysis-header">
                <span>Jami mablag&apos;</span>
                <span className="analysis-value">{formatCurrency(totalInUZS)}</span>
              </div>
              <Progress percent={100} strokeColor="#52c41a" showInfo={false} />
            </div>
            
            <div className="analysis-item">
              <div className="analysis-header">
                <span>Jami xarajatlar</span>
                <span className="analysis-value">{formatCurrency(totalExpenses)}</span>
              </div>
              <Progress percent={expenseRatio} strokeColor="#ff4d4f" showInfo={false} />
            </div>
            
            <div className="analysis-item">
              <div className="analysis-header">
                <span>Service xarajatlari</span>
                <span className="analysis-value">{formatCurrency(dpPayments)}</span>
              </div>
              <Progress 
                percent={Math.round((dpPayments / (totalExpenses + 0.01)) * 100)} 
                strokeColor="#1890ff" 
                showInfo={false} 
              />
            </div>
            
            <div className="analysis-item">
              <div className="analysis-header">
                <span>Haydovchi oylik maoshlari</span>
                <span className="analysis-value">{formatCurrency(salariesExp)}</span>
              </div>
              <Progress 
                percent={Math.round((salariesExp / (totalExpenses + 0.01)) * 100)} 
                strokeColor="#722ed1" 
                showInfo={false} 
              />
            </div>
            
            <div className="analysis-item result-item">
              <div className="analysis-header">
                <span>Qolgan balans</span>
                <span className={`analysis-value ${finalBalance >= 0 ? 'positive-value' : 'negative-value'}`}>
                  {formatCurrency(finalBalance)}
                </span>
              </div>
              <Progress 
                percent={Math.round((Math.abs(finalBalance) / (totalInUZS + 0.01)) * 100)} 
                strokeColor={finalBalance >= 0 ? "#52c41a" : "#ff4d4f"} 
                showInfo={false} 
              />
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default Overview;