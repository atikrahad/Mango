import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['400', '500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'MangoVaiya | Premium Farm-to-Table Mangoes & Affiliate Network',
  description: 'Buy premium, organic, naturally sweetened seasonal mangoes (Himsagar, Langra, Amrapali) direct from Rajshahi orchards. Powered by a secure affiliate marketing ecosystem.',
  keywords: 'mangoes online, Rajshahi mangoes, organic himsagar, buy amrapali online, affiliate network, cash on delivery, secure OTP delivery',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
        {/* Animated Background Gradients */}
        <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-amber-500/10 blur-[150px]" />
          <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-orange-600/10 blur-[150px]" />
        </div>
        
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
