import React from 'react';
import { Row, Col, Card } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import { formatCurrency } from '@/utils/formatCurrency';

interface CashOverview {
  cashbox?: {
    total_in_usd?: number;
    total_in_uzs?: number;
  };
  expenses?: {
    total_expenses_usd?: number;
    total_expenses_uzs?: number;
    dp_price_usd?: number;
    dp_price_uzs?: number;
    salaries_usd?: number;
    salaries_uzs?: number;
  };
  final_balance_usd?: number;
  final_balance_uzs?: number;
}

interface SummaryCardsProps {
  cashOverview: CashOverview | null;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ cashOverview }) => {
  return (
    <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
      <Col xs={24} sm={12} md={8}>
        <Card className="summary-card total-card" hoverable>
          <div className="summary-card-title">Jami kassa</div>
          <div className="summary-card-value">
            {formatCurrency(cashOverview?.cashbox?.total_in_uzs || (cashOverview?.cashbox?.total_in_usd * 12800) || 0)}
          </div>
          <LineChartOutlined className="summary-card-icon" />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card className="summary-card expenses-card" hoverable>
          <div className="summary-card-title">Jami xarajatlar</div>
          <div className="summary-card-value">
            {formatCurrency(cashOverview?.expenses?.total_expenses_uzs || (cashOverview?.expenses?.total_expenses_usd * 12800) || 0)}
          </div>
          <div className="summary-card-subtitle">
            <span>Service: {formatCurrency(cashOverview?.expenses?.dp_price_uzs || (cashOverview?.expenses?.dp_price_usd * 12800) || 0)}</span> |
            <span> Maosh: {formatCurrency(cashOverview?.expenses?.salaries_uzs || (cashOverview?.expenses?.salaries_usd * 12800) || 0)}</span>
          </div>
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={8}>
        <Card
          className="summary-card balance-card"
          hoverable
          style={{
            borderTop: cashOverview?.final_balance_usd && cashOverview.final_balance_usd >= 0 
              ? '4px solid #52c41a' 
              : '4px solid #f5222d'
          }}
        >
          <div className="summary-card-title">Qolgan balans</div>
          <div
            className="summary-card-value"
            style={{
              color: (cashOverview?.final_balance_uzs || cashOverview?.final_balance_usd) && (cashOverview?.final_balance_uzs || cashOverview?.final_balance_usd) >= 0 
                ? '#52c41a' 
                : '#f5222d'
            }}
          >
            {formatCurrency(cashOverview?.final_balance_uzs || (cashOverview?.final_balance_usd * 12800) || 0)}
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default SummaryCards; 