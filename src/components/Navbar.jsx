"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, User, LogIn, LayoutDashboard, LogOut, Search, Globe, Download } from 'lucide-react';
import styles from './Navbar.module.css';
import SearchTool from './SearchTool';
import { useLanguage } from '@/context/LanguageContext';

const Navbar = ({ user, serverLogo }) => {
    const { language, changeLanguage, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [logo, setLogo] = useState(serverLogo || null);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSTip, setShowIOSTip] = useState(false);

    useEffect(() => {
        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
        setIsIOS(isIOSDevice);

        // Show tip if on iOS and NOT already in PWA mode
        if (isIOSDevice && !isStandalone) {
            setShowIOSTip(true);
        }
    }, []);
    useEffect(() => {
        if (!logo) {
            fetch('/api/admin/settings').then(res => res.json()).then(data => {
                if (data.logo) setLogo(data.logo);
            });
        }
    }, [logo]);

    useEffect(() => {
        // PWA Install Logic
        const handleBeforeInstallPrompt = (e) => {
            console.log('✅ PWA: beforeinstallprompt event fired');
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };

        const handleAppInstalled = () => {
            console.log('🎉 PWA: Application installed successfully');
            setShowInstallBtn(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('✅ PWA: Service Worker registered'))
                .catch(err => console.error('❌ PWA: SW register failed:', err));
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    // Push Subscription Logic
    useEffect(() => {
        if ('serviceWorker' in navigator && user) {
            navigator.serviceWorker.ready.then((reg) => {
                // Request permission and subscribe if not already
                if (Notification.permission === 'default') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            subscribeToPush(reg);
                        }
                    });
                } else if (Notification.permission === 'granted') {
                    subscribeToPush(reg);
                }
            });
        }
    }, [user]);

    const subscribeToPush = async (registration) => {
        try {
            const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!publicVapidKey) return;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });

            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                body: JSON.stringify({ subscription }),
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('✅ Push: User is subscribed');
        } catch (error) {
            console.error('❌ Push: Subscribe failed:', error);
        }
    };

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowInstallBtn(false);
        }
    };

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <>
            {showIOSTip && (
                <div style={{
                    background: 'var(--primary)',
                    color: 'white',
                    padding: '12px 20px',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 1100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '15px'
                }}>
                    <span>📱 <strong>iOS :</strong> Pour installer l'app, cliquez sur <Download size={16} inline="true" style={{ verticalAlign: 'middle' }} /> (Partage) puis <strong>"Sur l'écran d'accueil"</strong>.</span>
                    <button
                        onClick={() => setShowIOSTip(false)}
                        style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                        {t('close') || 'Fermer'}
                    </button>
                </div>
            )}
            <nav className={styles.navbar}>
                <div className={`container ${styles.navContainer}`}>
                    <Link href="/" className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {logo && <img src={logo} alt="Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />}
                        {language === 'ar' ? t('brandName') : <>Touches<span className={styles.highlight}>D'Art</span></>}
                    </Link>

                    {/* Desktop Menu */}
                    <div className={styles.desktopMenu}>
                        <Link href="/" className={styles.navLink}>{t('home')}</Link>
                        <Link href="/about" className={styles.navLink}>{t('about')}</Link>
                        <Link href="/clubs" className={styles.navLink}>{t('clubs')}</Link>
                        <Link href="/best-off" className={styles.navLink}>{t('bestOff')}</Link>
                        <Link href="/contact" className={styles.navLink}>{t('contact')}</Link>
                    </div>

                    <div className={styles.actions}>
                        {/* PWA Install Button Desktop */}
                        {showInstallBtn && (
                            <button
                                onClick={handleInstallClick}
                                className={`btn btn-primary ${styles.installBtn}`}
                                style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Download size={18} />
                                <span className={styles.installText}>{t('installApp')}</span>
                            </button>
                        )}

                        <div className={styles.langSwitcher}>
                            <Globe size={18} />
                            <select
                                value={language}
                                onChange={(e) => changeLanguage(e.target.value)}
                                className={styles.langSelect}
                            >
                                <option value="fr">FR</option>
                                <option value="en">EN</option>
                                <option value="ar">AR</option>
                            </select>
                        </div>
                        <SearchTool />
                        {user ? (
                            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                <Link href="/dashboard" className={`btn btn-secondary ${styles.authBtn}`}>
                                    <LayoutDashboard size={18} style={{ marginRight: '8px' }} />
                                    {t('dashboard')}
                                </Link>
                                <form action="/api/auth/logout" method="POST" className={styles.authBtn}>
                                    <button type="submit" className="btn btn-secondary" style={{ color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                                        <LogOut size={18} />
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <Link href="/login" className={`btn btn-secondary ${styles.authBtn}`}>
                                <LogIn size={18} style={{ marginRight: '8px' }} />
                                {t('connexion')}
                            </Link>
                        )}
                        <button className={styles.mobileToggle} onClick={toggleMenu}>
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <div className={`${styles.mobileMenu} ${isOpen ? styles.open : ''}`}>
                    <div className={styles.mobileLinks}>
                        {/* PWA Install Button Mobile */}
                        {showInstallBtn && (
                            <button
                                onClick={() => { handleInstallClick(); toggleMenu(); }}
                                style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    marginBottom: '1rem'
                                }}
                            >
                                <Download size={20} />
                                {t('installApp')}
                            </button>
                        )}

                        <Link href="/" onClick={toggleMenu}>{t('home')}</Link>
                        <Link href="/about" onClick={toggleMenu}>{t('about')}</Link>

                        <Link href="/clubs" onClick={toggleMenu}>{t('clubs')}</Link>
                        <Link href="/best-off" onClick={toggleMenu}>{t('bestOff')}</Link>
                        <Link href="/contact" onClick={toggleMenu}>{t('contact')}</Link>
                        {user ? (
                            <>
                                <Link href="/dashboard" className={styles.mobileAuth} onClick={toggleMenu}>{t('accessDashboard')}</Link>
                                <form action="/api/auth/logout" method="POST" style={{ marginTop: '1rem' }}>
                                    <button type="submit" style={{ background: 'none', border: 'none', color: '#f43f5e', fontSize: '1.25rem', fontWeight: 600, width: '100%', cursor: 'pointer' }}>
                                        {t('logout')}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className={styles.mobileAuth} onClick={toggleMenu}>{t('connexion')}</Link>
                                <Link href="/signup" className={styles.mobileAuth} onClick={toggleMenu}>{t('signup')}</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Navbar;
