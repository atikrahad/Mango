import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Mangosteen Ops Console | Admin & Affiliate Portal',
  description: 'Corporate portal for Mangosteen operations, affiliate performance wallet disburser, and seasonal order en route rider router.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#f8fafc] text-[#334155] selection:bg-[#10b981] selection:text-white">
        {/* Ops Ambient Glows */}
        <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-0 left-1/4 w-[50%] h-[50%] rounded-full ops-glow-emerald pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[50%] h-[50%] rounded-full ops-glow-gold pointer-events-none" />
        </div>
        
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
