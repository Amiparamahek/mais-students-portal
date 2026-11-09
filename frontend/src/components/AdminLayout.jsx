import React from 'react';
import { Users } from 'lucide-react';
import { Approved, Award, Bell, Book, Calendar, Clipboard, Dashboard, File } from '@duo-icons/react';
import PortalLayout from './PortalLayout';

const adminMenu = [
  { name: 'Dashboard', icon: Dashboard, path: '/admin/dashboard' },
  { name: 'Students', icon: Users, path: '/admin/students' },
  { name: 'Classes', icon: Book, path: '/admin/courses' },
  { name: 'Attendance', icon: Approved, path: '/admin/attendance' },
  { name: 'Timetable', icon: Calendar, path: '/admin/timetable' },
  { name: 'Exams', icon: Clipboard, path: '/admin/exams' },
  { name: 'Grades', icon: Award, path: '/admin/grades' },
  { name: 'Announcements', icon: Bell, path: '/admin/announcements' },
  { name: 'Documents', icon: File, path: '/admin/documents' },
];

export default function AdminLayout({ children }) {
  return (
    <PortalLayout brand="MAIS Admin" menu={adminMenu}>
      {children}
    </PortalLayout>
  );
}
