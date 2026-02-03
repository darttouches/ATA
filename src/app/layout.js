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
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Touches D'Art",
  },
  manifest: '/manifest.webmanifest',
};

export const viewport = {
  themeColor: '#11224E',
};

export default async function RootLayout({ children }) {
  let user = await getUser();
  // Ensure user is truly authenticated (guard against { error: ... } objects)
  if (user && user.error) user = null;

  let logo = null;
  try {
    await dbConnect();
    const logoData = await Settings.findOne({ key: 'site_logo' });
    logo = logoData?.value || null;
  } catch (dbError) {
    console.error('Database connection failed in RootLayout:', dbError.message);
  }

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <LanguageProvider>
          <Navbar user={user} serverLogo={logo} />
          <main className="main-content">
            {children}
          </main>
          <BackgroundMusic />
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
