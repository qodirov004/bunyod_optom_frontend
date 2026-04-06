import React from 'react';
import { Typography, Button, Space, Tooltip, Row, Col } from 'antd';
import { BankOutlined, ReloadOutlined, PrinterOutlined } from '@ant-design/icons';
import './financeHeader.css';

const { Title } = Typography;

interface FinanceHeaderProps {
  onRefresh: () => void;
  onPrint: () => void;
  isLoading: boolean;
}

const FinanceHeader: React.FC<FinanceHeaderProps> = ({ 
  onRefresh, 
  onPrint, 
  isLoading 
}) => {
  return (
    <Row gutter={[16, 16]} align="middle" className="finance-header-responsive">
      <Col xs={24} sm={24} md="auto" style={{ flex: '1 0 auto' }}>
        <Title level={2} style={{ marginBottom: 0 }}>
          <BankOutlined /> Moliya va Buxgalteriya
        </Title>
      </Col>
      <Col xs={24} sm={24} md="auto">
        <Space wrap>
          <Tooltip title="Yangilash">
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={isLoading}
            >
              Yangilash
            </Button>
          </Tooltip>
        </Space>
      </Col>
    </Row>
  );
};

export default FinanceHeader; 