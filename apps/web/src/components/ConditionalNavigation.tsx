'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from './Navigation';
import { AdminStatusBar } from './AdminStatusBar';

interface ConditionalNavigationProps {
  showAdminToggle?: boolean;
}

export function ConditionalNavigation({ showAdminToggle }: ConditionalNavigationProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const isAdminPage = pathname?.startsWith('/admin') || pathname === '/debug';

  if (isLoginPage) {
    return null;
  }

  // Убрали AdminToggle - теперь всё управляется через AdminStatusBar
  if (showAdminToggle) {
    return null;
  }

  return (
    <>
      <Navigation />
      {/* Admin status bar - показывается на всех страницах кроме админки */}
      {!isAdminPage && <AdminStatusBar />}
    </>
  );
}

