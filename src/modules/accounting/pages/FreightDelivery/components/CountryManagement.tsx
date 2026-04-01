import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Form, 
  Input, 
  Button, 
  Popconfirm, 
  message, 
  Typography, 
  Empty, 
  Spin, 
  Row, 
  Col,
  Modal
} from 'antd';
import { PlusOutlined, DeleteOutlined, GlobalOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';
import { 
  getAllCountries, 
  createCountry, 
  updateCountry, 
  deleteCountry,
  Country 
} from '@/modules/accounting/api/country/countryApi';

const { Text, Title } = Typography;

interface CountryFormProps {
  onSubmit: (name: string) => Promise<void>;
  loading: boolean;
}

interface EditCountryModalProps {
  open: boolean;
  country: Country | null;
  onCancel: () => void;
  onSave: (id: number, name: string) => Promise<void>;
  loading: boolean;
}

const CountryForm: React.FC<CountryFormProps> = ({ onSubmit, loading }) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values: { name: string }) => {
    try {
      await onSubmit(values.name);
      form.resetFields();
    } catch (error) {
      console.error('Country form submission error:', error);
    }
  };

  return (
    <Form
      form={form}
      layout="inline"
      onFinish={handleSubmit}
      style={{ marginBottom: 16 }}
    >
      <Form.Item
        name="name"
        rules={[{ required: true, message: "Davlat nomi kiritilishi shart" }]}
        style={{ flexGrow: 1 }}
      >
        <Input placeholder="Yangi davlat nomi" />
      </Form.Item>
      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          icon={<PlusOutlined />} 
          loading={loading}
        >
          Qo`shish
        </Button>
      </Form.Item>
    </Form>
  );
};

const EditCountryModal: React.FC<EditCountryModalProps> = ({ 
  open, 
  country, 
  onCancel, 
  onSave, 
  loading 
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && country) {
      form.setFieldsValue({ name: country.name });
    }
  }, [open, country, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (country) {
        await onSave(country.id, values.name);
      }
    } catch (error) {
      console.error('Country validation error:', error);
    }
  };

  return (
    <Modal
      title="Davlatni tahrirlash"
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Saqlash"
      cancelText="Bekor qilish"
      forceRender={true}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ name: country?.name || '' }}
      >
        <Form.Item
          name="name"
          label="Davlat nomi"
          rules={[{ required: true, message: "Nom kiritilishi shart" }]}
        >
          <Input placeholder="Davlat nomi" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const CountryManagement: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchCountries = async () => {
    setLoading(true);
    try {
      const data = await getAllCountries();
      setCountries(data);
    } catch (error) {
      console.error('Error fetching countries:', error);
      messageApi.error('Davlatlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const handleCreateCountry = async (name: string) => {
    setCreating(true);
    try {
      const newCountry = await createCountry(name);
      setCountries([...countries, newCountry]);
      messageApi.success(`"${name}" qo'shildi`);
    } catch (error) {
      console.error('Error creating country:', error);
      messageApi.error('Davlat qo\'shishda xatolik');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCountry = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteCountry(id);
      setCountries(countries.filter(c => c.id !== id));
      messageApi.success("Davlat muvaffaqiyatli o'chirildi");
    } catch (error) {
      console.error('Error deleting country:', error);
      messageApi.error("Davlatni o'chirishda xatolik");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditCountry = (country: Country) => {
    setEditingCountry(country);
    setIsEditModalVisible(true);
  };

  const handleUpdateCountry = async (id: number, name: string) => {
    setUpdating(true);
    try {
      const updated = await updateCountry(id, name);
      setCountries(countries.map(c => c.id === id ? updated : c));
      setIsEditModalVisible(false);
      setEditingCountry(null);
      messageApi.success("Davlat muvaffaqiyatli yangilandi");
    } catch (error) {
      console.error(`Error updating country:`, error);
      messageApi.error("Davlatni yangilashda xatolik");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>Davlatlarni boshqarish</Title>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchCountries}
            loading={loading}
          >
            Yangilash
          </Button>
        </div>
      }
      className="country-management-card"
      variant="borderless"
    >
      {contextHolder}
      <CountryForm 
        onSubmit={handleCreateCountry} 
        loading={creating} 
      />
      
      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Spin size="large" />
          </div>
        ) : (
          <List
            bordered
            dataSource={countries}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                actions={[
                  <Button
                    key={`edit-${item.id}`}
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleEditCountry(item)}
                    style={{ marginRight: 8 }}
                  />,
                  <Popconfirm
                    key={`delete-${item.id}`}
                    title="Davlatni o'chirishni istaysizmi?"
                    okText="Ha"
                    cancelText="Yo'q"
                    okType="danger"
                    onConfirm={() => handleDeleteCountry(item.id)}
                    disabled={deletingId === item.id}
                  >
                    <Button 
                      type="text" 
                      icon={<DeleteOutlined />} 
                      danger
                      loading={deletingId === item.id}
                    />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  avatar={<GlobalOutlined style={{ fontSize: 18, color: '#1890ff' }} />}
                  title={<Text strong>{item.name}</Text>}
                />
              </List.Item>
            )}
            locale={{
              emptyText: <Empty description="Davlatlar mavjud emas" />
            }}
          />
        )}
      </div>

      <EditCountryModal
        open={isEditModalVisible}
        country={editingCountry}
        onCancel={() => setIsEditModalVisible(false)}
        onSave={handleUpdateCountry}
        loading={updating}
      />
    </Card>
  );
};

export default CountryManagement;
