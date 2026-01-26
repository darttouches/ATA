"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Users, FileText, Settings, Shield, LogOut,
    Bell, MessageSquare, AlertCircle, User, Calendar, BarChart3, Mic, X, Home
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './DashboardSidebar.module.css';

export default function DashboardSidebar({ user, isOpen, onClose }) {
    const { t } = useLanguage();
    const pathname = usePathname();

    const isActive = (path) => pathname === path;

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`${styles.overlay} ${isOpen ? styles.visible : ''}`}
                onClick={onClose}
            />

            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '0 0.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{t('accessDashboard')}</h2>
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--primary)',
                            marginTop: '0.4rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            padding: '2px 8px',
                            background: 'rgba(124, 58, 237, 0.1)',
                            borderRadius: '4px',
                            display: 'inline-block',
                            fontWeight: 700
                        }}>
                            {user.role === 'president' ? t('president') : user.role}
                        </div>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        onClick={onClose}
                        className="btn btn-secondary mobile-only"
                        style={{ padding: '5px', border: 'none' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className={styles.nav}>
                    <Link href="/" className={styles.link} style={{ marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', borderRadius: '0', paddingBottom: '1rem' }}>
                        <Home size={18} /> {t('backToSite') || 'Retour au site'}
                    </Link>

                    <Link href="/dashboard/profile" className={`${styles.link} ${isActive('/dashboard/profile') ? styles.activeLink : ''}`} onClick={onClose}>
                        <User size={18} /> {t('myProfile')}
                    </Link>
                    <Link href="/dashboard/notifications" className={`${styles.link} ${isActive('/dashboard/notifications') ? styles.activeLink : ''}`} onClick={onClose}>
                        <Bell size={18} /> {t('notifications')}
                    </Link>
                    <Link href="/dashboard/messages" className={`${styles.link} ${isActive('/dashboard/messages') ? styles.activeLink : ''}`} onClick={onClose}>
                        <MessageSquare size={18} /> {t('messaging')}
                    </Link>
                    <Link href="/dashboard/voice" className={`${styles.link} ${isActive('/dashboard/voice') ? styles.activeLink : ''}`} onClick={onClose}>
                        <Mic size={18} /> {t('memberVoice')}
                    </Link>
                    <Link href="/dashboard" className={`${styles.link} ${isActive('/dashboard') ? styles.activeLink : ''}`} onClick={onClose}>
                        <LayoutDashboard size={18} /> {t('dashboardOverview')}
                    </Link>

                    {user.role === 'admin' && (
                        <>
                            <div className={styles.sectionLabel}>Administration</div>
                            <Link href="/dashboard/voice-management" className={`${styles.link} ${isActive('/dashboard/voice-management') ? styles.activeLink : ''}`} onClick={onClose}>
                                <Mic size={18} /> {t('voiceManagement')}
                            </Link>
                            <Link href="/dashboard/reclamations" className={`${styles.link} ${isActive('/dashboard/reclamations') ? styles.activeLink : ''}`} onClick={onClose}>
                                <AlertCircle size={18} /> {t('demandsReclamations')}
                            </Link>
                            <Link href="/dashboard/users" className={`${styles.link} ${isActive('/dashboard/users') ? styles.activeLink : ''}`} onClick={onClose}>
                                <Users size={18} /> {t('users')}
                            </Link>
                            <Link href="/dashboard/clubs" className={`${styles.link} ${isActive('/dashboard/clubs') ? styles.activeLink : ''}`} onClick={onClose}>
                                <Shield size={18} /> {t('clubsManagement')}
                            </Link>
                            <Link href="/dashboard/members" className={`${styles.link} ${isActive('/dashboard/members') ? styles.activeLink : ''}`} onClick={onClose}>
                                <Users size={18} /> {t('membersManagement')}
                            </Link>
                            <Link href="/dashboard/board" className={`${styles.link} ${isActive('/dashboard/board') ? styles.activeLink : ''}`} onClick={onClose}>
                                <Users size={18} /> {t('nationalBoard')}
                            </Link>
                            <Link href="/dashboard/about" className={`${styles.link} ${isActive('/dashboard/about') ? styles.activeLink : ''}`} onClick={onClose}>
                                <FileText size={18} /> {t('aboutManagement')}
                            </Link>
                            <Link href="/dashboard/partners" className={`${styles.link} ${isActive('/dashboard/partners') ? styles.activeLink : ''}`} onClick={onClose}>
                                <Users size={18} /> {t('partners')}
                            </Link>
                            <Link href="/dashboard/content" className={`${styles.link} ${isActive('/dashboard/content') ? styles.activeLink : ''}`} onClick={onClose}>
                                <FileText size={18} /> {t('contents')}
                            </Link>
                            <Link href="/dashboard/actions-moderation" className={`${styles.link} ${isActive('/dashboard/actions-moderation') ? styles.activeLink : ''}`} onClick={onClose}>
                                <Calendar size={18} /> {t('actionsModeration')}
                            </Link>
                            <Link href="/dashboard/polls-moderation" className={`${styles.link} ${isActive('/dashboard/polls-moderation') ? styles.activeLink : ''}`} onClick={onClose}>
                                <BarChart3 size={18} /> {t('pollsModeration')}
                            </Link>
                            <Link href="/dashboard/my-club/actions" className={`${styles.link} ${isActive('/dashboard/my-club/actions') ? styles.activeLink : ''}`} onClick={onClose}>
                                <Calendar size={18} /> {t('actionsManagement')}
                            </Link>
                            <Link href="/dashboard/settings" className={`${styles.link} ${isActive('/dashboard/settings') ? styles.activeLink : ''}`} onClick={onClose}>
                                <Settings size={18} /> {t('generalSettings')}
                            </Link>
                        </>
                    )}

                    {user.role === 'president' && (
                        <>
                            <div className={styles.sectionLabel}>{t('myClub')}</div>
                            <Link href="/dashboard/voice-management" className={`${styles.link} ${isActive('/dashboard/voice-management') ? styles.activeLink : ''}`} onClick={onClose}>
                                <Mic size={18} /> {t('voiceManagement')}
                            </Link>
                            <Link href="/dashboard/my-club" className={`${styles.link} ${isActive('/dashboard/my-club') ? styles.activeLink : ''}`} onClick={onClose}>
                                <Settings size={18} /> {t('pageSettings')}
                            </Link>
                            <Link href="/dashboard/my-club/content" className={`${styles.link} ${isActive('/dashboard/my-club/content') ? styles.activeLink : ''}`} onClick={onClose}>
                                <FileText size={18} /> {t('contentsEvents')}
                            </Link>
                            <Link href="/dashboard/my-club/actions" className={`${styles.link} ${isActive('/dashboard/my-club/actions') ? styles.activeLink : ''}`} onClick={onClose}>
                                <FileText size={18} /> {t('actionsAttendance')}
                            </Link>
                            <Link href="/dashboard/my-club/testimonials" className={`${styles.link} ${isActive('/dashboard/my-club/testimonials') ? styles.activeLink : ''}`} onClick={onClose}>
                                <MessageSquare size={18} /> {t('reviewsTestimonials')}
                            </Link>
                            <Link href="/dashboard/members" className={`${styles.link} ${isActive('/dashboard/members') ? styles.activeLink : ''}`} onClick={onClose}>
                                <Users size={18} /> {t('membersManagement')}
                            </Link>
                            <Link href="/dashboard/my-club/polls" className={`${styles.link} ${isActive('/dashboard/my-club/polls') ? styles.activeLink : ''}`} onClick={onClose}>
                                <BarChart3 size={18} /> {t('polls')}
                            </Link>
                        </>
                    )}
                </nav>

                <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                    <form action="/api/auth/logout" method="POST">
                        <button type="submit" className={`btn btn-secondary ${styles.logoutBtn}`}>
                            <LogOut size={18} /> {t('logout')}
                        </button>
                    </form>
                </div>
            </aside>
        </>
    );
}
