'use client';
import React from 'react';
import { Layout, Typography, Space } from 'antd';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import NavRight from '@/modules/accounting/components/Navbar/NavRight';
import { WalletOutlined } from '@ant-design/icons';

const { Header } = Layout;
const { Title } = Typography;

interface NavbarProps {
    fixed?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ fixed = true }) => {
    const { theme, sidebarCollapsed } = useSelector((state: RootState) => state.settings);
    
    return (
        <Header 
            className={`navbar ${theme} ${fixed ? 'fixed' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}
        >
            <div className="navbar-left">
                <Space align="center">
                    <WalletOutlined 
                        style={{ 
                            fontSize: '24px', 
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
                        RBL LOGISTCS — Kassir
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
