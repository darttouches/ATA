"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, User, LogIn, LayoutDashboard, LogOut, Search, Globe } from 'lucide-react';
import styles from './Navbar.module.css';
import SearchTool from './SearchTool';
import { useLanguage } from '@/context/LanguageContext';

const Navbar = ({ user, serverLogo }) => {
    const { language, changeLanguage, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [logo, setLogo] = useState(serverLogo || null);

    useEffect(() => {
        if (!logo) {
            fetch('/api/admin/settings').then(res => res.json()).then(data => {
                if (data.logo) setLogo(data.logo);
            });
        }
    }, [logo]);

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
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
    );
};

export default Navbar;
