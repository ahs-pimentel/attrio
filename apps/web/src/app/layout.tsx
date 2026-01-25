import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Attrio - Gerenciamento de Condominios',
  description: 'Plataforma SaaS para gerenciamento de condominios',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
