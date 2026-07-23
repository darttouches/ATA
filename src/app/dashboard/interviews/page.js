"use client";

import { useState, useEffect } from 'react';
import styles from './interviews.module.css';
import { useLanguage } from '@/context/LanguageContext';
import { Users, HelpCircle, MessageSquareWarning, Calendar, Phone, Mail, FileText, Download, Check, X, Plus, Trash2, Star, RefreshCw, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';

export default function InterviewsManagement() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('candidates');
    const [loading, setLoading] = useState(true);
    
    // Data
    const [candidates, setCandidates] = useState([]);
    const [globalQuestions, setGlobalQuestions] = useState([]);
    const [globalRemarks, setGlobalRemarks] = useState([]);
    
    // Modals & Forms
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [contentForm, setContentForm] = useState({ text: '', isDefault: true });
    
    // Specific assigning
    const [assignedQ, setAssignedQ] = useState([]);
    const [assignedR, setAssignedR] = useState([]);
    const [customQuestionText, setCustomQuestionText] = useState('');
    const [customRemarkText, setCustomRemarkText] = useState('');
    
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [candRes, contRes] = await Promise.all([
                fetch('/api/admin/interviews'),
                fetch('/api/admin/interviews/content')
            ]);
            const [candData, contData] = await Promise.all([
                candRes.ok ? candRes.json() : null,
                contRes.ok ? contRes.json() : null
            ]);
            if (candData?.success) setCandidates(candData.data);
            if (contData?.success) {
                setGlobalQuestions(contData.data.filter(c => c.type === 'question'));
                setGlobalRemarks(contData.data.filter(c => c.type === 'remark'));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddContent = async (e, type) => {
        e.preventDefault();
        try {
            await fetch('/api/admin/interviews/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, text: contentForm.text, isDefault: contentForm.isDefault })
            });
            setContentForm({ text: '', isDefault: true });
            fetchData();
        } catch (err) { alert(err.message); }
    };

    const handleToggleDefault = async (id, currentIsDefault) => {
        try {
            await fetch(`/api/admin/interviews/content/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isDefault: !currentIsDefault })
            });
            fetchData();
        } catch (err) { alert(err.message); }
    };

    const handleDeleteContent = async (id) => {
        if (!confirm('Supprimer cet élément ?')) return;
        try {
            await fetch(`/api/admin/interviews/content/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (err) { alert(err.message); }
    };

    const openCandidateModal = (cand) => {
        setSelectedCandidate(cand);
        // If candidate has no questions/remarks yet, prefill from active defaults
        let q = cand.questions || [];
        let r = cand.remarks || [];

        if (q.length === 0 && globalQuestions.length > 0) {
            q = globalQuestions.filter(gq => gq.isDefault !== false).map(gq => ({ originalId: gq._id, text: gq.text }));
        }
        if (r.length === 0 && globalRemarks.length > 0) {
            r = globalRemarks.filter(gr => gr.isDefault !== false).map(gr => ({ text: gr.text }));
        }

        setAssignedQ(q);
        setAssignedR(r);
    };
    
    const loadDefaultsIntoCandidate = () => {
        const defaultQ = globalQuestions.filter(gq => gq.isDefault !== false).map(gq => ({ originalId: gq._id, text: gq.text }));
        const defaultR = globalRemarks.filter(gr => gr.isDefault !== false).map(gr => ({ text: gr.text }));
        setAssignedQ(defaultQ);
        setAssignedR(defaultR);
    };

    const saveCandidateSetup = async () => {
         try {
             await fetch(`/api/admin/interviews/${selectedCandidate._id}`, {
                 method: 'PUT',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ questions: assignedQ, remarks: assignedR })
             });
             alert('Configuration sauvegardée avec succès !');
             setSelectedCandidate(null);
             fetchData();
         } catch(err) { alert('Erreur lors de la sauvegarde'); }
    };

    const handleCandidateDecision = async (candId, newDecision) => {
        if (!candId) {
            alert("Erreur: Identifiant du candidat introuvable.");
            return;
        }
        try {
            const res = await fetch(`/api/admin/interviews/${candId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    decision: newDecision,
                    decisionDate: new Date()
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(`Décision enregistrée avec succès : Candidat ${newDecision === 'accepted' ? 'ACCEPTÉ (Code activé pour inscription)' : 'REFUSÉ'}`);
                setSelectedCandidate(data.data);
                fetchData();
            } else {
                alert(data.error || 'Erreur lors de la mise à jour de la décision');
            }
        } catch (err) {
            console.error('Error updating candidate decision:', err);
            alert('Erreur: ' + err.message);
        }
    };

    const handleAddGlobalQuestionToCandidate = (gq) => {
        setAssignedQ([...assignedQ, { originalId: gq._id, text: gq.text }]);
    };
    const handleAddGlobalRemarkToCandidate = (gr) => {
        setAssignedR([...assignedR, { text: gr.text }]);
    };
    const handleAddCustomQuestion = () => {
        if (!customQuestionText) return;
        setAssignedQ([...assignedQ, { text: customQuestionText }]);
        setCustomQuestionText('');
    };
    const handleAddCustomRemark = () => {
        if (!customRemarkText) return;
        setAssignedR([...assignedR, { text: customRemarkText }]);
        setCustomRemarkText('');
    };

    const removeAssignedQ = (idx) => setAssignedQ(assignedQ.filter((_, i) => i !== idx));
    const removeAssignedR = (idx) => setAssignedR(assignedR.filter((_, i) => i !== idx));

    const exportPDF = () => {
        window.print();
    };

    if (loading) return <div className={styles.container}><h3>Chargement des entretiens...</h3></div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}><Users size={28} /> Gestion des Entretiens</h1>
            </div>

            <div className={styles.tabs}>
                <button className={`${styles.tabBtn} ${activeTab === 'candidates' ? styles.active : ''}`} onClick={() => setActiveTab('candidates')}>
                    <Users size={18}/> Candidats ({candidates.length})
                </button>
                <button className={`${styles.tabBtn} ${activeTab === 'questions' ? styles.active : ''}`} onClick={() => setActiveTab('questions')}>
                    <HelpCircle size={18}/> Questions Prédéfinies ({globalQuestions.length})
                </button>
                <button className={`${styles.tabBtn} ${activeTab === 'remarks' ? styles.active : ''}`} onClick={() => setActiveTab('remarks')}>
                    <MessageSquareWarning size={18}/> Remarques Prédéfinies ({globalRemarks.length})
                </button>
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'questions' && (
                    <div className={styles.card}>
                        <h3>Ajouter une question prédéfinie</h3>
                        <form onSubmit={(e) => handleAddContent(e, 'question')} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="text" className={styles.input} value={contentForm.text} onChange={e => setContentForm({...contentForm, text: e.target.value})} required placeholder="Ex: Pourquoi voulez-vous rejoindre l'association ATA ?" />
                                <button className="btn btn-primary" type="submit" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Plus size={18}/> Ajouter
                                </button>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                <input 
                                    type="checkbox" 
                                    checked={contentForm.isDefault} 
                                    onChange={e => setContentForm({...contentForm, isDefault: e.target.checked})} 
                                />
                                <span>⭐ Définir par défaut (Posée automatiquement dans TOUS les nouveaux entretiens)</span>
                            </label>
                        </form>
                        <div className={styles.list}>
                            {globalQuestions.length === 0 ? (
                                <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aucune question prédéfinie enregistrée.</p>
                            ) : (
                                globalQuestions.map(q => (
                                    <div key={q._id} className={styles.listItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                            <button 
                                                onClick={() => handleToggleDefault(q._id, q.isDefault !== false)}
                                                style={{
                                                    background: q.isDefault !== false ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)',
                                                    border: `1px solid ${q.isDefault !== false ? '#fbbf24' : 'rgba(255,255,255,0.2)'}`,
                                                    color: q.isDefault !== false ? '#fbbf24' : '#94a3b8',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                                title="Cliquer pour basculer l'état par défaut"
                                            >
                                                <Star size={14} fill={q.isDefault !== false ? '#fbbf24' : 'none'} />
                                                {q.isDefault !== false ? 'Par défaut' : 'Définir par défaut'}
                                            </button>
                                            <span style={{ fontSize: '0.95rem' }}>{q.text}</span>
                                        </div>
                                        <button onClick={() => handleDeleteContent(q._id)} className={styles.deleteBtn}><Trash2 size={16}/></button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'remarks' && (
                    <div className={styles.card}>
                        <h3>Ajouter une remarque / conseil prédéfini</h3>
                        <form onSubmit={(e) => handleAddContent(e, 'remark')} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="text" className={styles.input} value={contentForm.text} onChange={e => setContentForm({...contentForm, text: e.target.value})} required placeholder="Ex: Vous êtes tenu d'assister aux réunions mensuelles." />
                                <button className="btn btn-primary" type="submit" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Plus size={18}/> Ajouter
                                </button>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                <input 
                                    type="checkbox" 
                                    checked={contentForm.isDefault} 
                                    onChange={e => setContentForm({...contentForm, isDefault: e.target.checked})} 
                                />
                                <span>⭐ Définir par défaut (Affichée automatiquement dans TOUS les nouveaux entretiens)</span>
                            </label>
                        </form>
                        <div className={styles.list}>
                            {globalRemarks.length === 0 ? (
                                <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aucune remarque prédéfinie enregistrée.</p>
                            ) : (
                                globalRemarks.map(r => (
                                    <div key={r._id} className={styles.listItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                            <button 
                                                onClick={() => handleToggleDefault(r._id, r.isDefault !== false)}
                                                style={{
                                                    background: r.isDefault !== false ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)',
                                                    border: `1px solid ${r.isDefault !== false ? '#fbbf24' : 'rgba(255,255,255,0.2)'}`,
                                                    color: r.isDefault !== false ? '#fbbf24' : '#94a3b8',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                                title="Cliquer pour basculer l'état par défaut"
                                            >
                                                <Star size={14} fill={r.isDefault !== false ? '#fbbf24' : 'none'} />
                                                {r.isDefault !== false ? 'Par défaut' : 'Définir par défaut'}
                                            </button>
                                            <span style={{ fontSize: '0.95rem' }}>{r.text}</span>
                                        </div>
                                        <button onClick={() => handleDeleteContent(r._id)} className={styles.deleteBtn}><Trash2 size={16}/></button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'candidates' && (
                    <div className={styles.grid}>
                        {candidates.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aucun candidat en attente d'entretien.</p>
                        ) : (
                            candidates.map(cand => (
                                <div key={cand._id} className={styles.candidateCard} onClick={() => openCandidateModal(cand)}>
                                    <div className={styles.candHeader}>
                                        <h4>{cand.firstName} {cand.lastName}</h4>
                                        <span className={styles.badge} style={{background: cand.status === 'completed' ? '#10b981' : (cand.status === 'in-progress' ? '#f59e0b' : '#3b82f6')}}>
                                            {cand.status === 'completed' ? 'Entretien Réalisé' : (cand.status === 'in-progress' ? 'En cours' : 'En attente')}
                                        </span>
                                    </div>
                                    <div className={styles.candDetails}>
                                        <p><Calendar size={14}/> {new Date(cand.interviewDate).toLocaleString('fr-FR')}</p>
                                        <p><FileText size={14}/> Code: <strong>{cand.code}</strong></p>
                                        
                                        {/* DECISION BADGE */}
                                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            {cand.decision === 'accepted' ? (
                                                <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <CheckCircle2 size={14} /> Accepté (Code Validé)
                                                </span>
                                            ) : cand.decision === 'rejected' ? (
                                                <span style={{ color: '#f43f5e', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <XCircle size={14} /> Refusé
                                                </span>
                                            ) : (
                                                <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={14} /> Décision En attente
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Candidate Modal */}
            {selectedCandidate && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modalContent} exportable-area`} style={{ maxWidth: '800px' }}>
                        <div className={`${styles.modalHeader} no-print`}>
                            <h2>Dossier d'Entretien Candidat (Saison 2026/2027)</h2>
                            <button className={styles.closeBtn} onClick={() => setSelectedCandidate(null)}><X size={24}/></button>
                        </div>
                        
                        <div className={styles.modalBody}>
                            {/* Information Area */}
                            <div className={styles.candInfoBox}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                                    <h2>{selectedCandidate.firstName} {selectedCandidate.lastName}</h2>
                                    <div>
                                        {selectedCandidate.decision === 'accepted' ? (
                                            <span style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                <CheckCircle2 size={16} /> Candidat Accepté (Code Validé pour Inscription)
                                            </span>
                                        ) : selectedCandidate.decision === 'rejected' ? (
                                            <span style={{ background: 'rgba(244, 63, 94, 0.2)', border: '1px solid #f43f5e', color: '#f43f5e', padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                <XCircle size={16} /> Candidature Refusée
                                            </span>
                                        ) : (
                                            <span style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#f59e0b', padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock size={16} /> Décision en Attente
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.infoGrid} style={{ marginTop: '1rem' }}>
                                    <p><Phone size={16}/> {selectedCandidate.phone}</p>
                                    <p><Mail size={16}/> {selectedCandidate.email}</p>
                                    <p><Calendar size={16}/> {new Date(selectedCandidate.interviewDate).toLocaleString('fr-FR')}</p>
                                    <p><FileText size={16}/> Code Salle: <strong>{selectedCandidate.code}</strong></p>
                                    <p><Check size={16}/> Règles conformées: {selectedCandidate.rulesConfirmed ? <span style={{color:'#10b981', fontWeight: 600}}>Oui</span> : <span style={{color:'#f43f5e', fontWeight: 600}}>Non</span>}</p>
                                </div>
                            </div>

                            {/* DECISION ACTION BUTTONS PANEL */}
                            <div className="no-print" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.25rem', borderRadius: '12px', margin: '1.5rem 0' }}>
                                <h3 style={{ fontSize: '1rem', color: '#cbd5e1', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ShieldCheck size={20} color="#c084fc" />
                                    <span>Décision Administrateur (Autorisation d'Inscription 2026/2027)</span>
                                </h3>
                                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                    Si vous acceptez le candidat, son code <strong>{selectedCandidate.code}</strong> sera immédiatement activé pour lui permettre de créer son compte membre officiel.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <button 
                                        type="button"
                                        onClick={() => handleCandidateDecision(selectedCandidate._id, 'accepted')}
                                        className="btn btn-success"
                                        style={{ 
                                            padding: '0.75rem', 
                                            justifyContent: 'center', 
                                            background: selectedCandidate.decision === 'accepted' ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
                                            borderColor: '#10b981',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '0.95rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <CheckCircle2 size={18} /> Accepter le Candidat
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => handleCandidateDecision(selectedCandidate._id, 'rejected')}
                                        className="btn btn-danger"
                                        style={{ 
                                            padding: '0.75rem', 
                                            justifyContent: 'center', 
                                            background: selectedCandidate.decision === 'rejected' ? '#f43f5e' : 'rgba(244, 63, 94, 0.2)',
                                            borderColor: '#f43f5e',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '0.95rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <XCircle size={18} /> Refuser le Candidat
                                    </button>
                                </div>
                            </div>

                            {selectedCandidate.status === 'completed' ? (
                                /* View Mode (Completed) */
                                <div>
                                    <h3 style={{marginTop: '20px', color: '#60a5fa'}}>Questions & Réponses de l'Entretien</h3>
                                    <div className={styles.qaList}>
                                        {selectedCandidate.questions.map((q, idx) => (
                                            <div key={idx} className={styles.qaItem}>
                                                <div className={styles.qText}><strong>Q{idx + 1}:</strong> {q.text}</div>
                                                <div className={styles.aText}><strong>Réponse Candidat:</strong> {q.answer || <em style={{color: '#94a3b8'}}>[Pas de réponse]</em>}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <h3 style={{marginTop: '20px', color: '#f59e0b'}}>Remarques adressées</h3>
                                    <ul className={styles.remarkViewList}>
                                        {selectedCandidate.remarks.map((r, idx) => (
                                            <li key={idx}>{r.text}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                /* Setup Mode (Pending / In progress) */
                                <div className="no-print">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                                        <p className={styles.helpTxt} style={{ margin: 0 }}>Configurez les questions et remarques spécifiques pour cet entretien.</p>
                                        <button 
                                            onClick={loadDefaultsIntoCandidate}
                                            className="btn btn-secondary"
                                            style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <RefreshCw size={14} /> Charger les éléments par défaut
                                        </button>
                                    </div>
                                    
                                    <div className={styles.splitSetup}>
                                        <div className={styles.setupCol}>
                                            <h4 style={{color:'#60a5fa'}}>Questions (À poser lors de l'entretien)</h4>
                                            <div className={styles.assignedBox}>
                                                {assignedQ.length === 0 ? (
                                                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '10px' }}>Aucune question assignée pour l'instant.</p>
                                                ) : (
                                                    assignedQ.map((q, i) => (
                                                        <div key={i} className={styles.setupItem}>
                                                            <span>{q.text}</span>
                                                            <button onClick={()=>removeAssignedQ(i)}><X size={14}/></button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            
                                            <div style={{marginTop: '10px'}}>
                                                <label style={{fontSize:'0.8rem', color: '#94a3b8'}}>Depuis Liste Prédéfinie :</label>
                                                <div className={styles.pillList}>
                                                    {globalQuestions.map(gq => <button key={gq._id} onClick={()=>handleAddGlobalQuestionToCandidate(gq)} className={styles.pillBtn}><Plus size={12}/> {gq.text.substring(0, 30)}...</button>)}
                                                </div>
                                            </div>
                                            <div style={{marginTop: '10px', display:'flex', gap:'5px'}}>
                                                <input type="text" placeholder="Question spécifique..." className={styles.input} style={{padding:'0.5rem'}} value={customQuestionText} onChange={e=>setCustomQuestionText(e.target.value)} />
                                                <button onClick={handleAddCustomQuestion} className="btn btn-primary" style={{padding:'0.5rem'}}><Plus size={16}/></button>
                                            </div>
                                        </div>

                                        <div className={styles.setupCol}>
                                            <h4 style={{color:'#f59e0b'}}>Remarques (À afficher lors de l'entretien)</h4>
                                            <div className={styles.assignedBox}>
                                                {assignedR.length === 0 ? (
                                                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '10px' }}>Aucune remarque assignée pour l'instant.</p>
                                                ) : (
                                                    assignedR.map((r, i) => (
                                                        <div key={i} className={styles.setupItem}>
                                                            <span>{r.text}</span>
                                                            <button onClick={()=>removeAssignedR(i)}><X size={14}/></button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            <div style={{marginTop: '10px'}}>
                                                <label style={{fontSize:'0.8rem', color: '#94a3b8'}}>Depuis Liste Prédéfinie :</label>
                                                <div className={styles.pillList}>
                                                    {globalRemarks.map(gr => <button key={gr._id} onClick={()=>handleAddGlobalRemarkToCandidate(gr)} className={styles.pillBtn}><Plus size={12}/> {gr.text.substring(0, 30)}...</button>)}
                                                </div>
                                            </div>
                                            <div style={{marginTop: '10px', display:'flex', gap:'5px'}}>
                                                <input type="text" placeholder="Remarque spécifique..." className={styles.input} style={{padding:'0.5rem'}} value={customRemarkText} onChange={e=>setCustomRemarkText(e.target.value)} />
                                                <button onClick={handleAddCustomRemark} className="btn btn-warning" style={{padding:'0.5rem', background: '#f59e0b'}}><Plus size={16}/></button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button onClick={saveCandidateSetup} className="btn btn-success" style={{marginTop: '20px', width: '100%', justifyContent:'center'}}>Enregistrer la configuration</button>
                                </div>
                            )}

                        </div>
                        
                        <div className={`${styles.modalFooter} no-print`}>
                            {selectedCandidate.status === 'completed' && (
                                <button onClick={exportPDF} className="btn btn-success" style={{display: 'flex', gap:'10px', width:'100%', justifyContent:'center'}}>
                                    <Download size={18} /> Télécharger le Dossier (PDF)
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    .exportable-area, .exportable-area * { visibility: visible; }
                    .exportable-area { position: absolute; left: 0; top: 0; width: 100%; color: black !important; background: white !important;}
                    .no-print { display: none !important; }
                    .${styles.candInfoBox} { border: 1px solid #ccc; padding: 20px; color: black !important; background: white !important;}
                    .${styles.qText}, .${styles.aText} { color: black !important; }
                }
            `}</style>
        </div>
    );
}

