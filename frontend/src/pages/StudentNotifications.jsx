import React, { useEffect, useState } from 'react';
import useLiveFetch from '../hooks/useLiveFetch';
import { Bell, BellBadge } from '@duo-icons/react';
import api from '../services/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StudentNotifications() {
  const [items, setItems] = useState([]);

  const load = () => api.get('/notifications').then((res) => setItems(res.data || [])).catch(console.error);
  useLiveFetch(() => {
    load();
  }, []);

  const markRead = async (n) => {
    if (n.is_read) return;
    await api.put(`/notifications/${n.id}/read`);
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: 1 } : x)));
  };

  const markAll = async () => {
    await api.put('/notifications/mark-all-read');
    setItems((prev) => prev.map((x) => ({ ...x, is_read: 1 })));
  };

  const unread = items.filter((i) => !i.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">{unread} unread</p>
        </div>
        <Button variant="outline" disabled={unread === 0} onClick={markAll}>Mark all as read</Button>
      </div>

      <Card className="gap-0 divide-y py-0">
        {items.length === 0 && <p className="p-8 text-center text-muted-foreground">You're all caught up.</p>}
        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => markRead(n)}
            className={cn('flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-accent', !n.is_read && 'bg-muted/60')}
          >
            {n.is_read ? <Bell className="mt-0.5 size-5 text-muted-foreground" /> : <BellBadge className="mt-0.5 size-5" />}
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm', !n.is_read && 'font-semibold')}>{n.title}</p>
              <p className="text-sm text-muted-foreground">{n.message}</p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{new Date(n.created_at + 'Z').toLocaleDateString()}</span>
          </button>
        ))}
      </Card>
    </div>
  );
}
