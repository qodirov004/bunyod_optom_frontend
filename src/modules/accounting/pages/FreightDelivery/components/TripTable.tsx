import { Table, Space, Tag, Button, Popconfirm, Typography, Card, Badge, Empty, Modal, Alert } from 'antd'
import { CheckCircleOutlined, EnvironmentOutlined, DollarOutlined, UserOutlined, CarFilled, WarningOutlined, CheckOutlined, WalletOutlined, PhoneOutlined, CarOutlined, ShopOutlined } from '@ant-design/icons'
import React, { useState } from 'react'
import { RaysResponseType } from '@/modules/accounting/types/freight'
import { useUpdateTripStatus } from '@/modules/accounting/hooks/useTrips'
import { formatCurrency } from '@/utils/formatCurrency'
import axiosInstance from '@/api/axiosInstance'
import dayjs from 'dayjs'

const { Text, Paragraph } = Typography;


const completeRaceWithAllClients = async (tripId: number) => {
  try {
    await axiosInstance.post(`/rays/${tripId}/complete-race/`);
    return true;
  } catch (error: any) {
    console.error('Reysni yakunlashda xatolik:', error);
    throw error;
  }
};
const extractErrorMessage = (error: any): string => {
  if (!error.response || !error.response.data) {
    return 'Noma\'lum xatolik yuz berdi';
  }

  // Get the error data
  const errorData = error.response.data;

  // Check if there's an error field
  if (errorData.error) {
    // Handle the specific format: "[ErrorDetail(string='Клиент Ali не оплатил или не оформил долг.', code='invalid')]"
    const errorText = errorData.error;
    const matches = errorText.match(/string='(.+?)'/);

    if (matches && matches[1]) {
      // Replace the Russian message with Uzbek equivalent
      const russianMessage = matches[1];

      // Common error patterns
      if (russianMessage.includes('не оплатил или не оформил долг')) {
        // Extract client name if possible
        const clientMatches = russianMessage.match(/Клиент\s+(\w+)/i);
        const clientName = clientMatches && clientMatches[1] ? clientMatches[1] : 'Mijoz';

        return `"${clientName}" to'lov qilmagan yoki qarzni rasmiylashtirilmagan`;
      }

      // Return the original error if no pattern matched
      return russianMessage;
    }

    return errorData.error;
  }

  return 'Reysni yakunlashda xatolik yuz berdi';
};

const TripTable = ({
  trips = [],
  pagination = true,
  limit,
  loading = false,
  viewMode = 'table',
  onDriverPayment,
}: {
  trips: RaysResponseType[]
  pagination?: boolean
  limit?: number
  loading?: boolean
  viewMode?: 'table' | 'card'
  readOnly?: boolean
  onDriverPayment?: (tripId: number) => void
}) => {
  const { mutate: updateStatus } = useUpdateTripStatus()
  const [completingTripId, setCompletingTripId] = useState<number | null>(null)
  const [errorModalVisible, setErrorModalVisible] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successModalVisible, setSuccessModalVisible] = useState(false)
  const [completedTripId, setCompletedTripId] = useState<number | null>(null)

  // Reyslar ro'yxatini saralash va cheklash
  const displayTrips = limit
    ? [...trips].slice(-limit).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [...trips].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const getStatusColor = (isCompleted: boolean): string => {
    if (isCompleted) return 'green'
    return 'blue'
  }

  const getStatusText = (isCompleted: boolean): string => {
    if (isCompleted) return 'BAJARILGAN'
    return 'YO\'LDA'
  }

  const getTripCompletionStatus = (trip: RaysResponseType): boolean => {
    return Boolean(trip.is_completed);
  }
  const handleCompleteRace = async (id: number) => {
    setCompletingTripId(id);
    try {
      await completeRaceWithAllClients(id);
      setCompletedTripId(id);
      setSuccessModalVisible(true);
      updateStatus(
        { id, isCompleted: true },
        {
          onSuccess: () => {
            console.log('Trip status updated successfully');
          },
          onError: (error) => {
            console.error('Error updating trip status:', error);
          }
        }
      );
    } catch (error: any) {
      console.error('Reysni yakunlashda xatolik:', error);

      // Extract and display the error message
      const userFriendlyError = extractErrorMessage(error);
      setErrorMessage(userFriendlyError);
      setErrorModalVisible(true);
    } finally {
      setCompletingTripId(null);
    }
  };

  // Close error modal
  const handleCloseErrorModal = () => {
    setErrorModalVisible(false);
  };

  // Close success modal
  const handleCloseSuccessModal = () => {
    setSuccessModalVisible(false);
  };

  const tripColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Sana',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: "Haydovchi",
      key: 'driver',
      render: (_: any, record: RaysResponseType) => {
        const driverInfo = record.driver;
        return (
          <div>
            <Text strong>{driverInfo ? driverInfo.fullname : 'Haydovchi topilmadi'}</Text>
            {driverInfo && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                <PhoneOutlined /> {driverInfo.phone}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Mashina",
      key: 'car',
      render: (_: any, record: RaysResponseType) => (
        <div>
          <Text>{record.car ? `${record.car.name}` : 'Mashina kiritilmagan'}</Text>
          {record.car && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              <CarOutlined /> {record.car.number}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Furgon",
      key: 'fourgon',
      render: (_: any, record: RaysResponseType) => (
        <div>
          <Text>{record.fourgon ? `${record.fourgon.name}` : 'Furgon kiritilmagan'}</Text>
          {record.fourgon && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              <CarOutlined /> {record.fourgon.number}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Mijozlar va Mahsulotlar",
      key: 'client',
      width: 300,
      render: (_: any, record: RaysResponseType) => {
        if (!record.client || record.client.length === 0) {
          return <Text type="secondary">Mijoz topilmadi</Text>;
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {record.client.map((clientObj: any, index: number) => (
              <div 
                key={clientObj.id || index} 
                style={{ 
                  padding: '8px', 
                  background: '#f9f9f9', 
                  borderRadius: '6px',
                  border: '1px solid #eee'
                }}
              >
                <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ color: '#1890ff' }}>{clientObj.company}</Text>
                  <Tag color="cyan" style={{ fontSize: '10px' }}>{clientObj.products?.length || 0} mahsulot</Tag>
                </div>
                
                {clientObj.products && clientObj.products.length > 0 ? (
                  <div style={{ fontSize: '11px', color: '#555', paddingLeft: '4px', borderLeft: '2px solid #1890ff' }}>
                    {clientObj.products.map((prod: any, pIndex: number) => (
                      <div key={prod.id || pIndex} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>• {prod.name} x{prod.count}</span>
                        <Text type="secondary" style={{ fontSize: '10px' }}>{formatCurrency(prod.price)}</Text>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text type="secondary" style={{ fontSize: '10px' }}>Mahsulotlar yo'q</Text>
                )}
                
                <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                  <UserOutlined /> {clientObj.name} | <PhoneOutlined /> {clientObj.phone}
                </div>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Masofa',
      dataIndex: 'kilometer',
      key: 'kilometer',
      render: (km: number) => `${km} km`,
    },
    {
      title: 'Narxi',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => formatCurrency(price),
    },
    {
      title: "Haydovchining xarajatlari",
      dataIndex: 'dr_price',
      key: 'dr_price',
      render: (payment: number) => formatCurrency(payment),
    },
    {
      title: "Haydovchiga to'lov",
      dataIndex: 'dp_price',
      key: 'dp_price',
      render: (payment: number) => formatCurrency(payment),
    },
    {
      title: 'Soni',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => count || '-',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: RaysResponseType) => {
        const isCompleted = getTripCompletionStatus(record);
        return (
          <Tag color={getStatusColor(isCompleted)}>{getStatusText(isCompleted)}</Tag>
        );
      },
    },
    {
      title: 'Amallar',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => window.location.href = `/modules/accounting/freight/${record.id}`}
          >
            Batafsil
          </Button>

          {/* Yangi reysni yakunlash tugmasi */}
          {!record.is_completed && (
            <>
              <Popconfirm
                title="Reysni yakunlash!!"
                description="Rostdan ham bu reysni barcha mijozlari bilan yakunlamoqchimisiz?"
                onConfirm={() => handleCompleteRace(record.id)}
                okText="Ha"
                cancelText="Yo'q"
              >
                <Button
                  type="primary"
                  size="small"
                  danger
                  loading={completingTripId === record.id}
                  icon={<CheckCircleOutlined />}
                >
                  Yakunlash!!
                </Button>
              </Popconfirm>
              {onDriverPayment && (
                <Button
                  type="default"
                  size="small"
                  icon={<WalletOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDriverPayment(record.id);
                  }}
                >
                  To`lov!
                </Button>
              )}
            </>
          )}
        </Space>
      ),
    },
  ]

  // Card View Component
  const TripCardView = () => {
    if (displayTrips.length === 0) {
      return <Empty description="Reyslar mavjud emas" />
    }

    const navigateToTripDetails = (tripId: number) => {
      window.location.href = `/modules/accounting/freight/${tripId}`;
    };

    return (
      <div className="trip-cards" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        padding: '16px'
      }}>
        {displayTrips.map(trip => {
          const isCompleted = getTripCompletionStatus(trip);
          const driverInfo = trip.client.length > 0 ? trip.client[0] : null;

          return (
            <Card
              key={trip.id}
              className="trip-card"
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Reys #{trip.id}</span>
                  <Tag color={getStatusColor(isCompleted)}>{getStatusText(isCompleted)}</Tag>
                </div>
              }
              variant="borderless"
              style={{
                cursor: 'pointer',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onClick={() => navigateToTripDetails(trip.id)}
              actions={[
                <Button
                  type="primary"
                  key="details"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToTripDetails(trip.id);
                  }}
                >
                  Batafsil
                </Button>,

                !isCompleted && (
                  <>
                    <Popconfirm
                      key="complete"
                      title="Reysni yakunlash"
                      description="Rostdan ham bu reysni barcha mijozlari bilan yakunlamoqchimisiz?"
                      onConfirm={(e) => {
                        e.stopPropagation();
                        handleCompleteRace(trip.id);
                      }}
                      onCancel={(e) => {
                        e.stopPropagation();
                      }}
                      okText="Ha"
                      cancelText="Yo'q"
                    >
                      <Button
                        type="primary"
                        danger
                        loading={completingTripId === trip.id}
                        icon={<CheckCircleOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Yakunlash
                      </Button>
                    </Popconfirm>
                  </>
                ),

                !isCompleted && onDriverPayment && (
                  <Button
                    key="payment"
                    type="default"
                    icon={<WalletOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDriverPayment(trip.id);
                    }}
                  >
                    To`lov
                  </Button>
                )
              ].filter(Boolean)}
            >
              <div className="trip-card-content">
                <Paragraph className="route-info">
                  <EnvironmentOutlined /> {trip.from1} → {trip.to_go} ({trip.kilometer} km)
                </Paragraph>

                <div className="driver-info" style={{ padding: '8px 0', borderBottom: '1px solid #eee', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                      {trip.driver ? trip.driver.fullname : 'Haydovchi kiritilmagan'}
                    </span>
                  </div>
                  {trip.driver && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 26 }}>
                      <PhoneOutlined style={{ color: '#888', fontSize: 14 }} />
                      <a href={`tel:${trip.driver.phone}`} style={{ color: '#888', fontSize: 13 }}>{trip.driver.phone}</a>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, width: '100%' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: 6,
                    padding: '4px 10px',
                    minWidth: 0,
                    width: '100%'
                  }}>
                    <CarFilled style={{ color: '#52c41a', marginRight: 6, fontSize: 18 }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>
                        {trip.car ? trip.car.name : 'Mashina kiritilmagan'}
                      </span>
                      {trip.car && (
                        <span style={{ fontSize: 12, color: '#666' }}>
                          {trip.car.number}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#fffbe6',
                    border: '1px solid #ffe58f',
                    borderRadius: 6,
                    padding: '4px 10px',
                    minWidth: 0,
                    width: '100%'
                  }}>
                    <i className="icon-truck" style={{ color: '#faad14', marginRight: 6, fontSize: 18 }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>
                        {trip.fourgon ? trip.fourgon.name : 'Furgon kiritilmagan'}
                      </span>
                      {trip.fourgon && (
                        <span style={{ fontSize: 12, color: '#666' }}>
                          {trip.fourgon.number}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ 
                    maxHeight: '150px', 
                    overflowY: 'auto', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px', 
                    padding: '4px',
                    background: '#f8f9fa',
                    borderRadius: '6px'
                  }}>
                    {trip.client.map((clientObj: any, cIndex: number) => (
                      <div key={clientObj.id || cIndex} style={{ 
                        background: '#fff', 
                        border: '1px solid #e6f7ff', 
                        borderRadius: 6, 
                        padding: '6px 10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <ShopOutlined style={{ color: '#1890ff' }} />
                          <Text strong style={{ fontSize: '13px' }}>{clientObj.company}</Text>
                        </div>
                        {clientObj.products && clientObj.products.length > 0 && (
                          <div style={{ fontSize: '11px', color: '#666', marginLeft: '18px' }}>
                            {clientObj.products.map((p: any, pi: number) => (
                              <div key={p.id || pi}>• {p.name} (x{p.count})</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="price-info">
                  <p><DollarOutlined /> Narxi: <Text strong>{formatCurrency(trip.price)}</Text></p>
                  <p>Haydovchining xarajatlari: {formatCurrency(trip.dr_price)}</p>
                  <p>Haydovchiga to`lov: {formatCurrency(trip.dp_price)}</p>
                </div>

                <div className="trip-footer">
                   <Text type="secondary">{dayjs(trip.created_at).format('DD.MM.YYYY HH:mm')}</Text>
                  {trip.count && <Badge count={trip.count} color="blue" />}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  // Find the completed trip details for the success modal
  const completedTrip = completedTripId
    ? displayTrips.find(trip => trip.id === completedTripId) || trips.find(trip => trip.id === completedTripId)
    : null;


  return (
    <>
      {viewMode === 'table' ? (
        <Table
          columns={tripColumns}
          dataSource={displayTrips}
          rowKey="id"
          loading={loading}
          pagination={pagination ? { pageSize: 10 } : false}
        />
      ) : (
        <TripCardView />
      )}

      {/* Error Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
            <span>Reysni yakunlab bo`lmadi</span>
          </div>
        }
        open={errorModalVisible}
        onCancel={handleCloseErrorModal}
        footer={[
          <Button key="close" type="primary" onClick={handleCloseErrorModal}>
            Tushundim
          </Button>
        ]}
        centered
      >
        <div style={{ padding: '12px 0' }}>
          <Alert
            message="To'lov bilan bog'liq muammo"
            description={errorMessage}
            type="error"
            showIcon
          />
          <Paragraph style={{ marginTop: 16 }}>
            Reys yakunlashi uchun barcha mijozlar to`lovni amalga oshirgan yoki qarz rasmiylashtirilgan bo`lishi kerak. Iltimos, avval mijoz bilan to`lov masalasini hal qiling.
          </Paragraph>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CheckOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            <span>Reys muvaffaqiyatli yakunlandi</span>
          </div>
        }
        open={successModalVisible}
        onCancel={handleCloseSuccessModal}
        footer={[
          <Button
            key="goToDetails"
            type="primary"
            onClick={() => {
              handleCloseSuccessModal();
              if (completedTripId) {
                window.location.href = `/modules/accounting/freight/${completedTripId}`;
              }
            }}
          >
            Batafsil ko`rish
          </Button>,
          <Button key="close" onClick={handleCloseSuccessModal}>
            Yopish
          </Button>
        ]}
        centered
      >
        <div style={{ padding: '16px 0' }}>
          <Alert
            message="Reys muvaffaqiyatli yakunlandi"
            description={`Reys #${completedTripId} barcha mijozlar bilan muvaffaqiyatli yakunlandi`}
            type="success"
            showIcon
          />

          {completedTrip && (
            <div style={{ marginTop: 16 }}>
              <Card className="trip-summary-card" variant="borderless">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text strong>Yo`nalish:</Text>
                   <Text>{completedTrip.from1} → {completedTrip.to_go}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text strong>Haydovchi:</Text>
                  <Text>{completedTrip.driver?.fullname || 'Kiritilmagan'}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text strong>Jami:</Text>
                  <Text type="success">{formatCurrency(completedTrip.price)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text strong>Haydovchiga to`lov:</Text>
                  <Text>{formatCurrency(completedTrip.dp_price)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong>Foyda:</Text>
                  <Text type="success">
                    {formatCurrency(completedTrip.price - completedTrip.dr_price - completedTrip.dp_price)}
                  </Text>
                </div>
              </Card>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

export default TripTable