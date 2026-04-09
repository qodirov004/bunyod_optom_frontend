import React from 'react';
import { Table, Button, Popconfirm, Card, Tag } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { FuelType } from '../../../types/maintenance';
import { useCars } from '@/modules/accounting/hooks/useCars';
import { formatCurrency } from '@/utils/formatCurrency';

interface FuelListProps {
  fuelServices: FuelType[];
  deleteFuelService: (id: number) => void;
}

const FuelList: React.FC<FuelListProps> = ({ fuelServices, deleteFuelService }) => {
  const { cars = [] } = useCars();

  const getCarDisplay = (carId: number | null) => {
    if (!carId) return '-';
    const car = cars.find((c: any) => c.id === carId);
    return car ? (car.name || car.number || `Mashina (${carId})`) : `Mashina (${carId})`;
  };

  const columns = [
    {
      title: 'Mashina',
      dataIndex: 'car',
      key: 'car',
      render: (carId: number | null) => getCarDisplay(carId),
    },
    {
      title: 'Yoqilg\'i turi',
      dataIndex: 'fuel_type',
      key: 'fuel_type',
      render: (type: string) => (
        <Tag color={type === 'Benzin' ? 'red' : 'blue'}>
          {type || '-'}
        </Tag>
      ),
    },
    {
      title: 'Hajmi',
      key: 'volume',
      render: (_: any, record: FuelType) => {
        if (!record.volume) return '-';
        return `${record.volume} ${record.fuel_type === 'Gaz' ? 'Kub' : 'Litr'}`;
      },
    },
    {
      title: 'Narxi',
      dataIndex: 'price',
      key: 'price',
      render: (price: number | null) => price ? `${formatCurrency(price)} so'm` : '-',
    },
    {
      title: 'Sana',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_: any, record: FuelType) => (
        <Popconfirm
          title="O'chirishni tasdiqlaysizmi?"
          onConfirm={() => record.id && deleteFuelService(record.id)}
          okText="Ha"
          cancelText="Yo'q"
        >
          <Button danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card>
      <Table 
        columns={columns} 
        dataSource={fuelServices} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
      />
    </Card>
  );
};

export default FuelList;
