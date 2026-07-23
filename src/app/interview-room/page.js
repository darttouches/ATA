"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import styles from './interview.module.css';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Send, CheckCircle2, LogOut, Calendar, User, Sparkles, HelpCircle, Lock, Home, Loader2 } from 'lucide-react';
import Link from 'next/link';

function InterviewRoomContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialCodeFromUrl = searchParams.get('code') || '';

    const [candidateData, setCandidateData] = useState(null);
    const [loginCode, setLoginCode] = useState(initialCodeFromUrl.toUpperCase());
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasAttemptedUrlCode, setHasAttemptedUrlCode] = useState(false);

    // Recruitment Period State
    const [recruitmentStatus, setRecruitmentStatus] = useState({
        loading: true,
        isPeriodActive: true,
        statusMessage: ''
    });

    useEffect(() => {
        const fetchRecruitmentSettings = async () => {
            try {
                const res = await fetch('/api/admin/settings');
                if (res.ok) {
                    const data = await res.json();
                    const recruitment = data.recruitment;
                    if (recruitment) {
                        if (recruitment.isOpen === false) {
                            setRecruitmentStatus({
                                loading: false,
                                isPeriodActive: false,
                                statusMessage: "Les entretiens sont actuellement fermés par l'administration."
                            });
                            return;
                        }

                        const now = new Date();
                        let start = recruitment.startDate ? new Date(recruitment.startDate + 'T00:00:00') : null;
                        let end = recruitment.endDate ? new Date(recruitment.endDate + 'T23:59:59') : null;

                        if (start && now < start) {
                            setRecruitmentStatus({
                                loading: false,
                                isPeriodActive: false,
                                statusMessage: `La période d'inscription et d'entretien démarrera le ${start.toLocaleDateString('fr-FR')}.`
                            });
                            return;
                        }

                        if (end && now > end) {
                            setRecruitmentStatus({
                                loading: false,
                                isPeriodActive: false,
                                statusMessage: `La période d'inscription et d'entretien est actuellement clôturée (fermée depuis le ${end.toLocaleDateString('fr-FR')}).`
                            });
                            return;
                        }

                        setRecruitmentStatus({
                            loading: false,
                            isPeriodActive: true,
                            statusMessage: ''
                        });
                    } else {
                        setRecruitmentStatus({ loading: false, isPeriodActive: true, statusMessage: '' });
                    }
                } else {
                    setRecruitmentStatus(prev => ({ ...prev, loading: false }));
                }
            } catch (err) {
                console.error("Error loading settings:", err);
                setRecruitmentStatus(prev => ({ ...prev, loading: false }));
            }
        };
        fetchRecruitmentSettings();
    }, []);
    
    // Interview State
    const [candidateId, setCandidateId] = useState(null);
    const [currentStep, setCurrentStep] = useState(-1); // -1: Not started, 0..N: Questions, N+1: Remarks, N+2: Rules confirmation
    const [chatHistory, setChatHistory] = useState([]);
    const [answerText, setAnswerText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    // Voice synth & messaging ref
    const synth = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined') synth.current = window.speechSynthesis;
    }, []);

    // Auto scroll chat to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isTyping]);

    const speak = (text) => {
        if (!text) return;
        if (synth.current) {
            synth.current.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'fr-FR';
            synth.current.speak(utterance);
        }
    };

    const performLogin = async (codeToUse) => {
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/onboarding/interview/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codeToUse.trim().toUpperCase() })
            });
            const data = await res.json();
            
            if (!res.ok || !data.success) throw new Error(data.error || 'Code invalide ou introuvable');
            
            setCandidateId(data.candidateId);
            fetchCandidateData(data.candidateId);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    // Auto attempt login if code param is provided in URL
    useEffect(() => {
        if (initialCodeFromUrl && !candidateId && !hasAttemptedUrlCode) {
            setHasAttemptedUrlCode(true);
            performLogin(initialCodeFromUrl);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialCodeFromUrl]);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!loginCode.trim()) return;
        performLogin(loginCode);
    };

    const handleLogout = () => {
        setCandidateId(null);
        setCandidateData(null);
        setChatHistory([]);
        setCurrentStep(-1);
        setLoginCode('');
        setError('');
    };

    const fetchCandidateData = async (id) => {
        try {
            const res = await fetch(`/api/onboarding/interview/room?candidateId=${id}`);
            const data = await res.json();
            if (data.success) {
                setCandidateData(data.data);
                
                // Initialize interview based on status
                if (data.data.status === 'pending') {
                    // Update status to in-progress
                    await fetch('/api/onboarding/interview/room', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ candidateId: id, nextStatus: 'in-progress' })
                    });
                    
                    const welcomeMsg = `Bienvenue ${data.data.firstName} ${data.data.lastName}. Je suis le robot d'entretien ATA. Nous allons commencer avec vos questions.`;
                    setChatHistory([{ sender: 'bot', text: welcomeMsg }]);
                    speak(welcomeMsg);
                    
                    setTimeout(() => setCurrentStep(0), 1200);
                } else if (data.data.status === 'in-progress') {
                    // Resuming
                    let nextUnanswered = data.data.questions.findIndex(q => !q.answer);
                    if (nextUnanswered === -1) {
                        // All answered, move to remarks or rules
                        if (data.data.remarks && data.data.remarks.length > 0) {
                            setCurrentStep(data.data.questions.length); // Remarks mode
                        } else {
                            if (!data.data.rulesConfirmed) {
                                setCurrentStep(data.data.questions.length + 1); // Confirmation mode
                            } else {
                                setCurrentStep(999); // Done
                            }
                        }
                    } else {
                        setCurrentStep(nextUnanswered);
                    }
                    
                    // Populate history
                    const hist = [];
                    data.data.questions.forEach((q, idx) => {
                        if (idx <= nextUnanswered || nextUnanswered === -1) {
                             if (q.text) hist.push({ sender: 'bot', text: q.text });
                             if (q.answer) hist.push({ sender: 'user', text: q.answer });
                        }
                    });
                    setChatHistory(hist);
                } else if (data.data.status === 'completed') {
                    setCurrentStep(999);
                    setChatHistory([{ sender: 'bot', text: `Bonjour ${data.data.firstName}, votre entretien a déjà été soumis et enregistré avec succès. Merci !` }]);
                }
            }
        } catch(err) {
            console.error(err);
            setError("Erreur lors de la récupération de la session d'entretien.");
        } finally {
            setLoading(false);
        }
    };

    // When step changes, if it's a new question from the bot
    useEffect(() => {
        if (!candidateData || currentStep === -1) return;
        
        const qLen = candidateData.questions ? candidateData.questions.length : 0;
        
        if (currentStep >= 0 && currentStep < qLen) {
            const questionText = candidateData.questions[currentStep].text || "Veuillez répondre à la question suivante.";
            setChatHistory(prev => [...prev, { sender: 'bot', text: questionText }]);
            speak(questionText);
        } else if (currentStep === qLen && qLen > 0) {
            // Remarks
            const rLen = candidateData.remarks ? candidateData.remarks.length : 0;
            if (rLen > 0) {
                setChatHistory(prev => [...prev, { sender: 'bot', text: "Voici quelques remarques importantes concernant votre candidature :" }]);
                candidateData.remarks.forEach(r => {
                    setTimeout(() => {
                        setChatHistory(prev => [...prev, { sender: 'bot', text: r.text }]);
                        speak(r.text);
                    }, 1000);
                });
                
                setTimeout(() => setCurrentStep(qLen + 1), 2000 * rLen);
            } else {
                setCurrentStep(qLen + 1);
            }
        } else if (currentStep === qLen + 1) {
             const confirmMsg = "Avez-vous bien pris connaissance de nos consignes et vous engagez-vous à respecter les règles de l'association ?";
             setChatHistory(prev => [...prev, { sender: 'bot', text: confirmMsg }]);
             speak(confirmMsg);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, candidateData?.questions?.length]);

    const handleSendAnswer = async (e) => {
        e.preventDefault();
        if (!answerText.trim()) return;

        const val = answerText;
        setAnswerText('');
        setChatHistory(prev => [...prev, { sender: 'user', text: val }]);
        
        try {
            await fetch('/api/onboarding/interview/room', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    candidateId, 
                    answerData: { questionId: candidateData.questions[currentStep]._id, answer: val } 
                })
            });
            
            setIsTyping(true);
            setTimeout(() => {
                setIsTyping(false);
                setCurrentStep(c => c + 1);
            }, 1000);
        } catch(err) {
            console.error(err);
            setAnswerText(val); // restore 
        }
    };

    const handleConfirmRules = async () => {
        try {
            await fetch('/api/onboarding/interview/room', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidateId, nextStatus: 'completed', rulesConfirmed: true })
            });
            
            const msg = "Félicitations ! Votre entretien est officiellement terminé. L'équipe d'administration étudiera votre dossier.";
            setChatHistory(prev => [...prev, { sender: 'user', text: "Oui, je m'engage à respecter les règles." }]);
            setTimeout(() => {
                 setChatHistory(prev => [...prev, { sender: 'bot', text: msg }]);
                 speak(msg);
                 setCurrentStep(999);
            }, 1000);
        } catch (err) { console.error(err); }
    };

    if (recruitmentStatus.loading) {
        return (
            <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
                    <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: 'var(--primary, #8b5cf6)' }} />
                    <p>Vérification de la période d'entretien...</p>
                </div>
            </div>
        );
    }

    if (!recruitmentStatus.isPeriodActive) {
        return (
            <div className={styles.container} style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem 0.75rem' }}>
                <div className={styles.loginCard} style={{ width: '100%', maxWidth: '520px', textAlign: 'center', padding: '2rem 1.25rem' }}>
                    <div style={{ width: '60px', height: '60px', background: 'rgba(239, 68, 68, 0.15)', border: '2px solid rgba(239, 68, 68, 0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                        <Lock size={30} color="#ef4444" />
                    </div>
                    
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff', marginBottom: '1rem' }}>
                        Entretiens Fermés
                    </h1>
                    
                    <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {recruitmentStatus.statusMessage || "Les entretiens ne sont pas accessibles en dehors de la période d'inscription."}
                    </p>
                    
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.85rem 1.25rem', fontSize: '0.95rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px' }}
                    >
                        <Home size={18} /> Accéder à l'accueil
                    </button>
                </div>
            </div>
        );
    }

    if (!candidateId) {
        return (
            <div className={styles.container}>
                <div className={styles.loginCard}>
                    <div className={styles.botIcon}>🤖</div>
                    <h2>Espace Entretien Candidat</h2>
                    <p>Entrez le code d'entretien à 8 caractères que vous avez reçu lors de votre demande d'adhésion.</p>
                    
                    {error && <div className={styles.error}>{error}</div>}
                    
                    <form onSubmit={handleLogin}>
                        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                            <input 
                                type="text" 
                                placeholder="EX: ABC123XY" 
                                className={styles.input}
                                value={loginCode}
                                onChange={(e) => setLoginCode(e.target.value.toUpperCase())}
                                maxLength={8}
                                autoFocus
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem' }} 
                            disabled={loading || !loginCode.trim()}
                        >
                            {loading ? 'Vérification du code...' : 'Accéder à ma salle d\'entretien'} <LogIn size={18} />
                        </button>
                    </form>

                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', fontSize: '0.85rem', color: '#94a3b8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontWeight: 600, marginBottom: '6px' }}>
                            <HelpCircle size={15} /> Où trouver mon code d'entretien ?
                        </div>
                        <p style={{ margin: 0, lineHeight: 1.5 }}>
                            Votre code vous a été attribué après la validation du test d'intégration. Si vous ne vous êtes pas encore inscrit, rendez-vous sur la page d'adhésion.
                        </p>
                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                            <Link href="/join" style={{ color: 'var(--primary)', textDecoration: 'underline', fontSize: '0.85rem' }}>
                                Faire une demande d'adhésion & obtenir un code ➡️
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const qLen = candidateData?.questions?.length || 0;
    const formattedDate = candidateData?.interviewDate ? new Date(candidateData.interviewDate).toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }) : null;

    return (
        <div className={styles.container}>
            <div className={styles.chatBox}>
                <div className={styles.header}>
                    <div className={styles.botIconSmall}>🤖</div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Robot ATA <Sparkles size={16} color="#fbbf24" />
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '2px' }}>
                            <span>● En ligne avec <strong>{candidateData?.firstName} {candidateData?.lastName}</strong></span>
                            {formattedDate && (
                                <span style={{ color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Calendar size={13} /> Rendez-vous : {formattedDate}
                                </span>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        title="Changer de code / Se déconnecter"
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#cbd5e1',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.8rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <LogOut size={14} /> Quitter
                    </button>
                </div>

                <div className={styles.messagesArea}>
                    {chatHistory.map((m, i) => (
                        <div key={i} className={`${styles.message} ${m.sender === 'user' ? styles.userMessage : styles.botMessage}`}>
                            {m.text}
                        </div>
                    ))}
                    {isTyping && (
                        <div className={`${styles.message} ${styles.botMessage}`}>
                            <span className={styles.typingDot}>.</span><span className={styles.typingDot}>.</span><span className={styles.typingDot}>.</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className={styles.inputArea}>
                    {currentStep >= 0 && currentStep < qLen && (
                        <form onSubmit={handleSendAnswer} style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            <input 
                                type="text"
                                className={styles.chatInput}
                                placeholder="Tapez votre réponse ici..."
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                disabled={isTyping}
                                autoFocus
                            />
                            <button type="submit" className={styles.sendBtn} disabled={isTyping || !answerText.trim()}>
                                <Send size={20} />
                            </button>
                        </form>
                    )}
                    
                    {currentStep === qLen + 1 && (
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <button onClick={handleConfirmRules} className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.85rem 1.5rem', fontSize: '1rem' }}>
                                <CheckCircle2 size={18} /> Je confirme et je m'engage à respecter les règles
                            </button>
                        </div>
                    )}

                    {currentStep === 999 && (
                        <div style={{ width: '100%', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', padding: '10px' }}>
                            L'entretien est clôturé. Merci pour vos réponses. L'administration vous contactera prochainement.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function InterviewRoomPage() {
    return (
        <Suspense fallback={
            <div className={styles.container}>
                <div className={styles.loginCard}>
                    <h2>Chargement de la salle d'entretien...</h2>
                </div>
            </div>
        }>
            <InterviewRoomContent />
        </Suspense>
    );
}

