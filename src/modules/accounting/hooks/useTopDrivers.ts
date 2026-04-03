import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { DriverType, DriversResponse } from '../types/driver';

export const useTopDrivers = () => {
  return useQuery<DriverType[]>({
    queryKey: ['topDrivers'],
    queryFn: async () => {
      // API dan barcha faol haydovchilarni olamiz
      const response = await axiosInstance.get<DriversResponse>('/customusers/?status=driver');
      
      let driversList: DriverType[] = [];
      if (response.data && response.data.results) {
        driversList = response.data.results;
      } else if (Array.isArray(response.data)) {
        driversList = response.data;
      }
      
      // Frontendda reyslar soni bo'yicha saralab, eng yuqori 5 tasini qaytaramiz
      return driversList
        .sort((a, b) => (b.rays_count || 0) - (a.rays_count || 0))
        .slice(0, 5);
    }
  });
};
