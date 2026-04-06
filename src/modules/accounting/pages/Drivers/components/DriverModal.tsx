import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, Upload, Alert, message } from 'antd';
import dayjs from 'dayjs';
import {  UserOutlined, PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { DriverType } from '../../../types/driver';
import axiosInstance from "../../../../../api/axiosInstance";
import { API_URLS } from "../../../../../api/apiConfig";


const { Option } = Select;

interface DriverModalProps {
    visible: boolean;
    mode: 'create' | 'edit';
    driver: DriverType | null;
    onClose: () => void;
    onSubmit: (values: FormData) => Promise<void>;
}

const DriverModal: React.FC<DriverModalProps> = ({
    visible,
    mode,
    driver,
    onClose,
    onSubmit
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusOptions] = useState([
        { label: 'Haydovchi', value: 'driver' },
        { label: 'Egasi', value: 'Owner' },
        { label: 'CEO', value: 'CEO' },
        { label: 'Bugalter', value: 'Bugalter' },
        { label: 'Zaphos', value: 'Zaphos' },
    ]);
    
    // Set initial values including image if available
    useEffect(() => {
        form.resetFields();
        setError(null);
        
        if (mode === 'edit' && driver) {
            form.setFieldsValue({
                fullname: driver.fullname,
                username: driver.username,
                phone_number: driver.phone_number,
                status: driver.status,
                // Don't set password for edit mode
            });
        } else {
            // Default values for create mode
            form.setFieldsValue({
                status: 'driver',
            });
        }
    }, [form, mode, driver, visible]);
    
    // Get status options from backend - Removed because template/ is non-existent
    

    
    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Validate form
            const values = await form.validateFields();
            
            // Create FormData object to handle file upload
            const formData = new FormData();
            
            // Add text fields to FormData
            formData.append('fullname', values.fullname);
            
            // If username is not provided, use phone number
            if (!values.username && values.phone_number) {
                values.username = values.phone_number.replace(/\D/g, '');
            }
            formData.append('username', values.username);
            
            // Handle password for both create and edit modes
            if (mode === 'create') {
                // For create mode, if password is not provided, use phone number
                const password = values.password || values.phone_number.replace(/\D/g, '');
                formData.append('password', password);
            } else if (values.password) {
                // For edit mode, only include password if it's provided
                formData.append('password', values.password);
            }
            
            formData.append('phone_number', values.phone_number);
            formData.append('status', values.status);
            
            // Add date_joined, joining_date and date automatically for new drivers or if missing
            const existingDate = driver?.date_joined || driver?.joining_date || driver?.created_at || driver?.date;
            if (mode === 'create' || !existingDate) {
                const currentDate = dayjs().format('YYYY-MM-DD');
                formData.append('date_joined', currentDate);
                formData.append('joining_date', currentDate);
                formData.append('date', currentDate);
            } else if (existingDate) {
                // If it exists, preserve it but ensure it's in the payload
                const dateStr = dayjs(existingDate).format('YYYY-MM-DD');
                formData.append('date_joined', dateStr);
                formData.append('joining_date', dateStr);
                formData.append('date', dateStr);
            }
            
            // Log form data entries for debugging
            console.log('FormData entries:');
            for (const pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }
            
            // Submit form
            await onSubmit(formData);
            
            // Close modal on success
            form.resetFields();
        } catch (err: any) {
            console.error("Form submission error:", err);
            // If it's a validation error from Ant Design, it won't have a message property
            // We only want to show the top-level alert for API errors or other exceptions
            if (err.errorFields) {
                // This is an Ant Design validation error, don't show the generic alert
                return;
            }
            setError(err.message || "Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };
    

    
    // Password field is required for create mode, optional for edit
    const getPasswordRules = () => {
        if (mode === 'create') {
            return [{ required: false, message: 'Parol kiriting' }];
        }
        return [{ required: false, message: 'Parolni o\'zgartirish uchun yangi parolni kiriting' }];
    };
    
    return (
        <Modal
            title={mode === "create" ? "Yangi haydovchi qo'shish" : "Haydovchini tahrirlash"}
            open={visible}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Bekor qilish
                </Button>,
                <Button 
                    key="submit" 
                    type="primary" 
                    onClick={handleSubmit}
                    loading={loading}
                >
                    {mode === "create" ? "Qo'shish" : "Saqlash"}
                </Button>
            ]}
            width={600}
            forceRender={true}
        >
            {error && (
                <Alert
                    message="Xatolik"
                    description={error}
                    type="error"
                    showIcon
                    closable
                    style={{ marginBottom: 16 }}
                    onClose={() => setError(null)}
                />
            )}
            
            <Form
                form={form}
                layout="vertical"
            >

                
                <Form.Item
                    label="F.I.O"
                    name="fullname"
                    rules={[{ required: true, message: "F.I.O ni kiriting!" }]}
                >
                    <Input 
                        placeholder="Haydovchi F.I.O" 
                        prefix={<UserOutlined />} 
                    />
                </Form.Item>
                
                <Form.Item
                    label="Foydalanuvchi nomi"
                    name="username"
                    extra="Bo'sh qoldirilsa telefon raqami ishlatiladi"
                >
                    <Input placeholder="Foydalanuvchi nomi" />
                </Form.Item>
                
                <Form.Item
                    label="Telefon raqami"
                    name="phone_number"
                    rules={[
                        { required: true, message: "Telefon raqamini kiriting!" },
                        { 
                            pattern: /^\+?[0-9]{9,15}$/, 
                            message: "Telefon raqami noto'g'ri formatda" 
                        }
                    ]}
                >
                    <Input 
                        placeholder="+998XXXXXXXXX" 
                        prefix={<PhoneOutlined />}
                    />
                </Form.Item>
                
                <Form.Item
                    label="Parol"
                    name="password"
                    rules={getPasswordRules()}
                    extra={mode === 'create' ? "Bo'sh qoldirilsa telefon raqami ishlatiladi" : "Yangi parol kiriting yoki bo'sh qoldiring"}
                >
                    <Input.Password 
                        placeholder={mode === 'create' ? "Parolni kiriting" : "Yangi parol kiriting"}
                        prefix={<LockOutlined />}
                    />
                </Form.Item>
                
                <Form.Item
                    name="status"
                    label="Status"
                    rules={[{ required: true, message: 'Iltimos, statusni tanlang' }]}
                >
                    <Select placeholder="Statusni tanlang">
                        {statusOptions.map((opt: any) => (
                            <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default DriverModal;