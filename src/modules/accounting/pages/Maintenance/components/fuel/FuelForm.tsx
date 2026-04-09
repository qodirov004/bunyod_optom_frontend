import React from 'react';
import { Form, Input, Button, Select, Space } from 'antd';
import { FuelType } from '../../../types/maintenance';
import { useDrivers } from '@/modules/accounting/hooks/useDrivers';

const { Option } = Select;

interface FuelFormProps {
  onFinish: (values: FuelType) => void;
  onCancel: () => void;
  cars: any[];
  loading?: boolean;
  initialValues?: FuelType | null;
}

const FuelForm: React.FC<FuelFormProps> = ({ onFinish, onCancel, cars, loading, initialValues }) => {
  const [form] = Form.useForm();
  const { drivers = [], loading: driversLoading } = useDrivers();

  React.useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const handleFormFinish = (values: any) => {
    // Process values to match backend requirements
    const processedValues: FuelType = {
      ...values,
      liters: Number(values.liters),
      price: Number(values.price),
      currency: 4, // UZS
      custom_rate_to_uzs: 1
    };
    onFinish(processedValues);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFormFinish}
    >
      <Form.Item
        name="car"
        label="Mashina"
        rules={[{ required: true, message: 'Iltimos, mashinani tanlang' }]}
      >
        <Select 
          placeholder="Mashinani tanlang" 
          showSearch 
          optionFilterProp="children"
        >
          {cars.map((car: any) => (
            <Option key={car.id} value={car.id} label={`${car.name} (${car.car_number || car.number})`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontWeight: 500 }}>{car.name}</span>
                <span style={{ color: '#1677ff', fontSize: '12px' }}>{car.car_number || car.number}</span>
              </div>
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="driver"
        label="Haydovchi"
        rules={[{ required: true, message: 'Iltimos, haydovchini tanlang' }]}
      >
        <Select 
          placeholder="Haydovchini tanlang" 
          showSearch 
          optionFilterProp="children"
          loading={driversLoading}
          styles={{ popup: { root: { color: '#000' } } }}
        >
          {drivers.map((driver: any) => (
            <Option key={driver.id} value={driver.id} label={driver.fullname || `${driver.first_name} ${driver.last_name}`}>
              <span style={{ color: '#000' }}>
                {driver.fullname || `${driver.first_name} ${driver.last_name}` || `Haydovchi (${driver.id})`}
              </span>
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="fuel_type"
        label="Yoqilg'i turi"
        rules={[{ required: true, message: 'Iltimos, yoqilg\'i turini tanlang' }]}
      >
        <Select placeholder="Yoqilg'i turini tanlang">
          <Option value="benzin">Benzin</Option>
          <Option value="dizel">Dizel</Option>
          <Option value="gaz">Gaz</Option>
        </Select>
      </Form.Item>

      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) => prevValues.fuel_type !== currentValues.fuel_type}
      >
        {({ getFieldValue }) => {
          const fuelType = getFieldValue('fuel_type');
          const litersLabel = fuelType === 'gaz' ? 'Miqdori (Kub)' : 'Miqdori (Litr)';

          return (
            <Form.Item
              name="liters"
              label={litersLabel}
              rules={[{ required: true, message: 'Iltimos, miqdorini kiriting' }]}
            >
              <Input type="number" min={0} step="0.01" style={{ width: '100%' }} />
            </Form.Item>
          );
        }}
      </Form.Item>

      <Form.Item
        name="price"
        label="Umumiy narxi (so'm)"
        rules={[{ required: true, message: 'Iltimos, narxni kiriting' }]}
      >
        <Input type="number" min={0} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>
            Bekor qilish
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Saqlash
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default FuelForm;
