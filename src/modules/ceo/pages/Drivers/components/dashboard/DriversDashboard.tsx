import React, { useMemo } from 'react';
import { Card, Row, Col, Statistic, Progress, Typography, Space, Divider, List, Avatar, Alert, Badge, Empty } from 'antd';
import {
  TeamOutlined,
  CarOutlined,
  ClockCircleOutlined,
  MoneyCollectOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  HistoryOutlined,
  RiseOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { DriverType } from '../../../../../accounting/types/driver';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';

import { formatImageUrl } from '../../../../../../api/axiosInstance';
import { formatPrice } from '../../../../../../utils/formatCurrency';

const { Text, Title } = Typography;

// Client-side only component for date-dependent calculations
const DaysLeftBadge = dynamic(() => Promise.resolve(
  ({ expiryDate }: { expiryDate: string }) => {
    const daysLeft = dayjs(expiryDate).diff(dayjs(), 'days');
    let statusColor = 'green';
    if (daysLeft < 7) statusColor = 'red';
    else if (daysLeft < 14) statusColor = 'orange';
    
    return (
      <Badge 
        count={`${daysLeft} kun qoldi`} 
        style={{ backgroundColor: statusColor }} 
      />
    );
  }
), { ssr: false });

// Add this client-side only component for percentage calculations
const SafeProgress = dynamic(() => Promise.resolve(
  ({ value, total, color }: { value: number, total: number, color?: string }) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
      <Progress 
        percent={percentage} 
        size="small"
        strokeColor={color}
      />
    );
  }
), { ssr: false });

interface DriversDashboardProps {
  drivers: DriverType[];
  driversOnRoad: DriverType[];
  isLoading: boolean;
  summaryStats?: {
    total: number;
    active: number;
    inactive: number;
    on_road: number;
    waiting: number;
  };
  onTabChange?: (tab: string) => void;
}

const DriversDashboard: React.FC<DriversDashboardProps> = ({
  drivers,
  driversOnRoad,
  isLoading,
  summaryStats,
  onTabChange,
}) => {
  const router = useRouter();

  // Calculate statistics
  const stats = useMemo(() => {
    // If we have summary statistics from backend, use them as base
    const baseStats = {
      totalDrivers: summaryStats?.total || drivers.length,
      activeDrivers: summaryStats?.active || 0,
      inactiveDrivers: summaryStats?.inactive || 0,
      onRoadDrivers: summaryStats?.on_road || driversOnRoad.length,
      waitingDrivers: summaryStats?.waiting || 0,
      activePercentage: 0,
      onRoadPercentage: 0,
      avgTripsPerDriver: 0,
      totalTrips: 0,
      avgSalary: 0,
      totalSalary: 0,
      topPerformers: [],
      problemDrivers: [],
      licenseExpirations: [],
    };

    if (!drivers || drivers.length === 0) {
      return baseStats;
    }

    // Fallback local calculations for missing summary fields if needed
    if (!summaryStats) {
      const activeDrivers = drivers.filter(d => d.is_active);
      const onRoadDriverIds = new Set(driversOnRoad.map(d => d.id));
      const waitingDrivers = activeDrivers.filter(d => 
        !onRoadDriverIds.has(d.id) && 
        !d.is_busy && 
        (d.status === 'active' || d.status === 'driver')
      );
      
      baseStats.activeDrivers = activeDrivers.length;
      baseStats.inactiveDrivers = drivers.length - activeDrivers.length;
      baseStats.onRoadDrivers = driversOnRoad.length;
      baseStats.waitingDrivers = waitingDrivers.length;
    }
    
    // Calculate percentages based on the determined counts
    const activePercentage = baseStats.totalDrivers > 0 
      ? (baseStats.activeDrivers / baseStats.totalDrivers) * 100 
      : 0;
    const onRoadPercentage = baseStats.activeDrivers > 0 
      ? (baseStats.onRoadDrivers / baseStats.activeDrivers) * 100 
      : 0;
    
    // Calculate trip statistics (still based on the list we have)
    const totalTrips = drivers.reduce((sum, driver) => sum + (driver.rays_count || 0), 0);
    const avgTripsPerDriver = drivers.length > 0 
      ? totalTrips / drivers.length 
      : 0;
    
    // Calculate salary statistics
    const totalSalary = drivers.reduce((sum, driver) => sum + Number(driver.total_rays_usd || 0), 0);
    const avgSalary = drivers.length > 0 
      ? totalSalary / drivers.length 
      : 0;
    
    // Get top performers (drivers with most trips)
    const topPerformers = [...drivers]
      .sort((a, b) => (b.rays_count || 0) - (a.rays_count || 0))
      .slice(0, 5);
    
    // Get drivers with license expiring soon
    const today = dayjs();
    const licenseExpirations = drivers
      .filter(driver => 
        driver.license_expiry && 
        dayjs(driver.license_expiry).isAfter(today) && 
        dayjs(driver.license_expiry).diff(today, 'days') < 30
      )
      .sort((a, b) => 
        dayjs(a.license_expiry).diff(today) - dayjs(b.license_expiry).diff(today)
      )
      .slice(0, 5);
    
    return {
      ...baseStats,
      activePercentage,
      onRoadPercentage,
      avgTripsPerDriver,
      totalTrips,
      avgSalary,
      totalSalary,
      topPerformers,
      licenseExpirations,
      problemDrivers: [], // Simplified for now
    };
  }, [drivers, driversOnRoad, summaryStats]);

  const handleDriverClick = (driver: DriverType) => {
    if (driver && driver.id) {
      router.push(`/modules/ceo/drivers/${driver.id}/history`);
    }
  };

  return (
    <div className="drivers-dashboard">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small"
            style={{ cursor: onTabChange ? 'pointer' : 'default' }}
            onClick={() => onTabChange && onTabChange('list')}
          >
            <Statistic
              title="Jami haydovchilar"
              value={stats.totalDrivers}
              prefix={<TeamOutlined />}
            />
            <div className="statistic-footer">
              <Text type="secondary">
                {stats.activeDrivers} faol, {stats.inactiveDrivers} nofaol
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small"
            style={{ cursor: onTabChange ? 'pointer' : 'default' }}
            onClick={() => onTabChange && onTabChange('on-road')}
          >
            <Statistic
              title="Yo'ldagi haydovchilar"
              value={stats.onRoadDrivers}
              prefix={<CarOutlined />}
            />
            <SafeProgress value={stats.onRoadDrivers} total={stats.activeDrivers} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" 
            style={{ cursor: onTabChange ? 'pointer' : 'default' }}
            onClick={() => onTabChange && onTabChange('waiting')}
          >
            <Statistic
              title="Kutayotgan haydovchilar"
              value={stats.waitingDrivers}
              prefix={<ClockCircleOutlined />}
            />
            <SafeProgress 
              value={stats.waitingDrivers} 
              total={stats.activeDrivers} 
              color="#ffa940"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="O'rtacha ish haqi"
              value={formatPrice(stats.avgSalary)}
              prefix={<MoneyCollectOutlined />}
            />
            <div className="statistic-footer">
              <Text type="secondary">Jami: {formatPrice(stats.totalSalary)}</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Secondary Statistics and Lists */}
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24} md={12}>
          <Card title="Eng yaxshi haydovchilar" size="small">
            {stats.topPerformers.length > 0 ? (
              <List
                dataSource={stats.topPerformers}
                renderItem={(driver) => (
                  <List.Item onClick={() => handleDriverClick(driver)} style={{ cursor: 'pointer' }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          icon={<UserOutlined />}
                        />
                      }
                      title={driver.fullname}
                      description={`${driver.rays_count || 0} reys, ${formatPrice(driver.total_rays_usd || 0)}`}
                    />
                    <div>
                      <Badge count={driver.rays_count || 0} overflowCount={999} style={{ backgroundColor: '#52c41a' }} />
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Ma'lumot yo'q" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Additional Info */}
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24} md={24}>
          <Card title="Haydovchilar tahlili" size="small">
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="O'rtacha reyslar soni"
                  value={stats.avgTripsPerDriver}
                  precision={1}
                  prefix={<HistoryOutlined />}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Eng ko'p reys"
                  value={stats.topPerformers[0]?.rays_count || 0}
                  prefix={<TrophyOutlined />}
                  suffix={stats.topPerformers[0] ? `(${stats.topPerformers[0].fullname})` : ''}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Eng yuqori to'lov"
                  value={formatPrice(stats.topPerformers[0]?.total_rays_usd || 0)}
                  prefix={<RiseOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DriversDashboard; 