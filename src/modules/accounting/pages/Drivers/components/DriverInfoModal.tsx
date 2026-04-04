import React from 'react';
import { Modal, Descriptions, Avatar, Tag, Divider, Row, Col, Typography, Card, Image, Space, Empty } from 'antd';
import { 
    UserOutlined, 
    PhoneOutlined, 
    CalendarOutlined, 
    CarOutlined,
    ClockCircleOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { DriverType } from '../../../types/driver';
import { formatImageUrl } from '../../../../../api/axiosInstance';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface DriverInfoModalProps {
    visible: boolean;
    driver: DriverType | null;
    onClose: () => void;
    loading?: boolean;
}

const DriverInfoModal: React.FC<DriverInfoModalProps> = ({ visible, driver, onClose, loading }) => {
    if (!driver && !loading) return null;

    const formatDate = (date: string | null | undefined) => {
        if (!date) return 'Mavjud emas';
        return dayjs(date).format('DD.MM.YYYY');
    };

    const getStatusTag = (status: string, isBusy: boolean) => {
        if (isBusy) return <Tag color="success" icon={<CarOutlined />}>Yo'lda</Tag>;
        if (status === 'driver' || status === 'active') return <Tag color="processing" icon={<ClockCircleOutlined />}>Kutishda</Tag>;
        return <Tag color="default">{status}</Tag>;
    };

    return (
        <Modal
            title={<Title level={4} style={{ margin: 0 }}>Haydovchi ma'lumotlari</Title>}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={900}
            centered
            className="driver-info-modal"
        >
            {loading ? (
                <div style={{ height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Space direction="vertical" align="center">
                        <Avatar size={64} icon={<ClockCircleOutlined />} style={{ backgroundColor: '#f5f5f5', color: '#1890ff' }} />
                        <Text type="secondary">Ma'lumotlar yuklanmoqda...</Text>
                    </Space>
                </div>
            ) : driver && (
                <Row gutter={[24, 24]}>
                {/* Profile Header */}
                <Col span={24}>
                    <Card variant="borderless" styles={{ body: { padding: '20px', borderRadius: '12px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' } }}>
                        <Row align="middle" gutter={24}>
                            <Col>
                                <Avatar 
                                    size={120} 
                                    src={driver.photo ? formatImageUrl(driver.photo) : undefined} 
                                    icon={<UserOutlined />}
                                    style={{ border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                            </Col>
                            <Col flex="1">
                                <Title level={2} style={{ margin: '0 0 8px 0' }}>{driver.fullname}</Title>
                                <Space size="large">
                                    <Space><PhoneOutlined /> <Text strong>{driver.phone_number}</Text></Space>
                                    <Space><UserOutlined /> <Text type="secondary">ID: {driver.id}</Text></Space>
                                    {getStatusTag(driver.status, !!driver.is_busy)}
                                </Space>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Main Info */}
                <Col span={24}>
                    <Card title={<Space><DollarOutlined /> Ish faoliyati va Moliya</Space>} size="small" className="info-card">
                        <Row gutter={24}>
                            <Col xs={24} sm={12}>
                                <Card styles={{ body: { padding: '20px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '12px' } }}>
                                    <Text type="secondary">Jami reyslar</Text>
                                    <Title level={3} style={{ margin: '8px 0 0 0' }}>{driver.rays_count || 0}</Title>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Card styles={{ body: { padding: '20px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '12px' } }}>
                                    <Text type="secondary">Topgan summasi</Text>
                                    <Title level={3} style={{ margin: '8px 0 0 0', color: '#52c41a' }}>{(Number(driver.total_rays_usd || 0) * 12800).toLocaleString()}</Title>
                                    <Text style={{ fontSize: '12px' }}>so'm</Text>
                                </Card>
                            </Col>
                        </Row>
                        <Divider style={{ margin: '24px 0' }} />
                        <Space><CalendarOutlined /> <Text>Ro'yxatdan o'tgan: {formatDate(driver.date_joined || driver.date)}</Text></Space>
                    </Card>
                </Col>
            </Row>
            )}

            <style jsx global>{`
                .driver-info-modal .ant-modal-content {
                    border-radius: 16px;
                    overflow: hidden;
                }
                .driver-info-modal .ant-descriptions-label {
                    background-color: #fafafa;
                    width: 140px;
                }
                .info-card {
                    height: 100%;
                    border-radius: 12px;
                    border: 1px solid #f0f0f0;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
                .info-card:hover {
                    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
                    border-color: #e6f7ff;
                }
            `}</style>
        </Modal>
    );
};

export default DriverInfoModal;
