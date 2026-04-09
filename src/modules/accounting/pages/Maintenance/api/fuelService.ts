import axiosInstance from '@/api/axiosInstance';
import { FuelType } from '@/modules/accounting/types/maintenance';

const API_URL = '/fuel/';

// Get all fuel expenses with optional date range
export const getFuelServices = async (dateRange?: { startDate: string | null; endDate: string | null }): Promise<FuelType[]> => {
  let url = API_URL;
  if (dateRange && dateRange.startDate && dateRange.endDate) {
    url += `?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`;
  }
  const response = await axiosInstance.get<FuelType[]>(url);
  return response.data;
};

// Get a single fuel expense by ID
export const getFuelService = async (id: number): Promise<FuelType> => {
  const response = await axiosInstance.get<FuelType>(`${API_URL}${id}/`);
  return response.data;
};

// Create a new fuel expense
export const createFuelService = async (service: FuelType): Promise<FuelType> => {
  const response = await axiosInstance.post<FuelType>(API_URL, service);
  return response.data;
};

// Update a fuel expense
export const updateFuelService = async (id: number, service: FuelType): Promise<FuelType> => {
  const response = await axiosInstance.put<FuelType>(`${API_URL}${id}/`, service);
  return response.data;
};

// Delete a fuel expense
export const deleteFuelService = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${API_URL}${id}/`);
};
