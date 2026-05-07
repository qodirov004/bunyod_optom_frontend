'use client';
import React, { useMemo } from 'react';
import { Layout } from 'antd';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { Dashboard } from '../pages/Dashboard';
import { DriversPage } from '../pages/Drivers';
import { ClientsPage } from '../pages/Clients';
import Navbar from '../components/Navbar/Navbar';
import dynamic from 'next/dynamic';
import '../styles/global.css';
import '../styles/Navbar.css';
import '../styles/Sidebar.css';
import CarsPage from '../pages/Cars';
import AllCarsPage from '../pages/Cars/pages/AllCars/AllCarsPage';
import RoadCars from '../pages/Cars/pages/RoadCars/RoadCars';
import AvailableCars from '../pages/Cars/pages/AvailableCars/AvailableCars';
import CarHistoryPage from '../pages/Cars/pages/CarHistory/CarHistoryPage';
import MaintenancePage from '../pages/Maintenance';
import FurgonPage from '../pages/Furgon';
import FreightDeliveryPage from '../pages/FreightDelivery';
import TripHistoryPage from '../pages/TripHistoryPage/index';
import KassaPage from '../pages/Kassa';
import DriverSalaryPage from '../pages/DriverSalary';
import RouteTransition from '@/components/RouteTransition';

const { Content } = Layout;

interface RouteComponents {
    [key: string]: React.ComponentType;
}

const ClientHistoryPage = dynamic(
    () => import('../pages/Clients/components/ClientHistoryPage'),
    { ssr: false }
);

const ROUTES: RouteComponents = {
    '/modules/accounting': Dashboard,
    '/modules/accounting/transactions': DriversPage,
    '/modules/accounting/clients': ClientsPage,
    '/modules/accounting/cars': CarsPage,
    '/modules/accounting/cars/allpage': AllCarsPage,
    '/modules/accounting/cars/roadcars': RoadCars,
    '/modules/accounting/cars/availablecars': AvailableCars,
    '/modules/accounting/cars/:id/history': CarHistoryPage,
    '/modules/accounting/maintenance': MaintenancePage,
    '/modules/accounting/furgon': FurgonPage,
    '/modules/accounting/freight': FreightDeliveryPage,
    '/modules/accounting/triphistory': TripHistoryPage,
    '/modules/accounting/clients/:id/history': ClientHistoryPage,
    '/modules/accounting/kassa': KassaPage,
    '/modules/accounting/driversalary': DriverSalaryPage,
};

export function AccountingLayout() {
    const pathname = usePathname();
    const { theme, sidebarCollapsed } = useSelector((state: RootState) => state.settings);

    const currentComponent = useMemo(() => {
        if (pathname.match(/^\/modules\/accounting\/clients\/\d+\/history$/)) {
            return <ClientHistoryPage />;
        }

        if (pathname.match(/^\/modules\/accounting\/cars\/\d+\/history$/)) {
            return <CarHistoryPage />;
        }

        const Component = ROUTES[pathname] || Dashboard;
        return <Component />;
    }, [pathname]);

    return (
        <Layout className={`layout-container ${theme} ${sidebarCollapsed ? '' : 'sidebar-expanded'}`}>
            <Sidebar />
            <Layout className="content-area">
                <Navbar fixed />
                <Content>
                    <RouteTransition>
                        {currentComponent}
                    </RouteTransition>
                </Content>
            </Layout>
        </Layout>
    );
}