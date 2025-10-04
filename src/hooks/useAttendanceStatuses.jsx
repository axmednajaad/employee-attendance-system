import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAttendanceStatuses = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('attendance_statuses')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setStatuses(data || []);
    } catch (err) {
      console.error('Error fetching attendance statuses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  return {
    statuses,
    loading,
    error,
    refetch: fetchStatuses
  };
};