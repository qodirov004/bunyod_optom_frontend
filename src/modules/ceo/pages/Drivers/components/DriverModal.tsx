import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, Upload, Alert, Row, Col, message } from 'antd';
import { UploadOutlined, UserOutlined, PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { DriverType } from '../../../../accounting/types/driver';
import axiosInstance from "../../../../../api/axiosInstance";
import { formatImageUrl } from '../../../../../api/axiosInstance';
import type { UploadFile } from 'antd/es/upload/interface';
import type { RcFile } from 'antd/es/upload';
import moment from 'moment';

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
    const [statusOptions, setStatusOptions] = useState<{ label: string, value: string }[]>([]);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    // Use hardcoded status options instead of API call
    useEffect(() => {
        setStatusOptions([
            { label: 'Haydovchi', value: 'driver' },
            { label: 'Egasi', value: 'owner' },
            { label: 'CEO', value: 'ceo' },
            { label: 'Bugalter', value: 'bugalter' },
            { label: 'Zaphos', value: 'zaphos' }
        ]);
    }, []);

    // Reset form when modal opens or mode changes
    useEffect(() => {
        form.resetFields();
        setError(null);
        setPhotoUrl(driver?.photo || null);
        setFileList([]);

        if (driver?.photo) {
            setFileList([
                {
                    uid: '-1',
                    name: 'Photo',
                    status: 'done',
                    url: formatImageUrl(driver.photo) || undefined,
                },
            ]);
        }

        if (mode === 'edit' && driver) {
            // Extract first name and last name from fullname if needed
            const nameParts = (driver.fullname || '').split(' ');
            const firstName = driver.first_name || (nameParts.length > 0 ? nameParts[0] : '');
            const lastName = driver.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

            form.setFieldsValue({
                first_name: firstName,
                last_name: lastName,
                username: driver.username,
                phone_number: driver.phone_number,
                status: driver.status,
                is_active: driver.is_active || true,
                // Don't set password for edit mode
            });
        } else {
            // Default values for create mode
            form.setFieldsValue({
                status: 'driver',
                is_active: true
            });
        }
    }, [form, mode, driver, visible]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            // Validate form
            const values = await form.validateFields();

            const formData = new FormData();

            // Add basic fields
            formData.append('fullname', `${values.first_name || ''} ${values.last_name || ''}`.trim());
            formData.append('phone_number', values.phone_number);
            formData.append('status', values.status);
            formData.append('username', values.username || values.phone_number.replace(/\D/g, ''));
            
            if (mode === 'create') {
                formData.append('password', values.password || values.phone_number.replace(/\D/g, ''));
            } else if (values.password) {
                formData.append('password', values.password);
            }

            // Add files
            if (fileList[0]?.originFileObj) {
                formData.append('photo', fileList[0].originFileObj);
            }

            // Submit form
            await onSubmit(formData as any);

            // Close modal on success
            onClose();
        } catch (err) {
            console.error("Form submission error:", err);
            setError(err.message || "Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    // Handle file upload
    const handleBeforeUpload = (file: RcFile) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('Faqat JPG/PNG formatdagi rasmlar yuklang!');
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Rasm hajmi 2MB dan oshmasligi kerak!');
        }
        return isJpgOrPng && isLt2M;
    };

    const customProfileUpload = async ({ file, onSuccess, onError }: any) => {
        // We'll store the File object itself
        setFileList([{ ...file, originFileObj: file }]);
        onSuccess("ok", file);
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
                    Saqlash
                </Button>
            ]}
            width={800}
            forceRender={true}
        >
            {error && (
                <Alert
                    message="Xatolik"
                    description={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: '16px' }}
                />
            )}

            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    status: 'driver',
                    is_active: true
                }}
            >
                <Row gutter={16}>
                    {/* Photo Upload */}
                    <Col span={24} style={{ marginBottom: '16px', textAlign: 'center' }}>
                        <Upload
                            name="avatar"
                            listType="picture-card"
                            className="avatar-uploader"
                            showUploadList={true}
                            beforeUpload={handleBeforeUpload}
                            maxCount={1}
                            fileList={fileList}
                            customRequest={customProfileUpload}
                            onChange={({ fileList }) => setFileList(fileList)}
                        >
                            {fileList.length === 0 && (
                                <div>
                                    <UploadOutlined />
                                    <div style={{ marginTop: 8 }}>Profil Rasmi</div>
                                </div>
                            )}
                        </Upload>
                    </Col>

                    {/* Personal Info */}
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="first_name"
                            label="Ism"
                            rules={[{ required: true, message: 'Iltimos, ismni kiriting' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Ism" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="last_name"
                            label="Familiya"
                            rules={[{ required: true, message: 'Iltimos, familiyani kiriting' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Familiya" />
                        </Form.Item>
                    </Col>

                    {/* Contact Info */}
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="phone_number"
                            label="Telefon raqami"
                            rules={[{ required: true, message: 'Iltimos, telefon raqamini kiriting' }]}
                        >
                            <Input prefix={<PhoneOutlined />} placeholder="+998XXXXXXXXX" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="username"
                            label="Login"
                            rules={[{ required: true, message: 'Iltimos, login kiriting' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Login" />
                        </Form.Item>
                    </Col>

                    {mode === 'create' && (
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="password"
                                label="Parol"
                                rules={[{ required: true, message: 'Iltimos, parolni kiriting' }]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="Parol" />
                            </Form.Item>
                        </Col>
                    )}

                    {/* Status */}
                    <Col xs={24} sm={mode === 'create' ? 12 : 24}>
                        <Form.Item
                            name="status"
                            label="Status"
                            rules={[{ required: true, message: 'Iltimos, statusni tanlang' }]}
                        >
                            <Select placeholder="Status tanlang">
                                {statusOptions.map(option => (
                                    <Option key={option.value} value={option.value}>{option.label}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default DriverModal; 