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
  const [availableClients, setAvailableClients] = useState<{ id: number; first_name: string; }[]>([]);
  const [raysData, setRaysData] = useState<RaysClientsMap[]>([]);
  const [isDebtRepayment, setIsDebtRepayment] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const isDebt = Form.useWatch('is_debt', form);
  const totalExpectedAmount = Form.useWatch('total_expected_amount', form);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await cashApi.getPaymentWays();
        setPaymentMethods(response);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        message.error('To\'lov usullarini yuklashda xatolik yuz berdi');
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
        message.error('Xatolik: Reys-mijozlar ma\'lumotlarini olib bo\'lmadi');
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
      
      const isRepayment = editingTransaction && 
                          editingTransaction.comment === "Qarz to'lovi" && 
                          editingTransaction.total_expected_amount > 0;
      
      setIsDebtRepayment(isRepayment);
      
      if (editingTransaction) {
        form.setFieldsValue({
          ...editingTransaction,
          date: editingTransaction.created_at ? dayjs(editingTransaction.created_at) : dayjs(),
          is_debt: isRepayment ? false : (editingTransaction.is_debt || false),
          is_via_driver: editingTransaction.is_via_driver || false,
          is_delivered_to_cashier: editingTransaction.is_delivered_to_cashier || false,
          currency: 4 // Standardize to UZS
        });
        
        if (editingTransaction.rays) {
          setSelectedRays(editingTransaction.rays);
          updateAvailableClients(editingTransaction.rays);
        }
      } else {
        form.setFieldsValue({
          date: dayjs(),
          currency: 4, // UZS
          is_debt: false,
          is_via_driver: false,
          is_delivered_to_cashier: true,
          payment_way: 1, 
          client: preSelectedClient   
        });
      }
    }
  }, [visible, editingTransaction, preSelectedClient]);

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
          message.error('Mijoz uchun tegishli reys topilmadi. Iltimos, avval reysni tanlang.');
          setLoading(false);
          return;
        }
      }

      const amount = Number(values.amount);
      const totalExpectedAmountValue = isDebtRepayment 
        ? Number(values.total_expected_amount) 
        : (Number(values.total_expected_amount) || amount);
      
      const paidAmount = isDebtRepayment 
        ? amount 
        : (values.is_debt ? (Number(values.paid_amount) || 0) : amount);

      const submitData: any = {
        client: values.client,
        rays: raysId,
        ...(values.driver && { driver: values.driver }),
        ...(values.product && { product: values.product }),
        amount: amount,
        currency: 4, // Always UZS
        payment_way: values.payment_way, 
        comment: values.comment || (isDebtRepayment ? "Qarz to'lovi" : ''),
        is_debt: !!values.is_debt,
        is_via_driver: !!values.is_via_driver,
        is_delivered_to_cashier: values.is_delivered_to_cashier !== false,
        ...(values.total_expected_amount && { total_expected_amount: Math.round(totalExpectedAmountValue) }),
        ...(values.paid_amount && { paid_amount: Math.round(paidAmount) }),
        ...(values.date && { date: values.date.format('YYYY-MM-DD') }),
        move_type: 'cash'
      };

      if (editingTransaction?.id) {
        await cashApi.updateCash(editingTransaction.id, submitData);
        message.success('To\'lov muvaffaqiyatli yangilandi');
      } else {
        await cashApi.createCash(submitData);
        message.success('To\'lov muvaffaqiyatli yaratildi');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      message.error('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const inputParser = (value: string | undefined): string => {
    if (!value) return '';
    return value.replace(/\$\s?|(,*)/g, '');
  };

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
          currency: 4,
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
            disabled={!selectedRays || isDebtRepayment}
            showSearch
            optionFilterProp="children"
          >
            {availableClients.map(client => (
              <Option key={`client-option-${client.id}`} value={client.id}>
                {client.first_name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {isDebtRepayment && (
          <Form.Item
            label="Joriy qarz miqdori"
          >
            <Text strong style={{ fontSize: 16, color: '#ff4d4f' }}>
              {totalExpectedAmount}
            </Text>
          </Form.Item>
        )}

        <Form.Item
          name="amount"
          label={isDebtRepayment ? "To'lanayotgan summa" : "Summa"}
          rules={[{ required: true, message: 'Iltimos, summani kiriting' }]}
          style={{ width: '100%' }}
        >
          <InputNumber
            style={{ width: '100%' }}
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={inputParser}
          />
        </Form.Item>

        <Form.Item
          name="payment_way"
          label="To'lov turi"
          rules={[{ required: true, message: 'To\'lov turini tanlang' }]}
        >
          <Select placeholder="To'lov turini tanlang">
            {paymentMethods.map(method => (
              <Option key={method.id} value={method.id}>
                {method.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {!isDebtRepayment && (
          <>
            <Divider />
            <Space style={{ width: '100%' }} direction="horizontal" wrap>
              <Form.Item name="is_debt" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Radio.Group>
                  <Radio value={true}>Qarz</Radio>
                  <Radio value={false}>To`liq to`lov</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item name="is_via_driver" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Radio.Group>
                  <Radio value={true}>Haydovchi orqali</Radio>
                  <Radio value={false}>To`g`ridan-to`g`ri</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item name="is_delivered_to_cashier" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Radio.Group>
                  <Radio value={true}>Kassaga topshirildi</Radio>
                  <Radio value={false}>Topshirilmadi</Radio>
                </Radio.Group>
              </Form.Item>
            </Space>

            {isDebt && (
              <Space style={{ width: '100%', marginTop: '20px' }} direction="horizontal">
                <Form.Item
                  name="total_expected_amount"
                  label="Kutilayotgan summa"
                  rules={[{ required: true, message: 'Iltimos, kutilayotgan summani kiriting' }]}
                  style={{ width: '200px' }}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={inputParser}
                  />
                </Form.Item>
                <Form.Item
                  name="paid_amount"
                  label="To'langan summa"
                  rules={[{ required: true, message: 'Iltimos, to\'langan summani kiriting' }]}
                  style={{ width: '200px' }}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={inputParser}
                  />
                </Form.Item>
              </Space>
            )}
          </>
        )}

        {isDebtRepayment && (
          <Form.Item name="total_expected_amount" hidden>
            <InputNumber />
          </Form.Item>
        )}

        <Form.Item
          name="comment"
          label="Izoh"
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CashTransactionModal; 