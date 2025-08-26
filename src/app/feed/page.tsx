// app/feed/page.tsx
'use client';

import { Suspense } from 'react';
import EnhancedDashboard from '@/components/dashboard/EnhancedDashboard';

function FeedContent() {
  return <EnhancedDashboard />;
}

export default function FeedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading feed...</span>
      </div>
    }>
      <FeedContent />
    </Suspense>
  );
}