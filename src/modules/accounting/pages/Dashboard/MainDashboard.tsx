import React from 'react';
import { Layout } from 'antd';
import TopDriversSection from './sections/TopDriversSection';
import StatisticsSection from './sections/StatisticsSection';
import RecentTripsSection from './sections/RecentTripsSection';
import VehicleStatusSection from './sections/VehicleStatusSection';
import '../../styles/Dashboard.css';

const { Content } = Layout;

const MainDashboard = () => {
    return (
        <Layout className="dashboard-layout">
            <Content className="dashboard-content">
                {/* Statistika kartlari */}
                <div className="dashboard-section">
                    <StatisticsSection />
                </div>

                {/* Asosiy ma'lumotlar */}
                <div className="dashboard-main-content">
                    {/* Chap panel */}
                    <div className="dashboard-left-panel">
                        <div className="dashboard-section">
                            <VehicleStatusSection />
                        </div>
                    </div>

                    {/* O'ng panel */}
                    <div className="dashboard-right-panel">
                        <div className="dashboard-section">
                            <RecentTripsSection />
                        </div>
                    </div>
                </div>

                {/* Pastki qism, to'liq kenglikda */}
                <div className="dashboard-section" style={{ marginTop: '24px' }}>
                    <TopDriversSection />
                </div>
            </Content>
        </Layout>
    );
};

export default MainDashboard;