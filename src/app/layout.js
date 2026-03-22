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
  icons: {
    icon: '/favicon.ico',
    apple: '/logo/apple-icon.png', // Temporary placeholder for cleaner path
  },
};

export const viewport = {
  themeColor: '#11224E',
};

export default async function RootLayout({ children }) {
  let user = await getUser();
  // Ensure user is truly authenticated (guard against { error: ... } objects)
  if (user && user.error) user = null;

  let logo = null;
  let bgMusic = null;
  try {
    await dbConnect();
    const [logoData, musicData] = await Promise.all([
      Settings.findOne({ key: 'site_logo' }),
      Settings.findOne({ key: 'bg_music' })
    ]);
    logo = logoData?.value || null;
    bgMusic = musicData?.value || null;
  } catch (dbError) {
    console.error('Database connection failed in RootLayout:', dbError.message);
  }

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              if (localStorage.getItem('desktopMode') === 'true') {
                document.write('<meta name="viewport" content="width=1280, initial-scale=0.1">');
                document.documentElement.classList.add('force-desktop');
              } else {
                document.write('<meta name="viewport" content="width=device-width, initial-scale=1">');
              }
            } catch (e) {}
          })();
        `}} />
      </head>
      <body className={inter.className}>
        <LanguageProvider>
          <Navbar user={user} serverLogo={logo} />
          <main className="main-content">
            {children}
          </main>
          <BackgroundMusic initialSettings={bgMusic} />
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
