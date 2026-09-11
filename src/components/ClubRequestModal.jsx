"use client";

import { useState, useEffect, useMemo } from 'react';
import { X, Send, MapPin, Users, Shield, User, Info, CheckCircle2, Mail, Key } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ClubRequestModal({ isOpen, onClose }) {
    const { t } = useLanguage();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        clubName: "Touches D'Art ",
        email: '',
        password: '',
        location: '',
        president: '',
        vicePresident: '',
        secretary: '',
        hr: '',
        events: '',
        communication: ''
    });

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setError(null);
            setSuccess(false);
            setFormData({
                clubName: "Touches D'Art ",
                email: '',
                password: '',
                location: '',
                president: '',
                vicePresident: '',
                secretary: '',
                hr: '',
                events: '',
                communication: ''
            });

            // Fetch all members. Assume we filter valid (active) members on the frontend or backend.
            fetch('/api/users')
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        // Filter to only include active members if the schema uses isActive
                        const activeMembers = data.data.filter(u => u.isActive === true);
                        setUsers(activeMembers);
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch users", err);
                    setError(t('errorLoadingMembers') || "Impossible de charger les membres.");
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            const nameA = `${a.firstName || ''} ${a.lastName || ''} ${a.name || ''}`.trim().toLowerCase();
            const nameB = `${b.firstName || ''} ${b.lastName || ''} ${b.name || ''}`.trim().toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }, [users]);

    // Map of roleFieldName -> label for display
    const ROLE_LABELS = {
        president: t('clubPresident') || 'Président',
        vicePresident: t('vicePresident') || 'Vice-Président',
        secretary: t('secretaryGeneral') || 'Secrétaire Général',
        hr: t('hrManager') || 'Responsable RH',
        events: t('eventsManager') || 'Responsable des Événements',
        communication: t('mediaManager') || 'Responsable Média',
    };

    const BUREAU_FIELDS = ['president', 'vicePresident', 'secretary', 'hr', 'events', 'communication'];

    // Returns the Set of userIds already assigned to OTHER roles (not the current one)
    const getUsedIdsExcept = (currentField) => {
        const used = new Set();
        for (const field of BUREAU_FIELDS) {
            if (field !== currentField && formData[field]) {
                used.add(formData[field]);
            }
        }
        return used;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Prevent removing the prefix "Touches D'Art " for clubName
        if (name === 'clubName' && !value.startsWith("Touches D'Art ")) {
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Check duplicate bureau members
        const bureauFields = ['president', 'vicePresident', 'secretary', 'hr', 'events', 'communication'];
        const selectedIds = bureauFields.map(f => formData[f]).filter(Boolean);
        const uniqueIds = new Set(selectedIds);
        if (uniqueIds.size !== selectedIds.length) {
            setError(t('errorDuplicateRole') || "Un même membre ne peut pas occuper deux postes dans le bureau. Veuillez corriger votre sélection.");
            return;
        }

        if (!formData.clubName || formData.clubName.trim() === "Touches D'Art" || !formData.email || !formData.password || !formData.location || !formData.president || !formData.vicePresident || !formData.secretary || !formData.hr || !formData.events || !formData.communication) {
            setError(t('errorCompleteFields') || "Veuillez remplir tous les champs et sélectionner un membre pour chaque poste.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/clubs/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            
            if (data.success) {
                setSuccess(true);
            } else {
                setError(data.error || t('errorSubmitRequest') || "Une erreur est survenue lors de l'envoi de la demande.");
            }
        } catch (err) {
            setError(t('errorSubmitRequest') || "Une erreur est survenue lors de l'envoi de la demande.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '1rem',
            backdropFilter: 'blur(8px)'
        }} onClick={onClose}>
            <div className="card" style={{
                background: '#0f172a',
                width: '100%', maxWidth: '700px', maxHeight: '90vh',
                overflowY: 'auto', position: 'relative', borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '2rem'
            }} onClick={e => e.stopPropagation()}>
                
                <button 
                    onClick={onClose}
                    style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                >
                    <X size={24} />
                </button>

                <h2 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', fontWeight: 800 }}>
                    <Shield size={28} color="#7c3aed" />
                    {t('clubRequestTitle') || "Demande d'Activité de Club"}
                </h2>

                {success ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                        <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 0 1rem 0' }} />
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{t('requestSubmittedSuccess') || "Demande soumise avec succès !"}</h3>
                        <p style={{ opacity: 0.8, marginBottom: '2rem', lineHeight: 1.6 }}>
                            {t('requestSubmittedDesc') || "Votre demande a bien été envoyée au bureau national pour approbation. Vous serez notifié dès qu'elle sera traitée."}
                        </p>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                                color: 'white', padding: '12px 32px', borderRadius: '12px', border: 'none',
                                fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            {t('close') || "Fermer"}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        <div style={{
                            background: 'rgba(124, 58, 237, 0.1)', padding: '1rem',
                            borderRadius: '12px', border: '1px solid rgba(124, 58, 237, 0.2)',
                            display: 'flex', gap: '12px', alignItems: 'flex-start'
                        }}>
                            <Info size={20} color="#a78bfa" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: t('allMembersMustBeValid') || 'Tous les membres du bureau ajoutés ci-dessous doivent <strong>obligatoirement être adhérents en cours de validité</strong> pour cette saison associative.' }}>
                            </p>
                        </div>

                        {error && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                                {error}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Shield size={18} color="#a78bfa" />
                                    {t('clubNameLabel') || "Nom du Club"} <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="clubName"
                                    value={formData.clubName}
                                    onChange={handleChange}
                                    placeholder={`Touches D'Art [${t('clubLabel') || 'Votre établissement'}]`}
                                    style={{
                                        background: 'rgba(17, 34, 78, 0.5)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white', padding: '12px', borderRadius: '10px', fontSize: '0.95rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MapPin size={18} color="#a78bfa" />
                                    {t('activityLocation') || "Lieu d'Activité"} <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="Ex: École Nationale de Commerce, etc."
                                    style={{
                                        background: 'rgba(17, 34, 78, 0.5)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white', padding: '12px', borderRadius: '10px', fontSize: '0.95rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Mail size={18} color="#a78bfa" />
                                    {t('clubEmailText') || "Email du Club"} <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="contact@touchesdart.com"
                                    style={{
                                        background: 'rgba(17, 34, 78, 0.5)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white', padding: '12px', borderRadius: '10px', fontSize: '0.95rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Key size={18} color="#a78bfa" />
                                    {t('suggestedPassword') || "Mot de passe suggéré"} <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Min. 8 caractères"
                                    style={{
                                        background: 'rgba(17, 34, 78, 0.5)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white', padding: '12px', borderRadius: '10px', fontSize: '0.95rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '0.5rem'
                        }}>
                            
                            {[
                                { name: 'president', label: t('president') || 'Président du Club', icon: <User size={16} /> },
                                { name: 'vicePresident', label: t('vicePresident') || 'Vice-Président', icon: <User size={16} /> },
                                { name: 'secretary', label: t('secretaryGeneral') || 'Secrétaire Général', icon: <User size={16} /> },
                                { name: 'hr', label: t('hrManager') || 'Responsable RH', icon: <Users size={16} /> },
                                { name: 'events', label: t('eventsManager') || 'Responsable des Événements', icon: <User size={16} /> },
                                { name: 'communication', label: t('mediaManager') || 'Responsable Média', icon: <User size={16} /> },
                            ].map((role) => (
                                <div key={role.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.8)' }}>
                                        {role.icon} {role.label} <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <select
                                        name={role.name}
                                        value={formData[role.name]}
                                        onChange={handleChange}
                                        style={{
                                            background: 'rgba(17, 34, 78, 0.5)', border: `1px solid ${formData[role.name] ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                            color: 'white', padding: '10px 12px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none'
                                        }}
                                        disabled={loading}
                                    >
                                        <option value="" disabled>{t('selectMemberMenu') || '-- Sélectionner un adhérent --'}</option>
                                        {sortedUsers.filter(u => {
                                            // Always show the currently selected member for this role
                                            if (u._id === formData[role.name]) return true;
                                            // Hide members already assigned to another role
                                            const usedIds = getUsedIdsExcept(role.name);
                                            return !usedIds.has(u._id);
                                        }).map(u => (
                                            <option
                                                key={u._id}
                                                value={u._id}
                                                style={{ color: 'white', background: '#0f172a' }}
                                            >
                                                {u.firstName || u.name} {u.lastName || ''}
                                                {u.memberNumber ? ` (N°${u.memberNumber})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}

                        </div>

                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    background: 'transparent', color: 'rgba(255,255,255,0.7)',
                                    padding: '12px 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                {t('cancel') || 'Annuler'}
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || loading}
                                style={{
                                    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                                    color: 'white', padding: '12px 32px', borderRadius: '12px', border: 'none',
                                    fontWeight: 700, cursor: submitting || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                    opacity: submitting || loading ? 0.7 : 1, boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)'
                                }}
                            >
                                {submitting ? (t('sending') || 'Envoi...') : (
                                    <>
                                        <Send size={18} /> {t('submitRequest') || 'Soumettre la demande'}
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                )}

            </div>
        </div>
    );
}
