import React from 'react';
import { Table, Space, Avatar, Tag } from 'antd';
import { UserOutlined, CarOutlined } from '@ant-design/icons';
import { DriverType } from '../../../types/driver';
import { getDriverPhotoUrl } from '../photoUtils';

interface TopDriversTableProps {
    drivers: DriverType[];
    loading: boolean;
}

const TopDriversTable: React.FC<TopDriversTableProps> = ({ drivers, loading }) => {
    const columns = [
        {
            title: "№",
            key: 'rank',
            width: 40,
            render: (_: any, __: any, index: number) => (
                <span style={{ paddingLeft: '8px', fontWeight: 'bold' }}>{index + 1}</span>
            )
        },
        {
            title: 'Haydovchi',
            dataIndex: 'fullname',
            key: 'fullname',
            render: (_: any, record: any) => (
                <Space>
                    {(() => {
                        const photoUrl = getDriverPhotoUrl(record.photo);
                        const hasPhoto = !!photoUrl;

                        return (
                            <>
                                <Avatar
                                    src={photoUrl || undefined}
                                    icon={!hasPhoto && <UserOutlined />}
                                    style={{ backgroundColor: hasPhoto ? 'transparent' : '#1890ff' }}
                                >
                                    {!hasPhoto && record.fullname?.charAt(0)}
                                </Avatar>
                                <span>{record.fullname}</span>
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
        },
        {
            title: 'Reyslar soni',
            dataIndex: 'rays_count',
            key: 'rays_count',
            render: (rays_count: number | undefined) => (
                <Tag color="blue" icon={<CarOutlined />} style={{ fontWeight: 'bold' }}>{rays_count || 0} reys</Tag>
            ),
            sorter: (a: any, b: any) => (a.rays_count || 0) - (b.rays_count || 0),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
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
                    <Tag color={colors[status] || 'default'}>
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
            size="small"
            variant="borderless"
            scroll={{ x: 700 }}
            style={{ width: '100%' }}
        />
    );
};

export default TopDriversTable; 