import { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../../api/axiosInstance';

export const useVehicleHistory = (id: string, vehicleType: 'car' | 'furgon') => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch vehicle data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        let response;
        
        // Fetch raw data using Promise.all from the base endpoints
        if (vehicleType === 'furgon') {
          const [furgonRes, raysRes, balonRes, texnicRes] = await Promise.all([
            axiosInstance.get(`/furgon/${id}/`),
            axiosInstance.get(`/rays/?furgon=${id}`),
            axiosInstance.get(`/balonfurgon/?furgon=${id}`).catch(() => ({ data: [] })),
            axiosInstance.get(`/texnic/?furgon=${id}`).catch(() => ({ data: [] }))
          ]);

          const furgonData = furgonRes.data;
          const raysData = Array.isArray(raysRes.data) ? raysRes.data : (raysRes.data?.results || []);
          const balonData = Array.isArray(balonRes.data) ? balonRes.data : (balonRes.data?.results || []);
          const texnicData = Array.isArray(texnicRes.data) ? texnicRes.data : (texnicRes.data?.results || []);

          let bolonTotal = 0;
          let texnicTotal = 0;

          balonData.forEach((item: any) => bolonTotal += Number(item.price || 0));
          texnicData.forEach((item: any) => texnicTotal += Number(item.price || 0));

          response = {
             data: {
                furgon: furgonData,
                bolon: balonData,
                texnic: texnicData,
                details_expense_usd: { optol: 0, bolon: bolonTotal, texnic: texnicTotal },
                total_usd: bolonTotal + texnicTotal,
                rays_history: raysData,
                rays_count: raysData.length
             }
          };

        } else {
          const [carRes, raysRes, optolRes, balonRes, texnicRes] = await Promise.all([
            axiosInstance.get(`/cars/${id}/`),
            axiosInstance.get(`/rays/?car=${id}`),
            axiosInstance.get(`/optol/?car=${id}`).catch(() => ({ data: [] })),
            axiosInstance.get(`/balon/?car=${id}`).catch(() => ({ data: [] })),
            axiosInstance.get(`/texnic/?car=${id}`).catch(() => ({ data: [] }))
          ]);
          
          const carData = carRes.data;
          const raysData = Array.isArray(raysRes.data) ? raysRes.data : (raysRes.data?.results || []);
          const optolData = Array.isArray(optolRes.data) ? optolRes.data : (optolRes.data?.results || []);
          const balonData = Array.isArray(balonRes.data) ? balonRes.data : (balonRes.data?.results || []);
          const texnicData = Array.isArray(texnicRes.data) ? texnicRes.data : (texnicRes.data?.results || []);

          let optolTotal = 0;
          let bolonTotal = 0;
          let texnicTotal = 0;

          optolData.forEach((item: any) => optolTotal += Number(item.price || 0));
          balonData.forEach((item: any) => bolonTotal += Number(item.price || 0));
          texnicData.forEach((item: any) => texnicTotal += Number(item.price || 0));

          response = {
             data: {
                car: carData,
                optol: optolData,
                bolon: balonData,
                texnic: texnicData,
                details_expense_usd: { optol: optolTotal, bolon: bolonTotal, texnic: texnicTotal },
                total_usd: optolTotal + bolonTotal + texnicTotal,
                rays_history: raysData,
                rays_count: raysData.length
             }
          };
        }
        
        setData(response.data);
      } catch (err) {
        console.error('Error fetching vehicle history:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, vehicleType]);

  // Memoize processed data to avoid recalculations
  const processedData = useMemo(() => {
    if (!data) return null;

    // Destructure data with the correct property names
    const { 
      car, 
      furgon,
      optol = [], 
      bolon = [], 
      texnic = [],
      total_usd = 0,
      details_expense_usd = { optol: 0, bolon: 0, texnic: 0 },
      rays_history = [],
      rays_count = 0
    } = data;
    
    // Get the vehicle object based on type
    const vehicle = vehicleType === 'furgon' ? furgon : car;

    return {
      vehicle,
      optol,
      bolon,
      texnic,
      total_usd,
      details_expense_usd,
      rays_history,
      rays_count
    };
  }, [data, vehicleType]);

  return {
    data: processedData,
    loading,
    error
  };
}; 