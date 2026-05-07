'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Tabs,
  Statistic,
  Progress,
  Avatar,
  Input,
  Modal,
  Tooltip,
  Empty,
  Select,
  message,
  Form,
  Badge,
  Divider,
  Spin,
  Alert,
} from 'antd'
import {
  UserOutlined,
  CarOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  DashboardOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  DollarOutlined,
  IdcardOutlined,
} from '@ant-design/icons'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { useRouter } from 'next/navigation'
import { useCEODrivers } from '../../hooks/useCEODrivers'
import { DriverType } from '../../../accounting/types/driver'
import axiosInstance from '@/api/axiosInstance'
import { formatImageUrl } from '../../../../api/axiosInstance'; 
import DriverModal from './components/DriverModal'
import DriverInfoModal from './components/DriverInfoModal'
import DriversDashboard from './components/dashboard/DriversDashboard'
import DriverTable from './components/table/DriverTable'

const { Text, Title } = Typography
const { confirm } = Modal

/**
 * Enhanced Drivers management component
 */
const Drivers: React.FC = () => {
  // State for driver form and modal
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<DriverType | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false)
  const [infoDriver, setInfoDriver] = useState<DriverType | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchText, setSearchText] = useState('')
  const [searchFilters, setSearchFilters] = useState({
    search: '',
    status: 'all' as string,
    is_busy: undefined as boolean | undefined,
    page: 1,
    pageSize: 50
  })

  // Use enhanced driver hook
  const {
    drivers,
    driversOnRoad,
    isLoading,
    createDriver,
    updateDriver,
    deleteDriver,
    updateFilters,
    total,
    activeDriversCount,
    totalDriversCount,
    inactiveDriversCount,
    driversOnRoadCount,
    waitingDriversCount,
  } = useCEODrivers()

  const router = useRouter()

  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    setSearchFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    updateFilters(newFilters);
  }

  // Handle search input change
  const handleSearch = (value: string) => {
    setSearchText(value)
    const newFilters = {
      search: value,
      status: searchFilters.status,
      is_busy: searchFilters.is_busy,
      page: 1,
      pageSize: searchFilters.pageSize
    };
    setSearchFilters(newFilters);
    updateFilters(newFilters);
  }

  const handleAddDriver = useCallback(() => {
    setModalMode('create')
    setSelectedDriver(null)
    setIsModalVisible(true)
  }, [])
  
  const handleEditDriver = useCallback((driver: DriverType) => {
    if (!driver) return
    setModalMode('edit')
    setSelectedDriver(driver)
    setIsModalVisible(true)
  }, [])

  const handleShowInfo = useCallback((driver: DriverType) => {
    setInfoDriver(driver);
    setIsInfoModalVisible(true);
  }, []);

  const handleDeleteDriver = async (driver: DriverType) => {
    confirm({
      title: "Haydovchini o'chirishni istaysizmi?",
      icon: <ExclamationCircleOutlined />,
      content: "Bu amal qaytarilmaydi.",
      okText: 'Ha',
      okType: 'danger',
      cancelText: "Yo'q",
      onOk: async () => {
        try {
          await deleteDriver(driver.id);
          message.success("Haydovchi muvaffaqiyatli o'chirildi");
        } catch (error) {
          message.error("Xatolik yuz berdi");
        }
      }
    });
  };

  const handleModalSubmit = useCallback(
    async (values: FormData) => {
      try {
        if (modalMode === 'create') {
          await createDriver(values)
        } else if (modalMode === 'edit' && selectedDriver) {
          await updateDriver(selectedDriver.id, values)
        }
        setIsModalVisible(false)
      } catch (error) {
        throw error
      }
    },
    [modalMode, selectedDriver, createDriver, updateDriver],
  )

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key)
  }, [])

  return (
    <DashboardLayout title="Haydovchilar boshqaruvi" subtitle="Haydovchilarni boshqarish">
      <div className="drivers-actions" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} justify="space-between" align="middle">
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDriver}>
              Yangi haydovchi qo`shish
            </Button>
          </Col>
        </Row>
      </div>

      <Card className="drivers-container">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          type="card"
          items={[
            {
              key: 'dashboard',
              label: (<span><DashboardOutlined /> Dashboard</span>),
              children: (
                <DriversDashboard 
                  drivers={drivers} 
                  driversOnRoad={driversOnRoad} 
                  isLoading={isLoading} 
                  summaryStats={activeDriversCount !== undefined ? {
                    total: totalDriversCount,
                    active: activeDriversCount,
                    inactive: inactiveDriversCount,
                    on_road: driversOnRoadCount,
                    waiting: waitingDriversCount
                  } : undefined}
                  onTabChange={handleTabChange}
                />
              ),
            },
            {
              key: 'list',
              label: (<span><TeamOutlined /> Haydovchilar ro`yxati</span>),
              children: (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <Input.Search
                      placeholder="Ism yoki telefon bo'yicha qidirish..."
                      allowClear
                      value={searchText}
                      onSearch={handleSearch}
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ width: '100%', maxWidth: 400 }}
                    />
                  </div>
                  <DriverTable 
                    drivers={drivers}
                    loading={isLoading}
                    onEdit={handleEditDriver}
                    onDelete={handleDeleteDriver}
                    onView={(driver) => router.push(`/modules/ceo/drivers/${driver.id}/history`)}
                    onRowClick={handleShowInfo}
                    pagination={{
                      current: searchFilters.page,
                      pageSize: searchFilters.pageSize,
                      total: total,
                      onChange: (page: number, pageSize: number) => handleFilterChange({ page, pageSize })
                    }}
                  />
                </>
              ),
            },
            {
              key: 'on-road',
              label: (<span><CarOutlined /> Yo`ldagi haydovchilar</span>),
              children: (
                <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <Table
                    dataSource={driversOnRoad}
                    rowKey="id"
                    loading={isLoading}
                    scroll={{ x: 900 }} 
                    size="small" // Use small size on mobile
                    className="road-drivers-table"
                    pagination={{ pageSize: 10, size: 'small' }}
                    onRow={(record) => ({
                      onClick: (event: any) => {
                        if (event.target.closest('.ant-btn')) return;
                        handleShowInfo(record);
                      },
                      style: { cursor: 'pointer' }
                    })}
                    columns={[
                      {
                        title: 'Haydovchi',
                        key: 'driver',
                        width: 180,
                        render: (_, record: any) => (
                          <Space>
                            <Avatar size="small" src={formatImageUrl(record.photo)} icon={<UserOutlined />} />
                            <div style={{ lineHeight: '1.2' }}>
                              <div style={{ fontWeight: 500, fontSize: '12px', whiteSpace: 'nowrap' }}>{record.fullname}</div>
                              <div style={{ fontSize: '10px', color: '#8c8c8c' }}>{record.phone_number}</div>
                            </div>
                          </Space>
                        )
                      },
                      {
                        title: 'Mashina raqami',
                        key: 'car',
                        width: 150,
                        render: (_, record: any) => (
                          <div style={{ lineHeight: '1.2' }}>
                            <div style={{ fontWeight: 500, fontSize: '12px', whiteSpace: 'nowrap' }}>{record.car?.name || record.car?.model || 'Nomalum model'}</div>
                            <div style={{ fontSize: '10px', color: '#1890ff', fontWeight: 600 }}>{record.car?.car_number || record.car?.number || 'Davlat raqami yo\'q'}</div>
                          </div>
                        )
                      },
                      {
                        title: 'Status',
                        key: 'status',
                        width: 90,
                        render: () => <Tag color="success" style={{ margin: 0, fontSize: '11px' }}>Yo'lda</Tag>
                      },
                      {
                          title: 'Amallar',
                          key: 'action',
                          width: 100,
                          render: (_, record) => (
                            <Space size={4}>
                              <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleEditDriver(record)} />
                              <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteDriver(record)} />
                            </Space>
                          )
                      }
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      <DriverModal
        visible={isModalVisible}
        mode={modalMode}
        driver={selectedDriver}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleModalSubmit}
      />

      <DriverInfoModal
        visible={isInfoModalVisible}
        driver={infoDriver}
        onClose={() => setIsInfoModalVisible(false)}
      />
    </DashboardLayout>
  )
}

export default Drivers
