import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  message,
  Badge,
  Collapse,
  Tabs,
  Row,
  Col,
  Divider,
  Checkbox,
  Alert,
} from 'antd';
import type { Breakpoint } from 'antd';
import {
  SearchOutlined,
  DollarOutlined,
  CarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  RightOutlined
} from '@ant-design/icons';
import axiosInstance from '@/api/axiosInstance';
import { formatCurrency } from '@/utils/formatCurrency';
import { useQueryClient } from '@tanstack/react-query';

const { Option } = Select;

interface Client {
  id: number;
  first_name: string;
  company: string;
  total_expected_amount_usd?: number;
  total_expected_amount_uzs?: number;
  casa_paid?: number;
  casa_paid_uzs?: number;
  total_remaining_usd?: number;
  total_remaining_uzs?: number;
  products?: { id: number; name: string; price_usd: number; price_uzs?: number }[];
}

interface RaysClientsMap {
  rays_id: number;
  clients: Client[];
}

interface RaysPayment {
  id?: number | string;
  client: number;
  rays: number;
  amount: number;
  amount_in_usd?: string;
  currency: number; // Changed from string to number to match API expectation
  payment_way: number | string;
  payment_way_name?: string;
  comment?: string;
  is_debt?: boolean;
  is_via_driver?: boolean;
  is_delivered_to_cashier?: boolean;
  total_expected_amount?: number;
  paid_amount?: number;
  created_at?: string;
  status?: string;
  client_name?: string;
  product?: number;
  driver?: number;
  custom_rate_to_uzs: string;
}

// Form values for payment creation
interface PaymentFormValues {
  amount: number;
  total_expected_amount?: number;
  currency?: string;
  payment_way: number;
  comment?: string;
  is_debt?: boolean;
  is_via_driver?: boolean;
  is_delivered_to_cashier?: boolean;
  driver?: number;
  custom_rate_to_uzs?: string;
}

interface Driver {
  id: number;
  fullname: string;
  phone_number: string;
}

interface PaymentCategory {
  id: number;
  name: string;
}

const RaysTulovlar: React.FC = () => {
  const queryClient = useQueryClient();
  const [raysData, setRaysData] = useState<RaysClientsMap[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedRays, setSelectedRays] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState<boolean>(false);
  const [paymentForm] = Form.useForm();
  const [activeRaysPayments, setActiveRaysPayments] = useState<RaysPayment[]>([]);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [paymentCategories, setPaymentCategories] = useState<PaymentCategory[]>([]);
  const [paymentCategoriesLoading, setPaymentCategoriesLoading] = useState<boolean>(false);
  const [uzsId, setUzsId] = useState<number>(2); // Default to 2

  const isDebtWatched = Form.useWatch('is_debt', paymentForm);
  const amountWatched = Form.useWatch('amount', paymentForm);
  const expectedWatched = Form.useWatch('total_expected_amount', paymentForm);

  // Fetch currencies to find UZS ID
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await axiosInstance.get('/currency/');
        const data = response.data.results || response.data || [];
        const currencies = Array.isArray(data) ? data : [];
        const uzs = currencies.find((c: any) => c.currency === 'UZS');
        if (uzs) {
          setUzsId(uzs.id);
        }
      } catch (error) {
        console.error('Error fetching currencies:', error);
      }
    };
    fetchCurrencies();
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await axiosInstance.get('/customusers/?status=driver');
        setDrivers(Array.isArray(response.data) ? response.data : (response.data?.results || []));
      } catch (error) {
        console.error('Error fetching drivers:', error);
        setDrivers([]); // Default empty array
      }
    };

    fetchDrivers();
  }, []);

  // Fetch payment categories
  useEffect(() => {
    const fetchPaymentCategories = async () => {
      try {
        setPaymentCategoriesLoading(true);
        const response = await axiosInstance.get('/casacategory/');
        setPaymentCategories(Array.isArray(response.data) ? response.data : (response.data?.results || []));
      } catch (error) {
        console.error('Error fetching payment categories:', error);
        message.error("To'lov usullarini yuklashda xatolik yuz berdi");
      } finally {
        setPaymentCategoriesLoading(false);
      }
    };

    fetchPaymentCategories();
  }, []);

  // Fetch rays-clients mapping
  const fetchRaysClientsMap = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/casa/rays-clients-map/');
      const list = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      // Only keep rays that have clients (active rays)
      const activeRays = list.filter((rays: RaysClientsMap) => Array.isArray(rays.clients) && rays.clients.length > 0);
      setRaysData(activeRays);
    } catch (error) {
      message.error("Reys-mijoz ma'lumotlarini yuklashda xatolik yuz berdi");
      console.error('Error fetching rays-clients map:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch existing payments for active rays
  const fetchActiveRaysPayments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/casa/');
      const list = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      setActiveRaysPayments(list);
    } catch (error) {
      message.error("To'lovlar ma'lumotlarini yuklashda xatolik yuz berdi");
      console.error('Error fetching active rays payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isClient) {
      fetchRaysClientsMap();
      fetchActiveRaysPayments();
    }
  }, [isClient]);

  const openPaymentModal = (raysId: number, client: Client) => {
    setSelectedRays(raysId);
    setSelectedClient(client);
    setIsPaymentModalVisible(true);
  };

  useEffect(() => {
    if (!isPaymentModalVisible || !selectedClient) return;
    const expectedSum = Math.round(Number(selectedClient.total_expected_amount_uzs ?? selectedClient.total_expected_amount_usd ?? 0));
    const remainingSum = Math.max(0, Math.round(Number(selectedClient.total_remaining_uzs ?? selectedClient.total_remaining_usd ?? expectedSum)));
    paymentForm.resetFields();
    paymentForm.setFieldsValue({
      total_expected_amount: expectedSum > 0 ? expectedSum : undefined,
      amount: remainingSum > 0 ? remainingSum : (expectedSum > 0 ? expectedSum : 0),
      payment_way: paymentCategories.length > 0 ? paymentCategories[0].id : undefined,
      is_debt: false,
      is_via_driver: false,
      is_delivered_to_cashier: false,
      comment: '',
    });
  }, [isPaymentModalVisible, selectedClient, paymentForm]);

  useEffect(() => {
    if (isPaymentModalVisible && paymentCategories.length > 0 && !paymentForm.isFieldTouched('payment_way')) {
      paymentForm.setFieldValue('payment_way', paymentCategories[0].id);
    }
  }, [isPaymentModalVisible, paymentCategories, paymentForm]);

  const handleCreatePayment = async (values: PaymentFormValues) => {
    if (!selectedRays || !selectedClient) {
      message.error('Reys yoki mijoz tanlanmagan');
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
        message.error("Qarz yozish uchun hozir to'lanayotgan summa umumiy summadan kichik bo'lishi kerak (masalan, 0 so'm)");
        return;
      }
    } else if (paidNow <= 0) {
      message.error("To'lov summasi 0 dan katta bo'lishi kerak");
      return;
    }

    const paymentData: RaysPayment = {
      client: selectedClient.id,
      rays: selectedRays,
      amount: paidNow,
      amount_in_usd: String(paidNow),
      currency: uzsId,
      payment_way: values.payment_way,
      comment: values.comment || (isDebtTx ? `Qarz (Umumiy: ${expectedTotal.toLocaleString()} so'm)` : ''),
      is_debt: isDebtTx,
      is_via_driver: values.is_via_driver || false,
      is_delivered_to_cashier: values.is_delivered_to_cashier || false,
      ...(isDebtTx && {
        total_expected_amount: expectedTotal,
        paid_amount: paidNow,
      }),
      custom_rate_to_uzs: "1"
    };

    if (values.driver) {
      paymentData.driver = values.driver;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/casa/', paymentData);
      message.success(isDebtTx ? "Qarz yozuvi muvaffaqiyatli qo'shildi" : "To'lov muvaffaqiyatli qo'shildi");
      paymentForm.resetFields();
      setIsPaymentModalVisible(false);
      fetchActiveRaysPayments();
      fetchRaysClientsMap();
      queryClient.invalidateQueries();
    } catch (error: any) {
      console.error('Error creating payment:', error);
      let errorMessage = "To'lov qo'shishda xatolik yuz berdi";
      if (error.response && error.response.data) {
        const responseData = error.response.data;
        if (responseData.detail) {
          errorMessage = `Xatolik: ${responseData.detail}`;
        } else if (typeof responseData === 'object') {
          const errors = Object.entries(responseData)
            .map(([field, messages]) => `${field}: ${messages}`)
            .join(', ');
          errorMessage = `Xatolik: ${errors}`;
        }
      }
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filtered rays by search text
  const filteredRaysData = raysData.filter(rays => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;
    const matchRaysId = String(rays.rays_id).toLowerCase().includes(q);
    const matchClient = rays.clients.some(c =>
      (c.first_name || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q)
    );
    return matchRaysId || matchClient;
  });

  // Prepare tabs for collapse panels
  const getClientsTabs = (rays: RaysClientsMap) => {
    return [
      {
        key: 'clients',
        label: (
          <span>
            <UserOutlined /> Mijozlar bo&apos;yicha to&apos;lovlar
          </span>
        ),
        children: (
          <Row gutter={[16, 16]}>
            {rays.clients.map(client => {
              const clientPayments = activeRaysPayments
                .filter(payment => payment.rays === rays.rays_id && payment.client === client.id)
                .map((payment, index) => ({
                  ...payment,
                  id: payment.id || `temp-client-payment-${index}`
                }));

              const expectedUzs = client.total_expected_amount_uzs ?? client.total_expected_amount_usd;
              const paidUzs = client.casa_paid_uzs ?? client.casa_paid ?? 0;
              const remainingUzs =
                client.total_remaining_uzs ??
                client.total_remaining_usd ??
                Math.max(0, Number(expectedUzs || 0) - Number(paidUzs || 0));

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={`client-col-${client.id}`}>
                  <Card
                    title={
                      <Space direction="vertical" size={0}>
                        <div style={{ fontWeight: 600 }}>{client.company || client.first_name}</div>
                        {client.company && client.first_name && client.company !== client.first_name && (
                          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{client.first_name}</div>
                        )}
                      </Space>
                    }
                    className="client-payment-card"
                  >
                    <p>
                      <strong>Kelishilgan summa:</strong>{' '}
                      <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                        {expectedUzs !== undefined
                          ? formatCurrency(expectedUzs, 'UZS')
                          : 'Belgilanmagan'}
                      </span>
                    </p>
                    <p>
                      <strong>To&apos;langan:</strong>{' '}
                      <span style={{ color: '#52c41a' }}>
                        {formatCurrency(paidUzs, 'UZS')}
                      </span>
                    </p>
                    <p>
                      <strong>Qolgan qarz:</strong>{' '}
                      <span style={{ color: remainingUzs > 0 ? '#f5222d' : '#52c41a', fontWeight: 'bold' }}>
                        {formatCurrency(remainingUzs, 'UZS')}
                      </span>
                    </p>

                    {client.products && client.products.length > 0 && (
                      <div style={{ marginTop: '10px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Yuklar ro&apos;yxati:</div>
                        {client.products.map(product => {
                          const productPrice = product.price_uzs ?? product.price_usd ?? 0;
                          return (
                            <div key={`prod-${product.id}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span>• {product.name}</span>
                              <span style={{ color: '#1890ff' }}>{formatCurrency(productPrice, 'UZS')}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <Divider style={{ margin: '12px 0' }} />
                    <Button
                      type="primary"
                      icon={<DollarOutlined />}
                      onClick={() => openPaymentModal(rays.rays_id, client)}
                      block
                    >
                      To&apos;lov qo&apos;shish
                    </Button>

                    {clientPayments.length > 0 && (
                      <>
                        <Divider>To&apos;lovlar tarixi</Divider>
                        {clientPayments.map((payment, index) => (
                          <div key={payment.id ? `payment-${payment.id}` : `payment-index-${index}`} className="payment-history-item">
                            <p>
                              <Tag color="green">{payment.payment_way_name || 'Naqd'}</Tag>
                              {payment.is_debt && <Tag color="red">Qarz</Tag>}
                              <span style={{ marginLeft: 8 }}>
                                {formatCurrency(payment.amount, 'UZS')}
                              </span>
                              {payment.is_debt && payment.total_expected_amount ? (
                                <span style={{ display: 'block', fontSize: 11, color: '#8c8c8c' }}>
                                  Kelishilgan: {formatCurrency(payment.total_expected_amount, 'UZS')}
                                </span>
                              ) : null}
                              <span style={{ float: 'right', color: '#8c8c8c', fontSize: 12 }}>
                                {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '-'}
                              </span>
                            </p>
                          </div>
                        ))}
                      </>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        )
      },
      {
        key: 'history',
        label: (
          <span>
            <ClockCircleOutlined /> To&apos;lovlar tarixi
          </span>
        ),
        children: (
          <Table
            dataSource={activeRaysPayments
              .filter(payment => payment.rays === rays.rays_id)
              .map((payment, index) => ({
                ...payment,
                id: payment.id || `temp-payment-${index}`
              }))}
            rowKey={(record) => `payment-history-${record.id}`}
            pagination={false}
            columns={[
              {
                title: 'Sana',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
              },
              {
                title: 'Mijoz',
                dataIndex: 'client_name',
                key: 'client_name',
                responsive: ['sm'] as Breakpoint[],
                render: (clientName: string, record: RaysPayment) => {
                  const matchedClient = rays.clients.find(c => c.id === record.client);
                  const company = matchedClient?.company?.trim();
                  const primary = company || clientName || '-';
                  const showSub = company && clientName && company.toLowerCase() !== clientName.trim().toLowerCase();
                  return (
                    <Space direction="vertical" size={0}>
                      <span style={{ fontWeight: 500 }}>{primary}</span>
                      {showSub && <small style={{ color: '#8c8c8c' }}>{clientName}</small>}
                    </Space>
                  );
                },
              },
              {
                title: 'Summa',
                dataIndex: 'amount',
                key: 'amount',
                render: (amount: number, record: RaysPayment) => (
                  <Space direction="vertical" size={0}>
                    <span style={{ color: record.is_debt && amount === 0 ? '#f5222d' : '#52c41a' }}>
                      {formatCurrency(amount, 'UZS')}
                    </span>
                    {record.is_debt && record.total_expected_amount ? (
                      <small style={{ color: '#8c8c8c' }}>
                        Qarz (umumiy: {formatCurrency(record.total_expected_amount, 'UZS')})
                      </small>
                    ) : null}
                  </Space>
                ),
              },
              {
                title: "To'lov turi",
                dataIndex: 'payment_way_name',
                key: 'payment_way_name',
                render: (paymentWay: string) => (
                  <Tag color="blue">{paymentWay || '-'}</Tag>
                ),
                responsive: ['md'] as Breakpoint[],
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status: string, record: RaysPayment) => (
                  <Space>
                    <Tag color={status === 'pending' ? 'orange' : 'green'}>
                      {status === 'pending' ? 'Kutilmoqda' : 'Tasdiqlangan'}
                    </Tag>
                    {record.is_debt && <Tag color="red">Qarz</Tag>}
                  </Space>
                ),
                responsive: ['sm'] as Breakpoint[],
              },
              {
                title: 'Izoh',
                dataIndex: 'comment',
                key: 'comment',
                render: (comment: string) => comment || '-',
                responsive: ['lg'] as Breakpoint[],
              },
            ]}
            scroll={{ x: 'max-content' }}
          />
        )
      }
    ];
  };

  const calculatedDebtRemaining = Math.max(
    0,
    Number(expectedWatched || 0) - Number(amountWatched || 0)
  );

  return (
    <div className="rays-payments">
      {isClient ? (
        <Card
          title={
            <Space>
              <CarOutlined />
              Aktiv reyslar bo`yicha to&apos;lovlar
            </Space>
          }
          extra={
            <Button
              type="primary"
              onClick={() => {
                fetchRaysClientsMap();
                fetchActiveRaysPayments();
              }}
              loading={loading}
            >
              Yangilash
            </Button>
          }
        >
          <div style={{ marginBottom: 16 }}>
            <Input
              placeholder="Reys ID yoki mijoz nomi bo'yicha qidirish"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
              style={{ width: 300 }}
            />
          </div>

          <Collapse
            expandIconPosition="end"
            expandIcon={({ isActive }) => <RightOutlined rotate={isActive ? 90 : 0} />}
            items={filteredRaysData.map(rays => ({
              key: `rays-${rays.rays_id}`,
              label: (
                <Space wrap>
                  <Badge count={rays.clients.length} style={{ backgroundColor: '#108ee9' }}>
                    <Tag icon={<CarOutlined />} color="blue">Reys #{rays.rays_id}</Tag>
                  </Badge>
                  <span>Mijozlar: </span>
                  {rays.clients.map(client => (
                    <Tag key={`client-tag-${client.id}`} icon={<UserOutlined />} color="cyan">
                      {client.company || client.first_name}
                    </Tag>
                  ))}
                </Space>
              ),
              children: (
                <Tabs defaultActiveKey="clients" type="card" items={getClientsTabs(rays)} />
              )
            }))}
          />
          {filteredRaysData.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <InfoCircleOutlined style={{ fontSize: 24, color: '#ccc' }} />
              <p>Aktiv reyslar topilmadi yoki filter bo&apos;yicha mos reyslar yo&apos;q</p>
            </div>
          )}

          <Modal
            title={`${selectedClient?.company || selectedClient?.first_name || ''} - To'lov qo'shish`}
            open={isPaymentModalVisible}
            onCancel={() => setIsPaymentModalVisible(false)}
            footer={null}
            forceRender={true}
          >
            {selectedClient && (
              <div style={{ marginBottom: 16 }}>
                <Space wrap>
                  <span>
                    Mijoz:{' '}
                    <Tag icon={<UserOutlined />}>
                      {selectedClient.company || selectedClient.first_name}
                    </Tag>
                    {selectedClient.company && selectedClient.first_name && selectedClient.company !== selectedClient.first_name && (
                      <small style={{ color: '#8c8c8c' }}>({selectedClient.first_name})</small>
                    )}
                  </span>
                  <span>Reys ID: <Tag icon={<CarOutlined />} color="blue">#{selectedRays}</Tag></span>
                </Space>
              </div>
            )}

            <Form
              form={paymentForm}
              layout="vertical"
              onFinish={handleCreatePayment}
            >
              {isDebtWatched && (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Qarz sifatida belgilash"
                  description="Hozir to'lanayotgan summa maydoniga faqat hozir qo'lga olingan pulni kiriting (to'lanmagan bo'lsa 0 qoldiring). Umumiy kelishilgan summa bilan farqi mijozning qarzi sifatida saqlanadi."
                />
              )}

              <Form.Item
                name="total_expected_amount"
                label="Umumiy / Kelishilgan summa (so'm)"
                hidden={!isDebtWatched}
                rules={isDebtWatched ? [{ required: true, message: "Iltimos, umumiy summani kiriting" }] : []}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={isDebtWatched ? 1 : 0}
                  placeholder="Kelishilgan umumiy summa"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => (value ? value.replace(/\$\s?|(,*)/g, '') : '') as any}
                />
              </Form.Item>

              <Form.Item
                name="amount"
                label={isDebtWatched ? "Hozir to'lanayotgan summa (so'm)" : "To'lov summasi (so'm)"}
                rules={[{ required: true, message: "Iltimos, summani kiriting" }]}
                extra={isDebtWatched ? "Agar mijoz hozir pul bermagan bo'lsa, 0 qoldiring" : undefined}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={isDebtWatched ? 0 : 1}
                  placeholder={isDebtWatched ? "0" : "To'lov miqdori"}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => (value ? value.replace(/\$\s?|(,*)/g, '') : '') as any}
                />
              </Form.Item>

              {isDebtWatched && (
                <div style={{ marginBottom: 16, padding: '8px 12px', background: '#fff1f0', borderRadius: 6, border: '1px solid #ffa39e' }}>
                  <span>Qarzga yoziladigan qoldiq: </span>
                  <strong style={{ color: '#cf1322' }}>
                    {formatCurrency(calculatedDebtRemaining, 'UZS')}
                  </strong>
                </div>
              )}

              <Form.Item
                name="payment_way"
                label="To'lov usuli"
                rules={[{ required: true, message: "Iltimos, to'lov usulini tanlang" }]}
              >
                {paymentCategoriesLoading ? (
                  <div>To`lov usullari yuklanmoqda...</div>
                ) : (
                  <Select placeholder={paymentCategories.length === 0 ? "To'lov usullari mavjud emas" : "To'lov usulini tanlang"}>
                    {paymentCategories.map(category => (
                      <Option key={`payment-way-${category.id}`} value={category.id}>
                        {category.name}
                      </Option>
                    ))}
                  </Select>
                )}
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="is_debt"
                    valuePropName="checked"
                  >
                    <Checkbox
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const clientExp = Math.round(
                          Number(
                            selectedClient?.total_expected_amount_uzs ??
                            selectedClient?.total_expected_amount_usd ??
                            paymentForm.getFieldValue('total_expected_amount') ??
                            paymentForm.getFieldValue('amount') ??
                            0
                          )
                        );
                        if (checked) {
                          if (!paymentForm.getFieldValue('total_expected_amount') && clientExp > 0) {
                            paymentForm.setFieldValue('total_expected_amount', clientExp);
                          }
                          paymentForm.setFieldValue('amount', 0);
                        } else {
                          const rem = Math.max(
                            0,
                            Math.round(Number(selectedClient?.total_remaining_uzs ?? selectedClient?.total_remaining_usd ?? clientExp))
                          );
                          if ((paymentForm.getFieldValue('amount') ?? 0) === 0 && rem > 0) {
                            paymentForm.setFieldValue('amount', rem);
                          }
                        }
                      }}
                    >
                      Qarz sifatida
                    </Checkbox>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="is_via_driver"
                    valuePropName="checked"
                  >
                    <Checkbox>
                      Haydovchi orqali
                    </Checkbox>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="comment"
                label="Izoh"
              >
                <Input.TextArea rows={2} placeholder="Izoh qoldiring..." />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
                  To`lovni saqlash
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </Card>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Yuklanmoqda...</p>
        </div>
      )}

      <style jsx global>{`
        .client-payment-card {
          height: 100%;
          transition: all 0.3s;
        }
        
        .client-payment-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-5px);
        }
        
        .payment-history-item {
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .payment-history-item:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
};

export default RaysTulovlar; 
