"use client";

import { useState, useEffect } from 'react';
import { Upload, Save, Check, Plus, Trash2, Link as LinkIcon, Facebook, Instagram, Twitter, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function AdminSettings() {
    const { t } = useLanguage();
    const [logo, setLogo] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Footer State
    const [footerData, setFooterData] = useState({
        description: '',
        address: '',
        email: '',
        phone: '',
        socials: [], // { platform: 'facebook', url: '' }
        quickLinks: [], // { text: '', url: '' }
        copyright: ''
    });

    useEffect(() => {
        fetch('/api/admin/settings').then(res => res.json()).then(data => {
            if (data.logo) setLogo(data.logo);
            if (data.footer) setFooterData(data.footer);
        });
    }, []);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileData: reader.result,
                    folder: 'logo'
                }),
            });

            const data = await res.json();
            if (data.success) {
                setLogo(data.url);
            }
            setLoading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setLoading(true);
        const res = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                logoUrl: logo,
                footer: footerData
            }),
        });

        if (res.ok) {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: '600px' }}>
            <h1 style={{ marginBottom: '2rem' }}>Paramètres de l'Association</h1>

            <div className="card">
                <h3>Logo de l'Association</h3>
                <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '1.5rem' }}>
                    Ce logo s'affichera dans la barre de navigation sur toutes les pages.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '2rem' }}>
                    <div style={{
                        width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px dashed var(--card-border)', overflow: 'hidden'
                    }}>
                        {logo ? (
                            <img
                                src={logo}
                                alt="Logo Preview"
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=Erreur'; }}
                            />
                        ) : (
                            <Upload size={32} style={{ opacity: 0.2 }} />
                        )}
                    </div>

                    <div style={{ flex: 1 }}>
                        <label className="btn btn-secondary" style={{ cursor: 'pointer', marginBottom: '10px', display: 'inline-flex' }}>
                            <Upload size={18} style={{ marginRight: '8px' }} /> {loading ? 'Chargement...' : 'Importation locale'}
                            <input type="file" hidden accept="image/*" onChange={handleFileUpload} disabled={loading} />
                        </label>
                        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                            Extensions admises : JPG, PNG, SVG. Taille max 2Mo.
                        </div>
                        {logo && <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '5px', wordBreak: 'break-all' }}>Chemin : {logo}</div>}
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    onClick={handleSave}
                    disabled={loading || !logo}
                >
                    {success ? <><Check size={18} /> {t('changesSaved')}</> : <><Save size={18} /> {t('saveAllChanges')}</>}
                </button>
            </div>

            {/* Footer Management Section */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <h3>{t('footerManagement')}</h3>
                <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '1.5rem' }}>
                    {t('footerManagementDesc')}
                </p>

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {/* Description */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('footerDescription')}</label>
                        <textarea
                            className="card"
                            style={{ width: '100%', minHeight: '80px', border: '1px solid var(--card-border)' }}
                            value={footerData.description}
                            onChange={e => setFooterData({ ...footerData, description: e.target.value })}
                            placeholder={t('footerDescriptionPlaceholder')}
                        />
                    </div>

                    {/* Contact Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}><MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} /> {t('addressLocal')}</label>
                            <input
                                className="card"
                                style={{ width: '100%', border: '1px solid var(--card-border)' }}
                                value={footerData.address}
                                onChange={e => setFooterData({ ...footerData, address: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}><Mail size={14} style={{ display: 'inline', marginRight: '4px' }} /> Email</label>
                            <input
                                className="card"
                                style={{ width: '100%', border: '1px solid var(--card-border)' }}
                                value={footerData.email}
                                onChange={e => setFooterData({ ...footerData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}><Phone size={14} style={{ display: 'inline', marginRight: '4px' }} /> {t('phone')}</label>
                            <input
                                className="card"
                                style={{ width: '100%', border: '1px solid var(--card-border)' }}
                                value={footerData.phone}
                                onChange={e => setFooterData({ ...footerData, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Copyright</label>
                            <input
                                className="card"
                                style={{ width: '100%', border: '1px solid var(--card-border)' }}
                                value={footerData.copyright}
                                onChange={e => setFooterData({ ...footerData, copyright: e.target.value })}
                                placeholder="© 2024 Touches D'Art"
                            />
                        </div>
                    </div>

                    {/* Social Media */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('socialLinks')}</label>
                        {footerData.socials.map((social, index) => (
                            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <select
                                    className="card"
                                    style={{ width: '150px', border: '1px solid var(--card-border)', background: '#11224E', color: 'white' }}
                                    value={social.platform}
                                    onChange={e => {
                                        const newSocials = [...footerData.socials];
                                        newSocials[index].platform = e.target.value;
                                        setFooterData({ ...footerData, socials: newSocials });
                                    }}
                                >
                                    <option value="facebook">Facebook</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="twitter">Twitter</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="youtube">YouTube</option>
                                </select>
                                <input
                                    className="card"
                                    style={{ flex: 1, border: '1px solid var(--card-border)' }}
                                    value={social.url}
                                    onChange={e => {
                                        const newSocials = [...footerData.socials];
                                        newSocials[index].url = e.target.value;
                                        setFooterData({ ...footerData, socials: newSocials });
                                    }}
                                    placeholder="URL..."
                                />
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        const newSocials = footerData.socials.filter((_, i) => i !== index);
                                        setFooterData({ ...footerData, socials: newSocials });
                                    }}
                                >
                                    <Trash2 size={16} color="#f43f5e" />
                                </button>
                            </div>
                        ))}
                        <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                            onClick={() => setFooterData({ ...footerData, socials: [...footerData.socials, { platform: 'facebook', url: '' }] })}
                        >
                            <Plus size={14} style={{ marginRight: '5px' }} /> {t('add')}
                        </button>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{t('quickLinks')}</label>
                        {footerData.quickLinks.map((link, index) => (
                            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <input
                                    className="card"
                                    style={{ flex: 1, border: '1px solid var(--card-border)' }}
                                    value={link.text}
                                    onChange={e => {
                                        const newLinks = [...footerData.quickLinks];
                                        newLinks[index].text = e.target.value;
                                        setFooterData({ ...footerData, quickLinks: newLinks });
                                    }}
                                    placeholder={t('text')}
                                />
                                <input
                                    className="card"
                                    style={{ flex: 1, border: '1px solid var(--card-border)' }}
                                    value={link.url}
                                    onChange={e => {
                                        const newLinks = [...footerData.quickLinks];
                                        newLinks[index].url = e.target.value;
                                        setFooterData({ ...footerData, quickLinks: newLinks });
                                    }}
                                    placeholder="URL..."
                                />
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        const newLinks = footerData.quickLinks.filter((_, i) => i !== index);
                                        setFooterData({ ...footerData, quickLinks: newLinks });
                                    }}
                                >
                                    <Trash2 size={16} color="#f43f5e" />
                                </button>
                            </div>
                        ))}
                        <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                            onClick={() => setFooterData({ ...footerData, quickLinks: [...footerData.quickLinks, { text: '', url: '' }] })}
                        >
                            <Plus size={14} style={{ marginRight: '5px' }} /> {t('add')}
                        </button>
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '2rem' }}
                    onClick={handleSave}
                    disabled={loading}
                >
                    {success ? <><Check size={18} /> {t('changesSaved')}</> : <><Save size={18} /> {t('saveAllChanges')}</>}
                </button>
            </div>
        </div>
    );
}
