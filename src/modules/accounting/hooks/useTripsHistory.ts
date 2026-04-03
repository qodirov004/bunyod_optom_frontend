import { useQuery } from '@tanstack/react-query'
import { completeAllRays } from '../api/freight/freightapi'
import { TripFormValues } from '../types/freight'

export const useTripsHistory = () => {
  return useQuery<TripFormValues[], Error>({
    queryKey: ['trips-history'],
    queryFn: completeAllRays,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
