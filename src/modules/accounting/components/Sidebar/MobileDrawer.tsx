import React from 'react';
import { Drawer, Menu, Divider } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { menuItems } from './Items';
import Logo from './Logo';

interface MobileDrawerProps {
    visible: boolean;
    onClose: () => void;
}

const mainItems = [menuItems[0]];
const managementItems = [menuItems[1], menuItems[2], menuItems[3], menuItems[4], menuItems[5]];
const tripsItems = [menuItems[6], menuItems[7], menuItems[8]];
const serviceItems = [menuItems[9]];

export function MobileDrawer({ visible, onClose }: MobileDrawerProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { theme } = useSelector((state: RootState) => state.settings);

    const handleMenuClick = (key: string) => {
        router.push(key);
        onClose(); // Close the drawer after navigation
    };

    return (
        <Drawer
            title={<Logo collapsed={false} />}
            placement="left"
            closable={true}
            onClose={onClose}
            open={visible}
            width={260}
            className={`mobile-sidebar-drawer ${theme}`}
            styles={{
                header: { padding: '16px 24px', borderBottom: theme === 'dark' ? '1px solid #303030' : '1px solid #f0f0f0' },
                body: { padding: 0 }
            }}
        >
            <div className="sidebar-scroll-container mobile-scroll">
                <div className="menu-group-title" style={{ padding: '16px 16px 8px 24px', fontSize: '12px', color: '#888' }}>Asosiy</div>
                <Menu
                    theme={theme === 'dark' ? 'dark' : 'light'}
                    mode="inline"
                    selectedKeys={[pathname]}
                    items={mainItems}
                    onClick={({ key }) => handleMenuClick(key)}
                    className="sidebar-menu"
                />

                <Divider className="menu-divider" style={{ margin: '8px 0' }} />

                <div className="menu-group-title" style={{ padding: '8px 16px 8px 24px', fontSize: '12px', color: '#888' }}>Boshqaruv</div>
                <Menu
                    theme={theme === 'dark' ? 'dark' : 'light'}
                    mode="inline"
                    selectedKeys={[pathname]}
                    items={managementItems}
                    onClick={({ key }) => handleMenuClick(key)}
                    className="sidebar-menu"
                />

                <Divider className="menu-divider" style={{ margin: '8px 0' }} />

                <div className="menu-group-title" style={{ padding: '8px 16px 8px 24px', fontSize: '12px', color: '#888' }}>Reyslar</div>
                <Menu
                    theme={theme === 'dark' ? 'dark' : 'light'}
                    mode="inline"
                    selectedKeys={[pathname]}
                    items={tripsItems}
                    onClick={({ key }) => handleMenuClick(key)}
                    className="sidebar-menu"
                />

                <Divider className="menu-divider" style={{ margin: '8px 0' }} />

                <div className="menu-group-title" style={{ padding: '8px 16px 8px 24px', fontSize: '12px', color: '#888' }}>Xizmatlar</div>
                <Menu
                    theme={theme === 'dark' ? 'dark' : 'light'}
                    mode="inline"
                    selectedKeys={[pathname]}
                    items={serviceItems}
                    onClick={({ key }) => handleMenuClick(key)}
                    className="sidebar-menu"
                />
            </div>
        </Drawer>
    );
}
