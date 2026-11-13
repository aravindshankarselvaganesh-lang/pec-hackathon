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
    'BreakFit deadline-to-menu feasibility engine for multi-cuisine campus food halls, diners, and local food courts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F7F5EF] text-[#202923] antialiased selection:bg-[#E6EFE8] selection:text-[#183F35] relative">
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
