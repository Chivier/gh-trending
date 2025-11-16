import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GitHub Trending RSS Feed',
  description: 'Daily trending repositories on GitHub with RSS feeds',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
