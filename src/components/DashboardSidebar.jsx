"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Settings, Shield, LogOut, Bell, MessageSquare, AlertCircle, User, Calendar, BarChart3, Mic } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function DashboardSidebar({ user }) {
    const { t } = useLanguage();
    const pathname = usePathname();

    const isActive = (path) => pathname === path;

    const linkStyle = (path) => ({
        justifyContent: 'flex-start',
        border: 'none',
        background: isActive(path) ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
        color: isActive(path) ? 'var(--primary)' : 'inherit',
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '0.95rem',
        fontWeight: isActive(path) ? 600 : 400,
        transition: 'all 0.2s'
    });

    return (
        <aside style={{
            width: '280px',
            background: 'var(--card-bg)',
            borderRight: '1px solid var(--card-border)',
            padding: '2rem 1.2rem',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 80px)',
            position: 'sticky',
            top: '80px',
            overflowY: 'auto'
        }}>
            <div style={{ marginBottom: '2rem', padding: '0 0.5rem' }}>
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

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
                <Link href="/dashboard/profile" style={linkStyle('/dashboard/profile')}>
                    <User size={18} /> {t('myProfile')}
                </Link>
                <Link href="/dashboard/notifications" style={linkStyle('/dashboard/notifications')}>
                    <Bell size={18} /> {t('notifications')}
                </Link>
                <Link href="/dashboard/messages" style={linkStyle('/dashboard/messages')}>
                    <MessageSquare size={18} /> {t('messaging')}
                </Link>
                <Link href="/dashboard/voice" style={linkStyle('/dashboard/voice')}>
                    <Mic size={18} /> {t('memberVoice')}
                </Link>
                <Link href="/dashboard" style={linkStyle('/dashboard')}>
                    <LayoutDashboard size={18} /> {t('dashboardOverview')}
                </Link>

                {user.role === 'admin' && (
                    <>
                        <div style={{ margin: '1.5rem 0.5rem 0.5rem', fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}>Administration</div>
                        <Link href="/dashboard/voice-management" style={linkStyle('/dashboard/voice-management')}>
                            <Mic size={18} /> {t('voiceManagement')}
                        </Link>
                        <Link href="/dashboard/reclamations" style={linkStyle('/dashboard/reclamations')}>
                            <AlertCircle size={18} /> {t('demandsReclamations')}
                        </Link>
                        <Link href="/dashboard/users" style={linkStyle('/dashboard/users')}>
                            <Users size={18} /> {t('users')}
                        </Link>
                        <Link href="/dashboard/clubs" style={linkStyle('/dashboard/clubs')}>
                            <Shield size={18} /> {t('clubsManagement')}
                        </Link>
                        <Link href="/dashboard/members" style={linkStyle('/dashboard/members')}>
                            <Users size={18} /> {t('membersManagement')}
                        </Link>
                        <Link href="/dashboard/board" style={linkStyle('/dashboard/board')}>
                            <Users size={18} /> {t('nationalBoard')}
                        </Link>
                        <Link href="/dashboard/about" style={linkStyle('/dashboard/about')}>
                            <FileText size={18} /> {t('aboutManagement')}
                        </Link>
                        <Link href="/dashboard/partners" style={linkStyle('/dashboard/partners')}>
                            <Users size={18} /> {t('partners')}
                        </Link>
                        <Link href="/dashboard/content" style={linkStyle('/dashboard/content')}>
                            <FileText size={18} /> {t('contents')}
                        </Link>
                        <Link href="/dashboard/actions-moderation" style={linkStyle('/dashboard/actions-moderation')}>
                            <Calendar size={18} /> {t('actionsModeration')}
                        </Link>
                        <Link href="/dashboard/polls-moderation" style={linkStyle('/dashboard/polls-moderation')}>
                            <BarChart3 size={18} /> {t('pollsModeration')}
                        </Link>
                        <Link href="/dashboard/my-club/actions" style={linkStyle('/dashboard/my-club/actions')}>
                            <Calendar size={18} /> {t('actionsManagement')}
                        </Link>
                        <Link href="/dashboard/settings" style={linkStyle('/dashboard/settings')}>
                            <Settings size={18} /> {t('generalSettings')}
                        </Link>
                    </>
                )}

                {user.role === 'president' && (
                    <>
                        <div style={{ margin: '1.5rem 0.5rem 0.5rem', fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}>{t('myClub')}</div>
                        <Link href="/dashboard/voice-management" style={linkStyle('/dashboard/voice-management')}>
                            <Mic size={18} /> {t('voiceManagement')}
                        </Link>
                        <Link href="/dashboard/my-club" style={linkStyle('/dashboard/my-club')}>
                            <Settings size={18} /> {t('pageSettings')}
                        </Link>
                        <Link href="/dashboard/my-club/content" style={linkStyle('/dashboard/my-club/content')}>
                            <FileText size={18} /> {t('contentsEvents')}
                        </Link>
                        <Link href="/dashboard/my-club/actions" style={linkStyle('/dashboard/my-club/actions')}>
                            <FileText size={18} /> {t('actionsAttendance')}
                        </Link>
                        <Link href="/dashboard/my-club/testimonials" style={linkStyle('/dashboard/my-club/testimonials')}>
                            <MessageSquare size={18} /> {t('reviewsTestimonials')}
                        </Link>
                        <Link href="/dashboard/members" style={linkStyle('/dashboard/members')}>
                            <Users size={18} /> {t('membersManagement')}
                        </Link>
                        <Link href="/dashboard/my-club/polls" style={linkStyle('/dashboard/my-club/polls')}>
                            <BarChart3 size={18} /> {t('polls')}
                        </Link>
                    </>
                )}
            </nav>

            <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                <form action="/api/auth/logout" method="POST">
                    <button type="submit" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', color: '#f43f5e', border: 'none', background: 'transparent' }}>
                        <LogOut size={18} style={{ marginRight: '10px' }} /> {t('logout')}
                    </button>
                </form>
            </div>
        </aside>
    );
}
