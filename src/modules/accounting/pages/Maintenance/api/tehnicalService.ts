import axiosInstance from '@/api/axiosInstance';
import { TehnicalService } from '@/modules/accounting/types/maintenance';

const API_URL = '/texnic/';

// Get all technical services with optional date range
export const getTehnicalServices = async (dateRange?: { startDate: string | null; endDate: string | null }): Promise<TehnicalService[]> => {
  let url = API_URL;
  if (dateRange && dateRange.startDate && dateRange.endDate) {
    url += `?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`;
  }
  const response = await axiosInstance.get<TehnicalService[]>(url);
  return response.data;
};

// Get a single technical service by ID
export const getTehnicalService = async (id: number): Promise<TehnicalService> => {
  const response = await axiosInstance.get<TehnicalService>(`${API_URL}${id}/`);
  return response.data;
};

// Create a new technical service
export const createTehnicalService = async (service: TehnicalService): Promise<TehnicalService> => {
  const response = await axiosInstance.post<TehnicalService>(API_URL, service);
  return response.data;
};

// Update a technical service
export const updateTehnicalService = async (id: number, service: TehnicalService): Promise<TehnicalService> => {
  const response = await axiosInstance.put<TehnicalService>(`${API_URL}${id}/`, service);
  return response.data;
};

// Delete a technical service
export const deleteTehnicalService = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${API_URL}${id}/`);
}; 