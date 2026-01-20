import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { QueryProvider } from '../providers/QueryProvider';
import { TelegramWebAppProvider } from '../providers/TelegramWebAppProvider';
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
      <head>
        {/* Telegram WebApp SDK - должен загружаться до гидратации React */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <ErrorBoundary>
          <QueryProvider>
            <TelegramWebAppProvider>
              <ToastProvider>
                <ConditionalNavigation />
                <main>{children}</main>
                <ConditionalNavigation showAdminToggle />
              </ToastProvider>
            </TelegramWebAppProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
