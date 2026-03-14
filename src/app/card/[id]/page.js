"use client";

import { useEffect, useState, use, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import {
    Shield, User, MapPin, Award, Share2, Printer, CheckCircle,
    Facebook, Instagram, Linkedin, Globe, Mail, Phone, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function MembershipCardPage({ params }) {
    const { id } = use(params);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [qrDataUrl, setQrDataUrl] = useState('');
    const cardRef = useRef(null);

    const ensureAbsoluteUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `https://${url}`;
    };

    const generateQR = useCallback(async (text) => {
        try {
            const url = await QRCode.toDataURL(text, {
                margin: 1,
                width: 300,
                color: {
                    dark: '#000000',
                    light: '#ffffff',
                },
            });
            setQrDataUrl(url);
        } catch (err) {
            console.error('QR Generation Error:', err);
        }
    }, []);

    const fetchCardData = useCallback(async () => {
        try {
            const res = await fetch(`/api/user/card/${id}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch');
            }
            const data = await res.json();
            setUserData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchCardData();
    }, [fetchCardData]);

    useEffect(() => {
        if (userData) {
            const currentUrl = window.location.href;
            generateQR(currentUrl);
        }
    }, [userData, generateQR]);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Carte de membre - ${userData.firstName} ${userData.lastName}`,
                    text: `Voici ma carte de membre officielle Touches D'Art`,
                    url: window.location.href,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Lien de la carte copié !');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
            <div className="flex flex-col items-center gap-4">
                <div className="loading-spinner"></div>
                <div className="text-gray-400 font-medium animate-pulse text-sm">Chargement...</div>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 text-center">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 max-w-sm w-full">
                <Shield size={48} className="mx-auto text-red-500 mb-4 opacity-50" />
                <h1 className="text-xl font-bold mb-2 text-gray-800">
                    {(error.includes('supprimé') || error.includes('invalide')) ? 'Carte introuvable' : 'Accès restreint'}
                </h1>
                <p className="text-gray-500 mb-6 text-sm">{error}</p>
                <Link href="/" className="inline-block w-full py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-colors">Retour au site</Link>
            </div>
        </div>
    );

    const clubColor = userData.club?.color || '#1e293b';

    return (
        <div className="page-wrapper">

            {/* Action Buttons */}
            <div className="no-print actions-bar">
                <button onClick={handleShare} className="btn-action shadow-sm">
                    <Share2 size={16} /> Partager
                </button>
                <button onClick={() => window.print()} className="btn-action-dark shadow-lg">
                    <Printer size={16} /> PDF / Imprimer
                </button>
            </div>

            {/* THE CARD - A6 (105x148mm) */}
            <div ref={cardRef} className="card-a6 shadow-2xl">

                {/* Top Section */}
                <div className="header-section" style={{ backgroundColor: clubColor }}>
                    <Link href="/" className="logo-badge-link">
                        <div className="logo-badge">
                            <Shield className="text-white" size={14} />
                            <span className="logo-text">Touches D'Art</span>
                        </div>
                    </Link>

                    {/* PHOTO CIRCLE - 5CM DIAMETER STRICT */}
                    <div className="photo-container">
                        <div className="photo-outer-circle shadow-lg">
                            <div className="photo-inner-circle">
                                {userData.profileImage ? (
                                    <div className="user-photo-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
                                        <Image src={userData.profileImage} alt={userData.name} fill className="user-photo" style={{ objectFit: 'cover' }} />
                                    </div>
                                ) : (
                                    <User size={40} className="text-gray-200" />
                                )}
                            </div>
                        </div>
                        {/* Status Icon */}
                        <div className="verified-badge">
                            <CheckCircle size={14} className="text-white" />
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="content-section">
                    <div className="name-role-group">
                        <h1 className="user-name">
                            {userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.name}
                        </h1>
                        <div className="role-chip">
                            <Award size={12} className="text-blue-600" />
                            <span className="role-text">{userData.officialRole || (userData.role === 'membre' ? 'MEMBRE ACTIF' : userData.role?.toUpperCase())}</span>
                        </div>
                        <div className="club-name">
                            <MapPin size={10} /> {userData.club?.name || "Touches D'Art"}
                        </div>
                    </div>

                    {/* Social Icons Bar - Small size */}
                    <div className="social-links-grid">
                        {userData.phone && (
                            <a href={`tel:${userData.phone}`} className="social-icon">
                                <Phone size={14} />
                            </a>
                        )}
                        {userData.whatsapp && (
                            <a href={`https://wa.me/${userData.whatsapp}`} target="_blank" className="social-icon">
                                <WhatsappIcon size={14} />
                            </a>
                        )}
                        {userData.email && (
                            <a href={`mailto:${userData.email}`} className="social-icon">
                                <Mail size={14} />
                            </a>
                        )}
                        {userData.instagram && (
                            <a href={ensureAbsoluteUrl(userData.instagram)} target="_blank" className="social-icon instacolor">
                                <Instagram size={14} />
                            </a>
                        )}
                        {userData.facebook && (
                            <a href={ensureAbsoluteUrl(userData.facebook)} target="_blank" className="social-icon fbcolor">
                                <Facebook size={14} />
                            </a>
                        )}
                        {userData.linkedin && (
                            <a href={ensureAbsoluteUrl(userData.linkedin)} target="_blank" className="social-icon lincolor">
                                <Linkedin size={14} />
                            </a>
                        )}
                        {userData.website && (
                            <a href={ensureAbsoluteUrl(userData.website)} target="_blank" className="social-icon webcolor">
                                <Globe size={14} />
                            </a>
                        )}
                    </div>

                    {/* QR Code */}
                    <div className="qr-section">
                        <div className="qr-box shadow-sm">
                            {qrDataUrl ? (
                                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                    <Image src={qrDataUrl} alt="QR" fill className="qr-img" style={{ objectFit: 'contain' }} unoptimized />
                                </div>
                            ) : (
                                <ExternalLink className="text-gray-100" size={16} />
                            )}
                        </div>
                        <p className="qr-label">Scanner pour vérifier l'adhésion</p>
                    </div>
                </div>

                <div className="footer-strip" style={{ backgroundColor: clubColor }}></div>
            </div>

            <style jsx>{`
                .page-wrapper {
                   min-height: 100vh;
                   background-color: #f1f5f9;
                   display: flex;
                   flex-direction: column;
                   align-items: center;
                   padding: 2rem 1rem;
                }
                .actions-bar {
                    display: flex;
                    gap: 0.75rem;
                    margin-bottom: 2rem;
                }
                .btn-action {
                    background: white;
                    color: #475569;
                    padding: 0.6rem 1.25rem;
                    border-radius: 0.75rem;
                    font-weight: 700;
                    font-size: 0.875rem;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: 0.2s;
                }
                .btn-action-dark {
                    background: #1e293b;
                    color: white;
                    padding: 0.6rem 1.25rem;
                    border-radius: 0.75rem;
                    font-weight: 700;
                    font-size: 0.875rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: 0.2s;
                    border: none;
                }
                .card-a6 {
                    width: 105mm;
                    height: 148mm;
                    background: white;
                    border-radius: 6mm;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .header-section {
                    height: 50mm;
                    position: relative;
                    padding-top: 8mm;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .logo-badge-link {
                    text-decoration: none;
                    display: block;
                    z-index: 20;
                }
                .logo-badge {
                    background: rgba(255,255,255,0.15);
                    backdrop-filter: blur(8px);
                    padding: 2mm 4mm;
                    border-radius: 20mm;
                    display: flex;
                    align-items: center;
                    gap: 2mm;
                }
                .logo-text {
                    color: white;
                    font-weight: 800;
                    font-size: 3mm;
                    text-transform: uppercase;
                    letter-spacing: 0.5mm;
                }
                .photo-container {
                    position: absolute;
                    bottom: -25mm;
                    z-index: 10;
                }
                .photo-outer-circle {
                    width: 50mm;
                    height: 50mm;
                    background: white;
                    border-radius: 50%;
                    padding: 1.5mm;
                    display: flex;
                }
                .photo-inner-circle {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    overflow: hidden;
                    background: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .user-photo {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .verified-badge {
                    position: absolute;
                    bottom: 2mm;
                    right: 2mm;
                    background: #3b82f6;
                    border: 1mm solid white;
                    border-radius: 50%;
                    padding: 1.2mm;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                }
                .content-section {
                    flex: 1;
                    padding-top: 28mm;
                    padding-left: 6mm;
                    padding-right: 6mm;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                .name-role-group {
                    margin-bottom: 5mm;
                }
                .user-name {
                    font-size: 6mm;
                    font-weight: 1000;
                    color: #0f172a !important;
                    -webkit-text-fill-color: #0f172a !important;
                    background: none !important;
                    margin-bottom: 2mm;
                }
                .role-chip {
                    background: #f1f5f9;
                    display: inline-flex;
                    align-items: center;
                    gap: 1.5mm;
                    padding: 1mm 3mm;
                    border-radius: 10mm;
                    margin-bottom: 1.5mm;
                }
                .role-text {
                    font-size: 2.2mm;
                    font-weight: 800;
                    color: #475569;
                    letter-spacing: 0.3mm;
                }
                .club-name {
                    font-size: 2.5mm;
                    font-weight: 700;
                    color: #94a3b8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1mm;
                }
                .social-links-grid {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 2mm;
                    margin-bottom: auto;
                    width: 100%;
                }
                .social-icon {
                    width: 8mm;
                    height: 8mm;
                    background: #f8fafc;
                    border: 0.3mm solid #e2e8f0;
                    border-radius: 2.5mm;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #475569;
                    transition: 0.2s;
                }
                .instacolor { color: #E4405F; }
                .fbcolor { color: #1877F2; }
                .lincolor { color: #0A66C2; }
                .webcolor { color: #475569; }

                .qr-section {
                    margin-top: 4mm;
                    margin-bottom: 6mm;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .qr-box {
                    background: white;
                    padding: 2mm;
                    border-radius: 4mm;
                    border: 0.2mm solid #f1f5f9;
                    margin-bottom: 2mm;
                    width: 22mm;
                    height: 22mm;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .qr-img {
                    width: 18mm;
                    height: 18mm;
                }
                .qr-label {
                    font-size: 1.8mm;
                    font-weight: 800;
                    color: #cbd5e1;
                    text-transform: uppercase;
                    letter-spacing: 0.4mm;
                }
                .footer-strip {
                    height: 1.5mm;
                    opacity: 0.3;
                }
                .loading-spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid #3b82f6;
                    border-top-color: transparent;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* PRINT OPTIMIZATION */
                @media print {
                    @page {
                        size: A6;
                        margin: 0;
                    }
                    /* HIDE ALL LAYOUT ELEMENTS */
                    :global(nav), :global(footer), :global(.no-print), :global(audio), :global(.actions-bar) {
                        display: none !important;
                    }
                    :global(body), :global(html) {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        width: 105mm !important;
                        height: 148mm !important;
                    }
                    :global(.main-content) {
                        padding: 0 !important;
                        margin: 0 !important;
                        min-height: 0 !important;
                    }
                    .page-wrapper {
                        padding: 0 !important;
                        margin: 0 !important;
                        background: white !important;
                        min-height: 0 !important;
                    }
                    .card-a6 { 
                        box-shadow: none !important; 
                        margin: 0 !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        border-radius: 0 !important;
                        border: none !important;
                    }
                    /* Ensure background colors print */
                    .header-section, .footer-strip, .logo-badge {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
}

function WhatsappIcon({ size }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
    )
}
