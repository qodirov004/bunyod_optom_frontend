import React, { useState, useEffect } from 'react';
import { Layout, Button, Avatar, Space, message, Dropdown, Spin, Modal, Form, Input } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
  KeyOutlined,
  BankOutlined
} from '@ant-design/icons';
import { Sidebar } from './Sidebar';
import { useRouter, usePathname } from 'next/navigation';
import { MenuProps } from 'antd';

const { Header, Content, Footer } = Layout;

export interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  extra
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [form] = Form.useForm();

  // Saqlangan collapsed holatini olish
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsed) {
      setCollapsed(savedCollapsed === 'true');
    } else if (pathname && pathname.includes('/modules/owner')) {
      setCollapsed(true);
    }
  }, [pathname]);

  // Collapsed holatini saqlash
  const handleCollapse = (value: boolean) => {
    setCollapsed(value);
    localStorage.setItem('sidebar-collapsed', String(value));
  };


  const handlePasswordChange = async (values: any) => {
    try {
      setChangePasswordLoading(true);

      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Success notification
      message.success('Parol muvaffaqiyatli o\'zgartirildi');
      setPasswordModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Parolni o\'zgartirishda xatolik yuz berdi');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
      type: 'item' as const
    },
    {
      key: 'change-password',
      label: 'Parolni o\'zgartirish',
      icon: <KeyOutlined />,
      onClick: () => setPasswordModalVisible(true),
    },
    {
      key: 'divider',
      type: 'divider' as const
    },
    {
      key: 'logout',
      label: 'Chiqish',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        // Clear auth token completely
        const { removeToken } = require('@/auth/authUtils');
        removeToken();
        window.location.href = '/login';
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} onCollapse={handleCollapse} />

      <Layout className="site-layout" style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.2s' }}>
        <Header className="dashboard-header">
          <div className="header-left">
            <div className="header-title">
              <h1 className="dashboard-title">{title}</h1>
              {subtitle && <p className="dashboard-subtitle">{subtitle}</p>}
            </div>
          </div>

          <div className="header-actions">
            <Space size="middle">
              {extra}

              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                <Button type="text" className="header-btn user-btn">
                  <Avatar icon={<UserOutlined />} size="small" />
                  <span className="username">Administrator</span>
                </Button>
              </Dropdown>
            </Space>
          </div>
        </Header>

        <Content className="dashboard-content">
          {children}
        </Content>

        <Footer className="dashboard-footer">
          RBL LOGISTCS &copy; {new Date().getFullYear()} - Boshqaruv tizimi
        </Footer>
      </Layout>

      <Modal
        title="Parolni o'zgartirish"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            name="currentPassword"
            label="Joriy parol"
            rules={[{ required: true, message: 'Joriy parolni kiriting' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Yangi parol"
            rules={[
              { required: true, message: 'Yangi parolni kiriting' },
              { min: 6, message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' }
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Yangi parolni tasdiqlang"
            rules={[
              { required: true, message: 'Yangi parolni tasdiqlang' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Yangi parollar mos kelmadi'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={changePasswordLoading} block>
              Parolni o'zgartirish
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .site-layout {
          background: #f4f7fe !important;
        }

        .dashboard-header {
          background: rgba(255, 255, 255, 0.8) !important;
          backdrop-filter: blur(10px);
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 70px;
          line-height: normal !important;
          padding: 0 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          position: sticky;
          top: 0;
          z-index: 10;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .header-left {
          display: flex;
          align-items: center;
        }
        
        .header-title {
          display: flex;
          flex-direction: column;
        }
        
        .dashboard-title {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #1e1e2d;
          letter-spacing: -0.5px;
        }
        
        .dashboard-subtitle {
          margin: 2px 0 0 0;
          font-size: 13px;
          color: #a0aec0;
          font-weight: 500;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
        }
        
        .header-btn {
          display: flex;
          align-items: center;
          height: 44px;
          padding: 0 16px;
          border-radius: 10px;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
          transition: all 0.2s ease;
        }
        
        .header-btn:hover {
          background: #f7fafc !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04);
        }
        
        .user-btn {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .username {
          margin-left: 4px;
          font-weight: 600;
          color: #4a5568;
        }
        
        .dashboard-content {
          padding: 24px;
          background: #f4f7fe;
          min-height: calc(100vh - 70px - 60px);
        }
        
        .dashboard-footer {
          text-align: center;
          padding: 20px 24px;
          background: transparent;
          color: #a0aec0;
          font-size: 13px;
          font-weight: 500;
        }
        
        @media (max-width: 768px) {
          .username {
            display: none;
          }
          
          .dashboard-header {
            padding: 0 16px;
          }
          
          .dashboard-content {
            padding: 16px;
          }
        }
      `}</style>
    </Layout>
  );
};