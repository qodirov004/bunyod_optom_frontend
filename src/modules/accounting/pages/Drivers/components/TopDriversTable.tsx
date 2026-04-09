import React from 'react';
import { Table, Space, Avatar, Tag, Typography } from 'antd';
import { UserOutlined, CarOutlined, TrophyOutlined } from '@ant-design/icons';
import { DriverType } from '../../../types/driver';
import { getDriverPhotoUrl } from '../photoUtils';

const { Text } = Typography;

interface TopDriversTableProps {
    drivers: DriverType[];
    loading: boolean;
}

const TopDriversTable: React.FC<TopDriversTableProps> = ({ drivers, loading }) => {
    const columns = [
        {
            title: "№",
            key: 'rank',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => {
                const rank = index + 1;
                if (rank === 1) return <TrophyOutlined style={{ color: '#ffd700', fontSize: '20px' }} />;
                if (rank === 2) return <TrophyOutlined style={{ color: '#c0c0c0', fontSize: '18px' }} />;
                if (rank === 3) return <TrophyOutlined style={{ color: '#cd7f32', fontSize: '16px' }} />;
                return <span style={{ fontWeight: 'bold', color: '#8c8c8c' }}>{rank}</span>;
            }
        },
        {
            title: 'Haydovchi',
            dataIndex: 'fullname',
            key: 'fullname',
            render: (_: any, record: any) => (
                <Space size={12}>
                    {(() => {
                        const photoUrl = getDriverPhotoUrl(record.photo);
                        const hasPhoto = !!photoUrl;

                        return (
                            <>
                                <Avatar
                                    size="large"
                                    src={photoUrl || undefined}
                                    icon={!hasPhoto && <UserOutlined />}
                                    style={{ 
                                        backgroundColor: hasPhoto ? 'transparent' : '#1890ff',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {!hasPhoto && record.fullname?.charAt(0)}
                                </Avatar>
                                <Space direction="vertical" size={0}>
                                    <Text strong style={{ fontSize: '14px' }}>{record.fullname}</Text>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>@{record.username}</Text>
                                </Space>
                            </>
                        );
                    })()}
                </Space>
            ),
        },
        {
            title: 'Telefon',
            dataIndex: 'phone_number',
            key: 'phone_number',
            render: (phone: string) => <Text style={{ fontFamily: 'monospace' }}>{phone}</Text>
        },
        {
            title: 'Reyslar soni',
            dataIndex: 'rays_count',
            key: 'rays_count',
            align: 'center' as const,
            render: (rays_count: number | undefined) => (
                <Tag 
                    color={rays_count && rays_count > 0 ? "blue" : "default"} 
                    icon={<CarOutlined />} 
                    style={{ 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontWeight: 'bold',
                        fontSize: '13px'
                    }}
                >
                    {rays_count || 0} reys
                </Tag>
            ),
            sorter: (a: any, b: any) => (a.rays_count || 0) - (b.rays_count || 0),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            align: 'center' as const,
            render: (status: string) => {
                const colors: Record<string, string> = {
                    active: 'success',
                    inactive: 'error',
                    onRoute: 'processing',
                    onVacation: 'warning',
                    driver: 'success',
                    owner: 'blue',
                    manager: 'purple',
                };
                
                const texts: Record<string, string> = {
                    active: 'Faol',
                    inactive: 'Faol emas',
                    onRoute: 'Yo`lda',
                    onVacation: 'Ta`tilda',
                    driver: 'Haydovchi',
                    owner: 'Egasi',
                    manager: 'Menejer',
                };
                
                return (
                    <Tag 
                        color={colors[status] || 'default'}
                        style={{ borderRadius: '4px', minWidth: '80px', textAlign: 'center' }}
                    >
                        {texts[status] || status}
                    </Tag>
                );
            },
        },
    ];

    return (
        <Table 
            dataSource={drivers} 
            columns={columns} 
            rowKey="id"
            loading={loading}
            pagination={false}
            size="middle"
            scroll={{ x: 700 }}
            style={{ 
                width: '100%',
                background: '#fff',
                borderRadius: '8px'
            }}
            rowClassName={(_, index) => index < 3 ? 'top-rank-row' : ''}
        />
    );
};

export default TopDriversTable;