import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';

export interface ClientPaymentData {
  total_clients: number;
  paid_clients: number;
  unpaid_clients: number;
  percent_paid: number;
  percent_unpaid: number;
}

export const useClientPaymentData = () => {
  // Fetch active trips (unpaid) and history trips (paid)
  const { data: activeTrips = [], isLoading: isActiveLoading } = useQuery({
    queryKey: ['ceo-client-active-trips'],
    queryFn: async () => {
      const response = await axiosInstance.get('/rays/');
      const data = response.data;
      return Array.isArray(data) ? data : (data.results || []);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: historyTrips = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['ceo-client-history-trips'],
    queryFn: async () => {
      const response = await axiosInstance.get('/rayshistory/');
      const data = response.data;
      return Array.isArray(data) ? data : (data.results || []);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch true total clients count directly from the API
  const { data: clientsData = {}, isLoading: isClientsLoading } = useQuery({
    queryKey: ['ceo-clients-payment-total'],
    queryFn: async () => {
      const response = await axiosInstance.get('/clients/');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = isActiveLoading || isHistoryLoading || isClientsLoading;

  // Total clients registered in the system
  const total_clients = clientsData?.count || (Array.isArray(clientsData) ? clientsData.length : 0);

  // We consider a client "unpaid" if they have an active trip (not completed)
  const unpaidClientIds = new Set<string>();
  activeTrips.forEach((trip: any) => {
    if (trip.client && Array.isArray(trip.client)) {
      trip.client.forEach((c: any) => unpaidClientIds.add(c.id));
    }
  });

  // We consider a client "paid" if they're in the total_clients but don't have an active trip.
  // Or at least, paid_clients = total_clients - unpaid_clients mapped across system.
  const unpaid_clients = unpaidClientIds.size;
  const paid_clients = Math.max(0, total_clients - unpaid_clients);

  const percent_paid = total_clients > 0 ? Math.round((paid_clients / total_clients) * 100) : 0;
  const percent_unpaid = total_clients > 0 ? Math.round((unpaid_clients / total_clients) * 100) : 0;

  const clientPaymentData: ClientPaymentData = {
    total_clients,
    paid_clients,
    unpaid_clients,
    percent_paid,
    percent_unpaid
  };

  return { 
    clientPaymentData, 
    isLoading,
    error: null 
  };
};
