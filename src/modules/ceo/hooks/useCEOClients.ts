import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { getAllClients, createClient, updateClient, deleteClient, clientApi } from '../../accounting/api/client/clientApi';
import { Client, ClientFilter } from '../../accounting/types/client';
import { AxiosError } from 'axios';

export const useCEOClients = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ClientFilter>({
    page: 1,
    pageSize: 10,
    search: ''
  });

  // Use the same API as accounting module
  const { data: responseData, isLoading, error } = useQuery({
    queryKey: ['ceo-clients', filters],
    queryFn: () => getAllClients(filters),
    staleTime: 5 * 60 * 1000,
  });

  // Process data - clientApi returns { data, total }
  const clients = Array.isArray(responseData?.data) ? responseData.data : [];
  const total = responseData?.total || 0;

  const createMutation = useMutation({
    mutationFn: (data: Partial<Client>) => createClient(data),
    onSuccess: () => {
      message.success("Mijoz muvaffaqiyatli qo'shildi");
      queryClient.invalidateQueries({ queryKey: ['ceo-clients'] });
    },
    onError: (error: AxiosError) => {
      console.error('Create error:', error);
      message.error("Mijoz qo'shishda xatolik yuz berdi");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Client> }) =>
      updateClient(id, data),
    onSuccess: () => {
      message.success("Mijoz ma'lumotlari yangilandi");
      queryClient.invalidateQueries({ queryKey: ['ceo-clients'] });
    },
    onError: (error: AxiosError) => {
      message.error("Mijoz ma'lumotlarini yangilashda xatolik yuz berdi");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteClient(id),
    onSuccess: () => {
      message.success("Mijoz o'chirildi");
      queryClient.invalidateQueries({ queryKey: ['ceo-clients'] });
    },
    onError: (error) => {
      console.error('Delete mutation error:', error);
      message.error("Mijozni o'chirishda xatolik yuz berdi");
    }
  });

  const handleSearch = useCallback((search: string) => {
    setFilters(prev => ({ 
      ...prev, 
      search: search.trim(),
      page: 1 
    }));
  }, []);

  const handleTableChange = useCallback((
    pagination: { current?: number; pageSize?: number }
  ) => {
    setFilters(prev => ({
      ...prev,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 10
    }));
  }, []);

  return {
    clients,
    total,
    loading: isLoading,
    error,
    filters,
    setFilters,
    handleSearch,
    handleTableChange,
    createClient: (data: Partial<Client>) => createMutation.mutateAsync(data),
    updateClient: (id: number, data: Partial<Client>) => updateMutation.mutate({ id, data }),
    deleteClient: (id: number) => deleteMutation.mutateAsync(id)
  };
};

export const useCEOClient = (id: number) => {
  return useQuery({
    queryKey: ["ceo-client", id],
    queryFn: () => clientApi.getClientById(id),
    enabled: !!id,
  });
};

 