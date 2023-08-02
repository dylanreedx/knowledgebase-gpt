import {ClerkProvider} from '@clerk/nextjs';
import './globals.css';
import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import Providers from './providers';

const inter = Inter({subsets: ['latin']});

export const metadata: Metadata = {
  title: "Piqd | Learn video's information faster.",
  description:
    'YouTube is the best way to learn in 2023. Learn skills, information, and more from YouTube videos faster.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <ClerkProvider>
      <html lang='en'>
        <body className={inter.className}>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
