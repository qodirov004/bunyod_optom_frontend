import React, { useState, useEffect } from 'react';
import {
  Card, Table, Row, Col, Statistic, Progress,
  Typography, Empty, message, Button, Space, Tag,
  DatePicker, Select, Tooltip, Avatar, Tabs
} from 'antd';
import {
  ToolOutlined, CarOutlined, FireOutlined,
  ShoppingOutlined, ReloadOutlined, CarFilled,
  CalendarOutlined, DollarOutlined
} from '@ant-design/icons';
import { cashApi } from '../../api/cash/cashApi';
import { ServiceTotals, ServiceRecord } from '../../types/cash.types';
import axiosInstance from '@/api/axiosInstance';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface VehicleServiceStats {
  carId: number;
  carName: string;
  servicesCount: number;
  totalSpent: number;
  lastService: string;
}

const ServiceExpenses: React.FC = () => {
  const [serviceTotals, setServiceTotals] = useState<ServiceTotals | null>(null);
  const [serviceData, setServiceData] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [expenseType, setExpenseType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);

  const fetchServiceData = async () => {
    try {
      setLoading(true);
      // Fetch both service totals, fuel data, and car data
      const [serviceResponse, fuelResponse, carResponse] = await Promise.all([
        cashApi.getServiceTotalsWithDate(),
        axiosInstance.get('/fuel/').catch(() => ({ data: [] })),
        axiosInstance.get('/cars/').catch(() => ({ data: [] }))
      ]);

      if (serviceResponse) {
        // Build a dictionary of car IDs to names/numbers
        const carLookup: Record<number, string> = {};
        if (carResponse && Array.isArray(carResponse.data)) {
          carResponse.data.forEach((car: any) => {
            carLookup[car.id] = car.car_number || car.number || car.name || `Mashina #${car.id}`;
          });
        }

        // Fallback for any cars missing from /car/
        (serviceResponse.all_expenses || []).forEach((s: any) => {
          if (s.car && !carLookup[s.car] && s.car_name) {
            carLookup[s.car] = s.car_name;
          }
        });

        let combinedExpenses = [...(serviceResponse.all_expenses || [])].map((expense: any) => {
          const value = expense.usd_value || expense.price || 0;
          return {
            ...expense,
            car_name: carLookup[expense.car] || expense.car_name || `Mashina #${expense.car}`,
            // Move 'optol' (Топливо) from service API to 'Техобслуживание' (Texnik xizmat)
            type: expense.type === 'Топливо' || expense.type === 'optol' ? 'Техобслуживание' : expense.type,
            price: value,
            usd_value: value,
            currency: 'UZS' // Override to never show USD
          };
        });

        let fuelTotal = 0;

        // Add fuel expenses to the list
        if (fuelResponse && fuelResponse.data && Array.isArray(fuelResponse.data)) {
          const fuelData = fuelResponse.data.map((f: any) => {
            const price = Number(f.price) || 0;
            const usd_value = price; // Assuming fuel is in UZS already, or use exchange rate if needed
            fuelTotal += usd_value;

            return {
              id: f.id,
              car: f.car,
              car_name: carLookup[f.car] || `Mashina #${f.car}`,
              type: 'Топливо',
              created_at: f.created_at || f.date || new Date().toISOString(),
              price: price,
              currency: 'UZS',
              usd_value: usd_value,
              kilometer: f.kilometer || 0
            };
          });

          combinedExpenses = [...combinedExpenses, ...fuelData];
        }

        const backendTotals = serviceResponse.totals_usd || { texnic: 0, balon: 0, balon_furgon: 0, chiqimlik: 0, optol: 0, total: 0 };

        const newTotals = {
          texnic: (backendTotals.texnic || 0) + (backendTotals.optol || 0),
          balon: backendTotals.balon || 0,
          balon_furgon: backendTotals.balon_furgon || 0,
          chiqimlik: backendTotals.chiqimlik || 0,
          optol: fuelTotal, // ONLY fuel from /fuel/
          total: (backendTotals.total || 0) + fuelTotal
        };

        setServiceData(combinedExpenses);
        setServiceTotals({
          all_expenses: combinedExpenses,
          totals_usd: newTotals
        });
      }
    } catch (error) {
      console.error('Error fetching service data:', error);
      message.error('Xizmat xarajatlari ma\'lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceData();
  }, []);

  // Filter expenses based on type, date range, and car
  const filteredExpenses = React.useMemo(() => {
    if (!serviceData.length) return [];

    let filtered = [...serviceData];

    // Filter by expense type
    if (expenseType !== 'all') {
      filtered = filtered.filter(expense => {
        // Map Russian type names to our internal types
        const typeMap: Record<string, string> = {
          'Техобслуживание': 'texnic',
          'Шиномонтаж': 'balon',
          'Шиномонтаж Фургон': 'balon_furgon',
          'Расход': 'chiqimlik',
          'Топливо': 'optol'
        };

        return typeMap[expense.type] === expenseType;
      });
    }

    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');

      filtered = filtered.filter(expense => {
        const expenseDate = dayjs(expense.created_at);
        return expenseDate.isAfter(startDate) && expenseDate.isBefore(endDate);
      });
    }

    // Filter by car
    if (selectedCarId !== null) {
      filtered = filtered.filter(expense => expense.car === selectedCarId);
    }

    return filtered;
  }, [serviceData, expenseType, dateRange, selectedCarId]);

  // Calculate vehicle statistics
  const vehicleStats = React.useMemo(() => {
    if (!serviceData.length) return [];

    const stats: Record<number, VehicleServiceStats> = {};

    serviceData.forEach(service => {
      if (!stats[service.car]) {
        stats[service.car] = {
          carId: service.car,
          carName: service.car_name,
          servicesCount: 0,
          totalSpent: 0,
          lastService: service.created_at
        };
      }

      stats[service.car].servicesCount++;
      stats[service.car].totalSpent += service.usd_value;

      // Update last service date if current is more recent
      const currentDate = new Date(service.created_at);
      const lastDate = new Date(stats[service.car].lastService);
      if (currentDate > lastDate) {
        stats[service.car].lastService = service.created_at;
      }
    });

    return Object.values(stats).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [serviceData]);

  // Handle date range change
  const handleDateRangeChange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    setDateRange(dates);
  };

  // Handle type filter change
  const handleTypeChange = (value: string) => {
    setExpenseType(value);
  };

  // Handle car selection
  const handleCarSelect = (carId: number | null) => {
    setSelectedCarId(carId);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setExpenseType('all');
    setDateRange(null);
    setSelectedCarId(null);
  };

  // Get color for service type
  const getTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      'Техобслуживание': 'green',
      'Шиномонтаж': 'blue',
      'Шиномонтаж Фургон': 'cyan',
      'Расход': 'orange',
      'Топливо': 'purple'
    };
    return typeColors[type] || 'default';
  };

  // Get icon for service type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Техобслуживание': return <ToolOutlined />;
      case 'Шиномонтаж': return <CarOutlined />;
      case 'Шиномонтаж Фургон': return <CarFilled />;
      case 'Расход': return <FireOutlined />;
      case 'Топливо': return <ShoppingOutlined />;
      default: return null;
    }
  };

  // Format service type name for display
  const formatTypeName = (type: string): string => {
    const typeNames: Record<string, string> = {
      'Техобслуживание': 'Texnik xizmat',
      'Шиномонтаж': 'Balon xizmat',
      'Шиномонтаж Фургон': 'Furgon balon xizmat',
      'Расход': 'Chiqim xarajatlar',
      'Топливо': 'Yoqilg&apos;i xarajatlar'
    };
    return typeNames[type] || type;
  };

  const tabItems = [
    {
      key: 'overview',
      label: 'Umumiy ma\'lumot',
      children: (
        <>
          {/* Summary Cards */}
          <div className="summary-cards-container" style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '16px',
            overflowX: 'auto',
            paddingBottom: '8px'
          }}>
            {serviceTotals && (
              <>
                <Card className="expense-card" variant="borderless" style={{ background: '#f6ffed', flex: '1 1 0', minWidth: '150px' }} styles={{ body: { padding: '16px 12px' } }}>
                  <Statistic
                    title={<div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}><ToolOutlined /> Texnik xizmat</div>}
                    value={serviceTotals.totals_usd.texnic}
                    precision={2}
                    suffix={<span style={{ fontSize: '13px' }}>so'm</span>}
                    valueStyle={{ color: '#52c41a', fontSize: '16px', fontWeight: 600, whiteSpace: 'nowrap' }}
                  />
                </Card>
                <Card className="expense-card" variant="borderless" style={{ background: '#e6f7ff', flex: '1 1 0', minWidth: '150px' }} styles={{ body: { padding: '16px 12px' } }}>
                  <Statistic
                    title={<div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}><CarOutlined /> Balon xizmati</div>}
                    value={serviceTotals.totals_usd.balon}
                    precision={2}
                    suffix={<span style={{ fontSize: '13px' }}>so'm</span>}
                    valueStyle={{ color: '#1890ff', fontSize: '16px', fontWeight: 600, whiteSpace: 'nowrap' }}
                  />
                </Card>
                <Card className="expense-card" variant="borderless" style={{ background: '#f0f5ff', flex: '1 1 0', minWidth: '150px' }} styles={{ body: { padding: '16px 12px' } }}>
                  <Statistic
                    title={<div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}><CarFilled /> Furgon balon</div>}
                    value={serviceTotals.totals_usd.balon_furgon}
                    precision={2}
                    suffix={<span style={{ fontSize: '13px' }}>so'm</span>}
                    valueStyle={{ color: '#2f54eb', fontSize: '16px', fontWeight: 600, whiteSpace: 'nowrap' }}
                  />
                </Card>
                <Card className="expense-card" variant="borderless" style={{ background: '#fff2e8', flex: '1 1 0', minWidth: '150px' }} styles={{ body: { padding: '16px 12px' } }}>
                  <Statistic
                    title={<div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}><FireOutlined /> Chiqim xarajat</div>}
                    value={serviceTotals.totals_usd.chiqimlik}
                    precision={2}
                    suffix={<span style={{ fontSize: '13px' }}>so'm</span>}
                    valueStyle={{ color: '#fa8c16', fontSize: '16px', fontWeight: 600, whiteSpace: 'nowrap' }}
                  />
                </Card>
                <Card className="expense-card" variant="borderless" style={{ background: '#f9f0ff', flex: '1 1 0', minWidth: '150px' }} styles={{ body: { padding: '16px 12px' } }}>
                  <Statistic
                    title={<div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}><ShoppingOutlined /> Yoqilg'i xarajat</div>}
                    value={serviceTotals.totals_usd.optol}
                    precision={2}
                    suffix={<span style={{ fontSize: '13px' }}>so'm</span>}
                    valueStyle={{ color: '#722ed1', fontSize: '16px', fontWeight: 600, whiteSpace: 'nowrap' }}
                  />
                </Card>
                <Card className="expense-card" variant="borderless" style={{ background: '#fcfcfc', border: '1px solid #f0f0f0', flex: '1 1 0', minWidth: '150px' }} styles={{ body: { padding: '16px 12px' } }}>
                  <Statistic
                    title={<div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px', fontWeight: 'bold' }}><DollarOutlined /> Jami xarajat</div>}
                    value={serviceTotals.totals_usd.total}
                    precision={2}
                    suffix={<span style={{ fontSize: '13px' }}>so'm</span>}
                    valueStyle={{ color: '#000000', fontSize: '17px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                  />
                </Card>
              </>
            )}
          </div>

          {/* Progress and Percentage */}
          {serviceTotals && (
            <Card style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>Xarajatlar taqsimoti:</Text>
                  <Text strong style={{ fontSize: 16 }}>{serviceTotals.totals_usd.total.toLocaleString()} so'm</Text>
                </div>
                <Progress
                  percent={100}
                  success={{
                    percent: (serviceTotals.totals_usd.texnic / serviceTotals.totals_usd.total) * 100
                  }}
                  strokeColor={{
                    '0%': '#52c41a',
                    '25%': '#1890ff',
                    '40%': '#2f54eb',
                    '65%': '#fa8c16',
                    '100%': '#722ed1',
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  <Tooltip title={`${serviceTotals.totals_usd.texnic.toLocaleString()} so'm`}>
                    <Tag color="green">
                      Texnik: {((serviceTotals.totals_usd.texnic / serviceTotals.totals_usd.total) * 100).toFixed(1)}%
                    </Tag>
                  </Tooltip>
                  <Tooltip title={`${serviceTotals.totals_usd.balon.toLocaleString()} so'm`}>
                    <Tag color="blue">
                      Balon: {((serviceTotals.totals_usd.balon / serviceTotals.totals_usd.total) * 100).toFixed(1)}%
                    </Tag>
                  </Tooltip>
                  <Tooltip title={`${serviceTotals.totals_usd.balon_furgon.toLocaleString()} so'm`}>
                    <Tag color="cyan">
                      Furgon balon: {((serviceTotals.totals_usd.balon_furgon / serviceTotals.totals_usd.total) * 100).toFixed(1)}%
                    </Tag>
                  </Tooltip>
                  <Tooltip title={`${serviceTotals.totals_usd.chiqimlik.toLocaleString()} so'm`}>
                    <Tag color="orange">
                      Chiqim: {((serviceTotals.totals_usd.chiqimlik / serviceTotals.totals_usd.total) * 100).toFixed(1)}%
                    </Tag>
                  </Tooltip>
                  <Tooltip title={`${serviceTotals.totals_usd.optol.toLocaleString()} so'm`}>
                    <Tag color="purple">
                      Yoqilg&apos;i: {((serviceTotals.totals_usd.optol / serviceTotals.totals_usd.total) * 100).toFixed(1)}%
                    </Tag>
                  </Tooltip>
                </div>
              </div>

              {vehicleStats.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <Title level={5}>Transport vositalari bo&apos;yicha xarajatlar</Title>
                  <Row gutter={[16, 16]}>
                    {vehicleStats.slice(0, 4).map(vehicle => (
                      <Col xs={24} sm={12} md={6} key={vehicle.carId}>
                        <Card size="small" hoverable onClick={() => handleCarSelect(vehicle.carId)}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Space align="center">
                              <Avatar icon={<CarOutlined />} style={{ backgroundColor: '#1890ff' }} />
                              <Text strong>{vehicle.carName}</Text>
                            </Space>
                            <Statistic
                              title="Jami xarajat"
                              value={vehicle.totalSpent}
                              precision={0}
                              suffix="so'm"
                              valueStyle={{ fontSize: '16px' }}
                            />
                            <Space>
                              <Tag color="blue">{vehicle.servicesCount} ta xizmat</Tag>
                              <Tag color="green">
                                <CalendarOutlined /> {dayjs(vehicle.lastService).format('DD.MM.YYYY')}
                              </Tag>
                            </Space>
                          </Space>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </Card>
          )}
        </>
      )
    },
    {
      key: 'details',
      label: 'Batafsil ma\'lumot',
      children: (
        <Card
          title="Xarajatlar ro'yxati"
          extra={
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              alignItems: 'center',
              justifyContent: 'flex-end',
              width: '100%',
              maxWidth: 860
            }}>
              <div style={{ width: 'min(220px, 100%)' }}>
                <Select
                  placeholder="Xarajat turi"
                  style={{ width: '100%' }}
                  onChange={handleTypeChange}
                  value={expenseType}
                >
                  <Option value="all">Barcha xarajatlar</Option>
                  <Option value="texnic">Texnik xizmat</Option>
                  <Option value="balon">Balon xizmati</Option>
                  <Option value="balon_furgon">Furgon balon xizmati</Option>
                  <Option value="chiqimlik">Chiqim xarajatlari</Option>
                  <Option value="optol">Yoqilg&apos;i xarajatlari</Option>
                </Select>
              </div>

              <div style={{ width: 'min(280px, 100%)' }}>
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  style={{ width: '100%' }}
                  placeholder={['Boshlanish', 'Tugash']}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end', width: 'auto' }}>
                <Button onClick={handleResetFilters} style={{ minWidth: 140 }}>
                  Filtrlarni tozalash
                </Button>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={fetchServiceData}
                  style={{ minWidth: 120 }}
                >
                  Yangilash
                </Button>
              </div>
            </div>
          }
        >
          <Table
            dataSource={filteredExpenses}
            rowKey={(record) => `${record.car}-${record.created_at}-${record.id || Math.random().toString(36).substr(2, 9)}`}
            pagination={{ pageSize: 10 }}
            loading={loading}
            scroll={{ x: 'max-content' }}
            columns={[

              {
                title: 'Sana',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (date: string) => (
                  <Space>
                    <CalendarOutlined />
                    {dayjs(date).format('DD.MM.YYYY')}
                  </Space>
                ),
                sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
              },
              {
                title: 'Transport',
                dataIndex: 'car_name',
                key: 'car_name',
                render: (name: string, record) => (
                  <Space>
                    <Avatar icon={<CarOutlined />} size="small" style={{ backgroundColor: '#1890ff' }} />
                    <Text>{name}</Text>
                    <Tag color="blue">{record.kilometer} km</Tag>
                  </Space>
                ),
                filters: Array.from(new Set(serviceData.map(item => item.car_name)))
                  .map(name => ({ text: name, value: name })),
                onFilter: (value, record) => record.car_name === value,
              },
              {
                title: 'Turi',
                dataIndex: 'type',
                key: 'type',
                render: (type: string) => (
                  <Tag color={getTypeColor(type)} icon={getTypeIcon(type)}>
                    {formatTypeName(type)}
                  </Tag>
                ),
                filters: [
                  { text: 'Texnik xizmat', value: 'Техобслуживание' },
                  { text: 'Balon xizmat', value: 'Шиномонтаж' },
                  { text: 'Furgon balon', value: 'Шиномонтаж Фургон' },
                  { text: 'Chiqim', value: 'Расход' },
                  { text: 'Yoqilg&apos;i', value: 'Топливо' }
                ],
                onFilter: (value, record) => record.type === value,
              },
              {
                title: 'Summa',
                dataIndex: 'price',
                key: 'price',
                render: (price: number, record: ServiceRecord) =>
                  `${price.toLocaleString()} so'm`,
                sorter: (a, b) => a.price - b.price,
              },
              {
                title: 'Qiymati (so\'m)',
                dataIndex: 'usd_value',
                key: 'usd_value',
                render: (value: number) => `${value.toLocaleString()} so'm`,
                sorter: (a, b) => a.usd_value - b.usd_value,
              }
            ]}
            summary={(pageData) => {
              const total = pageData.reduce((sum, item) => sum + item.usd_value, 0);
              return (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4} align="right">
                      <strong>Jami:</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4}>
                      <strong>{total.toLocaleString()} so'm</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              );
            }}
          />
        </Card>
      )
    },
    {
      key: 'vehicles',
      label: 'Transport vositalari',
      children: (
        <Card title="Transport vositalari bo&apos;yicha xarajatlar">
          {vehicleStats.length > 0 ? (
            <Row gutter={[16, 16]}>
              {vehicleStats.map(vehicle => (
                <Col xs={24} sm={12} md={8} lg={6} key={vehicle.carId}>
                  <Card
                    hoverable
                    className={selectedCarId === vehicle.carId ? 'vehicle-card-selected' : 'vehicle-card'}
                    onClick={() => handleCarSelect(vehicle.carId === selectedCarId ? null : vehicle.carId)}
                  >
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <Avatar
                        icon={<CarOutlined />}
                        size={64}
                        style={{
                          backgroundColor: selectedCarId === vehicle.carId ? '#1890ff' : '#f0f0f0',
                          color: selectedCarId === vehicle.carId ? '#ffffff' : '#1890ff'
                        }}
                      />
                      <Title level={4} style={{ marginTop: 8, marginBottom: 0 }}>{vehicle.carName}</Title>
                    </div>

                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Statistic
                          title="Jami xarajat"
                          value={vehicle.totalSpent}
                          precision={0}
                          suffix="so'm"
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Xizmatlar soni"
                          value={vehicle.servicesCount}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Col>
                    </Row>

                    <div style={{ marginTop: 16 }}>
                      <Text type="secondary">So&apos;nggi xizmat:</Text>
                      <div>
                        <Tag icon={<CalendarOutlined />} color="blue">
                          {dayjs(vehicle.lastService).format('DD.MM.YYYY')}
                        </Tag>
                      </div>
                    </div>

                    {serviceData.some(service => service.car === vehicle.carId) && (
                      <div style={{ marginTop: 16 }}>
                        <Text type="secondary">Xizmat turlari:</Text>
                        <div style={{ marginTop: 8 }}>
                          {Array.from(new Set(serviceData
                            .filter(service => service.car === vehicle.carId)
                            .map(service => service.type)))
                            .map(type => (
                              <Tag
                                key={type}
                                color={getTypeColor(type)}
                                icon={getTypeIcon(type)}
                                style={{ marginBottom: 5 }}
                              >
                                {formatTypeName(type)}
                              </Tag>
                            ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty description="Transport vositalari ma&apos;lumotlari mavjud emas" />
          )}
        </Card>
      )
    }
  ];

  return (
    <div className="service-expenses">
      <Tabs defaultActiveKey="overview" items={tabItems} />
    </div>
  );
};

export default ServiceExpenses; 