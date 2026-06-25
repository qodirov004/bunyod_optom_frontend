import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { getAllDrivers, getDriver, createDriverWithPhoto as createDriver, updateDriverWithPhoto as updateDriver, deleteDriver } from '../../accounting/api/drivers/driverApi';
import { DriverType, DriverFilter } from '../../accounting/types/driver';
import { AxiosError } from 'axios';
import axiosInstance from '@/api/axiosInstance';

export const useCEODrivers = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DriverFilter>({
    page: 1,
    pageSize: 10,
    search: '',
    status: 'all',
    sortBy: undefined,
    sortOrder: undefined
  });

  // Use the same API as accounting module
  const { data, isLoading: isLoadingDrivers, error } = useQuery({
    queryKey: ['ceo-drivers', filters],
    queryFn: () => getAllDrivers(filters),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Active cars query - independent from drivers, should not block driver display
  const { data: activeCarsData, isLoading: isLoadingCars } = useQuery({
    queryKey: ['active-cars'],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get('/car-active/');
        return response.data || [];
      } catch (error) {
        console.error('Error fetching active cars:', error);
        return [];
      }
    },
    staleTime: 1 * 60 * 1000,
  });
  
  const activeCars = activeCarsData || [];

  // Process data the same way as accounting module
  const drivers = useMemo(() => {
    const results = Array.isArray(data?.results) ? data.results : [];
    
    // Create a map of driver ID to car object for O(1) lookup and to avoid closure/equality bugs
    const activeCarMap = new Map();
    activeCars.forEach((activeItem: any) => {
      const driverObj = activeItem.driver;
      if (driverObj) {
        const dId = typeof driverObj === 'object' ? driverObj.id : driverObj;
        if (dId !== undefined && dId !== null) {
          activeCarMap.set(String(dId), activeItem.car);
        }
      }
    });
    
    // Use statistics from backend if available, otherwise fallback to local calculation
    return results.map(driver => {
      const activeCarObj = activeCarMap.get(String(driver.id));

      return {
        ...driver,
        // Backend returns these fields now, we use them directly
        rays_count: driver.rays_count !== undefined ? driver.rays_count : 0,
        total_km: driver.total_km !== undefined ? driver.total_km : 0,
        total_income: driver.total_income !== undefined ? driver.total_income : (driver.total_rays_usd || 0),
        total_rays_usd: driver.total_rays_usd || 0,
        car: activeCarObj,
      };
    });
  }, [data, activeCars]);

  const total = data?.count || 0;

  // Get drivers on road (active cars)
  const driversOnRoad = useMemo(() => {
    if (!activeCars.length) return [];
    
    // Map active cars to driver objects directly, so it doesn't depend on paginated 'drivers' list
    const roadDrivers: any[] = [];
    const seenIds = new Set();

    activeCars.forEach((car: any) => {
      const driver = car.driver;
      if (driver && typeof driver === 'object' && driver.id && !seenIds.has(driver.id)) {
        // Use the driver object from car-active response
        roadDrivers.push({
          ...driver,
          fullname: driver.fullname || driver.username || `${driver.first_name || ''} ${driver.last_name || ''}`.trim(),
          phone_number: driver.phone_number || driver.phone || '',
          photo: driver.photo || driver.photo_front || null,
          rays_id: car.rays_id,
          car: car.car, // Include car object
          clients: car.clients || [],
          is_on_road: true
        });
        seenIds.add(driver.id);
      } else if (driver && typeof driver !== 'object' && !seenIds.has(driver)) {
        // If it's just an ID, we try to find it in the current page (fallback)
        const d = drivers.find(d => d.id === driver);
        if (d) {
          roadDrivers.push({ 
            ...d, 
            is_on_road: true,
            rays_id: car.rays_id,
            clients: car.clients || [] 
          });
          seenIds.add(driver);
        }
      }
    });
    
    return roadDrivers;
  }, [drivers, activeCars]);
  
  // Get waiting drivers
  const waitingDrivers = useMemo(() => {
    if (!drivers.length) return [];
    
    // Extract driver IDs from active cars
    const driverIds = new Set(
      activeCars.map((car: any) => 
        typeof car.driver === 'object' ? car.driver.id : car.driver
      )
    );
    
    // Return drivers that are active but not in active cars
    return drivers.filter(driver => 
      !driverIds.has(driver.id) && 
      (driver.status === 'active' || driver.status === 'driver') &&
      driver.is_active && // Make sure driver is active
      !driver.is_busy // Not busy
    );
  }, [drivers, activeCars]);

  // Fetch summary statistics from backend
  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['ceo-drivers-summary'],
    queryFn: async () => {
      const response = await axiosInstance.get('/customusers/summary/');
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
  });

  // Get active drivers count
  const activeDriversCount = summaryData?.active || 0;
  const totalDriversCount = summaryData?.total || 0;
  
  // Get inactive drivers count
  const inactiveDriversCount = summaryData?.inactive || 0;
  
  // Calculate active drivers percentage
  const activeDriversPercentage = totalDriversCount > 0 ? (activeDriversCount / totalDriversCount) * 100 : 0;
  
  // Calculate on-road drivers percentage
  const driversOnRoadCount = summaryData?.on_road || 0;
  const driversOnRoadPercentage = activeDriversCount > 0 ? (driversOnRoadCount / activeDriversCount) * 100 : 0;
  
  // Calculate waiting drivers
  const waitingDriversCount = summaryData?.waiting || 0;
  const waitingDriversPercentage = activeDriversCount > 0 ? (waitingDriversCount / activeDriversCount) * 100 : 0;

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<DriverFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Create driver
  const createDriverMutation = useMutation({
    mutationFn: (data: FormData) => createDriver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ceo-drivers'] });
      message.success('Haydovchi muvaffaqiyatli qo\'shildi');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Haydovchi qo\'shishda xatolik yuz berdi';
      message.error(errorMessage);
    }
  });

  // Update driver
  const updateDriverMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => updateDriver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ceo-drivers'] });
      message.success('Haydovchi muvaffaqiyatli yangilandi');
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Haydovchi yangilashda xatolik yuz berdi';
      message.error(errorMessage);
    }
  });

  // Delete driver
  const deleteDriverMutation = useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ceo-drivers'] });
      message.success('Haydovchi muvaffaqiyatli o\'chirildi');
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Haydovchi o\'chirishda xatolik yuz berdi';
      message.error(errorMessage);
    }
  });

  return {
    drivers,
    driversOnRoad,
    waitingDrivers,
    total,
    activeCars,
    // Only block on driver data loading - active cars load independently
    isLoading: isLoadingDrivers,
    isLoadingCars,
    error,
    activeDriversCount,
    totalDriversCount,
    inactiveDriversCount,
    activeDriversPercentage,
    driversOnRoadCount,
    driversOnRoadPercentage,
    waitingDriversCount,
    waitingDriversPercentage,
    filters,
    updateFilters,
    createDriver: createDriverMutation.mutateAsync,
    updateDriver: (id: number, data: FormData) => updateDriverMutation.mutateAsync({ id, data }),
    deleteDriver: deleteDriverMutation.mutate,
    isCreatingDriver: createDriverMutation.isPending,
    isUpdatingDriver: updateDriverMutation.isPending,
    isDeletingDriver: deleteDriverMutation.isPending
  };
};

export const useCEODriver = (id: number) => {
  return useQuery({
    queryKey: ["ceo-driver", id],
    queryFn: () => getDriver(id),
    enabled: !!id,
  });
}; 