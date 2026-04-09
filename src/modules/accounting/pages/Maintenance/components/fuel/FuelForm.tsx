import React from 'react';
import { Form, Input, Button, Select, Space } from 'antd';
import { FuelType } from '../../../types/maintenance';

const { Option } = Select;

interface FuelFormProps {
  onFinish: (values: FuelType) => void;
  onCancel: () => void;
  cars: any[];
  loading?: boolean;
}

const FuelForm: React.FC<FuelFormProps> = ({ onFinish, onCancel, cars, loading }) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Form.Item
        name="car"
        label="Mashina"
        rules={[{ required: true, message: 'Iltimos, mashinani tanlang' }]}
      >
        <Select placeholder="Mashinani tanlang" showSearch optionFilterProp="children">
          {cars.map((car: any) => (
            <Option key={car.id} value={car.id}>
              {car.name || car.number || `Ko'rsatilmagan (${car.id})`}
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
          <Option value="Benzin">Benzin</Option>
          <Option value="Gaz">Gaz</Option>
        </Select>
      </Form.Item>

      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) => prevValues.fuel_type !== currentValues.fuel_type}
      >
        {({ getFieldValue }) => {
          const fuelType = getFieldValue('fuel_type');
          const volumeLabel = fuelType === 'Gaz' ? 'Hajmi (Kub)' : 'Hajmi (Litr)';

          return (
            <Form.Item
              name="volume"
              label={volumeLabel}
              rules={[{ required: true, message: 'Iltimos, hajmini kiriting' }]}
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
