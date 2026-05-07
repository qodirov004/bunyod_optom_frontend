import React, { useState } from 'react';
import { Table, Tag, Button, Space, Tooltip, Tabs, Skeleton, Card, Empty } from 'antd';
import { EyeOutlined, RollbackOutlined, CarOutlined, UserOutlined, EnvironmentOutlined, CalendarOutlined } from '@ant-design/icons';
import { TripData } from '../../../hooks/useTrips';
import dayjs from 'dayjs';



interface TripsListProps {
  activeTrips: TripData[];
  historyTrips: TripData[];
  isLoading: boolean;
  onViewDetails: (trip: TripData) => void;
  onCompleteTrip: (id: number) => void;
  onReactivateTrip: (id: number) => void;
  isCompletingTrip: boolean;
  isReactivatingTrip: boolean;
}

const TripsList: React.FC<TripsListProps> = ({
  activeTrips,
  historyTrips,
  isLoading,
  onViewDetails,
}) => {
  const [activeTab, setActiveTab] = useState('active');

  // Format currency function
  const formatCurrency = (amount: number = 0) => {
    return amount.toLocaleString('uz-UZ') + ' so\'m';
  };
  const baseColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Haydovchi',
      key: 'driver',
      render: (_, record: TripData) => (
        <Space>
          <UserOutlined />
          {record.driver?.fullname || 'Noma\'lum'}
        </Space>
      ),
    },
    {
      title: 'Mijoz',
      key: 'client',
      render: (_, record: TripData) => {
        if (!record.client || record.client.length === 0) return 'Mijoz kiritilmagan';
        const client = record.client[0] as any;
        return client.company ? client.company : `${client.first_name || ''} ${client.last_name || ''}`.trim();
      },
    },
    {
      title: 'Transport',
      key: 'vehicle',
      render: (_, record: TripData) => (
        <Space direction="vertical" size={0}>
          <Space>
            <CarOutlined />
            <span style={{ fontWeight: 500 }}>{record.car?.name || 'Noma\'lum model'}</span>
          </Space>
          <div style={{ fontSize: '11px', color: '#1890ff', fontWeight: 600, paddingLeft: '24px' }}>
            {record.car?.car_number || record.car?.number || 'Davlat raqami yo\'q'}
          </div>
          {record.fourgon && (
            <div style={{ fontSize: '11px', color: '#52c41a', paddingLeft: '24px' }}>
              Furgon: {record.fourgon?.number || 'Noma\'lum'}
            </div>
          )}
        </Space>
      ),
    },
    {
      title: 'Masofa',
      key: 'route',
      render: (_, record: TripData) => (
        <Space direction="vertical" size={0}>
          <div>{record.kilometer || 0} km</div>
        </Space>
      ),
    },
    {
      title: 'Sana',
      key: 'date',
      render: (_, record: TripData) => (
        <Space direction="vertical" size={0}>
          <div>
            <CalendarOutlined /> {dayjs(record.created_at).format('DD.MM.YYYY')}
          </div>
          {record.end_date && (
            <div>
              - {dayjs(record.end_date).format('DD.MM.YYYY')}
            </div>
          )}
        </Space>
      ),
    },
    {
      title: 'Narx',
      key: 'price',
      render: (_, record: TripData) => `${record.price?.toLocaleString() || 0} so'm`,
    },
    {
      title: 'Haydovchi xarajati',
      key: 'driver_expense',
      render: (_, record: TripData) => (
        <Tag color="red">
          {(record.driver_expense || 0).toLocaleString()} so'm
        </Tag>
      ),
    },
    {
      title: 'Foyda',
      key: 'profit',
      render: (_, record: TripData) => {
        const profit = (record.price || 0) - (record.dr_price || 0) - (record.dp_price || 0) - (record.driver_expense || 0);
        return (
          <Tag color={profit > 0 ? 'success' : 'error'}>
            {profit.toLocaleString()} so'm
          </Tag>
        );
      },
    },
  ];

  const activeColumns = [
    ...baseColumns,
    {
      title: 'Amallar',
      key: 'action',
      width: 120,
      render: (_, record: TripData) => (
        <Space>
          <Tooltip title="Batafsil ko'rish">
            <Button
              type="primary"
              size="small"
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() => onViewDetails(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Columns for history trips
  const historyColumns = [
    ...baseColumns,
    {
      title: 'Amallar',
      key: 'action',
      width: 120,
      render: (_, record: TripData) => (
        <Space>
          <Tooltip title="Batafsil ko'rish">
            <Button
              type="primary"
              size="small"
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() => onViewDetails(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Render function for loading state
  const renderLoading = () => (
    <Card>
      <Skeleton active paragraph={{ rows: 10 }} />
    </Card>
  );

  // Render function for empty data
  const renderEmpty = (message: string) => (
    <Card>
      <Empty description={message} />
    </Card>
  );

  return (
    <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" items={[
      {
        key: 'active',
        label: `Aktiv reyslar (${activeTrips?.length || 0})`,
        children: isLoading ? (
          renderLoading()
        ) : activeTrips.length === 0 ? (
          renderEmpty('Aktiv reyslar mavjud emas')
        ) : (
          <Table
            columns={activeColumns}
            dataSource={activeTrips}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Jami ${total} ta reys`
            }}
            scroll={{ x: 1200 }}
            size="middle"
          />
        )
      },
      {
        key: 'history',
        label: `Tarix (${historyTrips?.length || 0})`,
        children: isLoading ? (
          renderLoading()
        ) : historyTrips.length === 0 ? (
          renderEmpty('Tarixdagi reyslar mavjud emas')
        ) : (
          <Table
            columns={historyColumns}
            dataSource={historyTrips}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Jami ${total} ta reys`
            }}
            scroll={{ x: 1200 }}
            size="middle"
          />
        )
      }
    ]} />
  );
};

export default TripsList; 