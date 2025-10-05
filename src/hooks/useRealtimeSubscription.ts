import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeSubscriptionOptions {
  table: string;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export function useRealtimeSubscription({
  table,
  filter,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeSubscriptionOptions) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const channelName = `realtime-${table}`;
    const realtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          console.log(`[Realtime] INSERT on ${table}:`, payload);
          onInsert?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          console.log(`[Realtime] UPDATE on ${table}:`, payload);
          onUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          console.log(`[Realtime] DELETE on ${table}:`, payload);
          onDelete?.(payload);
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Subscription status for ${table}:`, status);
      });

    setChannel(realtimeChannel);

    return () => {
      console.log(`[Realtime] Unsubscribing from ${table}`);
      supabase.removeChannel(realtimeChannel);
    };
  }, [table, filter]);

  return channel;
}