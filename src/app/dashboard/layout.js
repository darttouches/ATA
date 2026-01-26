"use client";

import { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Menu } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function DashboardLayout({ children }) {
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data); // Fixed: API returns user directly, not { user: ... }
                } else {
                    window.location.href = '/login';
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>{t('loading')}</div>;
    if (!user) return null;

    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', background: 'var(--background)' }}>
            {/* Hamburger for mobile */}
            <div className="mobile-only" style={{
                position: 'fixed',
                top: '80px',
                left: 0,
                right: 0,
                height: '50px',
                background: 'var(--card-bg)',
                borderBottom: '1px solid var(--card-border)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 1rem',
                zIndex: 900
            }}>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="btn btn-secondary"
                    style={{ padding: '8px', border: 'none' }}
                >
                    <Menu size={20} />
                </button>
                <span style={{ marginLeft: '1rem', fontWeight: 600, fontSize: '0.9rem' }}>Dashboard</span>
            </div>

            <DashboardSidebar
                user={user}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content */}
            <main style={{
                flex: 1,
                padding: '2rem',
                overflowY: 'auto',
                marginTop: 'var(--mobile-nav-offset, 0px)' // Handle mobile top bar
            }}>
                <style jsx global>{`
                    @media (max-width: 1024px) {
                        :root {
                            --mobile-nav-offset: 50px;
                        }
                    }
                `}</style>
                {children}
            </main>
        </div>
    );
}
