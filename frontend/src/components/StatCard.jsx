import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function StatCard({ title, value, icon: Icon }) {
  return (
    <Card className="gap-3 py-5 fx-fade-up fx-lift">
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-foreground">
          <Icon className="size-6" />
        </div>
      </CardContent>
    </Card>
  );
}
