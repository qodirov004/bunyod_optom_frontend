import React, { useState, useMemo } from 'react';
import { Card, Table, Avatar, Tag, Spin, Button, Empty, Modal, Descriptions, Space, Typography, Divider } from 'antd';
import { UserOutlined, TrophyOutlined, EyeOutlined, PhoneOutlined, CarOutlined, DollarOutlined, HistoryOutlined } from '@ant-design/icons';
import { useTopDrivers } from '../../../hooks/useTopDrivers';
import { useTrips } from '../../../hooks/useTrips';
import { useHistory } from '../../../hooks/useHistory';
import { formatCurrency } from '@/utils/formatCurrency';
import type { ColumnsType } from 'antd/es/table';

const { Text, Title } = Typography;

// Define proper type for driver
interface DriverData {
    id: number;
    fullname: string;
    username: string;
    phone_number: string;
    photo?: string;
    is_busy: boolean;
    rays_count: number;
    total_rays_usd: number;
    status: string;
    has_active_trip?: boolean;
}

const TopDriversSection = () => {
    const { data: drivers = [], isLoading: isDriversLoading, error: driversError } = useTopDrivers();
    const { data: trips = [], isLoading: isTripsLoading } = useTrips();
    const { data: history = [], isLoading: isHistoryLoading } = useHistory();
    const [selectedDriver, setSelectedDriver] = useState<DriverData | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Consolidated driver statistics from active and historical trips
    const processedDrivers = useMemo(() => {
        return drivers.map(driver => {
            // Find active trips for this driver
            const activeTrips = trips.filter(trip => trip.driver?.id === driver.id);
            const hasActiveTrip = activeTrips.some(trip => !trip.is_completed);
            
            // Find historical trips for this driver
            const historicalTrips = history.filter(h => h.driver?.id === driver.id || (h as any).driver_id === driver.id);
            
            // Calculate real-time totals
            const totalRaysCount = activeTrips.length + historicalTrips.length;
            const totalRevenue = 
                activeTrips.reduce((sum, trip) => sum + (Number(trip.price) || 0), 0) +
                historicalTrips.reduce((sum, h) => sum + (Number(h.total_price) || 0), 0);

            return {
                ...driver,
                is_busy: driver.is_busy || hasActiveTrip,
                has_active_trip: hasActiveTrip,
                rays_count: totalRaysCount,
                total_rays_usd: totalRevenue
            };
        });
    }, [drivers, trips, history]);

    const showDetails = (driver: DriverData) => {
        setSelectedDriver(driver);
        setIsModalVisible(true);
    };

    const handleClose = () => {
        setIsModalVisible(false);
        setSelectedDriver(null);
    };

    const columns: ColumnsType<DriverData> = [
        {
            title: 'Haydovchi',
            dataIndex: 'fullname',
            key: 'fullname',
            render: (text: string, record: DriverData) => (
                <div className="driver-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar
                        src={record.photo}
                        icon={<UserOutlined />}
                        style={{ backgroundColor: record.photo ? 'transparent' : '#1890ff' }}
                    />
                    <div>
                        <div className="driver-name" style={{ fontWeight: 600 }}>{text}</div>
                        <div className="driver-phone" style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.phone_number}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Reyslar',
            dataIndex: 'rays_count',
            key: 'rays_count',
            align: 'center' as const,
            render: (count: number) => (
                <Tag color="blue" style={{ borderRadius: '10px' }}>{count || 0}</Tag>
            )
        },
        {
            title: 'Holat',
            dataIndex: 'is_busy',
            key: 'is_busy',
            align: 'center' as const,
            render: (busy: boolean) => (
                <Tag color={busy ? 'volcano' : 'green'} style={{ borderRadius: '10px' }}>
                    {busy ? 'Band' : 'Bo\'sh'}
                </Tag>
            ),
        },
        {
            title: 'Amallar',
            key: 'actions',
            align: 'center' as const,
            render: (_, record: DriverData) => (
                <Button
                    type="primary"
                    shape="circle"
                    icon={<EyeOutlined />}
                    onClick={() => showDetails(record)}
                    style={{ backgroundColor: '#1890ff' }}
                />
            ),
        }
    ];

    const renderContent = () => {
        if (isDriversLoading || isTripsLoading || isHistoryLoading) {
            return <div className="section-loading" style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" /></div>;
        }

        if (driversError) {
            return <Empty description="Ma'lumotlarni yuklashda xatolik yuz berdi" />;
        }

        if (!processedDrivers.length) {
            return <Empty description="Haydovchilar mavjud emas" />;
        }

        return (
            <Table
                dataSource={processedDrivers.slice(0, 5) as DriverData[]} // Top 5 drivers only
                columns={columns}
                pagination={false}
                rowKey="id"
                className="dashboard-table"
                size="middle"
                scroll={{ x: 700 }}
            />
        );
    };

    return (
        <Card
            title={
                <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrophyOutlined className="section-icon" style={{ color: '#faad14' }} />
                    <span>Eng yaxshi haydovchilar</span>
                </div>
            }
            className="dashboard-card"
            style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
            {renderContent()}

            <Modal
                title={
                    <Space>
                        <UserOutlined style={{ color: '#1890ff' }} />
                        <span>Haydovchi ma'lumotlari</span>
                    </Space>
                }
                open={isModalVisible}
                onCancel={handleClose}
                footer={[
                    <Button key="close" type="primary" onClick={handleClose}>
                        Yopish
                    </Button>
                ]}
                width={550}
                centered
                styles={{
                    body: { padding: '24px 32px' }
                }}
            >
                {selectedDriver && (
                    <div className="driver-detail-content">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '20px' }}>
                            <Avatar
                                size={80}
                                src={selectedDriver.photo}
                                icon={<UserOutlined />}
                                style={{ 
                                    backgroundColor: selectedDriver.photo ? 'transparent' : '#1890ff',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            />
                            <div>
                                <Title level={3} style={{ margin: 0 }}>{selectedDriver.fullname}</Title>
                                <Text type="secondary">@{selectedDriver.username}</Text>
                                <div style={{ marginTop: '8px' }}>
                                    <Tag color={selectedDriver.is_busy ? 'volcano' : 'green'}>
                                        {selectedDriver.is_busy ? 'Band' : 'Bo\'sh'}
                                    </Tag>
                                    <Tag color="blue">{selectedDriver.status}</Tag>
                                </div>
                            </div>
                        </div>

                        <Divider style={{ margin: '16px 0' }} />

                        <Descriptions column={1} bordered size="small" labelStyle={{ width: '160px', fontWeight: 600 }}>
                            <Descriptions.Item label={<Space><PhoneOutlined /> Telefon</Space>}>
                                <Text copyable>{selectedDriver.phone_number}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Space><HistoryOutlined /> Jami reyslar</Space>}>
                                <Text strong>{selectedDriver.rays_count || 0}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Space><DollarOutlined /> Umumiy tushum</Space>}>
                                <Text strong type="success">
                                    {formatCurrency(selectedDriver.total_rays_usd)}
                                </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label={<Space><CarOutlined /> Holati</Space>}>
                                {selectedDriver.is_busy ? (
                                    <Text type="danger">Hozirda reysda</Text>
                                ) : (
                                    <Text type="success">Navbatda / Bo'sh</Text>
                                )}
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Modal>
        </Card>
    );
};

export default TopDriversSection;
