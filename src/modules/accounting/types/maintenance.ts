export interface oilService {
  id?: number
  kilometer: string
  car: number | null
  service: number | null
}
export interface ServiceType {
  id?: number
  name: string
  carModel?: string
  carNumber?: string
  serviceType?: string
  details?: string
  price?: number
  date?: string
  completed?: boolean
  kilometer?: number
  carId?: number
}

export interface TehnicalService {
  id?: number;
  price: number | null;
  kilometer: number | null;
  car: number | null;
  service: number | null;
  currency: number | null;
  custom_rate_to_uzs?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface BalonType {
  id?: number;
  price: number | null;
  kilometer: number | null;
  car: number | null;
  type: string | null;
  count: number | null;
  currency: number | null;
  custom_rate_to_uzs?: string | null;
  created_at?: string;
}

export interface BalonFurgonType {
  id?: number;
  price: number | null;
  kilometer: number | null;
  furgon: number | null;
  type: string | null;
  count: number | null;
  currency: number | null;
  custom_rate_to_uzs?: string | null;
  created_at?: string;
}

export interface OptolType {
  id?: number;
  price: number | null;
  kilometer: number | null;
  car: number | null;
  type: string | null;
  count: number | null;
  currency: number | null;
  custom_rate_to_uzs?: string | null;
  created_at?: string;
}