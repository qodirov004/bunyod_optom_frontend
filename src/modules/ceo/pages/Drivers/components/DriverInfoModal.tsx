import React from 'react';
import { Modal, Descriptions, Avatar, Tag, Divider, Row, Col, Typography, Card, Image, Space } from 'antd';
import { 
    UserOutlined, 
    PhoneOutlined, 
    IdcardOutlined, 
    CalendarOutlined, 
    EnvironmentOutlined,
    CarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    SafetyCertificateOutlined
} from '@ant-design/icons';
import { DriverType } from '../../../../accounting/types/driver';
import { formatImageUrl } from '../../../../../api/axiosInstance';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface DriverInfoModalProps {
    visible: boolean;
    driver: DriverType | null;
    onClose: () => void;
}

const DriverInfoModal: React.FC<DriverInfoModalProps> = ({ visible, driver, onClose }) => {
    if (!driver) return null;

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
            <Row gutter={[24, 24]}>
                {/* Profile Header */}
                <Col span={24}>
                    <Card bordered={false} bodyStyle={{ padding: '20px', borderRadius: '12px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
                        <Row align="middle" gutter={24}>
                            <Col>
                                <Avatar 
                                    size={120} 
                                    src={formatImageUrl(driver.photo)} 
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
                <Col xs={24} lg={12}>
                    <Card title={<Space><IdcardOutlined /> Pasport ma'lumotlari</Space>} size="small" className="info-card">
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Seriya va raqam">
                                <Text strong>{driver.passport_series || ''} {driver.passport_number || 'Mavjud emas'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Berilgan joyi">
                                {driver.passport_issued_by || 'Mavjud emas'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Berilgan sana">
                                {formatDate(driver.passport_issued_date)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tug'ilgan sana">
                                {formatDate(driver.passport_birth_date)}
                            </Descriptions.Item>
                        </Descriptions>
                        
                        <Divider orientation="left" plain>Pasport nusxalari</Divider>
                        <Row gutter={16}>
                            <Col span={12}>
                                <div style={{ textAlign: 'center' }}>
                                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Old taraf</Text>
                                    <Image 
                                        width="100%" 
                                        height={120}
                                        style={{ objectFit: 'cover', borderRadius: '8px' }}
                                        src={formatImageUrl(driver.passport_photo_front)} 
                                        fallback="/images/not-found.png"
                                    />
                                </div>
                            </Col>
                            <Col span={12}>
                                <div style={{ textAlign: 'center' }}>
                                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Orqa taraf</Text>
                                    <Image 
                                        width="100%" 
                                        height={120}
                                        style={{ objectFit: 'cover', borderRadius: '8px' }}
                                        src={formatImageUrl(driver.passport_photo_back)} 
                                        fallback="/images/not-found.png"
                                    />
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Card title={<Space><SafetyCertificateOutlined /> Haydovchilik guvohnomasi</Space>} size="small" className="info-card">
                            <Descriptions column={1} bordered size="small">
                                <Descriptions.Item label="Guvohnoma raqami">
                                    <Text strong>{driver.license_number || 'Mavjud emas'}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Amal qilish muddati">
                                    <Text color={dayjs().isAfter(dayjs(driver.license_expiry)) ? 'red' : 'inherit'}>
                                        {formatDate(driver.license_expiry)}
                                    </Text>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Card title={<Space><DollarOutlined /> Ish faoliyati va Moliya</Space>} size="small" className="info-card">
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Card bodyStyle={{ padding: '12px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                                        <Text type="secondary">Jami reyslar</Text>
                                        <Title level={3} style={{ margin: '8px 0 0 0' }}>{driver.rays_count || 0}</Title>
                                    </Card>
                                </Col>
                                <Col span={12}>
                                    <Card bodyStyle={{ padding: '12px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                                        <Text type="secondary">To'langan summa</Text>
                                        <Title level={3} style={{ margin: '8px 0 0 0', color: '#52c41a' }}>{driver.total_rays_usd || 0}$</Title>
                                    </Card>
                                </Col>
                            </Row>
                            <Divider style={{ margin: '16px 0' }} />
                            <Space><EnvironmentOutlined /> <Text>Manzil: {driver.address || 'Kiritilmagan'}</Text></Space>
                            <br />
                            <Space><CalendarOutlined /> <Text>Ro'yxatdan o'tgan: {formatDate(driver.date)}</Text></Space>
                        </Card>
                    </Space>
                </Col>
            </Row>

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
