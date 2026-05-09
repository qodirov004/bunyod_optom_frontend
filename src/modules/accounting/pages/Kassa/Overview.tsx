import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, Spin, Alert, Button, Tooltip } from 'antd';
import { 
  SyncOutlined, 
  WalletOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  BankOutlined,
  CarOutlined,
  DollarOutlined,
  ToolOutlined,
  TeamOutlined,
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
    serviceExpenses?: number;
    salariesExpenses?: number;
    cashPayments?: number;
    bankPayments?: number;
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

  // Use UZS values directly or fallback to provided fallbackData
  const totalInUZS = overview?.cashbox?.total_in_uzs || 
                     overview?.cashbox?.UZS || 
                     fallbackData?.totalInUZS || 0;
  
  const dpPayments = overview?.expenses?.dp_price_uzs || fallbackData?.serviceExpenses || 0;
  const salariesExp = overview?.expenses?.salaries_uzs || fallbackData?.salariesExpenses || 0;
  
  const driverExp = overview?.expenses?.driver_expenses_uzs || 0;
  const cashPayments = overview?.cashbox?.naqd_uzs || fallbackData?.cashPayments || 0;
  const bankPayments = overview?.cashbox?.bank_uzs || fallbackData?.bankPayments || 0;
  const driverReturned = overview?.cashbox?.driver_returned_uzs || 0;

  // Total expenses in UZS
  const totalExpenses = overview?.expenses?.total_expenses_uzs || 
                        fallbackData?.totalExpenses || 
                        (dpPayments + salariesExp);

  // Final Balance in UZS
  const finalBalance = overview?.final_balance_uzs || 
                       (totalInUZS - totalExpenses) || 
                       fallbackData?.finalBalance || 0;
  
  const expenseRatio = Math.min(Math.round((totalExpenses / (totalInUZS + 0.01)) * 100), 100);

  return (
    <div className="ov-root">
      {/* Header */}
      <div className="ov-header">
        <div>
          <Title level={3} className="ov-title">Kassa holati</Title>
          <Text type="secondary">Kassadagi mablag'lar va xarajatlar (joriy oy uchun)</Text>
        </div>
        <Tooltip title="Ma'lumotlarni yangilash">
          <Button 
            type="primary" 
            onClick={fetchOverview} 
            icon={<SyncOutlined spin={loading} />}
            className="ov-refresh-btn"
          >
            Yangilash
          </Button>
        </Tooltip>
      </div>

      <Row gutter={[16, 16]} className="ov-detail-row">
        {/* Jami mablag' */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <div className="ov-detail-card ov-dc-income">
            <div className="ov-dc-icon-wrap ov-dc-icon-income">
              <WalletOutlined />
            </div>
            <div className="ov-dc-body">
              <div className="ov-dc-label">Jami mablag'</div>
              <div className="ov-dc-amount">{formatCurrency(totalInUZS)}</div>
              <div className="ov-dc-sub"><ArrowUpOutlined /> Barcha kirimlar</div>
            </div>
          </div>
        </Col>

        {/* Naqd pul */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <div className="ov-detail-card ov-dc-cash">
            <div className="ov-dc-icon-wrap ov-dc-icon-cash">
              <DollarOutlined />
            </div>
            <div className="ov-dc-body">
              <div className="ov-dc-label">Naqd pul o'tkazmasi</div>
              <div className="ov-dc-amount">{formatCurrency(cashPayments)}</div>
            </div>
          </div>
        </Col>

        {/* Bank */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <div className="ov-detail-card ov-dc-bank">
            <div className="ov-dc-icon-wrap ov-dc-icon-bank">
              <BankOutlined />
            </div>
            <div className="ov-dc-body">
              <div className="ov-dc-label">Bank o'tkazmasi</div>
              <div className="ov-dc-amount">{formatCurrency(bankPayments)}</div>
            </div>
          </div>
        </Col>

        {/* Jami xarajatlar */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <div className="ov-detail-card ov-dc-expense">
            <div className="ov-dc-icon-wrap ov-dc-icon-expense">
              <ArrowDownOutlined />
            </div>
            <div className="ov-dc-body">
              <div className="ov-dc-label">Jami xarajatlar</div>
              <div className="ov-dc-amount">{formatCurrency(totalExpenses)}</div>
              <div className="ov-dc-sub"><ArrowDownOutlined /> {expenseRatio}% xarajat</div>
            </div>
          </div>
        </Col>

        {/* Service */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <div className="ov-detail-card ov-dc-service">
            <div className="ov-dc-icon-wrap ov-dc-icon-service">
              <ToolOutlined />
            </div>
            <div className="ov-dc-body">
              <div className="ov-dc-label">Service xarajatlari</div>
              <div className="ov-dc-amount">{formatCurrency(dpPayments)}</div>
              <div className="ov-dc-sub">Texnik xarajatlar</div>
            </div>
          </div>
        </Col>

        {/* Maosh */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <div className="ov-detail-card ov-dc-salary">
            <div className="ov-dc-icon-wrap ov-dc-icon-salary">
              <TeamOutlined />
            </div>
            <div className="ov-dc-body">
              <div className="ov-dc-label">Ish haqi (Maosh)</div>
              <div className="ov-dc-amount">{formatCurrency(salariesExp)}</div>
            </div>
          </div>
        </Col>

        {/* Haydovchi xarajatlari */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <div className="ov-detail-card ov-dc-driver-exp">
            <div className="ov-dc-icon-wrap ov-dc-icon-driver-exp">
              <CarOutlined />
            </div>
            <div className="ov-dc-body">
              <div className="ov-dc-label">Haydovchi xarajatlari</div>
              <div className="ov-dc-amount">{formatCurrency(driverExp)}</div>
              <div className="ov-dc-sub">Yo'l xarajatlari</div>
            </div>
          </div>
        </Col>

        {/* Qolgan balans */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <div className={`ov-detail-card ${finalBalance >= 0 ? 'ov-dc-balance-pos' : 'ov-dc-balance-neg'}`}>
            <div className={`ov-dc-icon-wrap ${finalBalance >= 0 ? 'ov-dc-icon-pos' : 'ov-dc-icon-neg'}`}>
              {finalBalance >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            </div>
            <div className="ov-dc-body">
              <div className="ov-dc-label">Qolgan balans</div>
              <div className="ov-dc-amount">{formatCurrency(finalBalance)}</div>
              <div className="ov-dc-sub">Hozirgi qoldiq</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* To'lovlar tahlili */}
      <div className="ov-section-title" style={{ marginTop: 28 }}>To'lovlar tahlili (so'm)</div>

      <div className="ov-analysis-card">
        {/* Jami mablag */}
        <div className="ov-bar-row">
          <div className="ov-bar-label">Jami mablag'</div>
          <div className="ov-bar-value">{formatCurrency(totalInUZS)}</div>
        </div>
        <div className="ov-bar-track">
          <div className="ov-bar-fill ov-bar-green" style={{ width: '100%' }} />
        </div>

        {/* Naqd */}
        <div className="ov-bar-row">
          <div className="ov-bar-label">Naqd pul o'tkazmalari</div>
          <div className="ov-bar-value">{formatCurrency(cashPayments)}</div>
        </div>
        <div className="ov-bar-track">
          <div className="ov-bar-fill ov-bar-blue" style={{ width: `${Math.round((cashPayments / (totalInUZS + 0.01)) * 100)}%` }} />
        </div>

        {/* Bank */}
        <div className="ov-bar-row">
          <div className="ov-bar-label">Bank o'tkazmalari</div>
          <div className="ov-bar-value">{formatCurrency(bankPayments)}</div>
        </div>
        <div className="ov-bar-track">
          <div className="ov-bar-fill ov-bar-indigo" style={{ width: `${Math.round((bankPayments / (totalInUZS + 0.01)) * 100)}%` }} />
        </div>

        {/* Haydovchidan qaytgan */}
        {driverReturned > 0 && (
          <>
            <div className="ov-bar-row">
              <div className="ov-bar-label">
                <CarOutlined style={{ marginRight: 6, color: '#13c2c2' }} />
                Haydovchidan qaytgan pul
              </div>
              <div className="ov-bar-value ov-bar-value-teal">{formatCurrency(driverReturned)}</div>
            </div>
            <div className="ov-bar-track">
              <div className="ov-bar-fill ov-bar-teal" style={{ width: `${Math.round((driverReturned / (totalInUZS + 0.01)) * 100)}%` }} />
            </div>
          </>
        )}

        <div className="ov-bar-divider" />

        {/* Xarajatlar */}
        <div className="ov-bar-row">
          <div className="ov-bar-label">Jami xarajatlar</div>
          <div className="ov-bar-value ov-bar-value-red">{formatCurrency(totalExpenses)}</div>
        </div>
        <div className="ov-bar-track">
          <div className="ov-bar-fill ov-bar-red" style={{ width: `${expenseRatio}%` }} />
        </div>

        {/* Service */}
        <div className="ov-bar-row">
          <div className="ov-bar-label">Service xarajatlari</div>
          <div className="ov-bar-value">{formatCurrency(dpPayments)}</div>
        </div>
        <div className="ov-bar-track">
          <div className="ov-bar-fill ov-bar-blue" style={{ width: `${Math.round((dpPayments / (totalExpenses + 0.01)) * 100)}%` }} />
        </div>

        {/* Maosh */}
        <div className="ov-bar-row">
          <div className="ov-bar-label">Haydovchi oylik maoshlari</div>
          <div className="ov-bar-value">{formatCurrency(salariesExp)}</div>
        </div>
        <div className="ov-bar-track">
          <div className="ov-bar-fill ov-bar-purple" style={{ width: `${Math.round((salariesExp / (totalExpenses + 0.01)) * 100)}%` }} />
        </div>

        {/* Driver exp */}
        <div className="ov-bar-row">
          <div className="ov-bar-label">Haydovchi xarajatlari</div>
          <div className="ov-bar-value">{formatCurrency(driverExp)}</div>
        </div>
        <div className="ov-bar-track">
          <div className="ov-bar-fill ov-bar-amber" style={{ width: `${Math.round((driverExp / (totalExpenses + 0.01)) * 100)}%` }} />
        </div>

        {/* Qoldiq */}
        <div className="ov-bar-result">
          <div className="ov-bar-row">
            <div className="ov-bar-label" style={{ fontWeight: 600 }}>Qolgan balans</div>
            <div className={`ov-bar-value ${finalBalance >= 0 ? 'ov-bar-value-green' : 'ov-bar-value-red'}`} style={{ fontWeight: 700 }}>
              {formatCurrency(finalBalance)}
            </div>
          </div>
          <div className="ov-bar-track">
            <div 
              className={`ov-bar-fill ${finalBalance >= 0 ? 'ov-bar-green' : 'ov-bar-red'}`}
              style={{ width: `${Math.round((Math.abs(finalBalance) / (totalInUZS + 0.01)) * 100)}%` }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;