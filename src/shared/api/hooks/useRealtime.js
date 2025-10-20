import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

/**
 * Centralized realtime hook for Supabase subscriptions
 * Handles common subscription patterns for v1.1
 */
export function useRealtime(table, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    select = "*",
    filter = {},
    order = { created_at: "desc" },
    limit = null,
    event = "INSERT"
  } = options;

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase.from(table).select(select);

        // Apply filters
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });

        // Apply ordering
        if (order) {
          Object.entries(order).forEach(([key, direction]) => {
            query = query.order(key, { ascending: direction === "asc" });
          });
        }

        // Apply limit
        if (limit) {
          query = query.limit(limit);
        }

        const { data: result, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        if (mounted) {
          setData(result || []);
        }
      } catch (err) {
        console.error(`Error fetching ${table}:`, err);
        if (mounted) {
          setError(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchData();

    // Set up realtime subscription
    const channel = supabase
      .channel(`${table}_realtime`)
      .on(
        "postgres_changes",
        { 
          event, 
          schema: "public", 
          table 
        },
        (payload) => {
          if (mounted) {
            setData(prev => {
              if (event === "INSERT") {
                return [payload.new, ...prev];
              } else if (event === "UPDATE") {
                return prev.map(item => 
                  item.id === payload.new.id ? payload.new : item
                );
              } else if (event === "DELETE") {
                return prev.filter(item => item.id !== payload.old.id);
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [table, JSON.stringify(filter), JSON.stringify(order), limit, event]);

  return { data, loading, error };
}

/**
 * Hook for realtime incidents with auto-archiving
 */
export function useRealtimeIncidents() {
  const { data, loading, error } = useRealtime('incidents', {
    select: "*",
    filter: { status: "active" },
    order: { created_at: "desc" }
  });

  useEffect(() => {
    // Auto-archive old incidents
    const autoArchive = async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from("incidents")
        .update({ status: "archived" })
        .lt("created_at", thirtyDaysAgo)
        .eq("status", "active");
    };

    autoArchive();
  }, []);

  return { data, loading, error };
}

/**
 * Hook for realtime attendance data
 */
export function useRealtimeAttendance() {
  return useRealtime('attendance_log', {
    select: "*",
    order: { created_at: "desc" }
  });
}

/**
 * Hook for realtime guard locations
 */
export function useRealtimeGuardLocations() {
  return useRealtime('guard_locations', {
    select: "*"
  });
}

/**
 * Hook for realtime activity logs
 */
export function useRealtimeActivityLogs() {
  return useRealtime('activity_log', {
    select: "*",
    order: { time: "desc" },
    limit: 50
  });
}
