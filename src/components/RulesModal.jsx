"use client";

import { useState, useEffect, useMemo } from 'react';
import { BookOpen, Search, X, Plus, Edit2, Trash2, Globe, Shield, Sparkles, CheckCircle, Scale } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function RulesModal({ isOpen, onClose, currentUser, onRulesUpdated }) {
    const { language } = useLanguage();
    const [activeLang, setActiveLang] = useState(language || 'fr');
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Admin edit/create form state
    const [showAdminForm, setShowAdminForm] = useState(false);
    const [editingRuleId, setEditingRuleId] = useState(null);
    const [ruleForm, setRuleForm] = useState({
        category: 'Général',
        fullText: { fr: '', ar: '', en: '' },
        shortTextToType: { fr: '', ar: '', en: '' },
        isActive: true
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (language) setActiveLang(language);
    }, [language]);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/onboarding/rules');
            const data = await res.json();
            if (data.success) {
                setRules(data.data || []);
            }
        } catch (err) {
            console.error('Error fetching rules:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchRules();
        }
    }, [isOpen]);

    const categories = useMemo(() => {
        const cats = new Set();
        rules.forEach(r => {
            if (r.category) cats.add(r.category);
        });
        return ['all', ...Array.from(cats)];
    }, [rules]);

    const filteredRules = useMemo(() => {
        let result = rules;
        if (selectedCategory !== 'all') {
            result = result.filter(r => r.category === selectedCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(r => {
                const textFR = (r.fullText?.fr || '').toLowerCase();
                const textAR = (r.fullText?.ar || '').toLowerCase();
                const textEN = (r.fullText?.en || '').toLowerCase();
                const cat = (r.category || '').toLowerCase();
                return textFR.includes(q) || textAR.includes(q) || textEN.includes(q) || cat.includes(q);
            });
        }
        return result;
    }, [rules, selectedCategory, searchQuery]);

    const handleOpenAdminForm = (rule = null) => {
        if (rule) {
            setEditingRuleId(rule._id);
            setRuleForm({
                category: rule.category || 'Général',
                fullText: {
                    fr: rule.fullText?.fr || '',
                    ar: rule.fullText?.ar || '',
                    en: rule.fullText?.en || ''
                },
                shortTextToType: {
                    fr: rule.shortTextToType?.fr || '',
                    ar: rule.shortTextToType?.ar || '',
                    en: rule.shortTextToType?.en || ''
                },
                isActive: rule.isActive !== false
            });
        } else {
            setEditingRuleId(null);
            setRuleForm({
                category: 'Général',
                fullText: { fr: '', ar: '', en: '' },
                shortTextToType: { fr: '', ar: '', en: '' },
                isActive: true
            });
        }
        setShowAdminForm(true);
    };

    const handleSaveRule = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let res;
            if (editingRuleId) {
                res = await fetch(`/api/admin/rules/${editingRuleId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ruleForm)
                });
            } else {
                res = await fetch('/api/onboarding/rules', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ruleForm)
                });
            }
            const data = await res.json();
            if (res.ok && (data.success || data.data)) {
                setShowAdminForm(false);
                fetchRules();
                if (onRulesUpdated) onRulesUpdated();
            } else {
                alert(data.error || 'Erreur lors de la sauvegarde');
            }
        } catch (err) {
            console.error('Error saving rule:', err);
            alert('Erreur réseau');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRule = async (id) => {
        if (!confirm('Voulez-vous vraiment supprimer cette règle ?')) return;
        try {
            const res = await fetch(`/api/admin/rules/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchRules();
                if (onRulesUpdated) onRulesUpdated();
            } else {
                const data = await res.json();
                alert(data.error || 'Erreur lors de la suppression');
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!isOpen) return null;

    const isRtl = activeLang === 'ar';

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '1rem',
            backdropFilter: 'blur(10px)'
        }} onClick={onClose}>
            <div className="card" style={{
                background: '#0f172a',
                width: '100%', maxWidth: '900px', maxHeight: '90vh',
                overflowY: 'auto', position: 'relative', borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
                direction: isRtl ? 'rtl' : 'ltr'
            }} onClick={e => e.stopPropagation()}>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '24px', [isRtl ? 'left' : 'right']: '24px',
                        background: 'rgba(255,255,255,0.08)', border: 'none',
                        color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                        padding: '8px', borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <X size={20} />
                </button>

                {/* Header Banner */}
                <div style={{ marginBottom: '1.5rem', paddingRight: isRtl ? 0 : '45px', paddingLeft: isRtl ? '45px' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                            padding: '12px', borderRadius: '14px', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
                        }}>
                            <Scale size={26} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'white' }}>
                                {activeLang === 'ar' ? 'Charte & Règlement Intérieur' : activeLang === 'en' ? 'Association Rules & Regulations' : 'Charte & Règlement Intérieur'}
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)' }}>
                                {activeLang === 'ar' ? 'القواعد والإرشادات الرسمية لجمعية لمسات فنية' : activeLang === 'en' ? 'Official guidelines and principles of Touches d\'Art Association' : 'Règles et principes officiels de l\'association Touches d\'Art'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Controls Bar: Language Selector + Admin Add Button */}
                <div style={{
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
                    gap: '12px', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)',
                    padding: '12px 16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)'
                }}>
                    {/* 3-Language Tabs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Globe size={18} style={{ opacity: 0.6, [isRtl ? 'marginLeft' : 'marginRight']: '6px' }} />
                        <button
                            onClick={() => setActiveLang('fr')}
                            style={{
                                padding: '6px 16px', borderRadius: '8px', border: 'none',
                                fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                                background: activeLang === 'fr' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.06)',
                                color: 'white', transition: 'all 0.2s'
                            }}
                        >
                            🇫🇷 Français
                        </button>
                        <button
                            onClick={() => setActiveLang('ar')}
                            style={{
                                padding: '6px 16px', borderRadius: '8px', border: 'none',
                                fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                                background: activeLang === 'ar' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.06)',
                                color: 'white', transition: 'all 0.2s'
                            }}
                        >
                            🇹🇳 العربية
                        </button>
                        <button
                            onClick={() => setActiveLang('en')}
                            style={{
                                padding: '6px 16px', borderRadius: '8px', border: 'none',
                                fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                                background: activeLang === 'en' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.06)',
                                color: 'white', transition: 'all 0.2s'
                            }}
                        >
                            🇬🇧 English
                        </button>
                    </div>

                    {/* Admin Add Rule Button */}
                    {currentUser?.role === 'admin' && (
                        <button
                            onClick={() => handleOpenAdminForm()}
                            className="btn btn-primary"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                fontSize: '0.85rem', padding: '8px 16px', borderRadius: '8px',
                                background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none',
                                fontWeight: 700, cursor: 'pointer'
                            }}
                        >
                            <Plus size={16} /> Ajouter une règle
                        </button>
                    )}
                </div>

                {/* Filter and Search controls */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '1.5rem' }}>
                    <div style={{ flex: '1 1 240px', position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', top: '11px', [isRtl ? 'right' : 'left']: '12px', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                            type="text"
                            placeholder={activeLang === 'ar' ? 'بحث عن قاعدة...' : activeLang === 'en' ? 'Search for a rule...' : 'Rechercher une règle...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', background: 'rgba(17, 34, 78, 0.5)', border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white', padding: `8px 12px 8px ${isRtl ? '12px' : '36px'}`, borderRadius: '10px',
                                paddingRight: isRtl ? '36px' : '12px'
                            }}
                        />
                    </div>

                    {categories.length > 2 && (
                        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                                        fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                                        background: selectedCategory === cat ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255,255,255,0.03)',
                                        color: selectedCategory === cat ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                                        borderColor: selectedCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.1)'
                                    }}
                                >
                                    {cat === 'all' ? (activeLang === 'ar' ? 'الكل' : activeLang === 'en' ? 'All' : 'Toutes') : cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Rules List Container */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)' }}>
                        Chargement des règles...
                    </div>
                ) : filteredRules.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <BookOpen size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p style={{ margin: 0, opacity: 0.6 }}>
                            {activeLang === 'ar' ? 'لا توجد قواعد متاحة حاليا.' : activeLang === 'en' ? 'No rules found.' : 'Aucune règle disponible.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                        {filteredRules.map((rule, idx) => {
                            const text = rule.fullText?.[activeLang] || rule.fullText?.fr || rule.fullText?.ar || rule.fullText?.en || '';
                            const shortText = rule.shortTextToType?.[activeLang] || rule.shortTextToType?.fr || rule.shortTextToType?.ar || '';

                            return (
                                <div
                                    key={rule._id || idx}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                                        padding: '1.25rem 1.5rem', borderRadius: '14px',
                                        border: '1px solid rgba(255,255,255,0.08)', position: 'relative',
                                        transition: 'all 0.2s ease'
                                    }}
                                    className="hover:border-primary/50"
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{
                                                background: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa',
                                                padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem',
                                                fontWeight: 800, border: '1px solid rgba(124, 58, 237, 0.3)'
                                            }}>
                                                Règle #{idx + 1}
                                            </span>
                                            {rule.category && (
                                                <span style={{
                                                    background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8',
                                                    padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem',
                                                    fontWeight: 600
                                                }}>
                                                    {rule.category}
                                                </span>
                                            )}
                                        </div>

                                        {/* Admin action buttons */}
                                        {currentUser?.role === 'admin' && (
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button
                                                    onClick={() => handleOpenAdminForm(rule)}
                                                    style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#38bdf8', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                                                    title="Modifier"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRule(rule._id)}
                                                    style={{ background: 'rgba(244, 63, 94, 0.12)', border: 'none', color: '#f43f5e', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Main Rule Text */}
                                    <p style={{
                                        margin: '0 0 10px 0', fontSize: '0.98rem', lineHeight: '1.6',
                                        color: '#e2e8f0', fontWeight: 500
                                    }}>
                                        {text}
                                    </p>

                                    {shortText && (
                                        <div style={{
                                            fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)',
                                            background: 'rgba(0,0,0,0.2)', padding: '6px 12px',
                                            borderRadius: '8px', fontStyle: 'italic', display: 'flex',
                                            alignItems: 'center', gap: '6px'
                                        }}>
                                            <Sparkles size={12} color="#f59e0b" />
                                            <span>{shortText}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Admin Add/Edit Rule Modal Sub-Form */}
            {showAdminForm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 4000, padding: '1rem'
                }} onClick={() => setShowAdminForm(false)}>
                    <div className="card" style={{
                        width: '100%', maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto',
                        position: 'relative', background: '#1e293b', borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }} onClick={e => e.stopPropagation()}>
                        
                        <button
                            onClick={() => setShowAdminForm(false)}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                        >
                            <X size={20} />
                        </button>

                        <h3 style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Shield size={20} color="#10b981" />
                            {editingRuleId ? 'Modifier la règle' : 'Ajouter une nouvelle règle'}
                        </h3>

                        <form onSubmit={handleSaveRule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', opacity: 0.8 }}>Catégorie</label>
                                <input
                                    type="text"
                                    value={ruleForm.category}
                                    onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
                                    placeholder="Ex: Général, Membres, Clubs..."
                                    required
                                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', borderRadius: '8px' }}
                                />
                            </div>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: '#a78bfa' }}>1. Texte Intégral (3 Langues)</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <textarea
                                        rows={2}
                                        placeholder="🇫🇷 Texte en Français..."
                                        value={ruleForm.fullText.fr}
                                        onChange={(e) => setRuleForm({ ...ruleForm, fullText: { ...ruleForm.fullText, fr: e.target.value } })}
                                        required
                                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                                    />
                                    <textarea
                                        rows={2}
                                        placeholder="🇹🇳 النص باللغة العربية..."
                                        value={ruleForm.fullText.ar}
                                        onChange={(e) => setRuleForm({ ...ruleForm, fullText: { ...ruleForm.fullText, ar: e.target.value } })}
                                        required
                                        dir="rtl"
                                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                                    />
                                    <textarea
                                        rows={2}
                                        placeholder="🇬🇧 Text in English..."
                                        value={ruleForm.fullText.en}
                                        onChange={(e) => setRuleForm({ ...ruleForm, fullText: { ...ruleForm.fullText, en: e.target.value } })}
                                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                                    />
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: '#a78bfa' }}>2. Résumé / Phrase Clé (Optionnel)</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="🇫🇷 Résumé FR..."
                                        value={ruleForm.shortTextToType.fr}
                                        onChange={(e) => setRuleForm({ ...ruleForm, shortTextToType: { ...ruleForm.shortTextToType, fr: e.target.value } })}
                                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="🇹🇳 تلخيص بالعربية..."
                                        value={ruleForm.shortTextToType.ar}
                                        onChange={(e) => setRuleForm({ ...ruleForm, shortTextToType: { ...ruleForm.shortTextToType, ar: e.target.value } })}
                                        dir="rtl"
                                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="🇬🇧 English summary..."
                                        value={ruleForm.shortTextToType.en}
                                        onChange={(e) => setRuleForm({ ...ruleForm, shortTextToType: { ...ruleForm.shortTextToType, en: e.target.value } })}
                                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAdminForm(false)}
                                    className="btn btn-secondary"
                                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn btn-primary"
                                    style={{ padding: '8px 20px', fontSize: '0.85rem', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                                >
                                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
