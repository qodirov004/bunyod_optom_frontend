import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Modal, message, Table, Space } from 'antd';
import { useCash } from '../../../hooks/useCash';
import { CashTransaction } from '../../../api/cashTransaction';

interface ClientPaymentProps {
  raysId: number;
  open: boolean;
  onClose: () => void;
  initialClients?: any[];
}

const ClientPayment: React.FC<ClientPaymentProps> = ({ raysId, open, onClose, initialClients }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  
  // Pass messageApi to useCash hook for React 19 compatibility
  const { loading, createTransaction, raysClientsMap } = useCash(messageApi);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);

  useEffect(() => {
    if (open && raysId) {
      if (initialClients && initialClients.length > 0) {
        setClients(initialClients);
      } else {
        const raysData = raysClientsMap.find(item => item.rays_id === raysId);
        setClients(raysData?.clients || []);
      }
    }
  }, [open, raysId, raysClientsMap, initialClients]);

  const handleSubmit = async (values: any) => {
    try {
      const transactionData: any = {
        client: selectedClient!,
        rays: Number(raysId),
        rays_id: Number(raysId),
        amount: Math.round(Number(values.amount)),
        currency: 4, // UZS
        payment_way: values.payment_way,
        comment: values.comment || '',
        is_debt: !!values.is_debt,
        is_via_driver: !!values.is_via_driver,
        is_delivered_to_cashier: values.is_delivered_to_cashier !== false,
        move_type: 'cash',
        date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
      };

      try {
        await createTransaction(transactionData);
      } catch (firstError: any) {
        // If it fails with the 'rays' field error, try without it as a fallback
        if (firstError.response?.data?.rays) {
          console.warn('Retrying without rays field due to backend error');
          const fallbackData = { ...transactionData };
          delete fallbackData.rays;
          await createTransaction(fallbackData);
        } else {
          throw firstError;
        }
      }
      messageApi.success('To\'lov muvaffaqiyatli saqlandi');
      form.resetFields();
      onClose();
    } catch (error) {
      messageApi.error('To\'lovni saqlashda xatolik yuz berdi');
      console.error('Error recording payment:', error);
    }
  };

  const columns = [
    {
      title: 'Mijoz ismi',
      dataIndex: 'first_name',
      key: 'first_name',
    },
    {
      title: 'Amal',
      key: 'action',
      render: (_, record: any) => (
        <Space size="middle">
          <Button 
            type="primary" 
            onClick={() => setSelectedClient(record.id)}
            disabled={selectedClient === record.id}
          >
            Tanlash
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title="Mijoz to'lovi"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      {contextHolder}
      <div style={{ marginBottom: 20 }}>
        <Table 
          columns={columns} 
          dataSource={clients} 
          rowKey="id"
          pagination={false}
          locale={{ emptyText: 'Mijozlar topilmadi' }}
        />
      </div>

      {selectedClient && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            currency: 4,
            payment_way: 1,
            is_debt: false,
            is_via_driver: false,
            is_delivered_to_cashier: false
          }}
        >
          <Form.Item
            name="amount"
            label="Summa (so'mda)"
            rules={[{ required: true, message: 'Iltimos, summani kiriting!' }]}
          >
            <Input type="number" placeholder="Summani kiriting" />
          </Form.Item>

          <Form.Item
            name="payment_way"
            label="To'lov turi"
            rules={[{ required: true, message: 'Iltimos, to\'lov turini tanlang!' }]}
          >
            <Select placeholder="To'lov turini tanlang">
              <Select.Option value={1}>Naqd</Select.Option>
              <Select.Option value={2}>Karta</Select.Option>
              <Select.Option value={3}>Hisobdan (Pul o'tkazmasi)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comment"
            label="Izoh"
          >
            <Input.TextArea placeholder="Qo'shimcha izohlar" />
          </Form.Item>

          <Form.Item
            name="is_debt"
            valuePropName="checked"
          >
            <Input type="checkbox" /> Mijoz qarzga oldi
          </Form.Item>

          <Form.Item
            name="is_via_driver"
            valuePropName="checked"
          >
            <Input type="checkbox" /> Haydovchi orqali to'lov
          </Form.Item>

          <Form.Item
            name="is_delivered_to_cashier"
            valuePropName="checked"
          >
            <Input type="checkbox" /> Kassirga topshirildi
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%', height: '40px' }}>
              To'lovni saqlash
            </Button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default ClientPayment;