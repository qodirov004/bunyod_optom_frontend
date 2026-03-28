'use client';

import React from 'react';
import { Tabs, Card } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import AdminManagement from './components/AdminManagement';
import ProtectedRoute from '@/components/ProtectedRoute';



const AdminPage: React.FC = () => {
  return (
    <ProtectedRoute allowedRoles={['ceo']}>
      <DashboardLayout title="Administratorlarni boshqarish">
        <Card style={{ marginBottom: 24 }}>
          <Tabs 
            defaultActiveKey="admins" 
            type="card"
            items={[
              {
                key: 'admins',
                label: <span><UserOutlined /> Administratorlar</span>,
                children: <AdminManagement />
              }
            ]}
          />
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default AdminPage; 