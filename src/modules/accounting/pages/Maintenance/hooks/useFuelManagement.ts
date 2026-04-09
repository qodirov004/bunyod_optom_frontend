import { useState } from 'react';
import { FuelType } from '@/modules/accounting/types/maintenance';
import { message } from 'antd';

export const useFuelManagement = () => {
  const [fuelServices, setFuelServices] = useState<FuelType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addFuelService = async (service: FuelType) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newService = { ...service, id: Date.now(), created_at: new Date().toISOString() };
      setFuelServices((prev) => [newService, ...prev]);
      message.success('Yoqilg\'i harajati muvaffaqiyatli qo\'shildi');
    } catch (error) {
      message.error('Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFuelService = async ({ id, service }: { id: number; service: FuelType }) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setFuelServices((prev) => prev.map((item) => (item.id === id ? { ...item, ...service } : item)));
      message.success('Yoqilg\'i harajati yangilandi');
    } catch (error) {
      message.error('Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFuelService = async (id: number) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setFuelServices((prev) => prev.filter((item) => item.id !== id));
      message.success('Yoqilg\'i harajati o\'chirildi');
    } catch (error) {
      message.error('Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fuelServices,
    isLoading,
    isError: false,
    addFuelService,
    updateFuelService,
    deleteFuelService,
  };
};
