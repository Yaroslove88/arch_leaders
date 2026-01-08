'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from './Navigation';
import { AdminToggle } from './AdminToggle';

interface ConditionalNavigationProps {
  showAdminToggle?: boolean;
}

export function ConditionalNavigation({ showAdminToggle }: ConditionalNavigationProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return null;
  }

  if (showAdminToggle) {
    return <AdminToggle />;
  }

  return <Navigation />;
}

