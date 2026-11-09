import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Radio,
  Space,
  Divider,
  message,
  Alert,
  Typography
} from 'antd';
import { CashCreate, RaysClientsMap } from '../../types/cash.types';
import { cashApi } from '../../api/cash/cashApi';
import { useCurrencies } from '../../hooks/useCurrencies';
import { formatCurrency } from '@/utils/formatCurrency';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text } = Typography;

interface PaymentMethod {
  id: number;
  name: string;
}

interface CashTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingTransaction?: CashCreate;
  raysClientsMap?: RaysClientsMap[];
  preSelectedClient?: number | null;
  form?: any;
}

const CashTransactionModal: React.FC<CashTransactionModalProps> = ({
  visible,
  onClose,
  onSuccess,
  editingTransaction,
  raysClientsMap = [],
  preSelectedClient,
  form: externalForm
}) => {
  const [internalForm] = Form.useForm();
  const form = externalForm || internalForm;
  const [loading, setLoading] = useState(false);
  const [selectedRays, setSelectedRays] = useState<number | null>(null);
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [raysData, setRaysData] = useState<RaysClientsMap[]>([]);
  const [isDebtRepayment, setIsDebtRepayment] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const { currencies } = useCurrencies();

  // Helper to find UZS currency ID
  const uzsId = currencies?.find(c => c.currency === 'UZS')?.id || 2;

  const isDebt = Form.useWatch('is_debt', form);
  const totalExpectedAmount = Form.useWatch('total_expected_amount', form);
  const amountValue = Form.useWatch('amount', form);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const categories = await cashApi.getCashCategories();
        if (Array.isArray(categories) && categories.length > 0) {
          setPaymentMethods(categories);
          return;
        }
      } catch {
        // Fallback below
      }
      try {
        const response = await cashApi.getPaymentWays();
        setPaymentMethods(response);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        message.error("To'lov usullarini yuklashda xatolik yuz berdi");
      }
    };

    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    const fetchRaysClientMapData = async () => {
      try {
        const response = await cashApi.getRaysClientsMap();
        setRaysData(response);
      } catch (error) {
        console.error('Error fetching rays-clients map:', error);
        message.error("Xatolik: Reys-mijozlar ma'lumotlarini olib bo'lmadi");
      }
    };

    if (raysClientsMap && raysClientsMap.length > 0) {
      setRaysData(raysClientsMap);
    } else {
      fetchRaysClientMapData();
    }
  }, [raysClientsMap]);

  useEffect(() => {
    if (visible) {
      form.resetFields();

      const isRepayment = Boolean(
        editingTransaction &&
        editingTransaction.comment === "Qarz to'lovi" &&
        editingTransaction.total_expected_amount > 0
      );

      setIsDebtRepayment(isRepayment);

      if (editingTransaction) {
        form.setFieldsValue({
          ...editingTransaction,
          date: editingTransaction.created_at ? dayjs(editingTransaction.created_at) : dayjs(),
          is_debt: isRepayment ? false : Boolean(editingTransaction.is_debt),
          is_via_driver: Boolean(editingTransaction.is_via_driver),
          is_delivered_to_cashier: Boolean(editingTransaction.is_delivered_to_cashier),
          currency: uzsId
        });

        if (editingTransaction.rays) {
          setSelectedRays(editingTransaction.rays);
          updateAvailableClients(editingTransaction.rays);
        }
      } else {
        setSelectedRays(null);
        setAvailableClients([]);
        form.setFieldsValue({
          date: dayjs(),
          currency: uzsId,
          is_debt: false,
          is_via_driver: false,
          is_delivered_to_cashier: true,
          payment_way: paymentMethods[0]?.id || 1,
          client: preSelectedClient
        });
      }
    }
  }, [visible, editingTransaction, preSelectedClient]);

  useEffect(() => {
    if (visible && !editingTransaction && paymentMethods.length > 0 && !form.isFieldTouched('payment_way')) {
      form.setFieldValue('payment_way', paymentMethods[0].id);
    }
  }, [visible, editingTransaction, paymentMethods, form]);

  const updateAvailableClients = (raysId: number) => {
    const selectedRaysData = raysData.find(r => r.rays_id === raysId);
    if (selectedRaysData) {
      setAvailableClients(selectedRaysData.clients);
    } else {
      setAvailableClients([]);
    }
  };

  const handleRaysChange = (value: number) => {
    setSelectedRays(value);
    form.setFieldValue('client', undefined);
    updateAvailableClients(value);
  };

  const handleClientChange = (clientId: number) => {
    const clientObj = availableClients.find(c => c.id === clientId);
    if (!clientObj) return;
    const expected = Math.round(
      Number(clientObj.total_expected_amount_uzs ?? clientObj.total_expected_amount_usd ?? 0)
    );
    const remaining = Math.round(
      Number(clientObj.total_remaining_uzs ?? clientObj.total_remaining_usd ?? expected)
    );
    if (expected > 0) {
      form.setFieldValue('total_expected_amount', expected);
    }
    if (form.getFieldValue('is_debt')) {
      form.setFieldValue('amount', 0);
    } else if (remaining > 0) {
      form.setFieldValue('amount', remaining);
    }
  };

  const findValidRaysForClient = async (clientId: number): Promise<number | null> => {
    if (raysData && raysData.length) {
      for (const rays of raysData) {
        const clientExists = rays.clients.some(client => client.id === clientId);
        if (clientExists) {
          return rays.rays_id;
        }
      }
    }
    try {
      const response = await cashApi.getRaysClientsMap();
      setRaysData(response);

      for (const rays of response) {
        const clientExists = rays.clients.some(client => client.id === clientId);
        if (clientExists) {
          return rays.rays_id;
        }
      }
    } catch (error) {
      console.error('Error finding valid rays for client:', error);
    }

    return null;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let raysId = values.rays;
      if (isDebtRepayment && (!raysId || raysId === 0)) {
        const validRays = await findValidRaysForClient(values.client);
        if (validRays) {
          raysId = validRays;
        } else {
          message.error("Mijoz uchun tegishli reys topilmadi. Iltimos, avval reysni tanlang.");
          setLoading(false);
          return;
        }
      }

      const isDebtTx = Boolean(values.is_debt) && !isDebtRepayment;
      const paidNow = Math.round(Number(values.amount ?? 0));
      const expectedTotal = Math.round(
        Number(values.total_expected_amount ?? (isDebtTx ? 0 : paidNow))
      );

      if (isDebtTx) {
        if (!expectedTotal || expectedTotal <= 0) {
          message.error("Qarz yozish uchun umumiy / kelishilgan summani kiriting");
          setLoading(false);
          return;
        }
        if (paidNow < 0 || paidNow >= expectedTotal) {
          message.error("Qarz yozishda hozir to'lanayotgan summa umumiy summadan kichik bo'lishi kerak (masalan, 0 so'm)");
          setLoading(false);
          return;
        }
      } else if (paidNow <= 0) {
        message.error("To'lov summasi 0 dan katta bo'lishi kerak");
        setLoading(false);
        return;
      }

      const submitData: any = {
        client: values.client,
        rays: raysId,
        ...(values.driver && { driver: values.driver }),
        ...(values.product && { product: values.product }),
        amount: paidNow,
        amount_in_usd: String(paidNow),
        currency: uzsId,
        payment_way: values.payment_way,
        comment:
          values.comment ||
          (isDebtRepayment
            ? "Qarz to'lovi"
            : isDebtTx
            ? `Qarz (Umumiy: ${expectedTotal.toLocaleString()} so'm)`
            : ''),
        is_debt: isDebtTx,
        is_via_driver: !!values.is_via_driver,
        is_delivered_to_cashier: values.is_delivered_to_cashier !== false,
        ...((isDebtTx || isDebtRepayment) && expectedTotal > 0 ? { total_expected_amount: expectedTotal } : {}),
        paid_amount: paidNow,
        ...(values.date && { date: values.date.format('YYYY-MM-DD') }),
        move_type: 'cash'
      };

      if (editingTransaction?.id) {
        await cashApi.updateCash(editingTransaction.id, submitData);
        message.success("To'lov muvaffaqiyatli yangilandi");
      } else {
        await cashApi.createCash(submitData);
        message.success(isDebtTx ? "Qarz yozuvi muvaffaqiyatli yaratildi" : "To'lov muvaffaqiyatli yaratildi");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      const errData = error?.response?.data;
      if (errData && typeof errData === 'object') {
        const msg = errData.detail || Object.entries(errData).map(([k, v]) => `${k}: ${v}`).join(', ');
        message.error(`Xatolik: ${msg}`);
      } else if (!error?.errorFields) {
        message.error('Xatolik yuz berdi');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputParser = (value: string | undefined): string => {
    if (!value) return '';
    return value.replace(/\$\s?|(,*)/g, '');
  };

  const remainingPreview = Math.max(
    0,
    Number(totalExpectedAmount || 0) - Number(amountValue || 0)
  );

  return (
    <Modal
      title={isDebtRepayment ? "Qarz to'lovi" : (editingTransaction ? "To'lovni tahrirlash" : "Yangi to'lov")}
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      width={800}
      forceRender={true}
    >
      {isDebtRepayment && (
        <Alert
          message="Qarz to'lovi"
          description="Siz mijozning mavjud qarzini to'layapsiz. To'lov summasi qarzni kamaytirish uchun ishlatiladi."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          date: dayjs(),
          currency: uzsId,
          is_debt: false,
          is_via_driver: false,
          is_delivered_to_cashier: true,
          payment_way: 1,
          client: preSelectedClient
        }}
      >
        <Form.Item
          name="rays"
          label="Reys"
          rules={[{ required: true, message: 'Iltimos, reysni tanlang' }]}
        >
          <Select
            placeholder="Reysni tanlang"
            onChange={handleRaysChange}
            showSearch
            optionFilterProp="children"
            disabled={isDebtRepayment}
          >
            {raysData.map(rays => (
              <Option key={`rays-option-${rays.rays_id}`} value={rays.rays_id}>
                Reys #{rays.rays_id}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="client"
          label="Mijoz"
          rules={[{ required: true, message: 'Iltimos, mijozni tanlang' }]}
        >
          <Select
            placeholder="Mijozni tanlang"
            onChange={handleClientChange}
            disabled={!selectedRays || isDebtRepayment}
            showSearch
            optionFilterProp="children"
          >
            {availableClients.map(client => (
              <Option key={`client-option-${client.id}`} value={client.id}>
                {client.company
                  ? `${client.company}${client.first_name && client.first_name !== client.company ? ` (${client.first_name})` : ''}`
                  : client.first_name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {isDebtRepayment && (
          <Form.Item label="Joriy qarz miqdori">
            <Text strong style={{ fontSize: 16, color: '#ff4d4f' }}>
              {formatCurrency(totalExpectedAmount, 'UZS')}
            </Text>
          </Form.Item>
        )}

        {!isDebtRepayment && (
          <>
            <Divider />
            <Space style={{ width: '100%', marginBottom: 16 }} direction="horizontal" wrap>
              <Form.Item name="is_debt" style={{ marginBottom: 0 }}>
                <Radio.Group
                  onChange={(e) => {
                    const nextDebt = e.target.value;
                    if (nextDebt) {
                      const currAmt = Number(form.getFieldValue('amount') || 0);
                      const currExp = Number(form.getFieldValue('total_expected_amount') || 0);
                      if (currExp <= 0 && currAmt > 0) {
                        form.setFieldValue('total_expected_amount', currAmt);
                      }
                      form.setFieldValue('amount', 0);
                    } else {
                      const currExp = Number(form.getFieldValue('total_expected_amount') || 0);
                      if (Number(form.getFieldValue('amount') || 0) === 0 && currExp > 0) {
                        form.setFieldValue('amount', currExp);
                      }
                    }
                  }}
                >
                  <Radio value={false}>To&apos;liq to&apos;lov</Radio>
                  <Radio value={true}>Qarz</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item name="is_via_driver" style={{ marginBottom: 0 }}>
                <Radio.Group>
                  <Radio value={true}>Haydovchi orqali</Radio>
                  <Radio value={false}>To&apos;g&apos;ridan-to&apos;g&apos;ri</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item name="is_delivered_to_cashier" style={{ marginBottom: 0 }}>
                <Radio.Group>
                  <Radio value={true}>Kassaga topshirildi</Radio>
                  <Radio value={false}>Topshirilmadi</Radio>
                </Radio.Group>
              </Form.Item>
            </Space>
          </>
        )}

        {isDebt && !isDebtRepayment && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Qarz sifatida belgilash"
            description="Umumiy kelishilgan summani va hozir to'lanayotgan summani kiriting. Agar mijoz hozir umuman pul bermagan bo'lsa, 'Hozir to'lanayotgan summa' ga 0 kiriting."
          />
        )}

        <Form.Item
          name="total_expected_amount"
          label="Umumiy / Kelishilgan summa (so'm)"
          hidden={!isDebt || isDebtRepayment}
          rules={isDebt && !isDebtRepayment ? [{ required: true, message: 'Iltimos, umumiy summani kiriting' }] : []}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={isDebt && !isDebtRepayment ? 1 : 0}
            placeholder="Kelishilgan umumiy summa"
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={inputParser as any}
          />
        </Form.Item>

        <Form.Item
          name="amount"
          label={
            isDebtRepayment
              ? "To'lanayotgan summa (so'm)"
              : isDebt
              ? "Hozir to'lanayotgan summa (so'm)"
              : "Summa (so'm)"
          }
          rules={[{ required: true, message: 'Iltimos, summani kiriting' }]}
          extra={isDebt && !isDebtRepayment ? "Agar mijoz hozir pul bermagan bo'lsa, 0 qoldiring" : undefined}
          style={{ width: '100%' }}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={isDebt && !isDebtRepayment ? 0 : 1}
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={inputParser as any}
          />
        </Form.Item>

        {isDebt && !isDebtRepayment && (
          <div style={{ marginBottom: 16, padding: '8px 12px', background: '#fff1f0', borderRadius: 6, border: '1px solid #ffa39e' }}>
            <span>Qarzga yoziladigan qoldiq: </span>
            <strong style={{ color: '#cf1322' }}>
              {formatCurrency(remainingPreview, 'UZS')}
            </strong>
          </div>
        )}

        <Form.Item
          name="payment_way"
          label="To'lov turi"
          rules={[{ required: true, message: "To'lov turini tanlang" }]}
        >
          <Select placeholder="To'lov turini tanlang">
            {paymentMethods.map(method => (
              <Option key={method.id} value={method.id}>
                {method.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="comment"
          label="Izoh"
        >
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CashTransactionModal;