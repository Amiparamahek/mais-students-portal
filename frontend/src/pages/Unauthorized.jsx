import React from 'react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Unauthorized</h1>
        <p className="text-muted-foreground mb-6">You don't have permission to access this page.</p>
        <Link to="/login" className="text-foreground hover:underline">
          Go to Login
        </Link>
      </div>
    </div>
  );
}
