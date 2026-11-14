import type { Metadata } from 'next';
import '@/styles/globals.css';
import { RestaurantProvider } from '@/context/restaurant-context';
import { Navbar } from '@/components/layout/Navbar';
import { DemoBanner } from '@/components/layout/DemoBanner';
import { Footer } from '@/components/layout/Footer';
import { InteractiveBackground } from '@/components/layout/InteractiveBackground';

export const metadata: Metadata = {
  title: 'RushLess — Time-Aware Food Hall Ordering & Kitchen Live KDS',
  description:
    'Order ahead with live kitchen wait times and BreakFit™ smart scheduling. Fresh food, timed to your break.',
  keywords: [
    'food hall',
    'campus ordering',
    'kitchen display system',
    'BreakFit',
    'time-aware ordering',
    'fast casual dining',
  ],
  authors: [{ name: 'RushLess Team' }],
  openGraph: {
    title: 'RushLess — Time-Aware Food Hall Ordering',
    description: 'Fresh food, ready the minute you arrive. Live kitchen queues and smart time matching.',
    siteName: 'RushLess',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#183F35',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F7F5EF] text-[#202923] antialiased selection:bg-[#E6EFE8] selection:text-[#183F35] relative overflow-x-hidden">
        <RestaurantProvider>
          <InteractiveBackground />
          <DemoBanner />
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </RestaurantProvider>
      </body>
    </html>
  );
}
