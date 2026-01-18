import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '../providers/QueryProvider';
import { TelegramProvider } from '../providers/TelegramProvider';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ToastProvider } from '../components/ToastProvider';
import { ConditionalNavigation } from '../components/ConditionalNavigation';

export const metadata: Metadata = {
  title: 'Архитектор лидерства',
  description: 'Система развития лидерских способностей',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <ErrorBoundary>
          <TelegramProvider>
            <QueryProvider>
              <ToastProvider>
                <ConditionalNavigation />
                <main>{children}</main>
                <ConditionalNavigation showAdminToggle />
              </ToastProvider>
            </QueryProvider>
          </TelegramProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
