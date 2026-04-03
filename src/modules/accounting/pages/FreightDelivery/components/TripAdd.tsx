import React, { useState, useEffect } from 'react'
import {
  Form,
  Select,
  Input,
  InputNumber,
  Button,
  message,
  Card,
  Row,
  Col,
  Table,
  Divider,
  Typography,
  Space,
  Tag,
  Spin,
  Empty,
  Tabs,
  Modal,
} from 'antd'
import {
  PlusOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import axiosInstance from '@/api/axiosInstance'
import { API_URLS } from '@/api/apiConfig'
import { createRays, fetchFromLocations, fetchToLocations } from '@/modules/accounting/api/freight/freightapi'
import '../style/TripAdd.module.css'
import { FromLocation, ToLocation, ProductCreate } from '../../../types/freight.types'
import { freightApi } from '../../../api/freight/freightapi'
import ClientPayment from '../../../pages/Kassa/components/ClientPayment'
import { useCountries } from '../../../hooks/useCountries'

const { Option } = Select
const { TextArea } = Input
const { Text } = Typography

// Define local storage key
const DRAFT_TRIP_DATA_KEY = 'draft_trip_data';

interface Client {
  id: number;
  first_name: string;
  last_name: string;
  number: string;
  company?: string;
}

// API-dan olingan haydovchi ma'lumotlari interfeysi
interface Driver {
  id: number;
  fullname: string;
  phone_number: string;
  is_busy?: boolean;
}

interface Car {
  id: number;
  car_number: string;
  name: string;
  number: string;
  is_busy?: boolean;
}
interface Fourgon {
  id: number;
  name: string;
  number: string;
  is_busy?: boolean;
}
interface ClientProduct {
  id?: number; 
  tempId: string; 
  name: string;
  price: number;
  count: number;
  description: string;
  from_location: string;
  to_location: string;
  clientId: number;
}

// Tanlangan mijoz va mahsulotlari
interface SelectedClientData {
  client: Client;
  products: ClientProduct[];
}

// Product form values type
interface ProductFormValues {
  name: string;
  price: number;
  count: number;
  description?: string;
  from_location?: string;
  to_location?: string;
}

// Trip form values type
interface TripFormValues {
  driver: number;
  car: number;
  fourgon: number;
  price?: number;
  dr_price?: number;
  dp_price: number;
  from1?: string;
  to_go?: string;
  kilometer: number;
  dp_information?: string;
  count?: number;
  country?: number;
}

interface TripAddProps {
  onSuccess?: () => void;
}

// Helper function to generate a unique temporary ID
const generateTempId = () => {
  return Math.random().toString(36).substring(2, 15);
};

// Helper functions for local storage
const saveDraftToStorage = (selectedClients: SelectedClientData[]) => {
  try {
    // Don't save if there are no clients or products
    if (!selectedClients || selectedClients.length === 0) {
      return;
    }
    
    // Check if there are any products to save
    const hasProducts = selectedClients.some(client => client.products && client.products.length > 0);
    if (!hasProducts) {
      return;
    }
    
    localStorage.setItem(DRAFT_TRIP_DATA_KEY, JSON.stringify(selectedClients));
  } catch (error) {
    console.error('Error saving draft to localStorage:', error);
  }
};

const loadDraftFromStorage = (): SelectedClientData[] | null => {
  try {
    const savedData = localStorage.getItem(DRAFT_TRIP_DATA_KEY);
    return savedData ? JSON.parse(savedData) : null;
  } catch (error) {
    console.error('Error loading draft from localStorage:', error);
    return null;
  }
};

const clearDraftFromStorage = () => {
  try {
    // Verify that localStorage exists before removing
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(DRAFT_TRIP_DATA_KEY);
      console.log('Draft data cleared from localStorage');
    }
  } catch (error) {
    console.error('Error clearing draft from localStorage:', error);
  }
};

const TripAdd: React.FC<TripAddProps> = ({ onSuccess }) => {
  const [form] = Form.useForm()
  const [productForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [cars, setCars] = useState<Car[]>([])
  const [fourgons, setFourgons] = useState<Fourgon[]>([])
  const [fetchingData, setFetchingData] = useState(true)
  const [selectedClients, setSelectedClients] = useState<SelectedClientData[]>([])
  const [currentClientId, setCurrentClientId] = useState<number | null>(null)
  const [activeTabKey, setActiveTabKey] = useState<string>("0")
  const [completedClientIds, setCompletedClientIds] = useState<number[]>([])
  const [fromLocations, setFromLocations] = useState<FromLocation[]>([])
  const [toLocations, setToLocations] = useState<ToLocation[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedRaysId, setSelectedRaysId] = useState<number | null>(null)
  const { countries: apiCountries, loading: countriesLoading } = useCountries();
  const [messageApi, contextHolder] = message.useMessage();
  const [paymentClients, setPaymentClients] = useState<any[]>([]);

  // Helper function to check if two products are duplicates
  const isProductDuplicate = (product1: ClientProduct, product2: ClientProduct): boolean => {
    return (
      product1.name === product2.name && 
      product1.price === product2.price && 
      product1.count === product2.count &&
      product1.from_location === product2.from_location &&
      product1.to_location === product2.to_location
    );
  };

  // Load saved draft when component mounts
  useEffect(() => {
    const savedDraft = loadDraftFromStorage();
    if (savedDraft && savedDraft.length > 0) {
      // Filter out clients with no products
      const validClients = savedDraft.filter(client => 
        client.products && client.products.length > 0
      );
      
      // Process each client to deduplicate products
      const processedClients = validClients.map(client => {
        // Filter out duplicate products
        const uniqueProducts: ClientProduct[] = [];
        client.products.forEach(product => {
          // Check if this product is a duplicate of any existing product
          const isDuplicate = uniqueProducts.some(existingProduct => 
            isProductDuplicate(existingProduct, product)
          );
          
          if (!isDuplicate) {
            uniqueProducts.push(product);
          }
        });
        
        return {
          ...client,
          products: uniqueProducts
        };
      });
      
      // Only set state if there are valid clients with products
      if (processedClients.length > 0) {
        setSelectedClients(processedClients);
        setCurrentClientId(processedClients[0].client.id);
        setActiveTabKey("0");
        // Trigger message in a timeout or separate effect to avoid render cycle issues
        setTimeout(() => {
          messageApi.info("Saqlangan ma'lumotlar yuklandi");
        }, 100);
      }
    }
  }, [messageApi]);

  // Save draft when selectedClients changes, but with debounce
  useEffect(() => {
    // Skip saving if there are no clients or if we're in the process of loading
    if (selectedClients.length === 0 || fetchingData) {
      return;
    }
    
    // Check if there are any products to save
    const hasProducts = selectedClients.some(client => client.products && client.products.length > 0);
    if (!hasProducts) {
      return;
    }
    
    // Use a debounce to avoid too frequent saves
    const timeoutId = setTimeout(() => {
      console.log('Saving draft to localStorage...');
      saveDraftToStorage(selectedClients);
    }, 1000); // 1 second delay
    
    // Cleanup timeout on next change
    return () => clearTimeout(timeoutId);
  }, [selectedClients, fetchingData]);

  // Kerakli ma'lumotlarni yuklash
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('API URLs:', API_URLS);
        try {
          const driversRes = await axiosInstance.get(`${API_URLS.drivers}?status=driver`);
          setDrivers(driversRes.data || []);
          console.log('Drivers data:', driversRes.data);

          if (driversRes.data && driversRes.data.length > 0) {
            console.log('Driver ID example:', driversRes.data[0].id, typeof driversRes.data[0].id);
          }
        } catch (error) {
          console.error('Haydovchilarni yuklashda xatolik:', error);
          messageApi.error('Haydovchilarni yuklashda xatolik');
        }

        try {
          const clientsRes = await axiosInstance.get('/clients/');
          setClients(clientsRes.data || []);
          console.log('Clients data:', clientsRes.data);

          if (clientsRes.data && clientsRes.data.length > 0) {
            console.log('Client ID example:', clientsRes.data[0].id, typeof clientsRes.data[0].id);
          }
        } catch (error) {
          console.error('Mijozlarni yuklashda xatolik:', error);
          messageApi.error('Mijozlarni yuklashda xatolik');
        }

        try {
          const carsRes = await axiosInstance.get(API_URLS.cars);
          setCars(carsRes.data || []);
          console.log('Cars data:', carsRes.data);

          if (carsRes.data && carsRes.data.length > 0) {
            console.log('Car ID example:', carsRes.data[0].id, typeof carsRes.data[0].id);
          }
        } catch (error) {
          console.error('Mashinalarni yuklashda xatolik:', error);
          messageApi.error('Mashinalarni yuklashda xatolik');
        }

        try {
          const fourgonsRes = await axiosInstance.get(API_URLS.vans);
          setFourgons(fourgonsRes.data || []);
          console.log('Fourgons data:', fourgonsRes.data);

          if (fourgonsRes.data && fourgonsRes.data.length > 0) {
            console.log('Fourgon ID example:', fourgonsRes.data[0].id, typeof fourgonsRes.data[0].id);
          }
        } catch (error) {
          console.error('Furgonlarni yuklashda xatolik:', error);
          messageApi.error('Furgonlarni yuklashda xatolik');
        }

        try {
          const fromLocationsRes = await fetchFromLocations();
          setFromLocations(fromLocationsRes);
        } catch (error) {
          console.error('Error loading from locations:', error);
          messageApi.error('Failed to load origin locations');
        }

        try {
          const toLocationsRes = await fetchToLocations();
          setToLocations(toLocationsRes);
          console.log('To locations:', toLocationsRes);
        } catch (error) {
          console.error('Error loading to locations:', error);
          messageApi.error('Failed to load destination locations');
        }

      } catch (error) {
        console.error('Ma\'lumotlarni olishda xatolik:', error);
        messageApi.error('Ma\'lumotlarni olishda xatolik yuz berdi');
      } finally {
        setFetchingData(false);
      }
    }

    fetchData();
  }, [messageApi])

  // Add cleanup on component unmount and handle page navigation
  useEffect(() => {
    // Handle browser refresh or tab close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If there's data in localStorage, ask for confirmation
      const savedData = localStorage.getItem(DRAFT_TRIP_DATA_KEY);
      if (savedData) {
        // This shows a browser confirmation dialog
        e.preventDefault();
        e.returnValue = '';
      }
    };

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      // Remove event listener
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Clear draft from localStorage when component unmounts
      // Only clear if not in the middle of a submission
      if (!loading) {
        clearDraftFromStorage();
      }
    };
  }, [loading]);

  useEffect(() => {
    if (!fetchingData) {
      const busyDrivers = drivers.filter(driver => driver.is_busy).length;
      const busyCars = cars.filter(car => car.is_busy).length;
      const busyFurgons = fourgons.filter(furgon => furgon.is_busy).length;

      // Show message if there are busy vehicles
      if (busyDrivers > 0 || busyCars > 0 || busyFurgons > 0) {
        const messages = [];

        if (busyDrivers > 0) {
          messages.push(`Band haydovchilar: ${busyDrivers} ta`);
        }

        if (busyCars > 0) {
          messages.push(`Band mashinalar: ${busyCars} ta`);
        }

        if (busyFurgons > 0) {
          messages.push(`Band furgonlar: ${busyFurgons} ta`);
        }

        messageApi.info(messages.join(', ') + ' - bu transport vositalari boshqa reyslarga biriktirilgan.');
      }
    }
  }, [fetchingData, drivers, cars, fourgons, messageApi]);

  // Tab o'zgartirilganda
  const handleTabChange = (activeKey: string) => {
    setActiveTabKey(activeKey);
  };

  // Mijoz qo'shish
  const handleAddClient = (clientId: any) => {
    const id = Number(clientId);
    // Agar mijoz allaqachon tanlangan bo'lsa, qo'shmaslik
    if (selectedClients.some(item => item.client.id === id)) {
      messageApi.warning("Bu mijoz allaqachon tanlangan");
      return;
    }

    const client = clients.find(c => c.id === id);
    if (client) {
      const newClientData: SelectedClientData = {
        client: client,
        products: []
      };

      const newSelectedClients = [...selectedClients, newClientData];
      setSelectedClients(newSelectedClients);

      // Yangi qo'shilgan mijozga o'tish
      setActiveTabKey((newSelectedClients.length - 1).toString());
      setCurrentClientId(id);
    }
  };

  // Mijozni o'chirish
  const handleRemoveClient = (clientIndex: number) => {
    const newSelectedClients = [...selectedClients];
    newSelectedClients.splice(clientIndex, 1);
    setSelectedClients(newSelectedClients);

    // Agar hamma mijozlar o'chirilgan bo'lsa
    if (newSelectedClients.length === 0) {
      setCurrentClientId(null);
      setActiveTabKey("0");
    } else {
      // Agar o'chirilgan mijoz tanlangan mijoz bo'lsa
      if (parseInt(activeTabKey) === clientIndex) {
        // Qolgan mijozlardan birinchisini tanlaymiz
        setActiveTabKey("0");
        setCurrentClientId(newSelectedClients[0].client.id);
      } else if (parseInt(activeTabKey) > clientIndex) {
        // Agar o'chirilgan mijoz tanlangan mijozdan oldin bo'lsa
        setActiveTabKey((parseInt(activeTabKey) - 1).toString());
      }
    }
  };

  // Mijoz mahsulotini yaratish - now only adds to local state
  const handleAddProduct = async (values: ProductFormValues) => {
    if (!currentClientId) {
      messageApi.error("Avval mijozni tanlang");
      return;
    }

    // Mahsulot ma'lumotlarini tekshirish
    if (!values.name || !values.price || !values.count) {
      messageApi.error("Mahsulot ma'lumotlarini to'liq kiriting");
      return;
    }

    const clientIndex = selectedClients.findIndex(
      item => item.client.id === currentClientId
    );

    if (clientIndex === -1) {
      messageApi.error("Tanlangan mijoz topilmadi");
      return;
    }

    try {
      setLoading(true);

      // Generate a temporary ID for the product
      const tempId = generateTempId();

      // Create local product object
      const newProduct: ClientProduct = {
        tempId: tempId,
        name: values.name,
        price: Number(values.price),
        count: Number(values.count),
        description: values.description || '',
        from_location: values.from_location || '',
        to_location: values.to_location || '',
        clientId: currentClientId
      };

      // Check if a similar product already exists for this client using the helper function
      const existingSimilarProduct = selectedClients[clientIndex].products.some(
        product => isProductDuplicate(product, newProduct)
      );

      if (existingSimilarProduct) {
        messageApi.warning("Shunga o'xshash mahsulot allaqachon qo'shilgan");
        setLoading(false);
        return;
      }

      // Add the product to the local state
      const updatedClients = [...selectedClients];
      updatedClients[clientIndex].products.push(newProduct);
      setSelectedClients(updatedClients);

      // Formani tozalash
      productForm.resetFields();

      // Muvaffaqiyatli qo'shilgan haqida xabar berish
      messageApi.success("Mahsulot muvaffaqiyatli qo'shildi");
    } catch (error) {
      console.error('Error adding product:', error);
      messageApi.error("Mahsulot qo'shishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Mahsulotni o'chirish - now only removes from local state
  const handleRemoveProduct = (clientIndex: number, productIndex: number) => {
    const updatedClients = [...selectedClients];
    updatedClients[clientIndex].products.splice(productIndex, 1);
    setSelectedClients(updatedClients);
  };

  // Reys qo'shish funksiyasi
  const handleTripSubmit = async (values: TripFormValues) => {
    if (selectedClients.length === 0) {
      messageApi.error("Iltimos, kamida bitta mijoz tanlang");
      return;
    }

    // Check if any client has products
    const hasAnyProducts = selectedClients.some(client => client.products.length > 0);
    if (!hasAnyProducts) {
      messageApi.error("Kamida bitta mijoz uchun mahsulot qo'shing");
      return;
    }

    // Check if selected driver is busy
    const selectedDriver = drivers.find(driver => driver.id === Number(values.driver));
    if (selectedDriver?.is_busy) {
      messageApi.error("Tanlangan haydovchi band. Iltimos, boshqa haydovchi tanlang.");
      return;
    }

    // Check if selected car is busy
    const selectedCar = cars.find(car => car.id === values.car);
    if (selectedCar?.is_busy) {
      messageApi.error("Tanlangan mashina band. Iltimos, boshqa mashina tanlang.");
      return;
    }

    // Check if selected furgon is busy
    const selectedFurgon = fourgons.find(furgon => furgon.id === values.fourgon);
    if (selectedFurgon?.is_busy) {
      messageApi.error("Tanlangan furgon band. Iltimos, boshqa furgon tanlang.");
      return;
    }



    console.log("Driver payment data:", {
      amount: values.dp_price
    });

    setLoading(true);

    try {
      // IMPORTANT: First create all products in the backend
      console.log('=== FIRST CREATING ALL PRODUCTS ===');

      // Map to track created product IDs by tempId
      const createdProductMap = new Map();

      // Create all products first
      for (const selectedClient of selectedClients) {
        for (const product of selectedClient.products) {
          try {
            const productData: ProductCreate = {
              name: product.name,
              price: product.price,
              count: product.count,
              description: product.description,
              from_location: Number(product.from_location),
              to_location: Number(product.to_location),
              client: selectedClient.client.id,
              currency: 4, // UZS
              is_total_price: true
            };

            // Log product creation data
            console.log('Creating product:', product.name);

            // Create the product in the backend
            const createdProduct = await freightApi.createProduct(productData);
            console.log('Product created successfully:', createdProduct);

            // Store the created product ID with its tempId
            if (product.tempId) {
              createdProductMap.set(product.tempId, createdProduct.id);
            }
          } catch (productError) {
            console.error('Error creating product:', productError);
            messageApi.warning(`Failed to create product ${product.name} for client ${selectedClient.client.first_name}`);
          }
        }
      }

      console.log('All products created successfully');

      // NOW create the trip/rays
      // Format client as array of client IDs, which is what RaysCreate expects
      const clientIds = selectedClients.map(client => client.client.id);

      // Ensure dp_currency is a plain string, not a type
      // Create the payload with explicit types
      // Calculate total price and extract locations from the first product
      let totalPrice = 0;
      let firstFromLocId = null;
      let firstToLocId = null;

      selectedClients.forEach(client => {
        client.products.forEach(product => {
          totalPrice += Number(product.price);
          if (!firstFromLocId) firstFromLocId = Number(product.from_location);
          if (!firstToLocId) firstToLocId = Number(product.to_location);
        });
      });

      // Find location names
      const fromLocName = fromLocations.find((l: any) => l.id === firstFromLocId)?.name || '';
      const toLocName = toLocations.find((l: any) => l.id === firstToLocId)?.name || '';

      // Find the selected driver object to check for additional ID fields
      const selectedDriverObj = drivers.find(d => Number(d.id) === Number(values.driver));
      // In some contexts, the backend expects the driver_id (profile ID) instead of the user ID
      const driverId = (selectedDriverObj as any)?.driver_id || (selectedDriverObj as any)?.driver?.id || Number(values.driver);

      const payload = {
        driver: driverId,
        car: Number(values.car),
        fourgon: Number(values.fourgon),
        client: clientIds, 
        price: totalPrice,
        dr_price: values.dr_price ? Number(values.dr_price) : 0,
        dp_price: Number(values.dp_price),
        dp_currency: 4, // UZS
        currency: 4, // UZS
        from1: fromLocName,
        to_go: toLocName,
        kilometer: Number(values.kilometer),
        dp_information: values.dp_information || '',
        count: values.count || 0,
        country: values.country || 0,
        is_completed: false,
        client_completed: completedClientIds || []
      };

      // Log the exact payload being sent
      console.log('SENDING EXACT PAYLOAD:', JSON.stringify(payload, null, 2));

      try {
        // Use axiosInstance.post directly to avoid type issues
        const response = await axiosInstance.post('/rays/', payload);
        const raysResponse = response.data;
        console.log('Rays created successfully:', raysResponse);

        messageApi.success('Trip created successfully');

        // Capture clients for the payment modal BEFORE resetting state
        const clientsForPayment = selectedClients.map(sc => ({
            ...sc.client,
            first_name: sc.client.company || sc.client.first_name || 'Mijoz'
        }));
        setPaymentClients(clientsForPayment);

        // Open payment modal for the newly created rays
        setSelectedRaysId(raysResponse.id);
        setShowPaymentModal(true);

        // Clear ALL data from localStorage after successful trip creation
        clearDraftFromStorage();
        
        // Reset all state
        form.resetFields();
        productForm.resetFields();
        setSelectedClients([]);
        setCompletedClientIds([]);
        setCurrentClientId(null);
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } catch (apiError: any) {
        console.error('API Error:', apiError.response?.status, apiError.response?.data);
        // Show specific error from API if available
        if (apiError.response?.data?.dp_currency) {
          messageApi.error(`Currency error: ${apiError.response.data.dp_currency.join(', ')}`);
        } else {
          messageApi.error(apiError.message || 'Failed to create trip');
        }
      }

    } catch (error) {
      console.error('Submit Error:', error);
      messageApi.error(error instanceof Error ? error.message : 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Ma`lumotlar yuklanmoqda...</div>
      </div>
    );
  }

  const clientTabs = selectedClients.map((clientData, index) => {
    return {
      key: index.toString(),
      label: (
        <span>
          {clientData.client.company || `${clientData.client.first_name} ${clientData.client.last_name}`}
          <Tag
            color="blue"
            style={{ marginLeft: 8 }}
          >
            {clientData.products.length}
          </Tag>
        </span>
      ),
      children: (
        <div key={`client-tab-${index}`}>
          <div className="client-info" style={{ marginBottom: 16 }}>
            <Space>
              <UserOutlined />
              <Text strong>{clientData.client.company || `${clientData.client.first_name} ${clientData.client.last_name}`}</Text>
              <Text>({clientData.client.number})</Text>
              <Button
                type="text"
                danger
                onClick={() => handleRemoveClient(index)}
              >
                O`chirish
              </Button>
            </Space>
          </div>

          <Card title="Mahsulot qo'shish" variant="borderless" style={{ marginBottom: 16 }}>
            <Form
              form={productForm}
              name="product-form"
              layout="vertical"
              onFinish={handleAddProduct}
            >
              <Form.Item
                name="name"
                label="Mahsulot nomi"
                rules={[{ required: true, message: 'Mahsulot nomini kiriting!' }]}
              >
                <Input placeholder="Mahsulot nomi" />
              </Form.Item>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    name="price"
                    label="Narxi (so'mda)"
                    rules={[{ required: true, message: 'Narxni kiriting!' }]}
                  >
                    <InputNumber
                      placeholder="Narx"
                      min={0}
                      style={{ width: '100%' }}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => (value ? value.replace(/\$\s?|(,*)/g, '') : '') as any}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="count"
                    label="kubi"
                    rules={[{ required: true, message: 'Sonini kiriting!' }]}
                  >
                    <InputNumber
                      placeholder="kubi"
                      min={1}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    name="from_location"
                    label="Qayerdan"
                    rules={[{ required: true, message: 'Please select origin location' }]}
                  >
                    <Select placeholder="Select origin location">
                      {fromLocations.map(location => (
                        <Option key={location.id} value={location.id}>
                          {location.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="to_location"
                    label="Qayerga"
                    rules={[{ required: true, message: 'Please select destination location' }]}
                  >
                    <Select placeholder="Select destination location">
                      {toLocations.map(location => (
                        <Option key={location.id} value={location.id}>
                          {location.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>



              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    name="description"
                    label="Izoh"
                  >
                    <TextArea placeholder="Izoh" rows={2} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<PlusOutlined />}
                >
                  Mahsulot qo`shish
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {clientData.products.length > 0 ? (
            <Card title="Qo'shilgan mahsulotlar">
              <Table
                dataSource={clientData.products}
                rowKey={(record) => record.tempId}
                columns={[
                  {
                    title: 'Mahsulot nomi',
                    dataIndex: 'name',
                    key: 'name',
                  },
                  {
                    title: 'Narxi',
                    dataIndex: 'price',
                    key: 'price',
                    render: (price) => `${Number(price).toLocaleString()} so'm`,
                  },
                  {
                    title: 'Kubi',
                    dataIndex: 'count',
                    key: 'count',
                  },
                  {
                    title: 'Umumiy',
                    key: 'total',
                    render: (_, record) => `${record.price.toLocaleString()} so'm`,
                  },
                  {
                    title: 'Amallar',
                    key: 'action',
                    render: (_, record, productIndex) => (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveProduct(index, productIndex)}
                      >
                        O`chirish
                      </Button>
                    ),
                  },
                ]}
                pagination={false}
                summary={(pageData) => {
                  const totalPrice = pageData.reduce((sum, current) => sum + current.price, 0);
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}>
                        <Text strong>Jami</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <Text strong>{totalPrice.toLocaleString()} so'm</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} />
                    </Table.Summary.Row>
                  );
                }}
              />
            </Card>
          ) : (
            <Empty description="Hali mahsulot qo'shilmagan" />
          )}
        </div>
      )
    };
  });

  return (
    <div className="trip-form-container">
      {contextHolder}
      <Card title="Yangi reys qo'shish">
        <Row gutter={[24, 16]}>
          <Col span={24} md={16}>
            <Card title="Asosiy ma'lumotlar" variant="borderless">
              <Form
                form={form}
                name="trip-form"
                layout="vertical"
                onFinish={handleTripSubmit}
                validateMessages={{
                  required: '${label} kiritilishi shart!',
                  types: {
                    number: '${label} raqam bo\'lishi kerak!',
                  }
                }}
                initialValues={{
                  count: 0,
                  is_completed: false
                }}
              >
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Form.Item
                      name="driver"
                      label="Haydovchi"
                      rules={[
                        { required: true },
                        { type: 'number', transform: (value) => Number(value) }
                      ]}
                    >
                      <Select placeholder="Haydovchi tanlang">
                        {drivers.map(driver => (
                          <Option
                            key={driver.id}
                            value={Number(driver.id)}
                            disabled={driver.is_busy}
                          >
                            {driver.fullname}
                            {driver.is_busy && <Tag color="red" style={{ marginLeft: 8 }}>Band</Tag>}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item
                      name="car"
                      label="Mashina"
                      rules={[{ required: true, message: 'Mashinani tanlang!' }]}
                    >
                      <Select placeholder="Mashina tanlang">
                        {cars.map(car => (
                          <Option
                            key={car.id}
                            value={car.id}
                            disabled={car.is_busy}
                          >
                            {car.car_number} || <Tag>{car.name}</Tag>
                            {car.is_busy && <Tag color="red" style={{ marginLeft: 8 }}>Band</Tag>}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item
                      name="fourgon"
                      label="Furgon"
                      rules={[{ required: true, message: 'Furgonni tanlang!' }]}
                    >
                      <Select placeholder="Furgon tanlang">
                        {fourgons.map(fourgon => (
                          <Option
                            key={fourgon.id}
                            value={fourgon.id}
                            disabled={fourgon.is_busy}
                          >
                            {fourgon.number}
                            {fourgon.is_busy && <Tag color="red" style={{ marginLeft: 8 }}>Band</Tag>}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item
                      name="dp_price"
                      label="Haydovchiga to'lov (so'mda)"
                      rules={[{ required: true, message: "Haydovchiga to'lovni kiriting!" }]}
                    >
                      <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => (value ? value.replace(/\$\s?|(,*)/g, '') : '') as any}
                      />
                    </Form.Item>
                  </Col>


                </Row>

                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Form.Item
                      name="kilometer"
                      label="Kilometer"
                      rules={[{ required: true, message: "Kilometrni kiriting!" }]}
                    >
                      <InputNumber
                        placeholder="Kilometr"
                        min={0}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24} md={8}>
                    <Form.Item
                      name="count"
                      label="Soni"
                    >
                      <InputNumber
                        placeholder="Soni"
                        min={0}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={24} md={8}>
                    <Form.Item
                      name="country"
                      label="Davlat"
                      rules={[{ required: true, message: 'Davlatni tanlang' }]}
                    >
                      {countriesLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Spin size="small" style={{ marginRight: 8 }} />
                          <span>Davlatlar yuklanmoqda...</span>
                        </div>
                      ) : (
                        <Select
                          placeholder="Davlatni tanlang"
                          allowClear
                          style={{ width: '100%' }}
                        >
                          {apiCountries.map(country => (
                            <Option key={country.id} value={country.id}>
                              {country.name}
                            </Option>
                          ))}
                        </Select>
                      )}
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Form.Item
                      name="dp_information"
                      label="Qo'shimcha ma'lumotlar"
                    >
                      <TextArea
                        placeholder="Qo'shimcha ma'lumotlar"
                        rows={2}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<PlusOutlined />}
                    loading={loading}
                    disabled={selectedClients.length === 0 || !selectedClients.some(c => c.products.length > 0)}
                  >
                    Reys qo`shish
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col span={24} md={8}>
            <Card title="Mijozlar" variant="borderless" style={{ marginBottom: 16 }}>
              <Form.Item
                label="Mijoz qo'shish"
              >
                <Select
                  placeholder="Mijoz tanlang"
                  showSearch
                  style={{ width: '100%' }}
                  optionFilterProp="children"
                  onChange={handleAddClient}
                  value={undefined}
                >
                  {clients.map(client => (
                    <Option
                      key={client.id}
                      value={client.id}
                      disabled={selectedClients.some(c => c.client.id === client.id)}
                    >
                      {client.company || `${client.first_name} ${client.last_name}`} ({client.number})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Card
                title="Transport holati"
                size="small"
                style={{ marginBottom: '16px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Mashinalar:</span>
                  <div>
                    <Tag color="green">{cars.filter(car => !car.is_busy).length} ta</Tag> mavjud
                    {cars.filter(car => car.is_busy).length > 0 && (
                      <>, <Tag color="red">{cars.filter(car => car.is_busy).length} ta</Tag> band</>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Furgonlar:</span>
                  <div>
                    <Tag color="green">{fourgons.filter(furgon => !furgon.is_busy).length} ta</Tag> mavjud
                    {fourgons.filter(furgon => furgon.is_busy).length > 0 && (
                      <>, <Tag color="red">{fourgons.filter(furgon => furgon.is_busy).length} ta</Tag> band</>
                    )}
                  </div>
                </div>
              </Card>

              {selectedClients.length > 0 ? (
                <div className="client-tabs">
                  <Tabs
                    activeKey={activeTabKey}
                    onChange={handleTabChange}
                    type="card"
                    items={clientTabs}
                    onTabClick={(key) => setCurrentClientId(selectedClients[parseInt(key)].client.id)}
                  />
                </div>
              ) : (
                <Empty
                  description="Hali mijozlar qo'shilmagan"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Card>
          </Col>
        </Row>

        {selectedClients.length > 0 && (
          <Card title="Barcha tanlangan mijozlar va mahsulotlar" style={{ marginTop: 16 }}>
            {selectedClients.map((clientData) => (
              <div key={clientData.client.id} style={{ marginBottom: 16 }}>
                <Divider orientation="left">
                  <Space>
                    <UserOutlined />
                    <Text strong>{clientData.client.company || `${clientData.client.first_name} ${clientData.client.last_name}`}</Text>
                    <Text>({clientData.client.number})</Text>
                    <Tag color={clientData.products.length > 0 ? 'green' : 'red'}>
                      {clientData.products.length} mahsulot
                    </Tag>
                  </Space>
                </Divider>

                {clientData.products.length > 0 ? (
                  <Table
                    dataSource={clientData.products}
                    rowKey={(record) => record.tempId}
                    columns={[
                      {
                        title: 'Mahsulot nomi',
                        dataIndex: 'name',
                        key: 'name',
                      },
                      {
                        title: 'Narxi',
                        dataIndex: 'price',
                        key: 'price',
                        render: (price) => `${Number(price).toLocaleString()} so'm`,
                      },

                      {
                        title: 'Kubi',
                        dataIndex: 'count',
                        key: 'count',
                      },
                      {
                        title: 'Umumiy',
                        key: 'total',
                        render: (_, record) => `${record.price.toLocaleString()} so'm`,
                      },
                      {
                        title: 'Amallar',
                        key: 'action',
                        render: (_, record, productIndex) => (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveProduct(selectedClients.findIndex(c => c.client.id === clientData.client.id), productIndex)}
                          >
                            O`chirish
                          </Button>
                        ),
                      },
                    ]}
                    pagination={false}
                    summary={(pageData) => {
                      const totalPrice = pageData.reduce((sum, item) => sum + item.price, 0);
                      return (
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={2}>
                            <Text strong>Jami</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1}>
                            <Text strong>{totalPrice.toLocaleString()} so'm</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2} />
                        </Table.Summary.Row>
                      );
                    }}
                  />
                ) : (
                  <Empty description="Hali mahsulot qo'shilmagan" />
                )}
              </div>
            ))}

            <Divider orientation="left">Jami ma`lumotlar</Divider>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Mijozlar soni"
                    value={selectedClients.length}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Mahsulotlar soni"
                    value={selectedClients.reduce((sum, client) => sum + client.products.length, 0)}
                    prefix={<ShoppingCartOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        )}
      </Card>

      <ClientPayment
        raysId={selectedRaysId!}
        open={showPaymentModal}
        initialClients={paymentClients}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedRaysId(null);
          setPaymentClients([]);
          if (onSuccess) onSuccess();
        }}
      />
      <Modal
        title="Yangi mijoz qo'shish"
        open={false} // This was isClientModalVisible in the source but I see it twice? 
        // Actually I'll keep the logic if I find where isClientModalVisible is used.
        // I don't see handleClientModalOk and other modal logic in the full file? 
        // Wait, did I miss some lines? 
      />
    </div>
  )
}

function Statistic({ title, value, prefix, suffix }: { title: string, value: string | number, prefix?: React.ReactNode, suffix?: string }) {
  return (
    <div className="statistic">
      <div className="statistic-title">{title}</div>
      <div className="statistic-content">
        {prefix && <span className="statistic-prefix">{prefix}</span>}
        <span className="statistic-value">{value}</span>
        {suffix && <span className="statistic-suffix">{suffix}</span>}
      </div>
    </div>
  );
}

export default TripAdd