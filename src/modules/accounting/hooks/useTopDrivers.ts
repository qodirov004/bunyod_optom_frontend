import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { DriverType, DriversResponse } from '../types/driver';

export const useTopDrivers = () => {
  return useQuery<DriverType[]>({
    queryKey: ['topDrivers'],
    queryFn: async () => {
      // Fetch all drivers with status=driver (backend returns rays_count for them)
      const driversResponse = await axiosInstance.get<DriversResponse>('/customusers/?status=driver');
      
      let driversList: DriverType[] = [];
      if (driversResponse.data && driversResponse.data.results) {
        driversList = driversResponse.data.results;
      } else if (Array.isArray(driversResponse.data)) {
        driversList = driversResponse.data;
      }

      // Sort by rays_count and return the top 5
      return driversList
        .sort((a, b) => (Number(b.rays_count) || 0) - (Number(a.rays_count) || 0))
        .slice(0, 5);
    }
  });
};
