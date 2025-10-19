// PRU Patrol Sandbox v1.1 – Centralized Realtime Hook
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";

export function useRealtimeV11(tableName, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tableName) return;

    const channel = supabase
      .channel(`realtime_${tableName}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          if (options.onChange) options.onChange(payload);
          // Simple auto-refresh of table data
          fetchData();
        }
      )
      .subscribe();

    async function fetchData() {
      try {
        const { data: rows, error } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(options.limit || 50);
        if (error) throw error;
        setData(rows);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName]);

  return { data, loading, error };
}

// Helper functions for quick usage
export function useRealtimeIncidents() {
  return useRealtimeV11("incidents");
}

export function useRealtimeAttendance() {
  return useRealtimeV11("attendance_log");
}

export function useRealtimeActivity() {
  return useRealtimeV11("activity_log");
}
