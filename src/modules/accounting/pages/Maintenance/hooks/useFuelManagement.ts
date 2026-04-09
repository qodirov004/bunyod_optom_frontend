import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FuelType } from '@/modules/accounting/types/maintenance';
import {
  getFuelServices,
  createFuelService,
  updateFuelService,
  deleteFuelService,
} from '../api/fuelService';
import { message } from 'antd';

export const useFuelManagement = (dateRange?: { startDate: any; endDate: any } | null) => {
  const queryClient = useQueryClient();

  // Format dates for API
  const formattedRange = dateRange && dateRange.startDate && dateRange.endDate 
    ? { 
        startDate: dateRange.startDate.format('YYYY-MM-DD'), 
        endDate: dateRange.endDate.format('YYYY-MM-DD') 
      } 
    : undefined;

  // Fetch all fuel expenses
  const {
    data: fuelServices = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['fuelServices', formattedRange],
    queryFn: () => getFuelServices(formattedRange),
  });

  // Create a new fuel expense
  const createMutation = useMutation({
    mutationFn: createFuelService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelServices'] });
      message.success('Yoqilg\'i xarajati muvaffaqiyatli qo\'shildi');
    },
    onError: () => {
      message.error('Xatolik yuz berdi');
    }
  });

  // Update a fuel expense
  const updateMutation = useMutation({
    mutationFn: ({ id, service }: { id: number; service: FuelType }) =>
      updateFuelService(id, service),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelServices'] });
      message.success('Yoqilg\'i xarajati yangilandi');
    },
    onError: () => {
      message.error('Xatolik yuz berdi');
    }
  });

  // Delete a fuel expense
  const deleteMutation = useMutation({
    mutationFn: deleteFuelService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelServices'] });
      message.success('Yoqilg\'i xarajati o\'chirildi');
    },
    onError: () => {
      message.error('Xatolik yuz berdi');
    }
  });

  return {
    fuelServices,
    isLoading,
    isError,
    addFuelService: createMutation.mutate,
    updateFuelService: updateMutation.mutate,
    deleteFuelService: deleteMutation.mutate,
  };
};
