import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, InputNumber, Checkbox, Table, message, Space, Tag, Alert } from 'antd';
import { useCash } from '../../../hooks/useCash';
import axiosInstance from '@/api/axiosInstance';
import { formatCurrency } from '@/utils/formatCurrency';

interface ClientPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  raysId: number | null;
}

const DEFAULT_PAYMENT_WAYS = [
  { id: 1, name: 'Naqd' },
  { id: 2, name: 'Karta' },
  { id: 3, name: "O'tkazma" },
];

const ClientPaymentModal: React.FC<ClientPaymentModalProps> = ({
  visible,
  onClose,
  raysId
}) => {
  const [form] = Form.useForm();
  const { loading, createTransaction, getClientsForRays } = useCash();
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [uzsId, setUzsId] = useState<number>(2);
  const [paymentWays, setPaymentWays] = useState<{ id: number; name: string }[]>(DEFAULT_PAYMENT_WAYS);

  const isDebt = Form.useWatch('is_debt', form);
  const amountValue = Form.useWatch('amount', form);
  const totalExpectedValue = Form.useWatch('total_expected_amount', form);

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
        console.error('Error fetching metadata:', error);
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setSelectedClient(null);
    } else if (raysId) {
      form.resetFields();
      setSelectedClient(null);
    }
  }, [visible, raysId, form]);

  const handleSelectClient = (client: any) => {
    setSelectedClient(client);
  };

  useEffect(() => {
    if (!visible || !selectedClient) return;
    const expected = Math.round(Number(selectedClient.total_expected_amount_uzs ?? selectedClient.total_expected_amount_usd ?? 0));
    const remaining = Math.round(Number(selectedClient.total_remaining_uzs ?? selectedClient.total_remaining_usd ?? expected));
    form.setFieldsValue({
      total_expected_amount: expected > 0 ? expected : undefined,
      amount: remaining > 0 ? remaining : (expected > 0 ? expected : 0),
      currency: uzsId,
      payment_way: paymentWays[0]?.id || 1,
      is_debt: false,
      is_via_driver: false,
      is_delivered_to_cashier: true,
      comment: '',
    });
  }, [visible, selectedClient, uzsId, form]);

  useEffect(() => {
    if (visible && selectedClient && paymentWays.length > 0 && !form.isFieldTouched('payment_way')) {
      form.setFieldValue('payment_way', paymentWays[0].id);
    }
  }, [visible, selectedClient, paymentWays, form]);

  const handleSubmit = async (values: any) => {
    if (!selectedClient) {
      message.error('Iltimos, mijozni tanlang');
      return;
    }

    const isDebtTx = Boolean(values.is_debt);
    const paidNow = Math.round(Number(values.amount ?? 0));
    const clientExpected = Number(
      selectedClient.total_expected_amount_uzs ?? selectedClient.total_expected_amount_usd ?? 0
    );
    const expectedTotal = Math.round(
      Number(values.total_expected_amount ?? (clientExpected > 0 ? clientExpected : paidNow))
    );

    if (isDebtTx) {
      if (!expectedTotal || expectedTotal <= 0) {
        message.error("Qarz yozish uchun umumiy / kelishilgan summani kiriting");
        return;
      }
      if (paidNow < 0 || paidNow >= expectedTotal) {
        message.error("Qarz yozishda hozir to'lanayotgan summa umumiy summadan kichik bo'lishi kerak (masalan, 0 so'm)");
        return;
      }
    } else if (paidNow <= 0) {
      message.error("To'lov summasi 0 dan katta bo'lishi kerak");
      return;
    }

    try {
      const transactionData: any = {
        client: selectedClient.id,
        rays: raysId || undefined,
        amount: paidNow,
        amount_in_usd: String(paidNow),
        currency: uzsId,
        payment_way: values.payment_way,
        comment: values.comment || (isDebtTx ? `Qarz (Umumiy: ${expectedTotal.toLocaleString()} so'm)` : ''),
        is_debt: isDebtTx,
        is_via_driver: values.is_via_driver || false,
        is_delivered_to_cashier: Boolean(values.is_delivered_to_cashier),
        ...(isDebtTx && {
          total_expected_amount: expectedTotal,
          paid_amount: paidNow,
        }),
      };

      await createTransaction(transactionData);
      message.success(isDebtTx ? "Qarz yozuvi muvaffaqiyatli yaratildi" : "To'lov muvaffaqiyatli yaratildi");
      form.resetFields();
      setSelectedClient(null);
      onClose();
    } catch (error) {
      console.error('Payment creation error:', error);
      message.error("To'lovni yaratishda xatolik yuz berdi");
    }
  };

  const clientColumns = [
    {
      title: 'Mijoz',
      dataIndex: 'first_name',
      key: 'first_name',
      render: (text: string, record: any) => {
        const company = record.company?.trim();
        const person = `${text || ''} ${record.last_name || ''}`.trim();
        const primary = company || person || '-';
        const showPerson = company && person && company.toLowerCase() !== person.toLowerCase();
        return (
          <Space direction="vertical" size={0}>
            <span style={{ fontWeight: 600 }}>{primary}</span>
            {showPerson && <small style={{ color: '#8c8c8c' }}>{person}</small>}
          </Space>
        );
      },
    },
    {
      title: 'Yuk summasi',
      key: 'expected',
      render: (_: any, record: any) => {
        const exp = Number(record.total_expected_amount_uzs ?? record.total_expected_amount_usd ?? 0);
        return exp > 0 ? formatCurrency(exp, 'UZS') : '-';
      },
    },
    {
      title: 'Telefon',
      dataIndex: 'number',
      key: 'number',
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button
          type="primary"
          onClick={() => handleSelectClient(record)}
          disabled={selectedClient?.id === record.id}
        >
          {selectedClient?.id === record.id ? 'Tanlangan' : 'Tanlash'}
        </Button>
      ),
    },
  ];

  const clients = raysId ? getClientsForRays(raysId) : [];
  const remainingPreview = Math.max(
    0,
    Number(totalExpectedValue || 0) - Number(amountValue || 0)
  );

  return (
    <Modal
      title="Yangi to'lov yaratish"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <div style={{ marginBottom: 16 }}>
        <h3>Mijozni tanlang</h3>
        <Table
          columns={clientColumns}
          dataSource={clients}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </div>

      <div style={{ display: selectedClient ? 'block' : 'none' }}>
        {selectedClient && (
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Tag color="blue">Tanlangan mijoz:</Tag>
              <span>
                {selectedClient.company?.trim() || `${selectedClient.first_name || ''} ${selectedClient.last_name || ''}`.trim()}
              </span>
              {selectedClient.company && selectedClient.first_name && selectedClient.company.trim() !== selectedClient.first_name.trim() && (
                <small style={{ color: '#8c8c8c' }}>
                  ({selectedClient.first_name} {selectedClient.last_name || ''})
                </small>
              )}
            </Space>
          </div>
        )}

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
              message="Qarz sifatida belgilash"
              description="Hozir to'lanayotgan summa maydoniga faqat hozir olingan pulni (to'lanmagan bo'lsa 0) kiriting."
            />
          )}

          <Form.Item
            name="total_expected_amount"
            label="Umumiy / Kelishilgan summa (so'm)"
            hidden={!isDebt}
            rules={isDebt ? [{ required: true, message: 'Umumiy summani kiriting' }] : []}
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
              label={isDebt ? "Hozir to'lanayotgan summa (so'm)" : "Summa (so'm)"}
              rules={[{ required: true, message: 'Summani kiriting' }]}
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
                  {formatCurrency(remainingPreview, 'UZS')}
                </strong>
              </div>
            )}

            <Form.Item
              name="payment_way"
              label="To'lov turi"
              rules={[{ required: true, message: "To'lov turini tanlang" }]}
            >
              <Select>
                {paymentWays.map(way => (
                  <Select.Option key={way.id} value={way.id}>{way.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="comment"
              label="Izoh"
            >
              <Input.TextArea rows={2} placeholder="Izoh kiriting" />
            </Form.Item>

            <Form.Item name="is_debt" valuePropName="checked">
              <Checkbox
                onChange={(e) => {
                  const checked = e.target.checked;
                  const exp = Math.round(
                    Number(
                      selectedClient?.total_expected_amount_uzs ??
                      selectedClient?.total_expected_amount_usd ??
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
                      Number(selectedClient?.total_remaining_uzs ?? selectedClient?.total_remaining_usd ?? exp)
                    );
                    if ((form.getFieldValue('amount') ?? 0) === 0 && rem > 0) {
                      form.setFieldValue('amount', rem);
                    }
                  }
                }}
              >
                Qarz
              </Checkbox>
            </Form.Item>

            <Form.Item name="is_via_driver" valuePropName="checked">
              <Checkbox>Haydovchi orqali</Checkbox>
            </Form.Item>

            <Form.Item name="is_delivered_to_cashier" valuePropName="checked">
              <Checkbox>Kassaga topshirilgan</Checkbox>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                To`lovni saqlash
              </Button>
            </Form.Item>
          </Form>
      </div>
    </Modal>
  );
};

export default ClientPaymentModal;