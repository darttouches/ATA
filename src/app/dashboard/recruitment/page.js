"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Settings, Save, Plus, Edit, Trash2, Calendar, AlertCircle, UserPlus, X } from 'lucide-react';
import styles from './recruitment.module.css';

export default function RecruitmentManagement() {
    const { language, t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Recruitment Settings
    const [recruitmentSettings, setRecruitmentSettings] = useState({
        isOpen: true,
        startDate: '',
        endDate: ''
    });

    // Rules
    const [rules, setRules] = useState([]);
    const [editingRule, setEditingRule] = useState(null);
    const [ruleForm, setRuleForm] = useState({
        category: '',
        fullText: { ar: '', fr: '', en: '' },
        shortTextToType: { ar: '', fr: '', en: '' },
        isActive: true
    });
    const [showRuleModal, setShowRuleModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [settingsRes, rulesRes] = await Promise.all([
                fetch('/api/admin/settings'),
                fetch('/api/onboarding/rules')
            ]);

            if (settingsRes.ok) {
                const data = await settingsRes.json();
                if (data.recruitment) {
                    setRecruitmentSettings({
                        isOpen: data.recruitment.isOpen !== undefined ? data.recruitment.isOpen : true,
                        startDate: data.recruitment.startDate || '',
                        endDate: data.recruitment.endDate || ''
                    });
                }
            }

            if (rulesRes.ok) {
                const data = await rulesRes.json();
                if (data.success) {
                    setRules(data.data);
                }
            }
        } catch (err) {
            setError(t('error') || 'Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccessMsg(null);

            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recruitment: recruitmentSettings })
            });

            if (!res.ok) throw new Error('Erreur lors de la sauvegarde');
            
            setSuccessMsg('Paramètres de recrutement sauvegardés avec succès !');
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleOpenRuleModal = (rule = null) => {
        if (rule) {
            setEditingRule(rule);
            setRuleForm({
                category: rule.category || '',
                fullText: { ar: rule.fullText?.ar || '', fr: rule.fullText?.fr || '', en: rule.fullText?.en || '' },
                shortTextToType: { ar: rule.shortTextToType?.ar || '', fr: rule.shortTextToType?.fr || '', en: rule.shortTextToType?.en || '' },
                isActive: rule.isActive
            });
        } else {
            setEditingRule(null);
            setRuleForm({
                category: '',
                fullText: { ar: '', fr: '', en: '' },
                shortTextToType: { ar: '', fr: '', en: '' },
                isActive: true
            });
        }
        setShowRuleModal(true);
    };

    const handleSaveRule = async (e) => {
        e.preventDefault();
        try {
            const isEditing = !!editingRule;
            const url = isEditing 
                ? `/api/admin/rules/${editingRule._id}`
                : `/api/onboarding/rules`;
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ruleForm)
            });

            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Erreur lors de la sauvegarde de la règle');

            setShowRuleModal(false);
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteRule = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) return;

        try {
            const res = await fetch(`/api/admin/rules/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Erreur lors de la suppression');
            
            fetchData();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className={styles.loading}>Chargement...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    <UserPlus size={28} style={{ color: 'var(--primary)' }} />
                    Gestion du Recrutement
                </h1>
                <p className={styles.subtitle}>Définissez la période de recrutement et gérez les règles d'adhésion.</p>
            </div>

            {error && <div className={styles.error}><AlertCircle size={18} /> {error}</div>}
            {successMsg && <div className={styles.success}>{successMsg}</div>}

            <div className={styles.grid}>
                {/* SETTINGS CARD */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}><Calendar size={20} /> Période de Recrutement</h2>
                    </div>
                    
                    <div className={styles.cardBody}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Statut du Recrutement</label>
                            <div className={styles.toggleGroup}>
                                <label className={styles.toggle}>
                                    <input 
                                        type="checkbox" 
                                        checked={recruitmentSettings.isOpen}
                                        onChange={(e) => setRecruitmentSettings({...recruitmentSettings, isOpen: e.target.checked})}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                                <span>{recruitmentSettings.isOpen ? 'Ouvert' : 'Fermé'}</span>
                            </div>
                            <p className={styles.helpText}>Si fermé, le bouton "Faire une demande d'adhésion" sera masqué pour les utilisateurs.</p>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Date de début</label>
                                <input 
                                    type="date"
                                    className={styles.input}
                                    value={recruitmentSettings.startDate ? recruitmentSettings.startDate.substring(0,10) : ''}
                                    onChange={(e) => setRecruitmentSettings({...recruitmentSettings, startDate: e.target.value})}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Date de fin</label>
                                <input 
                                    type="date"
                                    className={styles.input}
                                    value={recruitmentSettings.endDate ? recruitmentSettings.endDate.substring(0,10) : ''}
                                    onChange={(e) => setRecruitmentSettings({...recruitmentSettings, endDate: e.target.value})}
                                />
                            </div>
                        </div>

                        <button 
                            className="btn btn-primary" 
                            style={{width: '100%', marginTop: '1rem'}}
                            onClick={handleSaveSettings}
                            disabled={saving}
                        >
                            <Save size={18} /> {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
                        </button>
                    </div>
                </div>

                {/* RULES CARD */}
                <div className={styles.card}>
                    <div className={styles.cardHeader} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <h2 className={styles.cardTitle}><Settings size={20} /> Règles d'Adhésion</h2>
                        <button className="btn btn-primary btn-sm" onClick={() => handleOpenRuleModal()}>
                            <Plus size={16} /> Ajouter une Règle
                        </button>
                    </div>
                    
                    <div className={styles.cardBody}>
                        {rules.length === 0 ? (
                            <div className={styles.emptyState}>Aucune règle configurée.</div>
                        ) : (
                            <ul className={styles.rulesList}>
                                {rules.map(rule => (
                                    <li key={rule._id} className={styles.ruleItem}>
                                        <div className={styles.ruleContent}>
                                            <div className={styles.ruleCategory}>{rule.category}</div>
                                            <div className={styles.ruleText}>{rule.fullText?.fr || rule.fullText?.ar}</div>
                                            {!rule.isActive && <span className={styles.badge}>Inactif</span>}
                                        </div>
                                        <div className={styles.ruleActions}>
                                            <button className={styles.actionBtn} onClick={() => handleOpenRuleModal(rule)}>
                                                <Edit size={16} />
                                            </button>
                                            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDeleteRule(rule._id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* RULE MODAL */}
            {showRuleModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>{editingRule ? 'Modifier la Règle' : 'Ajouter une Règle'}</h2>
                            <button className={styles.closeBtn} onClick={() => setShowRuleModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveRule} className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Catégorie / Titre</label>
                                <input 
                                    type="text" 
                                    className={styles.input} 
                                    required 
                                    value={ruleForm.category}
                                    onChange={e => setRuleForm({...ruleForm, category: e.target.value})}
                                />
                            </div>
                            
                            <h4>Texte Complet (Full Text)</h4>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Français</label>
                                <textarea className={styles.textarea} value={ruleForm.fullText.fr} onChange={e => setRuleForm({...ruleForm, fullText: {...ruleForm.fullText, fr: e.target.value}})}></textarea>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Arabe (Obligatoire)</label>
                                <textarea className={styles.textarea} required value={ruleForm.fullText.ar} onChange={e => setRuleForm({...ruleForm, fullText: {...ruleForm.fullText, ar: e.target.value}})} dir="rtl"></textarea>
                            </div>

                            <h4>Texte à Taper (Test Bot)</h4>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Français</label>
                                <input type="text" className={styles.input} value={ruleForm.shortTextToType.fr} onChange={e => setRuleForm({...ruleForm, shortTextToType: {...ruleForm.shortTextToType, fr: e.target.value}})} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Arabe</label>
                                <input type="text" className={styles.input} value={ruleForm.shortTextToType.ar} onChange={e => setRuleForm({...ruleForm, shortTextToType: {...ruleForm.shortTextToType, ar: e.target.value}})} dir="rtl" />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.toggle}>
                                    <input 
                                        type="checkbox" 
                                        checked={ruleForm.isActive}
                                        onChange={(e) => setRuleForm({...ruleForm, isActive: e.target.checked})}
                                    />
                                    <span className={styles.slider}></span>
                                    <span style={{marginLeft: '10px'}}>Active</span>
                                </label>
                            </div>

                            <div className={styles.modalFooter}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowRuleModal(false)}>Annuler</button>
                                <button type="submit" className="btn btn-primary">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
