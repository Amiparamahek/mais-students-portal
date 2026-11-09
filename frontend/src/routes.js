import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Role-based route guard
function ProtectedRoute({ element, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return element;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: null, // will be set in App.jsx
  },
  {
    path: '/unauthorized',
    element: null,
  },
  // Admin routes
  {
    path: '/admin/*',
    element: null,
  },
  // Student routes
  {
    path: '/student/*',
    element: null,
  },
]);

export default router;
