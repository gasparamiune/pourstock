import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type TableName = 'products' | 'locations' | 'stock_levels' | 'stock_movements' | 'profiles' | 'user_roles' | 'purchase_orders' | 'purchase_order_items' | 'table_plans' | 'user_departments' | 'rooms' | 'guests' | 'reservations' | 'room_charges' | 'housekeeping_tasks' | 'housekeeping_logs' | 'maintenance_requests' | 'table_plan_changes';

interface RealtimeOptions {
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
}

/**
 * Subscribe to realtime postgres_changes on a table.
 * Calls `callback` whenever a matching event occurs.
 */
export function useRealtimeSubscription(
  table: TableName | TableName[],
  callback: () => void,
  options?: RealtimeOptions,
) {
  useEffect(() => {
    const tables = Array.isArray(table) ? table : [table];
    const channelName = `realtime-${tables.join('-')}`;

    let channel = supabase.channel(channelName);

    for (const t of tables) {
      const opts: any = {
        event: options?.event || '*',
        schema: 'public',
        table: t,
      };
      if (options?.filter) opts.filter = options.filter;
      channel = channel.on('postgres_changes', opts, () => callback());
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, callback, options?.filter, options?.event]);
}
