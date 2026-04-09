import React, { useState } from 'react';
import { Card, Button, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import FuelForm from './FuelForm';
import { FuelType } from '../../../types/maintenance';
import { useCars } from '@/modules/accounting/hooks/useCars';

interface FuelAddProps {
  addFuelService: (service: FuelType) => void;
}

const FuelAdd: React.FC<FuelAddProps> = ({ addFuelService }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { cars = [] } = useCars();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleAdd = async (values: FuelType) => {
    setLoading(true);
    try {
      await addFuelService(values);
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error adding fuel expense:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
          Yangi yoqilg'i xarajatini qo'shish
        </Button>
      </Card>
      
      <Modal
        title="Yangi yoqilg'i harajatini qo'shish"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnHidden
      >
        <FuelForm 
          onFinish={handleAdd} 
          onCancel={handleCancel} 
          cars={cars} 
          loading={loading}
        />
      </Modal>
    </>
  );
};

export default FuelAdd;
