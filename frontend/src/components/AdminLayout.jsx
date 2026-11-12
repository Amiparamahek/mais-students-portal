import React from 'react';
import { Users } from 'lucide-react';
import { AlertOctagon, Approved, Award, Bell, Book, Calendar, ChartPie, Clipboard, Dashboard } from '@duo-icons/react';
import PortalLayout from './PortalLayout';

const adminMenu = [
  { name: 'Dashboard', icon: Dashboard, path: '/admin/dashboard' },
  { name: 'Students', icon: Users, path: '/admin/students' },
  { name: 'Analysis', icon: ChartPie, path: '/admin/analysis' },
  { name: 'Security', icon: AlertOctagon, path: '/admin/security' },
  { name: 'Classes', icon: Book, path: '/admin/courses' },
  { name: 'Attendance', icon: Approved, path: '/admin/attendance' },
  { name: 'Timetable', icon: Calendar, path: '/admin/timetable' },
  { name: 'Exams', icon: Clipboard, path: '/admin/exams' },
  { name: 'Grades', icon: Award, path: '/admin/grades' },
  { name: 'Announcements', icon: Bell, path: '/admin/announcements' },
];

export default function AdminLayout({ children }) {
  return (
    <PortalLayout brand="MAIS Admin" menu={adminMenu}>
      {children}
    </PortalLayout>
  );
}
