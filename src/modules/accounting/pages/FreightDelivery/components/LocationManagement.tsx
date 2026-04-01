import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
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
import { PlusOutlined, DeleteOutlined, EnvironmentOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';
import { 
  fetchFromLocations, 
  fetchToLocations, 
  createFromLocation, 
  createToLocation,
  deleteFromLocation,
  deleteToLocation,
  updateFromLocation,
  updateToLocation
} from '@/modules/accounting/api/freight/freightapi';
import { FromLocation, ToLocation } from '@/modules/accounting/types/freight.types';

const { Text, Title } = Typography;

interface LocationFormProps {
  onSubmit: (name: string) => Promise<void>;
  loading: boolean;
}

interface EditLocationModalProps {
  open: boolean;
  location: FromLocation | ToLocation | null;
  onCancel: () => void;
  onSave: (id: number, name: string) => Promise<void>;
  loading: boolean;
}

const LocationForm: React.FC<LocationFormProps> = ({ onSubmit, loading }) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values: { name: string }) => {
    try {
      await onSubmit(values.name);
      form.resetFields();
    } catch (error) {
      console.error('Form submission error:', error);
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
        rules={[{ required: true, message: "Nom kiritilishi shart" }]}
        style={{ flexGrow: 1 }}
      >
        <Input placeholder="Manzil nomi kiriting" />
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

const EditLocationModal: React.FC<EditLocationModalProps> = ({ 
  open, 
  location, 
  onCancel, 
  onSave, 
  loading 
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && location) {
      form.setFieldsValue({ name: location.name });
    }
  }, [open, location, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (location) {
        await onSave(location.id, values.name);
      }
    } catch (error) {
      console.error('Form validation error:', error);
    }
  };

  return (
    <Modal
      title="Manzilni tahrirlash"
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
        initialValues={{ name: location?.name || '' }}
      >
        <Form.Item
          name="name"
          label="Manzil nomi"
          rules={[{ required: true, message: "Nom kiritilishi shart" }]}
        >
          <Input placeholder="Manzil nomi kiriting" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const LocationManagement: React.FC = () => {
  const [fromLocations, setFromLocations] = useState<FromLocation[]>([]);
  const [toLocations, setToLocations] = useState<ToLocation[]>([]);
  const [loadingFromLocations, setLoadingFromLocations] = useState(false);
  const [loadingToLocations, setLoadingToLocations] = useState(false);
  const [creatingFromLocation, setCreatingFromLocation] = useState(false);
  const [creatingToLocation, setCreatingToLocation] = useState(false);
  const [deletingFromLocationId, setDeletingFromLocationId] = useState<number | null>(null);
  const [deletingToLocationId, setDeletingToLocationId] = useState<number | null>(null);
  const [editingLocation, setEditingLocation] = useState<FromLocation | ToLocation | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingLocationType, setEditingLocationType] = useState<'from' | 'to'>('from');
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchLocations = async () => {
    setLoadingFromLocations(true);
    setLoadingToLocations(true);
    
    try {
      const fromLocs = await fetchFromLocations();
      setFromLocations(fromLocs);
    } catch (error: any) {
      console.error('Error fetching from locations:', error);
      messageApi.error(error.message || 'Qayerdan manzillarini yuklashda xatolik');
    } finally {
      setLoadingFromLocations(false);
    }
    
    try {
      const toLocs = await fetchToLocations();
      setToLocations(toLocs);
    } catch (error: any) {
      console.error('Error fetching to locations:', error);
      messageApi.error(error.message || 'Qayerga manzillarini yuklashda xatolik');
    } finally {
      setLoadingToLocations(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreateFromLocation = async (name: string) => {
    setCreatingFromLocation(true);
    try {
      const newLocation = await createFromLocation(name);
      setFromLocations([...fromLocations, newLocation]);
      messageApi.success(`"${name}" manzili qo'shildi`);
    } catch (error: any) {
      console.error('Error creating from location:', error);
      messageApi.error(error.message || 'Manzil qo\'shishda xatolik');
    } finally {
      setCreatingFromLocation(false);
    }
  };

  const handleCreateToLocation = async (name: string) => {
    setCreatingToLocation(true);
    try {
      const newLocation = await createToLocation(name);
      setToLocations([...toLocations, newLocation]);
      messageApi.success(`"${name}" manzili qo'shildi`);
    } catch (error: any) {
      console.error('Error creating to location:', error);
      messageApi.error(error.message || 'Manzil qo\'shishda xatolik');
    } finally {
      setCreatingToLocation(false);
    }
  };

  const handleDeleteFromLocation = async (id: number) => {
    setDeletingFromLocationId(id);
    try {
      await deleteFromLocation(id);
      setFromLocations(fromLocations.filter(location => location.id !== id));
      messageApi.success("Manzil muvaffaqiyatli o'chirildi");
    } catch (error: any) {
      console.error('Error deleting from location:', error);
      messageApi.error(error.message || "Manzilni o'chirishda xatolik");
    } finally {
      setDeletingFromLocationId(null);
    }
  };

  const handleDeleteToLocation = async (id: number) => {
    setDeletingToLocationId(id);
    try {
      await deleteToLocation(id);
      setToLocations(toLocations.filter(location => location.id !== id));
      messageApi.success("Manzil muvaffaqiyatli o'chirildi");
    } catch (error: any) {
      console.error('Error deleting to location:', error);
      messageApi.error(error.message || "Manzilni o'chirishda xatolik");
    } finally {
      setDeletingToLocationId(null);
    }
  };

  const handleEditFromLocation = (location: FromLocation) => {
    setEditingLocation(location);
    setEditingLocationType('from');
    setIsEditModalVisible(true);
  };

  const handleEditToLocation = (location: ToLocation) => {
    setEditingLocation(location);
    setEditingLocationType('to');
    setIsEditModalVisible(true);
  };

  const handleUpdateLocation = async (id: number, name: string) => {
    setUpdatingLocation(true);
    try {
      if (editingLocationType === 'from') {
        const updatedLocation = await updateFromLocation(id, name);
        setFromLocations(fromLocations.map(location => 
          location.id === id ? updatedLocation : location
        ));
      } else {
        const updatedLocation = await updateToLocation(id, name);
        setToLocations(toLocations.map(location => 
          location.id === id ? updatedLocation : location
        ));
      }
      
      setIsEditModalVisible(false);
      setEditingLocation(null);
      messageApi.success("Manzil muvaffaqiyatli yangilandi");
    } catch (error: any) {
      console.error(`Error updating ${editingLocationType} location:`, error);
      messageApi.error(error.message || "Manzilni yangilashda xatolik");
    } finally {
      setUpdatingLocation(false);
    }
  };

  const closeEditModal = () => {
    setIsEditModalVisible(false);
    setEditingLocation(null);
  };

  const tabItems = [
    {
      key: "from",
      label: "Qayerdan",
      children: (
        <div className="from-locations">
          <Row>
            <Col span={24}>
              <LocationForm 
                onSubmit={handleCreateFromLocation} 
                loading={creatingFromLocation} 
              />
            </Col>
          </Row>
          
          <div style={{ marginTop: 16 }}>
            {loadingFromLocations ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin size="large" />
              </div>
            ) : (
              <List
                bordered
                dataSource={fromLocations}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    actions={[
                      <Button
                        key={`edit-${item.id}`}
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEditFromLocation(item)}
                        style={{ marginRight: 8 }}
                      />,
                      <Popconfirm
                        key={`delete-${item.id}`}
                        title="Manzilni o'chirishni istaysizmi?"
                        okText="Ha"
                        cancelText="Yo'q"
                        okType="danger"
                        onConfirm={() => handleDeleteFromLocation(item.id)}
                        disabled={deletingFromLocationId === item.id}
                      >
                        <Button 
                          type="text" 
                          icon={<DeleteOutlined />} 
                          danger
                          loading={deletingFromLocationId === item.id}
                        />
                      </Popconfirm>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<EnvironmentOutlined style={{ fontSize: 18, color: '#1890ff' }} />}
                      title={<Text strong>{item.name}</Text>}
                    />
                  </List.Item>
                )}
                locale={{
                  emptyText: <Empty description="Manzillar mavjud emas" />
                }}
              />
            )}
          </div>
        </div>
      )
    },
    {
      key: "to",
      label: "Qayerga",
      children: (
        <div className="to-locations">
          <Row>
            <Col span={24}>
              <LocationForm 
                onSubmit={handleCreateToLocation} 
                loading={creatingToLocation} 
              />
            </Col>
          </Row>
          
          <div style={{ marginTop: 16 }}>
            {loadingToLocations ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin size="large" />
              </div>
            ) : (
              <List
                bordered
                dataSource={toLocations}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    actions={[
                      <Button
                        key={`edit-${item.id}`}
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEditToLocation(item)}
                        style={{ marginRight: 8 }}
                      />,
                      <Popconfirm
                        key={`delete-${item.id}`}
                        title="Manzilni o'chirishni istaysizmi?"
                        okText="Ha"
                        cancelText="Yo'q"
                        okType="danger"
                        onConfirm={() => handleDeleteToLocation(item.id)}
                        disabled={deletingToLocationId === item.id}
                      >
                        <Button 
                          type="text" 
                          icon={<DeleteOutlined />} 
                          danger
                          loading={deletingToLocationId === item.id}
                        />
                      </Popconfirm>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<EnvironmentOutlined style={{ fontSize: 18, color: '#52c41a' }} />}
                      title={<Text strong>{item.name}</Text>}
                    />
                  </List.Item>
                )}
                locale={{
                  emptyText: <Empty description="Manzillar mavjud emas" />
                }}
              />
            )}
          </div>
        </div>
      )
    }
  ];

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>Manzillarni boshqarish</Title>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchLocations}
            loading={loadingFromLocations || loadingToLocations}
          >
            Yangilash
          </Button>
        </div>
      }
      className="location-management-card"
      variant="borderless"
    >
      {contextHolder}
      <Tabs
        defaultActiveKey="from"
        items={tabItems}
      />

      <EditLocationModal
        open={isEditModalVisible}
        location={editingLocation}
        onCancel={closeEditModal}
        onSave={handleUpdateLocation}
        loading={updatingLocation}
      />
    </Card>
  );
};

export default LocationManagement;