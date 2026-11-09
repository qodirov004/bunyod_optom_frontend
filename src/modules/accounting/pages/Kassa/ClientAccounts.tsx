import React, { useEffect, useState } from 'react';
import {
  Table, Card, Button, Space, Tag, Tooltip, Modal, Form,
  Input, Row, Col, Statistic,
  Typography, Empty, message, InputNumber, Select, Alert
} from 'antd';
import {
  EyeOutlined, DollarOutlined, SearchOutlined, FilterOutlined,
  UserOutlined,
  FallOutlined, ArrowUpOutlined, ArrowDownOutlined, CheckCircleOutlined,
  ClockCircleOutlined, ReloadOutlined, WarningOutlined
} from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { formatCurrency } from '@/utils/formatCurrency';
import { useClients } from '../../hooks/useClients';

const { Title } = Typography;
const { Option } = Select;

interface ClientDebt {
  key?: string;
  id: string | number; // Trip or Transaction History ID
  client_id: number;
  fullname: string;
  client_company?: string | null;
  trip_id: string | number;
  date: string;
  expected_uzs?: number;
  paid_uzs?: number;
  remaining_uzs?: number;
  expected_usd: number;
  paid_usd: number;
  remaining_usd: number;
}
interface PaymentHistory {
  id: number;
  client_name: string;
  payment_name: string;
  driver_name: string | null;
  amount: number;
  amount_in_usd: string;
  status: string;
  comment: string;
  is_via_driver: boolean;
  is_confirmed_by_cashier: boolean;
  is_delivered_to_cashier: boolean;
  total_expected_amount: number;
  paid_amount: number;
  remaining_debt: number;
  expected_uzs?: number;
  paid_uzs?: number;
  remaining_uzs?: number;
  is_debt: boolean;
  created_at: string;
  moved_at: string;
  client: number;
  rays: number | null;
  rays_history: number | null;
  product: number | null;
  driver: number | null;
  currency: number;
  payment_way: number;
  cashier: number | null;
}

const getExpected = (d?: Partial<ClientDebt> | null): number =>
  Number(d?.expected_uzs ?? d?.expected_usd ?? 0);

const getPaid = (d?: Partial<ClientDebt> | null): number =>
  Number(d?.paid_uzs ?? d?.paid_usd ?? 0);

const getRemaining = (d?: Partial<ClientDebt> | null): number =>
  Number(d?.remaining_uzs ?? d?.remaining_usd ?? 0);

const getClientPrimaryName = (d?: Partial<ClientDebt> | null): string =>
  (d?.client_company && d.client_company.trim()) || d?.fullname || '-';

const getClientDirectorSubname = (d?: Partial<ClientDebt> | null): string | null => {
  const company = d?.client_company?.trim();
  const full = d?.fullname?.trim();
  return company && full && company.toLowerCase() !== full.toLowerCase() ? full : null;
};

const ClientAccounts: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: clientsData, isLoading: isClientsLoading } = useClients();
  const [debts, setDebts] = useState<ClientDebt[]>([]);
  const [filteredDebts, setFilteredDebts] = useState<ClientDebt[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<ClientDebt | null>(null);
  const [form] = Form.useForm();
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [clientHistory, setClientHistory] = useState<PaymentHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedClientName, setSelectedClientName] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<{ id: number; name: string }[]>([]);

  // Filter states
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'debt' | 'paid'>('all');

  // Stats
  const [totalStats, setTotalStats] = useState({
    totalClients: 0,
    debtorsCount: 0,
    totalDebt: 0,
    totalPaid: 0,
    averageDebt: 0,
    topDebtors: [] as ClientDebt[]
  });

  const [refreshing, setRefreshing] = useState(false);



  // Fetch payment methods from backend
  const fetchPaymentMethods = async () => {
    try {
      const response = await axiosInstance.get('/casacategory/');
      const methodsData = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      setPaymentMethods(methodsData);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const [uzsId, setUzsId] = useState<number>(2); // Default to 2

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

  const processDebtsResponse = (rawData: any) => {
    const rawList: ClientDebt[] = Array.isArray(rawData)
      ? rawData
      : (rawData?.results || []);

    if (rawList.length === 0) {
      return {
        debtsWithKey: [] as ClientDebt[],
        stats: {
          totalClients: 0,
          debtorsCount: 0,
          totalDebt: 0,
          totalPaid: 0,
          averageDebt: 0,
          topDebtors: [] as ClientDebt[],
        }
      };
    }

    const debtsWithKey = rawList.map((debt, idx) => ({
      ...debt,
      key: `${debt.client_id ?? 'c'}-${debt.trip_id ?? debt.id ?? 't'}-${idx}`,
    }));

    const activeDebtRows = debtsWithKey.filter(d => getRemaining(d) > 0);
    const uniqueDebtorIds = new Set(activeDebtRows.map(d => d.client_id));
    const uniqueAllClientIds = new Set(debtsWithKey.map(d => d.client_id));

    const totalDebt = activeDebtRows.reduce((sum, debt) => sum + getRemaining(debt), 0);
    const totalPaid = debtsWithKey.reduce((sum, debt) => sum + getPaid(debt), 0);
    const averageDebt = uniqueDebtorIds.size > 0 ? totalDebt / uniqueDebtorIds.size : 0;
    const topDebtors = [...activeDebtRows]
      .sort((a, b) => getRemaining(b) - getRemaining(a))
      .slice(0, 3);

    return {
      debtsWithKey,
      stats: {
        totalClients: uniqueAllClientIds.size || debtsWithKey.length,
        debtorsCount: uniqueDebtorIds.size,
        totalDebt,
        totalPaid,
        averageDebt,
        topDebtors,
      }
    };
  };

  // Powerful refresh function with cache busting
  const forceRefreshData = async () => {
    try {
      setRefreshing(true);
      const response = await axiosInstance.get(`/casa/all-debts/`);
      const { debtsWithKey, stats } = processDebtsResponse(response.data);

      setDebts(debtsWithKey);
      setTotalStats(stats);

      if (debtsWithKey.length > 0) {
        message.success("Ma'lumotlar yangilandi");
      } else {
        message.info("Hozircha qarz yozuvlari yo'q");
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      message.error("Ma'lumotlarni yangilashda xatolik yuz berdi");
      setDebts([]);
      setFilteredDebts([]);
      setTotalStats({
        totalClients: 0,
        debtorsCount: 0,
        totalDebt: 0,
        totalPaid: 0,
        averageDebt: 0,
        topDebtors: []
      });
    } finally {
      setRefreshing(false);
    }
  };

  const fetchDebts = async () => {
    try {
      setLoading(true);
      await fetchPaymentMethods();
      const response = await axiosInstance.get(`/casa/all-debts/`);
      const { debtsWithKey, stats } = processDebtsResponse(response.data);

      setDebts(debtsWithKey);
      setTotalStats(stats);
    } catch (error) {
      console.error('Error fetching client debts:', error);
      message.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
      setDebts([]);
      setFilteredDebts([]);
      setTotalStats({
        totalClients: 0,
        debtorsCount: 0,
        totalDebt: 0,
        totalPaid: 0,
        averageDebt: 0,
        topDebtors: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  // Apply filters when search value, statusFilter, or debts changes
  useEffect(() => {
    let filtered = [...debts];

    const q = searchValue.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(debt =>
        (debt.fullname || '').toLowerCase().includes(q) ||
        (debt.client_company || '').toLowerCase().includes(q) ||
        String(debt.trip_id ?? '').toLowerCase().includes(q)
      );
    }

    if (statusFilter === 'debt') {
      filtered = filtered.filter(debt => getRemaining(debt) > 0);
    } else if (statusFilter === 'paid') {
      filtered = filtered.filter(debt => getRemaining(debt) <= 0);
    }

    setFilteredDebts(filtered);
  }, [searchValue, statusFilter, debts]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const fetchClientHistory = async (clientId: number, clientName: string) => {
    setHistoryLoading(true);
    setSelectedClientName(clientName);
    try {
      const response = await axiosInstance.get('/casahistory/');
      const historyList: PaymentHistory[] = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || []);
      const filteredHistory = historyList
        .filter((item) => item.client === clientId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setClientHistory(filteredHistory);
      setHistoryModalVisible(true);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      message.error("To'lov tarixini yuklashda xatolik yuz berdi");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openPayModal = (record: ClientDebt) => {
    setSelectedClient(record.client_id);
    setSelectedClientName(getClientPrimaryName(record));
    setSelectedDebt(record);
    setModalVisible(true);
  };

  const columns = [
    {
      title: 'Mijoz',
      dataIndex: 'client_company',
      key: 'client_company',
      render: (_: unknown, record: ClientDebt) => {
        const rem = getRemaining(record);
        const primaryName = getClientPrimaryName(record);
        const directorName = getClientDirectorSubname(record);
        return (
          <Space direction="vertical" size="small">
            <Tag color="blue" icon={<UserOutlined />}>{primaryName}</Tag>
            {directorName && (
              <small style={{ color: '#666' }}>{directorName}</small>
            )}
            {rem > 0 ? (
              <Tag color="red">Qarzdor</Tag>
            ) : (
              <Tag color="green">To&apos;langan</Tag>
            )}
          </Space>
        );
      },
      sorter: (a: ClientDebt, b: ClientDebt) =>
        getClientPrimaryName(a).localeCompare(getClientPrimaryName(b)),
    },
    {
      title: 'Reys #',
      dataIndex: 'trip_id',
      key: 'trip_id',
      render: (id: string | number) => (
        <Tag color="orange">
          {typeof id === 'number' || (!isNaN(Number(id)) && id !== "Bog'lanmagan") ? `#${id}` : id}
        </Tag>
      ),
      sorter: (a: ClientDebt, b: ClientDebt) => {
        const numA = Number(a.trip_id);
        const numB = Number(b.trip_id);
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
        return String(a.trip_id ?? '').localeCompare(String(b.trip_id ?? ''));
      },
    },
    {
      title: 'Sana',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: ClientDebt, b: ClientDebt) =>
        (new Date(a.date).getTime() || 0) - (new Date(b.date).getTime() || 0),
    },
    {
      title: "Umumiy summa (so'm)",
      key: 'expected_uzs',
      align: 'right' as const,
      render: (_: unknown, record: ClientDebt) => formatCurrency(getExpected(record), 'UZS'),
      sorter: (a: ClientDebt, b: ClientDebt) => getExpected(a) - getExpected(b),
    },
    {
      title: "To'langan summa (so'm)",
      key: 'paid_uzs',
      align: 'right' as const,
      render: (_: unknown, record: ClientDebt) => formatCurrency(getPaid(record), 'UZS'),
      sorter: (a: ClientDebt, b: ClientDebt) => getPaid(a) - getPaid(b),
    },
    {
      title: "Qolgan qarz (so'm)",
      key: 'remaining_uzs',
      align: 'right' as const,
      render: (_: unknown, record: ClientDebt) => {
        const debt = getRemaining(record);
        return (
          <Tag color={debt > 0 ? 'red' : 'green'} style={{ fontSize: '14px', padding: '4px 8px' }}>
            {formatCurrency(debt, 'UZS')} {debt > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          </Tag>
        );
      },
      sorter: (a: ClientDebt, b: ClientDebt) => getRemaining(a) - getRemaining(b),
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_: unknown, record: ClientDebt) => {
        const rem = getRemaining(record);
        return (
          <Space>
            {rem > 0 ? (
              <Tooltip title="Qarzni to'lash">
                <Button
                  type="primary"
                  danger
                  shape="circle"
                  size="small"
                  icon={<DollarOutlined />}
                  onClick={() => openPayModal(record)}
                />
              </Tooltip>
            ) : (
              <Tooltip title="To'lov qo'shish">
                <Button
                  type="primary"
                  shape="circle"
                  size="small"
                  icon={<DollarOutlined />}
                  onClick={() => openPayModal(record)}
                />
              </Tooltip>
            )}
            <Tooltip title="To'lovlar tarixi">
              <Button
                shape="circle"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => fetchClientHistory(record.client_id, getClientPrimaryName(record))}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  useEffect(() => {
    if (modalVisible && selectedDebt) {
      const rem = getRemaining(selectedDebt);
      form.resetFields();
      form.setFieldsValue({
        amount: rem > 0 ? Math.round(rem) : undefined,
        payment_way: paymentMethods.length > 0 ? paymentMethods[0].id : undefined,
        comment:
          selectedDebt.trip_id && selectedDebt.trip_id !== "Bog'lanmagan"
            ? `Reys #${selectedDebt.trip_id} uchun qarz to'lovi`
            : "Qarz to'lovi",
      });
    } else if (modalVisible) {
      form.resetFields();
      form.setFieldsValue({
        payment_way: paymentMethods.length > 0 ? paymentMethods[0].id : undefined,
      });
    }
  }, [modalVisible, selectedDebt, form]);

  useEffect(() => {
    if (modalVisible && paymentMethods.length > 0 && !form.isFieldTouched('payment_way')) {
      form.setFieldValue('payment_way', paymentMethods[0].id);
    }
  }, [modalVisible, paymentMethods, form]);

  const historyColumns = [
    {
      title: 'Reys #',
      key: 'rays',
      render: (_: unknown, record: PaymentHistory) => {
        const raysVal = record.rays_history || record.rays;
        return raysVal ? <Tag color="orange">#{raysVal}</Tag> : '-';
      }
    },
    {
      title: "Kelishilgan summa (so'm)",
      key: 'total_expected_amount',
      render: (_: unknown, record: PaymentHistory) => {
        const val = Number(record.total_expected_amount ?? record.expected_uzs ?? 0);
        return <span style={{ fontWeight: 600 }}>{formatCurrency(val, 'UZS')}</span>;
      }
    },
    {
      title: "Ushbu operatsiya (so'm)",
      key: 'amount',
      render: (_: unknown, record: PaymentHistory) => {
        const val = Number(record.amount ?? 0);
        return (
          <span style={{ color: val > 0 ? '#52c41a' : '#8c8c8c', fontWeight: 500 }}>
            {formatCurrency(val, 'UZS')}
          </span>
        );
      }
    },
    {
      title: "Jami to'langan (so'm)",
      key: 'paid_amount',
      render: (_: unknown, record: PaymentHistory) => {
        const val = Number(record.paid_amount ?? record.paid_uzs ?? record.amount ?? 0);
        return <span style={{ color: '#52c41a' }}>{formatCurrency(val, 'UZS')}</span>;
      }
    },
    {
      title: "Qolgan qarz (so'm)",
      key: 'remaining_debt',
      render: (_: unknown, record: PaymentHistory) => {
        const val = Number(record.remaining_debt ?? record.remaining_uzs ?? 0);
        return (
          <span style={{ color: val > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>
            {formatCurrency(val, 'UZS')}
          </span>
        );
      }
    },
    {
      title: 'Sana',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: "To'lov usuli",
      dataIndex: 'payment_name',
      key: 'payment_name',
      render: (name: string) => (
        <Tag color="blue">{name || '-'}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'confirmed' ? 'green' : 'orange'} icon={status === 'confirmed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}>
          {status === 'confirmed' ? 'Tasdiqlangan' : 'Kutilmoqda'}
        </Tag>
      ),
    },
    {
      title: 'Qarz',
      dataIndex: 'is_debt',
      key: 'is_debt',
      render: (isDebt: boolean) => (
        isDebt ? <Tag color="red">Qarz</Tag> : <Tag color="green">To&apos;lov</Tag>
      ),
    },
    {
      title: 'Izoh',
      dataIndex: 'comment',
      key: 'comment',
      render: (comment: string) => comment || '-',
    },
  ];

  return (
    <div className="client-accounts">
      <Row gutter={[16, 16]} className="client-stats-row">
        <Col xs={24} sm={12} md={6}>
          <Card className="summary-card total-clients-card">
            <Statistic
              title="Jami mijozlar"
              value={clientsData?.total || totalStats.totalClients}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
              loading={isClientsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="summary-card">
            <Statistic
              title="Qarzdorlar soni"
              value={totalStats.debtorsCount}
              prefix={<WarningOutlined />}
              valueStyle={{ color: totalStats.debtorsCount > 0 ? '#fa8c16' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="summary-card debt-card">
            <Statistic
              title="Jami qarz (so'm)"
              value={totalStats.totalDebt}
              prefix={<FallOutlined />}
              precision={0}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="summary-card action-card">
            <Statistic
              title="O'rtacha qarz (so'm)"
              value={totalStats.averageDebt}
              precision={0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="filter-card" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Mijoz nomi, kompaniya yoki reys # qidirish"
              prefix={<SearchOutlined />}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              style={{ width: '100%' }}
            >
              <Option value="all">Barchasi ({debts.length})</Option>
              <Option value="debt">Faqat qarzdorlar ({debts.filter(d => getRemaining(d) > 0).length})</Option>
              <Option value="paid">To&apos;langanlar ({debts.filter(d => getRemaining(d) <= 0).length})</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Card
        className="clients-content-card"
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={5} style={{ margin: 0 }}>
              <FilterOutlined /> Mijozlar va ularning qarzlari
            </Title>
            <Button
              icon={<ReloadOutlined />}
              loading={refreshing}
              onClick={forceRefreshData}
              type="primary"
              style={{
                background: '#6c5ce7',
                borderColor: '#6c5ce7',
                color: '#fff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Yangilash
            </Button>
          </div>
        }
      >
        {filteredDebts.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredDebts}
            loading={loading}
            rowKey="key"
            scroll={{ x: 'max-content' }}
            pagination={{
              total: filteredDebts.length,
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Jami: ${total} ta qarz yozuvi`,
            }}
            className="client-accounts-table"
            summary={(pageData) => {
              const pageExpected = pageData.reduce((sum, record) => sum + getExpected(record), 0);
              const pagePaid = pageData.reduce((sum, record) => sum + getPaid(record), 0);
              const pageDebt = pageData.reduce((sum, record) => sum + Math.max(0, getRemaining(record)), 0);
              return (
                <Table.Summary.Row style={{ fontWeight: 'bold', background: '#fafafa' }}>
                  <Table.Summary.Cell index={0}>Jami</Table.Summary.Cell>
                  <Table.Summary.Cell index={1}></Table.Summary.Cell>
                  <Table.Summary.Cell index={2}></Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    {formatCurrency(pageExpected, 'UZS')}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    {formatCurrency(pagePaid, 'UZS')}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <Tag color={pageDebt > 0 ? 'red' : 'green'} style={{ fontSize: '14px', padding: '4px 8px' }}>
                      {formatCurrency(pageDebt, 'UZS')}
                    </Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6}></Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        ) : (
          <Empty
            description="Hozircha mos qarz yozuvlari yo'q"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      {totalStats.topDebtors.length > 0 && (
        <Card title="Eng ko'p qarzdorlar" style={{ marginTop: 16 }}>
          {totalStats.topDebtors.map((debtor, index) => {
            const primaryName = getClientPrimaryName(debtor);
            const directorName = getClientDirectorSubname(debtor);
            return (
              <Card.Grid key={debtor.key || index} style={{ width: '33.33%', textAlign: 'center' }}>
                <div style={{ padding: '10px 0' }}>
                  <UserOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>{primaryName}</div>
                  {directorName && (
                    <div style={{ fontSize: 12, color: '#666' }}>{directorName}</div>
                  )}
                  <Tag color="red" style={{ margin: '8px 0', padding: '0 8px' }}>
                    {formatCurrency(getRemaining(debtor), 'UZS')}
                  </Tag>
                  <div>
                    <Button
                      type="primary"
                      size="small"
                      icon={<DollarOutlined />}
                      onClick={() => openPayModal(debtor)}
                    >
                      To&apos;lov qo&apos;shish
                    </Button>
                  </div>
                </div>
              </Card.Grid>
            );
          })}
        </Card>
      )}

      <Modal
        title={`${selectedClientName} to'lovlar tarixi`}
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={1000}
      >
        {clientHistory.length > 0 ? (
          <Table
            dataSource={clientHistory}
            columns={historyColumns}
            rowKey="id"
            loading={historyLoading}
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 5 }}
          />
        ) : historyLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Yuklanmoqda...</div>
        ) : (
          <Empty description="To'lovlar tarixi topilmadi" />
        )}
      </Modal>

      {/* Cash Transaction Modal */}
      <Modal
        title="To'lov qo'shish"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedClient(null);
          setSelectedDebt(null);
        }}
        footer={null}
        destroyOnHidden
        forceRender={true}
      >
        {selectedClient && (
          <div style={{ marginBottom: 16 }}>
            <Space wrap>
              <span>Mijoz: <Tag icon={<UserOutlined />}>{selectedClientName}</Tag></span>
              {selectedDebt?.trip_id && (
                <span>
                  Reys: <Tag color="orange">{!isNaN(Number(selectedDebt.trip_id)) ? `#${selectedDebt.trip_id}` : selectedDebt.trip_id}</Tag>
                </span>
              )}
              <span>
                Qarz miqdori:{' '}
                <Tag icon={<DollarOutlined />} color={getRemaining(selectedDebt) > 0 ? 'red' : 'green'}>
                  {formatCurrency(getRemaining(selectedDebt), 'UZS')}
                </Tag>
              </span>
            </Space>
          </div>
        )}

        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Qarzni so'ndirish uchun to'lov kassaga yuboriladi va kassir tasdiqlaganidan so'ng balansga tushadi."
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            try {
              setLoading(true);
              const tripNum = selectedDebt?.trip_id !== undefined ? Number(selectedDebt.trip_id) : NaN;
              const paymentData: Record<string, any> = {
                client: selectedClient,
                amount: Math.round(Number(values.amount)),
                currency: uzsId,
                payment_way: values.payment_way,
                comment: values.comment || "Qarz to'lovi",
                is_debt: false,
              };

              if (!Number.isNaN(tripNum) && tripNum > 0) {
                paymentData.rays = tripNum;
              }

              try {
                await axiosInstance.post('/casa/', paymentData);
              } catch (firstErr: any) {
                if (firstErr?.response?.data?.rays && paymentData.rays) {
                  const fallbackData = { ...paymentData };
                  delete fallbackData.rays;
                  await axiosInstance.post('/casa/', fallbackData);
                } else {
                  throw firstErr;
                }
              }

              message.success("To'lov muvaffaqiyatli qo'shildi");
              setModalVisible(false);
              setSelectedClient(null);
              setSelectedDebt(null);
              form.resetFields();
              queryClient.invalidateQueries();

              setTimeout(() => {
                forceRefreshData();
              }, 800);
            } catch (error: any) {
              console.error('Error creating payment:', error);
              let errorMessage = "To'lovni saqlashda muammo yuz berdi";

              if (error.response?.data) {
                const errorData = error.response.data;
                if (errorData.client) {
                  errorMessage = `Mijoz xatosi: ${errorData.client}`;
                } else if (errorData.payment_way) {
                  errorMessage = `To'lov usuli xatosi: ${errorData.payment_way}`;
                } else if (errorData.detail) {
                  errorMessage = errorData.detail;
                }
              }

              message.error(`Xatolik: ${errorMessage}`);
            } finally {
              setLoading(false);
            }
          }}
        >
          <Form.Item
            name="amount"
            label="To'lov summasi (so'm)"
            rules={[{ required: true, message: "Iltimos, to'lov summasini kiriting" }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder="To'lov miqdori"
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => (value ? value.replace(/\$\s?|(,*)/g, '') : '') as any}
            />
          </Form.Item>

          <Form.Item
            name="payment_way"
            label="To'lov usuli"
            rules={[{ required: true, message: "Iltimos, to'lov usulini tanlang" }]}
          >
            <Select placeholder="To'lov usulini tanlang">
              {paymentMethods.map(method => (
                <Option key={`payment-${method.id}`} value={method.id}>
                  {method.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="comment"
            label="Izoh"
          >
            <Input.TextArea rows={2} placeholder="Izoh qoldiring..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
              To&apos;lovni saqlash
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default ClientAccounts;
