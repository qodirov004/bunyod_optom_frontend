import React, { useState } from 'react';
import { Table, Button, Popconfirm, Card, Tag, Space, Modal, Tooltip } from 'antd';
import { DeleteOutlined, UserOutlined, EditOutlined } from '@ant-design/icons';
import { FuelType } from '../../../types/maintenance';
import { useCars } from '@/modules/accounting/hooks/useCars';
import { useDrivers } from '@/modules/accounting/hooks/useDrivers';
import { formatCurrency } from '@/utils/formatCurrency';
import FuelForm from './FuelForm';

interface FuelListProps {
  fuelServices: FuelType[];
  updateFuelService: (params: { id: number; service: FuelType }) => void;
  deleteFuelService: (id: number) => void;
}

const FuelList: React.FC<FuelListProps> = ({ fuelServices, updateFuelService, deleteFuelService }) => {
  const { cars = [] } = useCars();
  const { drivers = [] } = useDrivers();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFuel, setSelectedFuel] = useState<FuelType | null>(null);

  const handleEdit = (record: FuelType) => {
    setSelectedFuel(record);
    setIsEditModalOpen(true);
  };

  const handleUpdateFinish = (values: FuelType) => {
    if (selectedFuel?.id) {
      updateFuelService({
        id: selectedFuel.id,
        service: values
      });
      setIsEditModalOpen(false);
      setSelectedFuel(null);
    }
  };

  const getCarDisplay = (carId: number | null) => {
    if (!carId) return '-';
    const car = cars.find((c: any) => c.id === carId);
    if (!car) return `Mashina (${carId})`;
    
    return (
      <Space direction="vertical" size={0}>
        <span style={{ fontWeight: 500 }}>{car.name}</span>
        <Tag color="blue" style={{ fontSize: '11px', margin: 0 }}>{car.car_number || car.number}</Tag>
      </Space>
    );
  };

  const getDriverDisplay = (driverId: number | null) => {
    if (!driverId) return '-';
    const driver = drivers.find((d: any) => d.id === driverId);
    return driver ? (
      <span style={{ color: '#000' }}>
        <UserOutlined style={{ marginRight: 4 }} />
        {driver.fullname || `${driver.first_name} ${driver.last_name}`}
      </span>
    ) : `Haydovchi (${driverId})`;
  };

  const columns = [
    {
      title: '№',
      key: 'index',
      width: 50,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: 'Mashina',
      dataIndex: 'car',
      key: 'car',
      render: (carId: number | null) => getCarDisplay(carId),
    },
    {
      title: 'Haydovchi',
      dataIndex: 'driver',
      key: 'driver',
      render: (driverId: number | null) => getDriverDisplay(driverId),
    },
    {
      title: 'Yoqilg\'i turi',
      dataIndex: 'fuel_type',
      key: 'fuel_type',
      render: (type: string) => (
        <Tag color={type === 'benzin' ? 'red' : type === 'dizel' ? 'orange' : 'blue'}>
          {type === 'benzin' ? 'Benzin' : type === 'dizel' ? 'Dizel' : type === 'gaz' ? 'Gaz' : type || '-'}
        </Tag>
      ),
    },
    {
      title: 'Miqdori',
      key: 'liters',
      render: (_: any, record: FuelType) => {
        if (!record.liters) return '-';
        return `${record.liters} ${record.fuel_type === 'gaz' ? 'Kub' : 'Litr'}`;
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
      width: 120,
      fixed: 'right',
      render: (_: any, record: FuelType) => (
        <Space>
          <Tooltip title="Tahrirlash">
            <Button 
              type="primary" 
              shape="circle"
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              style={{ 
                background: '#52c41a', 
                borderColor: '#52c41a',
                color: '#fff',
                boxShadow: '0 2px 4px rgba(82, 196, 26, 0.2)'
              }}
            />
          </Tooltip>
          
          <Popconfirm
            title="O'chirishni tasdiqlaysizmi?"
            onConfirm={() => record.id && deleteFuelService(record.id)}
            okText="Ha"
            cancelText="Yo'q"
          >
            <Tooltip title="O'chirish">
              <Button 
                danger 
                ghost
                shape="circle" 
                icon={<DeleteOutlined />} 
              />
            </Tooltip>
          </Popconfirm>
        </Space>
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

      <Modal
        title="Yoqilg'i harajatini tahrirlash"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setSelectedFuel(null);
        }}
        footer={null}
        destroyOnClose
      >
        {selectedFuel && (
          <FuelForm 
            onFinish={handleUpdateFinish}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedFuel(null);
            }}
            cars={cars}
            initialValues={selectedFuel}
          />
        )}
      </Modal>
    </Card>
  );
};

export default FuelList;
