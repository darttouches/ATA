import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackgroundMusic from '@/components/BackgroundMusic';
import { Inter } from 'next/font/google';
import { getUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { LanguageProvider } from '@/context/LanguageContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "Touches D'Art - Association Culturelle et Artistique",
  description: "Plateforme officielle de l'association Touches D'Art. Découvrez nos clubs, activités et créations artistiques.",
};

export default async function RootLayout({ children }) {
  const user = await getUser();

  await dbConnect();
  const logoData = await Settings.findOne({ key: 'site_logo' });
  const logo = logoData?.value || null;

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <LanguageProvider>
          <Navbar user={user} serverLogo={logo} />
          <main style={{ paddingTop: '80px', minHeight: '100vh', position: 'relative' }}>
            {children}
          </main>
          <BackgroundMusic />
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
