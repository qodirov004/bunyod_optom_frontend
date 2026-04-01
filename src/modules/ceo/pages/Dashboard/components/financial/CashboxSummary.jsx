import React from 'react';
import { Row, Col, Card, Statistic, Typography } from 'antd';
import { formatCurrency } from '../../utils/formatters';

const { Title } = Typography;

const CashboxSummary = ({ cashbox, isLoading }) => {
  return (
    <Card variant="borderless" className="kpi-card">
      <div className="section-header">
        <Title level={5}>Kassa (so'm)</Title>
      </div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Statistic
            title="Mavjud mablag' (UZS)"
            value={formatCurrency(cashbox?.UZS || (cashbox?.total_in_usd * 12800) || 0)}
            loading={isLoading}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default CashboxSummary; 