import React from 'react';
import { Approved, Book, Bell, File, Clipboard } from '@duo-icons/react';
import PortalLayout from './PortalLayout';

const lecturerMenu = [
  { name: 'My Classes', icon: Book, path: '/lecturer/classes' },
  { name: 'Attendance', icon: Approved, path: '/lecturer/attendance' },
  { name: 'Announcements', icon: Bell, path: '/lecturer/announcements' },
  { name: 'Documents', icon: File, path: '/lecturer/documents' },
  { name: 'Profile', icon: Clipboard, path: '/lecturer/profile' },
];

export default function LecturerLayout({ children }) {
  return (
    <PortalLayout brand="MAIS Lecturer" menu={lecturerMenu}>
      {children}
    </PortalLayout>
  );
}
