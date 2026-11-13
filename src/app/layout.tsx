import type { Metadata } from 'next';
import '@/styles/globals.css';
import { RestaurantProvider } from '@/context/restaurant-context';
import { Navbar } from '@/components/layout/Navbar';
import { DemoBanner } from '@/components/layout/DemoBanner';
import { Footer } from '@/components/layout/Footer';
import { InteractiveBackground } from '@/components/layout/InteractiveBackground';

export const metadata: Metadata = {
  title: 'RushLess — Crossroads Global Food Hall',
  description:
    'Order ahead with live kitchen wait times so your food is ready the minute you arrive.',
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
