"use client"

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Table, Tag, Spin, Button, Empty, Alert, Descriptions } from 'antd';
import { DollarOutlined, CarOutlined, CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined, HistoryOutlined, WalletOutlined, BarChartOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import axiosInstance from '../../../../../api/axiosInstance';

const { Title, Text } = Typography;

interface ClientAnalyticsProps {
  clientId: number;
}

interface Trip {
  id: number;
  created_at: string;
  price?: number;
  status?: string;
}

interface ClientDebt {
  client_id: number;
  fullname: string;
  client_company: string;
  expected_uzs?: number;
  paid_uzs?: number;
  remaining_uzs?: number;
  expected_usd: number;
  paid_usd: number;
  remaining_usd: number;
}

interface ClientHistoryData {
  client: {
    id: number;
    first_name: string;
    last_name: string;
    number: string;
    city: string;
    company?: string;
  };
  rays_history: Trip[];
  rays_count: number;
  total_paid?: {
    USD?: number;
    UZS?: number;
    RUB?: number;
  };
  total_paid_usd?: number;
}

const ClientAnalytics: React.FC<ClientAnalyticsProps> = ({ clientId }) => {
  const [historyData, setHistoryData] = useState<ClientHistoryData | null>(null);
  const [debtData, setDebtData] = useState<ClientDebt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch client data and trips individually since /history/.../client-history/ is returning 404
        const [clientRes, raysRes, historyRes, debtsResponse] = await Promise.all([
          axiosInstance.get(`/clients/${clientId}/`),
          axiosInstance.get(`/rays/?client=${clientId}`),
          axiosInstance.get(`/rayshistory/?client=${clientId}`).catch(() => ({ data: [] })),
          axiosInstance.get(`/casa/all-debts/`)
        ]);

        const clientData = clientRes.data;
        const activeTrips = Array.isArray(raysRes.data) ? raysRes.data : (raysRes.data?.results || []);
        const historyTrips = Array.isArray(historyRes.data) ? historyRes.data : (historyRes.data?.results || []);
        
        // Combine and deduplicate trips
        const allTrips = [...activeTrips, ...historyTrips];
        const tripsMap = new Map();
        allTrips.forEach(trip => {
          if (trip.id) tripsMap.set(trip.id, trip);
        });
        const trips = Array.from(tripsMap.values());

        let totalUSD = 0;
        let totalUZS = 0;
        let totalRUB = 0;

        trips.forEach((trip: any) => {
          const tripAmount = Number(trip.price || trip.cost || 0);
          if (trip.payment_currency === 'USD') totalUSD += tripAmount;
          else if (trip.payment_currency === 'RUB') totalRUB += tripAmount;
          else totalUZS += tripAmount;
        });

        const constructedHistoryData = {
          client: clientData,
          rays_history: trips,
          rays_count: trips.length,
          total_paid: { USD: totalUSD, UZS: totalUZS, RUB: totalRUB },
          total_paid_usd: totalUZS
        };

        const rawDebts = Array.isArray(debtsResponse.data)
          ? debtsResponse.data
          : (debtsResponse.data?.results || []);
        const clientDebtRows = rawDebts.filter((item: ClientDebt) => item.client_id === clientId);
        const clientDebt: ClientDebt | null = clientDebtRows.length > 0
          ? clientDebtRows.reduce<ClientDebt>((acc, row) => ({
              client_id: clientId,
              fullname: acc.fullname || row.fullname || '',
              client_company: acc.client_company || row.client_company || '',
              expected_uzs: (acc.expected_uzs || 0) + Number(row.expected_uzs ?? row.expected_usd ?? 0),
              paid_uzs: (acc.paid_uzs || 0) + Number(row.paid_uzs ?? row.paid_usd ?? 0),
              remaining_uzs: (acc.remaining_uzs || 0) + Math.max(0, Number(row.remaining_uzs ?? row.remaining_usd ?? 0)),
              expected_usd: acc.expected_usd + Number(row.expected_uzs ?? row.expected_usd ?? 0),
              paid_usd: acc.paid_usd + Number(row.paid_uzs ?? row.paid_usd ?? 0),
              remaining_usd: acc.remaining_usd + Math.max(0, Number(row.remaining_uzs ?? row.remaining_usd ?? 0)),
            }), {
              client_id: clientId,
              fullname: '',
              client_company: '',
              expected_uzs: 0,
              paid_uzs: 0,
              remaining_uzs: 0,
              expected_usd: 0,
              paid_usd: 0,
              remaining_usd: 0,
            })
          : null;

        setHistoryData(constructedHistoryData);
        setDebtData(clientDebt);
      } catch (err) {
        console.error('Error fetching client data:', err);
        setError("Mijoz ma'lumotlarini yuklashda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchData();
    }
  }, [clientId]);

  if (loading) {
    return (
      <div className="centered-content">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Xatolik"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  if (!historyData) {
    return (
      <Empty
        description="Mijoz ma'lumotlari topilmadi"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  // Format date utility function
  const formatDate = (dateString: string) => {
    if (!dateString) return "Sana ma'lum emas";

    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return "Noto'g'ri sana";
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "0";
    return amount.toLocaleString();
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Sana',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDate(date)
    },
    {
      title: 'Summa',
      dataIndex: 'price',
      key: 'price',
      render: (price: number, record: any) => `${formatCurrency(Number(price || record.cost || 0))} ${record.payment_currency || 'UZS'}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'blue';
        let label = status;
        if (status === 'completed') { color = 'green'; label = 'Yakunlangan'; }
        else if (status === 'in_progress') { color = 'orange'; label = 'Jarayonda'; }
        else if (status === 'canceled') { color = 'red'; label = 'Bekor qilingan'; }
        return <Tag color={color}>{label}</Tag>;
      }
    }
  ];

  const paidAmountUzs = debtData
    ? Number(debtData.paid_uzs ?? debtData.paid_usd ?? 0)
    : Number(historyData.total_paid?.UZS || 0);
  const expectedAmountUzs = Number(debtData?.expected_uzs ?? debtData?.expected_usd ?? 0);
  const remainingAmountUzs = Number(debtData?.remaining_uzs ?? debtData?.remaining_usd ?? 0);

  return (
    <div className="client-analytics">
      <Title level={4}>Mijoz statistikasi va tarixi</Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Jami qatnovlar"
              value={historyData.rays_count || 0}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="To'langan summa (so'm)"
              value={paidAmountUzs}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix="so'm"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Kutilgan to'lov (so'm)"
              value={expectedAmountUzs}
              prefix={<WalletOutlined />}
              suffix="so'm"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Qolgan to'lov (so'm)"
              value={remainingAmountUzs}
              prefix={<BarChartOutlined />}
              valueStyle={{
                color: remainingAmountUzs > 0 ? '#cf1322' : '#3f8600'
              }}
              suffix="so'm"
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Summary Card */}
      <Card style={{ marginTop: 24, background: '#f0f5ff' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={16}>
            <Text type="secondary" style={{ fontSize: '14px' }}>Mijozning umumiy holati:</Text>
            <div style={{ marginTop: 8 }}>
              {remainingAmountUzs > 0 ? (
                <Tag color="red" style={{ fontSize: '14px', padding: '4px 12px' }}>
                  <WalletOutlined /> Qarzdorlik mavjud
                </Tag>
              ) : (
                <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>
                  <CheckCircleOutlined /> To&apos;lov to&apos;liq amalga oshirilgan
                </Tag>
              )}
            </div>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Text type="secondary">Oxirgi hisob-kitob:</Text>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 4 }}>
              {formatDate(new Date().toISOString())}
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <HistoryOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            <span>Reyslar tarixi</span>
          </div>
        }
        style={{ marginTop: 24 }}
      >
        {historyData.rays_history && historyData.rays_history.length > 0 ? (
          <Table
            dataSource={historyData.rays_history}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        ) : (
          <Empty description="Reyslar tarixi topilmadi" />
        )}
      </Card>

      {/* Payment guidance if there's remaining balance */}
      {debtData && remainingAmountUzs > 0 && (
        <Alert
          message="To'lov eslatmasi"
          description={`${debtData.client_company || debtData.fullname} uchun ${formatCurrency(remainingAmountUzs)} so'm miqdorida to'lov kutilmoqda.`}
          type="warning"
          showIcon
          style={{ marginTop: 24 }}
        />
      )}

      <style jsx global>{`
        .centered-content {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 200px;
        }
        
        .client-analytics .ant-card {
          height: 100%;
        }
      `}</style>
    </div>
  );
};

export default ClientAnalytics; 