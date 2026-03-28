"use client";

import React, { useState, useEffect } from 'react';
import { Layout, Button, Avatar, Space, Dropdown, Modal, Form, Input, message } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { Sidebar } from '../../../modules/ceo/components/layout/Sidebar';
import { useRouter, usePathname } from 'next/navigation';
import type { MenuProps } from 'antd';

const { Header, Content, Footer } = Layout;

export default function CEOLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) {
      setCollapsed(saved === 'true');
    }
  }, []);

  const handleCollapse = (value: boolean) => {
    setCollapsed(value);
    localStorage.setItem('sidebar-collapsed', String(value));
  };

  const handlePasswordChange = async (values: any) => {
    try {
      setChangePasswordLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      message.success("Parol muvaffaqiyatli o'zgartirildi");
      setPasswordModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error("Parolni o'zgartirishda xatolik yuz berdi");
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
    },
    {
      key: 'change-password',
      label: "Parolni o'zgartirish",
      icon: <KeyOutlined />,
      onClick: () => setPasswordModalVisible(true),
    },
    { key: 'divider', type: 'divider' as const },
    {
      key: 'logout',
      label: 'Chiqish',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        localStorage.removeItem('token');
        router.push('/login');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} onCollapse={handleCollapse} />

      <Layout
        className="site-layout"
        style={{ marginLeft: collapsed ? 80 : 260, transition: 'all 0.2s' }}
      >
        <Header className="dashboard-header">
          <div className="header-left">
            <div className="header-title" />
          </div>
          <div className="header-actions">
            <Space size="middle">
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
        <Form form={form} layout="vertical" onFinish={handlePasswordChange}>
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
              { min: 6, message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" },
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
        .dashboard-header {
          background: #fff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 64px;
          padding: 0 16px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .header-left {
          display: flex;
          align-items: center;
        }
        .header-title {
          display: flex;
          flex-direction: column;
        }
        .header-title h1 {
          margin: 0;
          font-size: 18px;
          line-height: 1.2;
        }
        .header-title p {
          margin: 4px 0 0 0;
          font-size: 14px;
          line-height: 1.2;
        }
        .header-actions {
          display: flex;
          align-items: center;
        }
        .header-btn {
          display: flex;
          align-items: center;
          height: 40px;
          padding: 0 12px;
          border-radius: 6px;
        }
        .header-btn:hover {
          background: rgba(0, 0, 0, 0.03);
        }
        .user-btn {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .username {
          margin-left: 8px;
        }
        .dashboard-content {
          padding: 16px;
          background: #f5f7fa;
          min-height: calc(100vh - 64px - 48px);
        }
        .dashboard-footer {
          text-align: center;
          padding: 12px 24px;
          background: #fff;
          color: rgba(0, 0, 0, 0.45);
          font-size: 14px;
          box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.03);
        }
        @media (max-width: 768px) {
          .username {
            display: none;
          }
          .dashboard-header {
            padding: 0 12px;
          }
          .dashboard-content {
            padding: 16px;
          }
        }
      `}</style>
    </Layout>
  );
}
