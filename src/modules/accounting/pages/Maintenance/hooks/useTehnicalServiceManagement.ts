import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TehnicalService } from '@/modules/accounting/types/maintenance';
import {
  getTehnicalServices,
  createTehnicalService,
  updateTehnicalService,
  deleteTehnicalService,
} from '../api/tehnicalService';

export const useTehnicalServiceManagement = (dateRange?: { startDate: any; endDate: any } | null) => {
  const queryClient = useQueryClient();

  // Format dates for API
  const formattedRange = dateRange && dateRange.startDate && dateRange.endDate 
    ? { 
        startDate: dateRange.startDate.format('YYYY-MM-DD'), 
        endDate: dateRange.endDate.format('YYYY-MM-DD') 
      } 
    : undefined;

  // Fetch all technical services
  const {
    data: tehnicalServices = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['tehnicalServices', formattedRange],
    queryFn: () => getTehnicalServices(formattedRange),
  });

  // Create a new technical service
  const createMutation = useMutation({
    mutationFn: createTehnicalService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tehnicalServices'] });
    },
  });

  // Update a technical service
  const updateMutation = useMutation({
    mutationFn: ({ id, service }: { id: number; service: TehnicalService }) =>
      updateTehnicalService(id, service),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tehnicalServices'] });
    },
  });

  // Delete a technical service
  const deleteMutation = useMutation({
    mutationFn: deleteTehnicalService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tehnicalServices'] });
    },
  });

  return {
    tehnicalServices,
    isLoading,
    isError,
    addTehnicalService: createMutation.mutate,
    updateTehnicalService: updateMutation.mutate,
    deleteTehnicalService: deleteMutation.mutate,
  };
}; 