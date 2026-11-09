import React from 'react';
import { Approved, Award, BellBadge, Book, Calendar, Clipboard, Dashboard, File, Message2, User } from '@duo-icons/react';
import PortalLayout from './PortalLayout';

const studentMenu = [
  { name: 'Dashboard', icon: Dashboard, path: '/student/dashboard' },
  { name: 'My Courses', icon: Book, path: '/student/courses' },
  { name: 'Attendance', icon: Approved, path: '/student/attendance' },
  { name: 'Grades', icon: Award, path: '/student/grades' },
  { name: 'Timetable', icon: Calendar, path: '/student/timetable' },
  { name: 'Exams', icon: Clipboard, path: '/student/exams' },
  { name: 'Announcements', icon: Message2, path: '/student/announcements' },
  { name: 'Documents', icon: File, path: '/student/documents' },
  { name: 'Notifications', icon: BellBadge, path: '/student/notifications' },
  { name: 'Profile', icon: User, path: '/student/profile' },
];

export default function StudentLayout({ children }) {
  return (
    <PortalLayout brand="MAIS Student" menu={studentMenu} notificationsPath="/student/notifications">
      {children}
    </PortalLayout>
  );
}
