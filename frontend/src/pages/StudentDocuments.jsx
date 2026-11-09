import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import api from '../services/api';
import { openDocument } from '../lib/download';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function StudentDocuments() {
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/documents').then((r) => setDocs(r.data || [])).catch((e) => setError(e.response?.data?.message || 'Failed to load documents'));
  }, []);

  const open = async (d) => {
    setError('');
    try {
      await openDocument(d);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open document');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
        <p className="text-muted-foreground">Study materials shared with you, including those for your classes.</p>
      </div>
      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="pr-6 text-right">Download</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No documents shared yet.</TableCell></TableRow>}
            {docs.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="pl-6 font-medium">{d.title}</TableCell>
                <TableCell>{d.category || '-'}</TableCell>
                <TableCell>{d.course_code || 'All students'}</TableCell>
                <TableCell>{new Date(d.uploaded_at + 'Z').toLocaleDateString()}</TableCell>
                <TableCell className="pr-6 text-right">
                  {d.stored_name || d.file_url ? (
                    <Button variant="outline" size="sm" onClick={() => open(d)}><Download /> {d.stored_name ? 'Download' : 'Open link'}</Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">No file attached</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
