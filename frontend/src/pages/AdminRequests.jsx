import React, { useState } from 'react';
import useLiveFetch from '../hooks/useLiveFetch';
import api from '../services/api';
import RequestThread from '../components/RequestThread';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '../components/StatCard';
import { Bell } from '@duo-icons/react';

export default function AdminRequests() {
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState({ open: 0, unread: 0 });
  const [filter, setFilter] = useState({ status: 'open', unread: '' });
  const [selected, setSelected] = useState(null);

  useLiveFetch(() => {
    const params = { status: filter.status };
    if (filter.unread) params.unread = '1';
    return Promise.all([
      api.get('/requests', { params }).then((r) => setList(r.data)),
      api.get('/requests/summary').then((r) => setSummary(r.data)),
    ]).catch(() => {});
  }, [filter.status, filter.unread]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Requests</h2>
        <p className="text-muted-foreground">Student approvals, documents, questions and complaints. Reply in the thread and set the outcome.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <StatCard title="Open requests" value={summary.open} icon={Bell} />
        <StatCard title="Waiting for your reply" value={summary.unread} icon={Bell} />
      </div>

      <div className="flex flex-wrap gap-2">
        {['open', 'all', 'closed'].map((s) => (
          <Button key={s} size="sm" variant={filter.status === s ? 'default' : 'outline'} onClick={() => setFilter({ ...filter, status: s })}>{s === 'open' ? 'Open' : s === 'all' ? 'All' : 'Closed'}</Button>
        ))}
        <Button size="sm" variant={filter.unread ? 'default' : 'outline'} onClick={() => setFilter({ ...filter, unread: filter.unread ? '' : '1' })}>Only unread</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Card className="gap-0 py-0">
          <CardHeader className="pt-6"><CardTitle>Inbox</CardTitle><CardDescription>Unread first.</CardDescription></CardHeader>
          {list.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nothing here.</p>}
          <ul className="divide-y">
            {list.map((r) => (
              <li key={r.id}>
                <button onClick={() => setSelected(r.id)} className={`flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-accent ${selected === r.id ? 'bg-accent' : ''}`}>
                  <span className="min-w-0">
                    <span className={`block truncate text-sm ${r.unread ? 'font-semibold' : ''}`}>{r.subject}</span>
                    <span className="block text-xs text-muted-foreground">{r.student_name} · {r.category}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {r.unread && <Badge>Unread</Badge>}
                    <Badge variant="outline">{r.status}</Badge>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <RequestThread id={selected} isAdmin onChanged={() => setSelected(selected)} />
      </div>
    </div>
  );
}
