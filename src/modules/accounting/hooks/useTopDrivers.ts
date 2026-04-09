import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { DriverType, DriversResponse } from '../types/driver';
import { TripFormValues } from '../types/freight';

export const useTopDrivers = () => {
  return useQuery<DriverType[]>({
    queryKey: ['topDrivers'],
    queryFn: async () => {
      // 1. Fetch all drivers
      const driversResponse = await axiosInstance.get<DriversResponse>('/customusers/?status=driver');
      
      let driversList: DriverType[] = [];
      if (driversResponse.data && driversResponse.data.results) {
        driversList = driversResponse.data.results;
      } else if (Array.isArray(driversResponse.data)) {
        driversList = driversResponse.data;
      }

      // 2. Fetch trip history to calculate real counts
      try {
        const historyResponse = await axiosInstance.get<any[]>('/rayshistory/');
        const history = historyResponse.data || [];

        // Aggregate counts by driver ID
        const countsMap: Record<number, number> = {};
        history.forEach((trip: any) => {
          const driverId = trip.driver?.id || (trip.driver_data ? driversList.find(d => d.fullname === trip.driver_data.fullname)?.id : null);
          if (driverId) {
            countsMap[driverId] = (countsMap[driverId] || 0) + 1;
          }
        });

        // Enrich drivers with calculated counts
        const enrichedDrivers = driversList.map(driver => ({
          ...driver,
          rays_count: Math.max(driver.rays_count || 0, countsMap[driver.id] || 0)
        }));

        // Sort by calculated counts
        return enrichedDrivers
          .sort((a, b) => (b.rays_count || 0) - (a.rays_count || 0))
          .slice(0, 5);
      } catch (err) {
        console.error('Error fetching history for top drivers:', err);
        // Fallback to backend sorting if history fetch fails
        return driversList
          .sort((a, b) => (b.rays_count || 0) - (a.rays_count || 0))
          .slice(0, 5);
      }
    }
  });
};
