import React from 'react';
import { Layout, Menu, Typography, Avatar } from 'antd';
import { 
  DashboardOutlined, 
  CarOutlined, 
  UserOutlined, 
  EnvironmentOutlined,
  DollarOutlined,
  TeamOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserAddOutlined,
  UsergroupAddOutlined,
  AppstoreOutlined,
  SolutionOutlined,
  BankOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';

const { Sider } = Layout;
const { Title } = Typography;

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Get the active key based on current path
  const getActiveKey = () => {
    if (pathname.includes('/modules/ceo/dashboard')) return 'dashboard';
    if (pathname.includes('/modules/ceo/fleet')) return 'fleet';
    if (pathname.includes('/modules/ceo/drivers')) return 'drivers';
    if (pathname.includes('/modules/ceo/clients')) return 'clients';
    if (pathname.includes('/modules/ceo/trips')) return 'trips';
    if (pathname.includes('/modules/ceo/finance')) return 'finance';
    if (pathname.includes('/modules/ceo/admin')) return 'admin';
    return 'dashboard';
  };
  
  // Create menu items array
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link href="/modules/ceo/dashboard">Dashboard</Link>
    },
    {
      key: 'fleet',
      icon: <CarOutlined />,
      label: <Link href="/modules/ceo/fleet">Transport</Link>
    },
    {
      key: 'drivers',
      icon: <TeamOutlined />,
      label: <Link href="/modules/ceo/drivers">Haydovchilar</Link>
    },
    {
      key: 'clients',
      icon: <TeamOutlined />,
      label: <Link href="/modules/ceo/clients">Mijozlar</Link>
    },
    {
      key: 'trips',
      icon: <EnvironmentOutlined />,
      label: <Link href="/modules/ceo/trips">Reyslar</Link>
    },
    {
      key: 'finance',
      icon: <DollarOutlined />,
      label: <Link href="/modules/ceo/finance">Moliya</Link>
    },
    {
      key: 'admin',
      icon: <AppstoreOutlined />,
      label: 'Admin',
      children: [
        {
          key: 'admin-users',
          icon: <UserAddOutlined />,
          label: <Link href="/modules/ceo/admin/admins">Administratorlar</Link>
        },
      ]
    }
  ];

  return (
    <Sider
      width={260}
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      className="ceo-sidebar"
      trigger={null}
    >
      <div className="logo-container">
        {!collapsed ? (
          <div className="logo">
            <Title level={4} style={{ color: '#fff', margin: 0 }}>RBL LOGISTCS</Title>
          </div>
        ) : (
          <div className="logo-small">
            <Title level={4} style={{ color: '#fff', margin: 0 }}>BT</Title>
          </div>
        )}
        <button 
          className="collapse-btn" 
          onClick={() => onCollapse(!collapsed)}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>
      
      <div className="user-info">
        <div className="user-avatar-wrapper">
          <Avatar size={collapsed ? 32 : 40} icon={<UserOutlined />} className="custom-avatar" />
          {!collapsed && <div className="online-indicator"></div>}
        </div>
        {!collapsed && (
          <div className="user-details">
            <span className="user-name">{user?.fullname || user?.username || ''}</span>
          </div>
        )}
      </div>
      
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getActiveKey()]}
        defaultOpenKeys={collapsed ? [] : ['admin']}
        items={menuItems}
        className="custom-menu"
      />
      
      <style jsx global>{`
        .ceo-sidebar {
          background: #1e1e2d !important;
          position: fixed;
          height: 100vh;
          left: 0;
          z-index: 100;
          box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
          border-right: none !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .ceo-sidebar .ant-layout-sider-children {
          background: #1e1e2d !important;
          display: flex;
          flex-direction: column;
        }
        
        .logo-container {
          padding: 24px 20px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .collapse-btn {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: #fff;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.2s ease;
        }

        .collapse-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #6c5ce7;
        }
        
        .logo {
          display: flex;
          align-items: center;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          padding: 15px 20px;
          margin-bottom: 15px;
          transition: all 0.3s ease;
        }
        
        .user-avatar-wrapper {
          position: relative;
        }

        .custom-avatar {
          background: #6c5ce7 !important;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .online-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 10px;
          height: 10px;
          background: #2ed573;
          border: 2px solid #1e1e2d;
          border-radius: 50%;
        }
        
        .user-details {
          margin-left: 12px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .user-name {
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          white-space: nowrap;
        }
        
        /* Menu Styling */
        .custom-menu {
          background: transparent !important;
          border-right: none !important;
        }

        .custom-menu .ant-menu-item {
          height: 48px !important;
          line-height: 48px !important;
          margin: 4px 12px !important;
          width: calc(100% - 24px) !important;
          border-radius: 8px !important;
          color: rgba(255, 255, 255, 0.6) !important;
          transition: all 0.2s ease !important;
        }

        .custom-menu .ant-menu-item:hover {
          color: #fff !important;
          background: rgba(255, 255, 255, 0.05) !important;
        }

        .custom-menu .ant-menu-item-selected {
          background: #6c5ce7 !important;
          color: #fff !important;
          box-shadow: 0 4px 12px rgba(108, 92, 231, 0.3);
        }

        .custom-menu .ant-menu-item .anticon {
          font-size: 18px !important;
          transition: all 0.3s ease;
        }

        .custom-menu .ant-menu-item-selected .anticon {
          transform: scale(1.1);
        }

        .custom-menu .ant-menu-submenu-title {
          margin: 4px 12px !important;
          width: calc(100% - 24px) !important;
          border-radius: 8px !important;
          color: rgba(255, 255, 255, 0.6) !important;
        }

        .custom-menu .ant-menu-sub {
          background: rgba(0, 0, 0, 0.15) !important;
          margin: 0 12px !important;
          border-radius: 8px !important;
        }

        /* Scrollbar */
        .ant-layout-sider-children::-webkit-scrollbar {
          width: 4px;
        }
        .ant-layout-sider-children::-webkit-scrollbar-track {
          background: transparent;
        }
        .ant-layout-sider-children::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </Sider>
  );
}; 