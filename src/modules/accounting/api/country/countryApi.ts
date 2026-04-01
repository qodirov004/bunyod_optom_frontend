import axiosInstance from '../../../../api/axiosInstance';

export interface Country {
  id: number;
  name: string;
}
export const getAllCountries = async (): Promise<Country[]> => {
  try {
    const response = await axiosInstance.get('/country/');
    console.log('Country API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching countries:', error);
    // Return default countries as fallback in case of API failure
    return [
      { id: 1, name: 'Uzb' },
      { id: 2, name: 'Chet' },
    ];
  }
};

export const createCountry = async (name: string): Promise<Country> => {
  try {
    const response = await axiosInstance.post('/country/', { name });
    return response.data;
  } catch (error) {
    console.error('Error creating country:', error);
    throw error;
  }
};

export const updateCountry = async (id: number, name: string): Promise<Country> => {
  try {
    const response = await axiosInstance.put(`/country/${id}/`, { name });
    return response.data;
  } catch (error) {
    console.error(`Error updating country ${id}:`, error);
    throw error;
  }
};

export const deleteCountry = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/country/${id}/`);
  } catch (error) {
    console.error(`Error deleting country ${id}:`, error);
    throw error;
  }
};

export const countryApi = {
  getAllCountries,
  createCountry,
  updateCountry,
  deleteCountry
};