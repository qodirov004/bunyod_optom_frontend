import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Modal, message, Table, Space, Checkbox, Alert, Tag } from 'antd';
import { useCash } from '../../../hooks/useCash';
import axiosInstance from '@/api/axiosInstance';
import { formatCurrency } from '@/utils/formatCurrency';

interface ClientPaymentProps {
  raysId: number;
  open: boolean;
  onClose: () => void;
  initialClients?: any[];
}

const DEFAULT_PAYMENT_WAYS = [
  { id: 1, name: 'Naqd' },
  { id: 2, name: 'Karta' },
  { id: 3, name: "Hisobdan (Pul o'tkazmasi)" },
];

const ClientPayment: React.FC<ClientPaymentProps> = ({ raysId, open, onClose, initialClients }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  // Pass messageApi to useCash hook for React 19 compatibility
  const { loading, createTransaction, raysClientsMap } = useCash(messageApi);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [selectedClientObj, setSelectedClientObj] = useState<any>(null);
  const [uzsId, setUzsId] = useState<number>(2); // Default to 2
  const [paymentWays, setPaymentWays] = useState<{ id: number; name: string }[]>(DEFAULT_PAYMENT_WAYS);

  const isDebt = Form.useWatch('is_debt', form);
  const amountValue = Form.useWatch('amount', form);
  const totalExpectedValue = Form.useWatch('total_expected_amount', form);

  // Fetch currencies & payment categories
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [currRes, catRes] = await Promise.allSettled([
          axiosInstance.get('/currency/'),
          axiosInstance.get('/casacategory/'),
        ]);
        if (currRes.status === 'fulfilled') {
          const data = currRes.value.data.results || currRes.value.data || [];
          const currencies = Array.isArray(data) ? data : [];
          const uzs = currencies.find((c: any) => c.currency === 'UZS');
          if (uzs) setUzsId(uzs.id);
        }
        if (catRes.status === 'fulfilled') {
          const catData = Array.isArray(catRes.value.data)
            ? catRes.value.data
            : (catRes.value.data?.results || []);
          if (catData.length > 0) setPaymentWays(catData);
        }
      } catch (error) {
        console.error('Error fetching payment metadata:', error);
      }
    };
    fetchMeta();
  }, []);

  const selectClientRecord = (record: any) => {
    setSelectedClient(record.id);
    setSelectedClientObj(record);
  };

  const initializedForOpenRef = React.useRef(false);

  useEffect(() => {
    if (!open) {
      initializedForOpenRef.current = false;
      setSelectedClient(null);
      setSelectedClientObj(null);
      form.resetFields();
      return;
    }

    if (!raysId) return;

    const nextClients =
      initialClients && initialClients.length > 0
        ? initialClients
        : (raysClientsMap.find(item => item.rays_id === raysId)?.clients || []);

    if (nextClients.length === 0) {
      setClients([]);
      return;
    }

    if (!initializedForOpenRef.current) {
      initializedForOpenRef.current = true;
      setClients(nextClients);
      if (nextClients.length === 1) {
        selectClientRecord(nextClients[0]);
      } else {
        setSelectedClient(null);
        setSelectedClientObj(null);
        form.resetFields();
      }
    }
  }, [open, raysId, raysClientsMap, initialClients]);

  // Populate form AFTER selectedClientObj commits and <Form> is mounted
  useEffect(() => {
    if (!open || !selectedClientObj) return;
    const expected = Math.round(Number(selectedClientObj.total_expected_amount_uzs ?? selectedClientObj.total_expected_amount_usd ?? 0));
    const remaining = Math.round(Number(selectedClientObj.total_remaining_uzs ?? selectedClientObj.total_remaining_usd ?? expected));
    form.setFieldsValue({
      total_expected_amount: expected > 0 ? expected : undefined,
      amount: remaining > 0 ? remaining : (expected > 0 ? expected : 0),
      payment_way: paymentWays.length > 0 ? paymentWays[0].id : 1,
      is_debt: false,
      is_via_driver: false,
      is_delivered_to_cashier: false,
      comment: '',
    });
  }, [open, selectedClientObj, form]);

  useEffect(() => {
    if (open && selectedClientObj && paymentWays.length > 0 && !form.isFieldTouched('payment_way')) {
      form.setFieldValue('payment_way', paymentWays[0].id);
    }
  }, [open, selectedClientObj, paymentWays, form]);

  const handleSubmit = async (values: any) => {
    if (!selectedClient) {
      messageApi.error('Iltimos, avval mijozni tanlang');
      return;
    }

    const isDebtTx = Boolean(values.is_debt);
    const paidNow = Math.round(Number(values.amount ?? 0));
    const clientExpected = Number(
      selectedClientObj?.total_expected_amount_uzs ?? selectedClientObj?.total_expected_amount_usd ?? 0
    );
    const expectedTotal = Math.round(
      Number(values.total_expected_amount ?? (clientExpected > 0 ? clientExpected : paidNow))
    );

    if (isDebtTx) {
      if (!expectedTotal || expectedTotal <= 0) {
        messageApi.error("Qarz yozish uchun umumiy / kelishilgan summani kiriting!");
        return;
      }
      if (paidNow < 0 || paidNow >= expectedTotal) {
        messageApi.error("Qarz sifatida belgilashda hozir to'lanayotgan summa umumiy summadan kichik bo'lishi kerak (masalan, 0 so'm)!");
        return;
      }
    } else if (paidNow <= 0) {
      messageApi.error("To'lov summasi 0 dan katta bo'lishi kerak!");
      return;
    }

    try {
      const transactionData: any = {
        client: selectedClient,
        rays: Number(raysId),
        rays_id: Number(raysId),
        amount: paidNow,
        amount_in_usd: String(paidNow),
        currency: uzsId,
        payment_way: values.payment_way,
        comment: values.comment || (isDebtTx ? `Qarz (Umumiy: ${expectedTotal.toLocaleString()} so'm)` : ''),
        is_debt: isDebtTx,
        is_via_driver: !!values.is_via_driver,
        is_delivered_to_cashier: Boolean(values.is_delivered_to_cashier),
        ...(isDebtTx && {
          total_expected_amount: expectedTotal,
          paid_amount: paidNow,
        }),
        move_type: 'cash',
        date: new Date().toISOString().split('T')[0]
      };

      try {
        await createTransaction(transactionData);
      } catch (firstError: any) {
        if (firstError.response?.data?.rays) {
          console.warn('Retrying without rays field due to backend error');
          const fallbackData = { ...transactionData };
          delete fallbackData.rays;
          await createTransaction(fallbackData);
        } else {
          throw firstError;
        }
      }
      messageApi.success(isDebtTx ? "Qarz yozuvi muvaffaqiyatli saqlandi" : "To'lov muvaffaqiyatli saqlandi");
      form.resetFields();
      setSelectedClient(null);
      setSelectedClientObj(null);
      onClose();
    } catch (error) {
      messageApi.error("To'lovni saqlashda xatolik yuz berdi");
      console.error('Error recording payment:', error);
    }
  };

  const columns = [
    {
      title: 'Mijoz',
      key: 'client',
      render: (_: any, record: any) => {
        const company = record.company?.trim();
        const director = (record.director_name || `${record.first_name || ''} ${record.last_name || ''}`).trim();
        const primary = company || director || '-';
        const showDirector = company && director && company.toLowerCase() !== director.toLowerCase();
        return (
          <Space direction="vertical" size={0}>
            <span style={{ fontWeight: 600 }}>{primary}</span>
            {showDirector && <small style={{ color: '#8c8c8c' }}>{director}</small>}
          </Space>
        );
      },
    },
    {
      title: 'Yuk summasi',
      key: 'expected',
      render: (_: any, record: any) => {
        const expected = Number(record.total_expected_amount_uzs ?? record.total_expected_amount_usd ?? 0);
        return expected > 0 ? <Tag color="blue">{formatCurrency(expected, 'UZS')}</Tag> : '-';
      },
    },
    {
      title: 'Amal',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="primary"
            onClick={() => selectClientRecord(record)}
            disabled={selectedClient === record.id}
          >
            {selectedClient === record.id ? 'Tanlangan' : 'Tanlash'}
          </Button>
        </Space>
      ),
    },
  ];

  const remainingDebtPreview = Math.max(
    0,
    Number(totalExpectedValue || 0) - Number(amountValue || 0)
  );

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

      <div style={{ display: selectedClient ? 'block' : 'none' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {isDebt && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="Qarz sifatida rasmiylashtirish"
              description="Mijoz yukni qarzga olayotgan bo'lsa, 'Hozir to'lanayotgan summa' maydoniga faqat hozir naqd/karta orqali olingan pulni kiriting (hech narsa to'lanmagan bo'lsa 0 qoldiring). Qolgan farq avtomatik qarz bo'lib yoziladi."
            />
          )}

          <Form.Item
            name="total_expected_amount"
            label="Umumiy / Kelishilgan summa (so'mda)"
            hidden={!isDebt}
            rules={isDebt ? [{ required: true, message: 'Iltimos, umumiy summani kiriting!' }] : []}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={isDebt ? 1 : 0}
              placeholder="Kelishilgan umumiy summa"
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => (value ? value.replace(/\$\s?|(,*)/g, '') : '') as any}
            />
          </Form.Item>

          <Form.Item
            name="amount"
            label={isDebt ? "Hozir to'lanayotgan summa (so'mda)" : "Summa (so'mda)"}
            rules={[{ required: true, message: 'Iltimos, summani kiriting!' }]}
            extra={isDebt ? "Agar mijoz hozir pul bermagan bo'lsa, 0 qoldiring" : undefined}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={isDebt ? 0 : 1}
              placeholder={isDebt ? "0" : "Summani kiriting"}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => (value ? value.replace(/\$\s?|(,*)/g, '') : '') as any}
            />
          </Form.Item>

          {isDebt && (
            <div style={{ marginBottom: 16, padding: '8px 12px', background: '#fff1f0', borderRadius: 6, border: '1px solid #ffa39e' }}>
              <span>Qarzga yoziladigan qoldiq: </span>
              <strong style={{ color: '#cf1322' }}>
                {formatCurrency(remainingDebtPreview, 'UZS')}
              </strong>
            </div>
          )}

          <Form.Item
            name="payment_way"
            label="To'lov turi"
            rules={[{ required: true, message: "Iltimos, to'lov turini tanlang!" }]}
          >
            <Select placeholder="To'lov turini tanlang">
              {paymentWays.map(way => (
                <Select.Option key={way.id} value={way.id}>{way.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="comment"
            label="Izoh"
          >
            <Input.TextArea placeholder="Qo'shimcha izohlar" />
          </Form.Item>

          <Space wrap style={{ marginBottom: 16 }}>
            <Form.Item
              name="is_debt"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Checkbox
                onChange={(e) => {
                  const checked = e.target.checked;
                  const exp = Math.round(
                    Number(
                      selectedClientObj?.total_expected_amount_uzs ??
                      selectedClientObj?.total_expected_amount_usd ??
                      form.getFieldValue('total_expected_amount') ??
                      form.getFieldValue('amount') ??
                      0
                    )
                  );
                  if (checked) {
                    if (!form.getFieldValue('total_expected_amount') && exp > 0) {
                      form.setFieldValue('total_expected_amount', exp);
                    }
                    form.setFieldValue('amount', 0);
                  } else {
                    const rem = Math.round(
                      Number(selectedClientObj?.total_remaining_uzs ?? selectedClientObj?.total_remaining_usd ?? exp)
                    );
                    if ((form.getFieldValue('amount') ?? 0) === 0 && rem > 0) {
                      form.setFieldValue('amount', rem);
                    }
                  }
                }}
              >
                Mijoz qarzga oldi
              </Checkbox>
            </Form.Item>

            <Form.Item
              name="is_via_driver"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Checkbox>Haydovchi orqali to&apos;lov</Checkbox>
            </Form.Item>

            <Form.Item
              name="is_delivered_to_cashier"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Checkbox>Kassirga topshirildi</Checkbox>
            </Form.Item>
          </Space>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%', height: '40px' }}>
              To&apos;lovni saqlash
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default ClientPayment;