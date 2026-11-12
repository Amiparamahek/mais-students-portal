import React, { useEffect, useState } from 'react';
import useLiveFetch from '../hooks/useLiveFetch';
import api from '../services/api';
import { examTimeRange } from '../lib/date';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function StudentExams() {
  const [exams, setExams] = useState([]);

  useLiveFetch(() => {
    api.get('/exams').then((res) => setExams(res.data || [])).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Exams</h2>
        <p className="text-muted-foreground">Upcoming exam schedule.</p>
      </div>
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Exam</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="pr-6">Room</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No exams scheduled yet.</TableCell></TableRow>
            )}
            {exams.map((x) => (
              <TableRow key={x.id}>
                <TableCell className="pl-6 font-medium">{x.exam_name}</TableCell>
                <TableCell>{x.code} - {x.name}</TableCell>
                <TableCell>{x.exam_date}</TableCell>
                <TableCell>{examTimeRange(x.exam_time, x.exam_end_time)}</TableCell>
                <TableCell className="pr-6">{x.room || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
