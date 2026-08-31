import { useQuery } from '@tanstack/react-query';
import { getSwimmingSpots } from '../services/api/helsinki';
export const useSwimmingSpots = () => useQuery({ queryKey: ['swimming-spots', 'helsinki'], queryFn: getSwimmingSpots, staleTime: 1000 * 60 * 10, retry: 1 });
