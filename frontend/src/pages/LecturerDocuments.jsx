import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function LecturerDocuments() {
  const [docs, setDocs] = useState([]);
  useEffect(() => {
    api.get('/documents').then((r) => setDocs(r.data || [])).catch(console.error);
  }, []);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
        <p className="text-muted-foreground">General documents and those for your classes.</p>
      </div>
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Visible to</TableHead>
              <TableHead className="pr-6">Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.length === 0 && <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">No documents.</TableCell></TableRow>}
            {docs.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="pl-6 font-medium">{d.title}</TableCell>
                <TableCell>{d.category || '-'}</TableCell>
                <TableCell>{d.course_code || 'Everyone'}</TableCell>
                <TableCell className="pr-6">
                  {d.file_url ? <a className="underline" href={d.file_url} target="_blank" rel="noreferrer">Open</a> : 'Not available'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
