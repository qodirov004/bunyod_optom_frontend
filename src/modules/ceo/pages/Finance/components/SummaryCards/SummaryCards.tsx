import React from 'react';
import { Row, Col, Card } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import { formatCurrency } from '@/utils/formatCurrency';
import { DashboardStats } from '../../hooks/useFinanceData';

interface CashOverview {
  cashbox?: {
    total_in_usd?: number;
    total_in_uzs?: number;
    UZS?: number;
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
  dashboardStats?: DashboardStats;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ cashOverview, dashboardStats }) => {
  // Use real UZS values from cashbox or convert USD to UZS, or use greedy dashboardStats fallback
  const cashboxTotal = cashOverview?.cashbox?.total_in_uzs || 
                       cashOverview?.cashbox?.UZS || 
                       (cashOverview?.cashbox?.total_in_usd ? cashOverview.cashbox.total_in_usd * 12800 : 0) || 
                       dashboardStats?.totalInUZS || 0;
  
  // Use real UZS values from expenses or convert USD to UZS, or use greedy dashboardStats fallback
  const totalExpenses = cashOverview?.expenses?.total_expenses_uzs || 
                        (cashOverview?.expenses?.total_expenses_usd ? cashOverview.expenses.total_expenses_usd * 12800 : 0) || 
                        dashboardStats?.yearlyExpenses || 0;
                        
  const serviceXarajat = cashOverview?.expenses?.dp_price_uzs || 
                         (cashOverview?.expenses?.dp_price_usd ? cashOverview.expenses.dp_price_usd * 12800 : 0) || 0;
                         
  const maoshXarajat = cashOverview?.expenses?.salaries_uzs || 
                       (cashOverview?.expenses?.salaries_usd ? cashOverview.expenses.salaries_usd * 12800 : 0) || 0;
  
  // Final Balance in UZS
  const finalBalance = cashOverview?.final_balance_uzs || 
                       (cashOverview?.final_balance_usd ? cashOverview.final_balance_usd * 12800 : 0) || 
                       (cashboxTotal - totalExpenses);

  return (
    <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
      <Col xs={24} sm={12} md={8}>
        <Card className="summary-card total-card" hoverable>
          <div className="summary-card-title">Jami kassa</div>
          <div className="summary-card-value">
            {formatCurrency(cashboxTotal)}
          </div>
          <LineChartOutlined className="summary-card-icon" />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card className="summary-card expenses-card" hoverable>
          <div className="summary-card-title">Jami xarajatlar</div>
          <div className="summary-card-value">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="summary-card-subtitle">
            <span>Service: {formatCurrency(serviceXarajat)}</span> |
            <span> Maosh: {formatCurrency(maoshXarajat)}</span>
          </div>
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={8}>
        <Card
          className="summary-card balance-card"
          hoverable
          style={{
            borderTop: finalBalance >= 0 
              ? '4px solid #52c41a' 
              : '4px solid #f5222d'
          }}
        >
          <div className="summary-card-title">Qolgan balans</div>
          <div
            className="summary-card-value"
            style={{
              color: finalBalance >= 0 
                ? '#52c41a' 
                : '#f5222d'
            }}
          >
            {formatCurrency(finalBalance)}
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default SummaryCards;