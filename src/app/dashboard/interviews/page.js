"use client";

import { useState, useEffect } from 'react';
import styles from './interviews.module.css';
import { useLanguage } from '@/context/LanguageContext';
import { Users, HelpCircle, MessageSquareWarning, Calendar, Phone, Mail, FileText, Download, Check, X, Plus, Trash2 } from 'lucide-react';

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
    const [contentForm, setContentForm] = useState({ text: '' });
    
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
                body: JSON.stringify({ type, text: contentForm.text })
            });
            setContentForm({ text: '' });
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
        setAssignedQ(cand.questions || []);
        setAssignedR(cand.remarks || []);
    };
    
    const saveCandidateSetup = async () => {
         try {
             await fetch(`/api/admin/interviews/${selectedCandidate._id}`, {
                 method: 'PUT',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ questions: assignedQ, remarks: assignedR })
             });
             alert('Configuration sauvegardée.');
             setSelectedCandidate(null);
             fetchData();
         } catch(err) { alert('Erreur'); }
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
        // En front, imprimer l'interface
        window.print();
    };

    if (loading) return <div className={styles.container}><h3>Chargement...</h3></div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}><Users size={28} /> Gestion des Entretiens</h1>
            </div>

            <div className={styles.tabs}>
                <button className={`${styles.tabBtn} ${activeTab === 'candidates' ? styles.active : ''}`} onClick={() => setActiveTab('candidates')}>
                    <Users size={18}/> Candidats
                </button>
                <button className={`${styles.tabBtn} ${activeTab === 'questions' ? styles.active : ''}`} onClick={() => setActiveTab('questions')}>
                    <HelpCircle size={18}/> Questions Prédéfinies
                </button>
                <button className={`${styles.tabBtn} ${activeTab === 'remarks' ? styles.active : ''}`} onClick={() => setActiveTab('remarks')}>
                    <MessageSquareWarning size={18}/> Remarques Prédéfinies
                </button>
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'questions' && (
                    <div className={styles.card}>
                        <h3>Ajouter une question prédéfinie</h3>
                        <form onSubmit={(e) => handleAddContent(e, 'question')} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <input type="text" className={styles.input} value={contentForm.text} onChange={e => setContentForm({text: e.target.value})} required placeholder="Ex: Pourquoi voulez-vous nous rejoindre ?" />
                            <button className="btn btn-primary" type="submit"><Plus size={18}/></button>
                        </form>
                        <div className={styles.list}>
                            {globalQuestions.map(q => (
                                <div key={q._id} className={styles.listItem}>
                                    <span>{q.text}</span>
                                    <button onClick={() => handleDeleteContent(q._id)} className={styles.deleteBtn}><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'remarks' && (
                     <div className={styles.card}>
                     <h3>Ajouter une remarque prédéfinie</h3>
                     <form onSubmit={(e) => handleAddContent(e, 'remark')} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                         <input type="text" className={styles.input} value={contentForm.text} onChange={e => setContentForm({text: e.target.value})} required placeholder="Ex: Vous êtes tenu d'assister à toutes les réunions." />
                         <button className="btn btn-primary" type="submit"><Plus size={18}/></button>
                     </form>
                     <div className={styles.list}>
                         {globalRemarks.map(r => (
                             <div key={r._id} className={styles.listItem}>
                                 <span>{r.text}</span>
                                 <button onClick={() => handleDeleteContent(r._id)} className={styles.deleteBtn}><Trash2 size={16}/></button>
                             </div>
                         ))}
                     </div>
                 </div>
                )}

                {activeTab === 'candidates' && (
                    <div className={styles.grid}>
                        {candidates.map(cand => (
                            <div key={cand._id} className={styles.candidateCard} onClick={() => openCandidateModal(cand)}>
                                <div className={styles.candHeader}>
                                    <h4>{cand.firstName} {cand.lastName}</h4>
                                    <span className={styles.badge} style={{background: cand.status === 'completed' ? '#10b981' : (cand.status === 'in-progress' ? '#f59e0b' : '#3b82f6')}}>
                                        {cand.status}
                                    </span>
                                </div>
                                <div className={styles.candDetails}>
                                    <p><Calendar size={14}/> {new Date(cand.interviewDate).toLocaleString()}</p>
                                    <p><FileText size={14}/> Code: {cand.code}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Candidate Modal */}
            {selectedCandidate && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modalContent} exportable-area`}>
                        <div className={`${styles.modalHeader} no-print`}>
                            <h2>Dossier Candidat</h2>
                            <button className={styles.closeBtn} onClick={() => setSelectedCandidate(null)}><X size={24}/></button>
                        </div>
                        
                        <div className={styles.modalBody}>
                            {/* Information Area */}
                            <div className={styles.candInfoBox}>
                                <h2>{selectedCandidate.firstName} {selectedCandidate.lastName}</h2>
                                <div className={styles.infoGrid}>
                                    <p><Phone size={16}/> {selectedCandidate.phone}</p>
                                    <p><Mail size={16}/> {selectedCandidate.email}</p>
                                    <p><Calendar size={16}/> {new Date(selectedCandidate.interviewDate).toLocaleString()}</p>
                                    <p><FileText size={16}/> Code Salle: <strong>{selectedCandidate.code}</strong></p>
                                    <p><Check size={16}/> Règles conformées: {selectedCandidate.rulesConfirmed ? <span style={{color:'#10b981'}}>Oui</span> : <span style={{color:'#f43f5e'}}>Non</span>}</p>
                                </div>
                            </div>

                            {selectedCandidate.status === 'completed' ? (
                                /* View Mode (Completed) */
                                <div>
                                    <h3 style={{marginTop: '20px', color: '#60a5fa'}}>Questions & Réponses</h3>
                                    <div className={styles.qaList}>
                                        {selectedCandidate.questions.map((q, idx) => (
                                            <div key={idx} className={styles.qaItem}>
                                                <div className={styles.qText}><strong>Q:</strong> {q.text}</div>
                                                <div className={styles.aText}><strong>R:</strong> {q.answer || <em>[Pas de réponse]</em>}</div>
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
                                    <p className={styles.helpTxt}>Configurez les questions et remarques pour l'entretien.</p>
                                    
                                    <div className={styles.splitSetup}>
                                        <div className={styles.setupCol}>
                                            <h4 style={{color:'#60a5fa'}}>Questions (À poser)</h4>
                                            <div className={styles.assignedBox}>
                                                {assignedQ.map((q, i) => (
                                                    <div key={i} className={styles.setupItem}>
                                                        <span>{q.text}</span>
                                                        <button onClick={()=>removeAssignedQ(i)}><X size={14}/></button>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div style={{marginTop: '10px'}}>
                                                <label style={{fontSize:'0.8rem'}}>Depuis Liste Prédéfinie :</label>
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
                                            <h4 style={{color:'#f59e0b'}}>Remarques (À afficher)</h4>
                                            <div className={styles.assignedBox}>
                                                {assignedR.map((r, i) => (
                                                    <div key={i} className={styles.setupItem}>
                                                        <span>{r.text}</span>
                                                        <button onClick={()=>removeAssignedR(i)}><X size={14}/></button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div style={{marginTop: '10px'}}>
                                                <label style={{fontSize:'0.8rem'}}>Depuis Liste Prédéfinie :</label>
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
