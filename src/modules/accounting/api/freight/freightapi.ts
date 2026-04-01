import axiosInstance from '@/api/axiosInstance'
import { API_URLS } from '@/api/apiConfig'
import {
  raysType,
  TripFormValues,
  RaysResponseType as FreightRaysResponseType,
  PaginatedResponse
} from '../../types/freight'
import { AxiosError } from 'axios'
import { 
  RaysCreate,
  ProductCreate,
  Location,
  FromLocation,
  ToLocation
} from '../../types/freight.types'

type ApiRaysResponseType = FreightRaysResponseType;
type ApiError = AxiosError<{ message?: string }>;

interface HistoryResponseData {
  id: number;
  driver_data: {
    fullname: string;
    phone_number: string;
  };
  car_data: {
    name: string;
    number: string;
  };
  fourgon_data: {
    name: string;
    number: string;
  };
  client_data: Array<{
    id: number;
    name: string;
    company: string;
    phone: string;
    price: number;
    address: string;
    is_completed: boolean;
  }>;
  price: number;
  dr_price: number;
  dp_price: number;
  from1: string;
  to_go: string;
  kilometer: number;
  dp_information: string;
  created_at: string;
  count: number;
  country: number;
}

export const createRays = async (data: raysType): Promise<ApiRaysResponseType> => {
  try {
    console.log('Original payload data:', data);
    
    const clientData = Array.isArray(data.client) ? data.client : [];
    const payload: Record<string, unknown> = {
      driver: Number(data.driver),
      car: Number(data.car),
      fourgon: Number(data.fourgon),
      client: clientData,
      price: Number(data.price || 0),
      dr_price: Number(data.dr_price || 0),
      dp_price: Number(data.dp_price || 0),
      kilometer: Number(data.kilometer || 0),
      is_completed: Boolean(data.is_completed),
    };

    if (Array.isArray(data.client_completed) && data.client_completed.length > 0) {
      payload.client_completed = data.client_completed.map(id => Number(id));
    }
    
    if (data.from1 !== undefined && data.from1 !== null && data.from1 !== '') {
      payload.from1 = String(data.from1);
    }
    
    if (data.to_go !== undefined && data.to_go !== null && data.to_go !== '') {
      payload.to_go = String(data.to_go);
    }
    
    if (data.dp_information !== undefined && data.dp_information !== null) {
      payload.dp_information = String(data.dp_information);
    }
    
    if (data.count !== undefined && data.count !== null) {
      payload.count = Number(data.count);
    }
    
    if (data.country !== undefined && data.country !== null) {
      payload.country = Number(data.country);
    }

    // Checking if selected vehicle is busy
    console.log('Creating new rays started', payload);
    if (payload?.car && typeof payload.car === 'object' && 'is_busy' in payload.car && payload.car.is_busy) {
      throw new Error("Transport band!");
    }
    if (payload?.fourgon && typeof payload.fourgon === 'object' && 'is_busy' in payload.fourgon && payload.fourgon.is_busy) {
      throw new Error("Furgon band!");
    }
    if (payload?.driver && typeof payload.driver === 'object' && 'is_busy' in payload.driver && payload.driver.is_busy) {
      throw new Error("Haydovchi band!");
    }

    console.log('Formatted payload:', payload);
    const response = await axiosInstance.post<ApiRaysResponseType>(API_URLS.rays, payload);
    return response.data;
  } catch (error: any) {
    console.error('API Error Details:', {
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.car && Array.isArray(errorData.car) && errorData.car.some((msg: string) => msg.includes('busy'))) {
        throw new Error('Tanlangan mashina band. Iltimos, boshqa mashina tanlang.');
      }
      if (errorData.fourgon && Array.isArray(errorData.fourgon) && errorData.fourgon.some((msg: string) => msg.includes('busy'))) {
        throw new Error('Tanlangan furgon band. Iltimos, boshqa furgon tanlang.');
      }
    }
    
    const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message || 'Reys yaratishda xatolik yuz berdi';
    throw new Error(errorDetail);
  }
};

export const fetchAllRays = async (): Promise<ApiRaysResponseType[]> => {
  try {
    const response = await axiosInstance.get<any>(`${API_URLS.rays}?t=${Date.now()}`)
    console.log('✅ Fetched rays (cache-busted):', response.data)

    const data = response.data
    const results = Array.isArray(data) ? data : (data.results || [])
    
    const transformedData = results.map((trip: any) => ({
      ...trip,
    }));

    return transformedData;
  } catch (error: any) {
    if (error.response?.status !== 401) {
      console.error('❌ Error fetching rays:', error.response?.data || error.message);
    }
    const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message || 'Reyslarni olishda xatolik yuz berdi';
    throw new Error(errorDetail);
  }
}

export const updateRayStatus = async (
  id: number,
  isCompleted: boolean,
): Promise<ApiRaysResponseType> => {
  try {
    console.log(`🚀 Updating ray ${id} status to ${isCompleted ? 'completed' : 'in progress'}...`)
    const response = await axiosInstance.patch<ApiRaysResponseType>(
      `${API_URLS.rays}${id}/`,
      {
        is_completed: isCompleted,
      },
    )
    console.log(
      `✅ Updated ray ${id} status to ${isCompleted ? 'completed' : 'in progress'}:`,
      response.data,
    )
    if (isCompleted) {
      try {
        console.log(`🚀 Moving ray ${id} to history...`)
        await completeRace(id)
        console.log(`✅ Ray ${id} moved to history successfully`)
      } catch (completeError: unknown) {
        const completeErrorAxios = completeError as ApiError;
        console.error(`⚠️ Failed to move ray ${id} to history:`, completeErrorAxios.message)
      }
    }

    return response.data
  } catch (error: any) {
    if (error.response?.status !== 401) {
      console.error(`❌ Error updating ray ${id}:`, error.response?.data || error.message);
    }
    const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message || 'Reysni yangilashda xatolik yuz berdi';
    throw new Error(errorDetail);
  }
}

export const completeRace = async (id: number): Promise<HistoryResponseData> => {
  try {
    const response = await axiosInstance.get<ApiRaysResponseType>(`${API_URLS.rays}${id}/`)
    const ray = response.data

    console.log(`🚀 Creating history record for ray ${id}...`)
    const historyData = {
      driver_data: {
        fullname: ray.client.length > 0 ? ray.client[0].name : "Unknown",
        phone_number: ray.client.length > 0 ? ray.client[0].phone : "Unknown"
      },
      car_data: {
        name: ray.car.model,
        number: ray.car.number
      },
      fourgon_data: {
        name: ray.fourgon.type,
        number: ray.fourgon.number
      },
      client_data: ray.client,
      price: ray.price,
      dr_price: ray.dr_price,
      dp_price: ray.dp_price,
      from1: ray.from1,
      to_go: ray.to_go,
      kilometer: ray.kilometer,
      dp_information: ray.dp_information,
      created_at: ray.created_at,
      count: ray.count,
      country: ray.country || 0
    }

    const historyResponse = await axiosInstance.post(API_URLS.history, historyData)
    console.log(`✅ Ray ${id} completed and moved to history:`, historyResponse.data)
    return historyResponse.data
  } catch (error: any) {
    if (error.response?.status !== 401) {
      console.error(`❌ Error completing ray ${id}:`, error.response?.data || error.message);
    }
    const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message || 'Reysni tarixga o\'tkazishda xatolik yuz berdi';
    throw new Error(errorDetail);
  }
}

export const completeAllRays = async (): Promise<TripFormValues[]> => {
  try {
    const response = await axiosInstance.get<TripFormValues[]>(
      `${API_URLS.history}`
    )
    console.log('✅ Fetched rays history:', response.data)
    return response.data;
  } catch (error: any) {
    if (error.response?.status !== 401) {
      console.error('❌ Error fetching rays history:', error.response?.data || error.message);
    }
    const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message || 'Reyslar tarixini olishda xatolik yuz berdi';
    throw new Error(errorDetail);
  }
}

export const exportRays = async (params: {
  period?: string
  from?: string
  to?: string
}): Promise<Blob> => {
  try {
    const queryParams = new URLSearchParams()
    if (params.period) {
      queryParams.append('period', params.period)
    }
    if (params.from) {
      queryParams.append('from', params.from)
    }
    if (params.to) {
      queryParams.append('to', params.to)
    }
    const url = `${API_URLS.rays}export/?${queryParams.toString()}`
    console.log('Making export request to:', url)

    const response = await axiosInstance.get(url, {
      responseType: 'blob',
      headers: {
        Accept:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })

    if (response.status !== 200) {
      throw new Error('Export failed')
    }

    return response.data
  } catch (error: unknown) {
    const axiosError = error as ApiError;
    console.error('Export error details:', axiosError)
    throw new Error('Reyslarni eksport qilishda xatolik yuz berdi')
  }
}

export const returnTripFromHistory = async (id: number): Promise<{ id: number; status: string }> => {
  try {
    const response = await axiosInstance.get<TripFormValues>(`${API_URLS.history}${id}/`)
    const trip = response.data

    const createdDate = new Date(trip.created_at)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - createdDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays > 2) {
      throw new Error('Reys 2 kundan ko\'p vaqt o\'tgani uchun qaytarib bo\'lmaydi')
    }
    console.log(`🚀 Returning trip ${id} to active list...`)
    const restoreResponse = await axiosInstance.post(`/rayshistory-actions/${id}/restore/`)
    console.log(`✅ Trip ${id} successfully returned to active list:`, restoreResponse.data)
    return restoreResponse.data
  } catch (error: any) {
    console.error(`❌ Error returning trip ${id}:`, error.response?.data || error.message);
    const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message || 'Reysni qaytarishda xatolik yuz berdi';
    throw new Error(errorDetail);
  }
}

export const fetchFromLocations = async (): Promise<FromLocation[]> => {
  try {
    const response = await axiosInstance.get<FromLocation[]>('/fromlocation/');
    return response.data;
  } catch (error: any) {
    const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to fetch from locations';
    console.error('Error fetching from locations:', error.response?.data || error);
    throw new Error(errorDetail);
  }
};

export const fetchToLocations = async (): Promise<ToLocation[]> => {
  try {
    const response = await axiosInstance.get<ToLocation[]>('/tolocation/');
    return response.data;
  } catch (error: any) {
    const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to fetch to locations';
    console.error('Error fetching to locations:', error.response?.data || error);
    throw new Error(errorDetail);
  }
};

export const createFromLocation = async (name: string): Promise<FromLocation> => {
  try {
    const response = await axiosInstance.post<FromLocation>('/fromlocation/', { name });
    return response.data;
  } catch (error: any) {
    const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message || (error.response?.data && typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : null) || 'Failed to create from location';
    console.error('Error creating from location:', error.response?.data || error);
    throw new Error(errorDetail);
  }
};

export const createToLocation = async (name: string): Promise<ToLocation> => {
  try {
    const response = await axiosInstance.post<ToLocation>('/tolocation/', { name });
    return response.data;
  } catch (error: any) {
    const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message || (error.response?.data && typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : null) || 'Failed to create to location';
    console.error('Error creating to location:', error.response?.data || error);
    throw new Error(errorDetail);
  }
};

export const deleteFromLocation = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/fromlocation/${id}/`);
  } catch (error: any) {
    const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to delete from location';
    console.error('Error deleting from location:', error.response?.data || error);
    throw new Error(errorDetail);
  }
};

export const deleteToLocation = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/tolocation/${id}/`);
  } catch (error: any) {
    const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to delete to location';
    console.error('Error deleting to location:', error.response?.data || error);
    throw new Error(errorDetail);
  }
};

export const updateFromLocation = async (id: number, name: string): Promise<FromLocation> => {
  try {
    const response = await axiosInstance.put<FromLocation>(`/fromlocation/${id}/`, { name });
    return response.data;
  } catch (error: any) {
    const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to update from location';
    console.error('Error updating from location:', error.response?.data || error);
    throw new Error(errorDetail);
  }
};

export const updateToLocation = async (id: number, name: string): Promise<ToLocation> => {
  try {
    const response = await axiosInstance.put<ToLocation>(`/tolocation/${id}/`, { name });
    return response.data;
  } catch (error: any) {
    const errorDetail = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to update to location';
    console.error('Error updating to location:', error.response?.data || error);
    throw new Error(errorDetail);
  }
};

export const freightApi = {
  // Get all freight deliveries
  getAllFreight: async () => {
    try {
      const response = await axiosInstance.get('/rays/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching all freight:', error.response?.data || error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || 'Error fetching freight data';
      throw new Error(errorMsg);
    }
  },

  // Create new rays (route)
  createRays: async (data: RaysCreate) => {
    try {
      // Transform client data to match API expectations
      const formattedData = {
        ...data,
        client: Array.isArray(data.client) ? data.client : [data.client],
        client_completed: Array.isArray(data.client_completed) ? data.client_completed : [],
        driver_data: data.driver_data || {
          fullname: '',
          phone_number: ''
        },
        car_data: data.car_data || {
          name: '',
          number: ''
        },
        fourgon_data: data.fourgon_data || {
          name: '',
          number: ''
        },
        dp_currency: data.dp_currency || 'USD',
        is_completed: data.is_completed || false
      };

      const response = await axiosInstance.post('/rays/', formattedData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating rays:', error.response?.data || error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || (error.response?.data && typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : null) || error.message || 'Error creating rays';
      throw new Error(errorMsg);
    }
  },

  // Create new product
  createProduct: async (data: ProductCreate) => {
    try {
      console.log('Creating product with data:', data); // Debugging
      const response = await axiosInstance.post('/product/', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating product:', error.response?.data || error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || (error.response?.data && typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : null) || error.message || 'Error creating product';
      throw new Error(errorMsg);
    }
  },

  // Get all locations
  getLocations: async (): Promise<Location[]> => {
    try {
      const response = await axiosInstance.get('/fromlocation/');
      return response.data;
    } catch (error: any) {
      console.error('Error getting locations:', error.response?.data || error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || 'Error getting locations';
      throw new Error(errorMsg);
    }
  },

  getRaysById: async (id: number) => {
    try {
      const response = await axiosInstance.get(`/rays/${id}/`);
      return response.data;
    } catch (error: any) {
      console.error(`Error getting ray ${id}:`, error.response?.data || error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || `Error getting ray details`;
      throw new Error(errorMsg);
    }
  },

  updateRays: async (id: number, data: Partial<RaysCreate>) => {
    try {
      const response = await axiosInstance.patch(`/rays/${id}/`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating ray ${id}:`, error.response?.data || error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || 'Error updating rays';
      throw new Error(errorMsg);
    }
  },

  // Delete rays
  deleteRays: async (id: number) => {
    try {
      await axiosInstance.delete(`/rays/${id}/`);
    } catch (error: any) {
      console.error(`Error deleting ray ${id}:`, error.response?.data || error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || 'Error deleting rays';
      throw new Error(errorMsg);
    }
  },

  // Get all rays
  getAllRays: async () => {
    try {
      const response = await axiosInstance.get('/rays/');
      return response.data;
    } catch (error: any) {
      console.error('Error getting all rays:', error.response?.data || error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || 'Error fetching all rays';
      throw new Error(errorMsg);
    }
  },

  // Get active rays
  getActiveRays: async () => {
    try {
      const response = await axiosInstance.get('/rays/?is_completed=false');
      return response.data;
    } catch (error: any) {
      console.error('Error getting active rays:', error.response?.data || error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || 'Error fetching active rays';
      throw new Error(errorMsg);
    }
  },

  // Complete rays
  completeRays: async (id: number) => {
    try {
      const response = await axiosInstance.patch(`/rays/${id}/`, {
        is_completed: true
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error completing ray ${id}:`, error.response?.data || error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || 'Error completing rays';
      throw new Error(errorMsg);
    }
  }
};