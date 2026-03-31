import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, Upload, Alert, DatePicker, Row, Col, Switch, message } from 'antd';
import { UploadOutlined, UserOutlined, PhoneOutlined, LockOutlined, IdcardOutlined, HomeOutlined, CalendarOutlined } from '@ant-design/icons';
import { DriverType } from '../../../../accounting/types/driver';
import axiosInstance from "../../../../../api/axiosInstance";
import { formatImageUrl } from '../../../../../api/axiosInstance';
import type { UploadFile } from 'antd/es/upload/interface';
import type { RcFile } from 'antd/es/upload';
import moment from 'moment';
import dayjs from 'dayjs';

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
    const [passportPhotoUrl, setPassportPhotoUrl] = useState<string | null>(null);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [passportFileList, setPassportFileList] = useState<UploadFile[]>([]);
    const [passportBackFileList, setPassportBackFileList] = useState<UploadFile[]>([]);

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
        setPassportPhotoUrl(driver?.passport_photo || null);
        setFileList([]);
        setPassportFileList([]);

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
        
        if (driver?.passport_photo_front) {
            setPassportFileList([
                {
                    uid: '-2',
                    name: 'Passport Front',
                    status: 'done',
                    url: formatImageUrl(driver.passport_photo_front) || undefined,
                },
            ]);
        }
        
        if (driver?.passport_photo_back) {
            setPassportBackFileList([
                {
                    uid: '-3',
                    name: 'Passport Back',
                    status: 'done',
                    url: formatImageUrl(driver.passport_photo_back) || undefined,
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
                address: driver.address,
                passport: driver.passport,
                passport_series: driver.passport_series,
                passport_number: driver.passport_number,
                passport_issued_by: driver.passport_issued_by,
                passport_issued_date: driver.passport_issued_date ? dayjs(driver.passport_issued_date) : undefined,
                passport_birth_date: driver.passport_birth_date ? dayjs(driver.passport_birth_date) : undefined,
                license_number: driver.license_number,
                license_expiry: driver.license_expiry ? dayjs(driver.license_expiry) : undefined,
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

            // Passport info
            formData.append('passport_series', values.passport_series || '');
            formData.append('passport_number', values.passport_number || '');
            formData.append('passport_issued_by', values.passport_issued_by || '');
            
            if (values.passport_issued_date) {
                formData.append('passport_issued_date', values.passport_issued_date.format('YYYY-MM-DD'));
            }
            if (values.passport_birth_date) {
                formData.append('passport_birth_date', values.passport_birth_date.format('YYYY-MM-DD'));
            }

            // License info
            formData.append('license_number', values.license_number || '');
            if (values.license_expiry) {
                formData.append('license_expiry', values.license_expiry.format('YYYY-MM-DD'));
            }

            if (values.address) {
                formData.append('address', values.address);
            }

            // Add files
            if (fileList[0]?.originFileObj) {
                formData.append('photo', fileList[0].originFileObj);
            }
            if (passportFileList[0]?.originFileObj) {
                formData.append('passport_photo_front', passportFileList[0].originFileObj);
            }
            if (passportBackFileList[0]?.originFileObj) {
                formData.append('passport_photo_back', passportBackFileList[0].originFileObj);
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

    const customPassportFrontUpload = async ({ file, onSuccess, onError }: any) => {
        setPhotoUrl(file); // This will be handled in handleSubmit directly as File object
        onSuccess("ok", file);
    };

    const customPassportBackUpload = async ({ file, onSuccess, onError }: any) => {
        setPassportPhotoUrl(file); // This will be handled in handleSubmit directly as File object
        onSuccess("ok", file);
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

                    {/* Passport Info */}
                    <Col span={24}>
                        <h4 style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 8, marginTop: 16 }}>Pasport ma'lumotlari</h4>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="passport_series"
                            label="Pasport seriyasi"
                            normalize={(value) => (value ? value.toUpperCase() : '')}
                        >
                            <Input prefix={<IdcardOutlined />} placeholder="AA" maxLength={2} style={{ textTransform: 'uppercase' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            name="passport_number"
                            label="Pasport raqami"
                            normalize={(value) => value.replace(/\D/g, '')}
                        >
                            <Input prefix={<IdcardOutlined />} placeholder="1234567" maxLength={7} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={16}>
                        <Form.Item
                            name="passport_issued_by"
                            label="Kim tomonidan berilgan"
                            normalize={(value) => {
                                if (!value) return '';
                                const letters = value.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
                                const numbers = value.replace(/[^0-9]/g, '').slice(0, 5);
                                return letters + numbers;
                            }}
                        >
                            <Input prefix={<IdcardOutlined />} placeholder="AAA12345" maxLength={8} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="passport_issued_date"
                            label="Berilgan sana"
                        >
                            <DatePicker 
                                style={{ width: '100%' }} 
                                format="DD.MM.YYYY" 
                                placeholder="Sanani tanlang" 
                                inputReadOnly 
                                allowClear={false}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="passport_birth_date"
                            label="Tug'ilgan sana"
                        >
                            <DatePicker 
                                style={{ width: '100%' }} 
                                format="DD.MM.YYYY" 
                                placeholder="Sanani tanlang" 
                                inputReadOnly 
                                allowClear={false}
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item label="Pasport nusxasi (Old taraf)">
                            <Upload
                                name="passport_front"
                                listType="picture"
                                showUploadList={true}
                                beforeUpload={handleBeforeUpload}
                                maxCount={1}
                                fileList={passportFileList}
                                customRequest={customPassportFrontUpload}
                                onChange={({ fileList }) => setPassportFileList(fileList)}
                            >
                                {passportFileList.length === 0 && (
                                    <Button icon={<UploadOutlined />}>Yuklash</Button>
                                )}
                            </Upload>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item label="Pasport nusxasi (Orqa taraf)">
                            <Upload
                                name="passport_back"
                                listType="picture"
                                showUploadList={true}
                                beforeUpload={handleBeforeUpload}
                                maxCount={1}
                                fileList={passportBackFileList}
                                customRequest={customPassportBackUpload}
                                onChange={({ fileList }) => setPassportBackFileList(fileList)}
                            >
                                {passportBackFileList.length === 0 && (
                                    <Button icon={<UploadOutlined />}>Yuklash</Button>
                                )}
                            </Upload>
                        </Form.Item>
                    </Col>

                    {/* Driving License Info */}
                    <Col span={24}>
                        <h4 style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 8, marginTop: 16 }}>Guvohnoma va boshqalar</h4>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="license_number"
                            label="Haydovchilik guvohnomasi"
                            normalize={(value) => {
                                if (!value) return '';
                                const letters = value.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
                                const numbers = value.replace(/[^0-9]/g, '').slice(0, 7);
                                return letters + numbers;
                            }}
                        >
                            <Input prefix={<IdcardOutlined />} placeholder="AA1234567" maxLength={9} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            name="license_expiry"
                            label="Amal qilish muddati"
                        >
                            <DatePicker 
                                style={{ width: '100%' }} 
                                format="DD.MM.YYYY" 
                                placeholder="Sanani tanlang" 
                                inputReadOnly 
                                allowClear={false}
                            />
                        </Form.Item>
                    </Col>

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
                    <Col xs={24}>
                        <Form.Item
                            name="address"
                            label="Manzil"
                        >
                            <Input.TextArea
                                rows={2}
                                placeholder="Manzil"
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default DriverModal; 