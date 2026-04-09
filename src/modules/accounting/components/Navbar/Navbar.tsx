'use client';
import React from 'react';
import { Layout, Typography, Space } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { toggleSidebar } from '@/modules/accounting/store/slices/settingsSlice';
import NavRight from './NavRight';
import { CarOutlined, MenuOutlined } from '@ant-design/icons';

const { Header } = Layout;
const { Title } = Typography;

interface NavbarProps {
    fixed?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ fixed = true }) => {
    const dispatch = useDispatch();
    const { theme, sidebarCollapsed } = useSelector((state: RootState) => state.settings);
    
    return (
        <Header 
            className={`navbar ${theme} ${fixed ? 'fixed' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}
        >
            <div className="navbar-left">
                <Space align="center" size={12}>
                    <button 
                        className="mobile-menu-trigger" 
                        onClick={() => dispatch(toggleSidebar())}
                    >
                        <MenuOutlined />
                    </button>
                    <CarOutlined 
                        className="navbar-brand-icon"
                        style={{ 
                            fontSize: '22px', 
                            color: '#6c5ce7'
                        }} 
                    />
                    <Title 
                        level={4} 
                        style={{ 
                            margin: 0,
                            color: '#1e1e2d',
                            fontWeight: 700,
                            letterSpacing: '-0.3px'
                        }}
                    >
                        RBL LOGISTCS — Bugalter
                    </Title>
                </Space>
            </div>

            <div className="navbar-right">
                <NavRight />
            </div>
        </Header>
    );
};

export default Navbar;