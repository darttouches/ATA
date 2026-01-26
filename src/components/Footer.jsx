"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
    const { t, language } = useLanguage();
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        fetch('/api/admin/settings').then(res => res.json()).then(data => {
            if (data.footer) setSettings(data.footer);
        });
    }, []);

    const getIcon = (platform) => {
        switch (platform) {
            case 'facebook': return <Facebook size={20} />;
            case 'instagram': return <Instagram size={20} />;
            case 'twitter': return <Twitter size={20} />;
            case 'linkedin': return <Linkedin size={20} />;
            case 'youtube': return <Youtube size={20} />;
            default: return null;
        }
    };

    if (!settings) return null;

    return (
        <footer style={{ background: '#0a1635', color: '#fff', paddingTop: '4rem', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', paddingBottom: '3rem' }}>

                    {/* Column 1: About */}
                    <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', background: 'linear-gradient(to right, var(--secondary), var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Touches D'Art
                        </h3>
                        <p style={{ opacity: 0.7, lineHeight: 1.6, marginBottom: '1.5rem' }}>
                            {settings.description || t('aboutDesc')}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {settings.socials && settings.socials.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.05)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.3s ease',
                                        color: 'white'
                                    }}
                                    onMouseOver={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    {getIcon(social.platform)}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', position: 'relative', paddingBottom: '0.5rem' }}>
                            {t('quickLinks')}
                            <span style={{ position: 'absolute', bottom: 0, left: language === 'ar' ? 'auto' : 0, right: language === 'ar' ? 0 : 'auto', width: '40px', height: '3px', background: 'var(--secondary)', borderRadius: '2px' }}></span>
                        </h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {settings.quickLinks && settings.quickLinks.length > 0 ? (
                                settings.quickLinks.map((link, index) => (
                                    <li key={index} style={{ marginBottom: '0.8rem' }}>
                                        <a href={link.url} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7, transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.paddingLeft = '5px'; }} onMouseOut={e => { e.currentTarget.style.opacity = 0.7; e.currentTarget.style.paddingLeft = '0'; }}>
                                            <ArrowRight size={14} color="var(--primary)" /> {link.text}
                                        </a>
                                    </li>
                                ))
                            ) : (
                                <>
                                    <li style={{ marginBottom: '0.8rem' }}><Link href="/about" style={{ opacity: 0.7 }}>{t('about')}</Link></li>
                                    <li style={{ marginBottom: '0.8rem' }}><Link href="/clubs" style={{ opacity: 0.7 }}>{t('clubs')}</Link></li>
                                    <li style={{ marginBottom: '0.8rem' }}><Link href="/contact" style={{ opacity: 0.7 }}>{t('contact')}</Link></li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Column 3: Contact */}
                    <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', position: 'relative', paddingBottom: '0.5rem' }}>
                            {t('contact')}
                            <span style={{ position: 'absolute', bottom: 0, left: language === 'ar' ? 'auto' : 0, right: language === 'ar' ? 0 : 'auto', width: '40px', height: '3px', background: 'var(--accent)', borderRadius: '2px' }}></span>
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {settings.address && (
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px' }}><MapPin size={18} color="var(--accent)" /></div>
                                    <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{settings.address}</p>
                                </div>
                            )}
                            {settings.email && (
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px' }}><Mail size={18} color="var(--accent)" /></div>
                                    <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{settings.email}</p>
                                </div>
                            )}
                            {settings.phone && (
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px' }}><Phone size={18} color="var(--accent)" /></div>
                                    <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{settings.phone}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Copyright Bar */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem 0', textAlign: 'center', fontSize: '0.85rem', opacity: 0.5 }}>
                    <p>{settings.copyright || `© ${new Date().getFullYear()} Touches D'Art. All rights reserved.`}</p>
                </div>
            </div>
        </footer>
    );
}
