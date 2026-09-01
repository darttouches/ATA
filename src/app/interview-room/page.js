"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import styles from './interview.module.css';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Send, CheckCircle2, LogOut, Calendar, User, Sparkles, HelpCircle, Lock, Home, Loader2, Bot } from 'lucide-react';
import Link from 'next/link';
import Spline from '@splinetool/react-spline';

function InterviewRoomContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialCodeFromUrl = searchParams.get('code') || '';

    const [candidateData, setCandidateData] = useState(null);
    const [loginCode, setLoginCode] = useState(initialCodeFromUrl.toUpperCase());
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasAttemptedUrlCode, setHasAttemptedUrlCode] = useState(false);

    // Spline & Voice refs
    const splineRef = useRef(null);
    const synth = useRef(null);
    const messagesEndRef = useRef(null);

    const safeEmitEvent = (eventType, targetName) => {
        try {
            if (splineRef.current && typeof splineRef.current.emitEvent === 'function') {
                splineRef.current.emitEvent(eventType, targetName);
            }
        } catch (err) {
            // Catch missing property errors from Spline runtime
        }
    };

    // Recruitment Period State
    const [recruitmentStatus, setRecruitmentStatus] = useState({
        loading: true,
        isPeriodActive: true,
        statusMessage: ''
    });

    // Suppress Spline internal "Missing property" console.error noise
    useEffect(() => {
        const originalError = console.error;
        console.error = (...args) => {
            const msg = args[0];
            if (typeof msg === 'string' && msg.includes('Missing property')) return;
            if (msg instanceof Error && msg.message?.includes('Missing property')) return;
            originalError.apply(console, args);
        };
        return () => { console.error = originalError; };
    }, []);

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
    const [currentStep, setCurrentStep] = useState(-1);
    const [chatHistory, setChatHistory] = useState([]);
    const [answerText, setAnswerText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

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

    const audioIdRef = useRef(0);

    const tryOnlineTTS = (text, activeLang) => {
        audioIdRef.current += 1;
        const currentId = audioIdRef.current;
        safeEmitEvent('keyDown', 'Bouche');

        const chunks = text.split(/ \.\.\.\. |\n|(?<=[.!?])\s+/).filter(c => c.trim().length > 0);
        const subChunks = [];
        
        chunks.forEach(chunk => {
            let remaining = chunk;
            while (remaining.length > 0) {
                let currentPart = remaining.substring(0, 150);
                if (remaining.length > 150) {
                     const lastSpace = currentPart.lastIndexOf(' ');
                     if (lastSpace > 0) currentPart = currentPart.substring(0, lastSpace);
                }
                subChunks.push(currentPart.trim());
                remaining = remaining.substring(currentPart.length).trim();
            }
        });

        if (subChunks.length === 0) return;

        if (!window.currentOnlineAudio) {
            window.currentOnlineAudio = new Audio();
        }
        
        const audio = window.currentOnlineAudio;
        let index = 0;

        const playNext = () => {
            if (audioIdRef.current !== currentId || index >= subChunks.length) {
                if (audioIdRef.current === currentId) {
                    safeEmitEvent('keyUp', 'Bouche');
                }
                return;
            }

            const chunkToPlay = subChunks[index];
            const url = `/api/tts?lang=${activeLang}&text=${encodeURIComponent(chunkToPlay)}`;
            
            let handled = false;
            const cleanup = () => {
                audio.removeEventListener('ended', handleEnded);
                audio.removeEventListener('error', handleError);
            };

            const handleEnded = () => {
                if (handled) return; handled = true;
                cleanup();
                index++;
                playNext();
            };
            
            const handleError = (e) => {
                if (handled) return; handled = true;
                console.warn('Backend TTS skipped chunk', e);
                cleanup();
                index++;
                playNext(); 
            };

            audio.addEventListener('ended', handleEnded);
            audio.addEventListener('error', handleError);
            
            audio.src = url;
            audio.load();
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(handleError);
            }
        };

        playNext();
    };

    const speak = (text) => {
        if (!text) return;
        const activeLang = 'fr';
        
        const allVoices = typeof window !== 'undefined' ? window.speechSynthesis?.getVoices() || [] : [];
        const nativeVoice = allVoices.find(v => v.lang.startsWith(activeLang));

        if (nativeVoice && synth.current) {
            synth.current.cancel();
            audioIdRef.current += 1;
            const currentId = audioIdRef.current;

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = nativeVoice;
            utterance.lang = 'fr-FR';
            utterance.onstart = () => {
                safeEmitEvent('keyDown', 'Bouche');
            };
            utterance.onend = () => {
                if (audioIdRef.current === currentId) safeEmitEvent('keyUp', 'Bouche');
            };
            utterance.onerror = () => {
                if (audioIdRef.current === currentId) safeEmitEvent('keyUp', 'Bouche');
                tryOnlineTTS(text, activeLang);
            };
            setTimeout(() => synth.current?.speak(utterance), 50);
        } else {
            tryOnlineTTS(text, activeLang);
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
                
                if (data.data.status === 'pending') {
                    await fetch('/api/onboarding/interview/room', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ candidateId: id, nextStatus: 'in-progress' })
                    });
                    
                    const welcomeMsg = `Bienvenue ${data.data.firstName} ${data.data.lastName}. Je suis Arto, votre robot assistant d'entretien. Nous allons commencer avec vos questions.`;
                    setChatHistory([{ sender: 'bot', text: welcomeMsg }]);
                    speak(welcomeMsg);
                    
                    setTimeout(() => setCurrentStep(0), 1200);
                } else if (data.data.status === 'in-progress') {
                    let nextUnanswered = data.data.questions.findIndex(q => !q.answer);
                    if (nextUnanswered === -1) {
                        if (data.data.remarks && data.data.remarks.length > 0) {
                            setCurrentStep(data.data.questions.length);
                        } else {
                            if (!data.data.rulesConfirmed) {
                                setCurrentStep(data.data.questions.length + 1);
                            } else {
                                setCurrentStep(999);
                            }
                        }
                    } else {
                        setCurrentStep(nextUnanswered);
                    }
                    
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
                    setChatHistory([{ sender: 'bot', text: `Bonjour ${data.data.firstName}, votre entretien avec Arto a été soumis et enregistré avec succès. Merci !` }]);
                }
            }
        } catch(err) {
            console.error(err);
            setError("Erreur lors de la récupération de la session d'entretien.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!candidateData || currentStep === -1) return;
        
        const qLen = candidateData.questions ? candidateData.questions.length : 0;
        
        if (currentStep >= 0 && currentStep < qLen) {
            const questionText = candidateData.questions[currentStep].text || "Veuillez répondre à la question suivante.";
            setChatHistory(prev => [...prev, { sender: 'bot', text: questionText }]);
            speak(questionText);
        } else if (currentStep === qLen && qLen > 0) {
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
            setAnswerText(val);
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
                <div className={styles.loginCard} style={{ maxWidth: '480px' }}>
                    {/* ARTO hero illustration — simple static preview, no Spline here to avoid duplicate instance */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '90px', height: '90px', margin: '0 auto 1.25rem auto', background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(79,70,229,0.12))', border: '2px solid rgba(124,58,237,0.35)', borderRadius: '50%' }}>
                        <Bot size={44} color="#a78bfa" />
                    </div>

                    <h2 style={{ marginTop: 0, fontSize: '1.4rem' }}>Salle d'Entretien avec Arto</h2>
                    <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Entrez votre code d'entretien à 8 caractères pour échanger en direct avec <strong>Arto</strong>, notre robot assistant.</p>
                    
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
                            {loading ? 'Vérification du code...' : 'Rejoindre Arto en entretien'} <LogIn size={18} />
                        </button>
                    </form>

                    <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', fontSize: '0.85rem', color: '#94a3b8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontWeight: 600, marginBottom: '6px' }}>
                            <HelpCircle size={15} /> Où trouver mon code d'entretien ?
                        </div>
                        <p style={{ margin: 0, lineHeight: 1.5 }}>
                            Votre code vous a été envoyé par <strong>email</strong> lors de votre demande d'adhésion.
                        </p>
                        <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
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
            <div className={styles.chatBox} style={{ height: '88vh' }}>
                {/* Header */}
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bot size={22} color="white" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.1rem' }}>
                                Arto <Sparkles size={16} color="#fbbf24" />
                            </h3>
                            <div style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                <span>● En entretien virtuel avec <strong>{candidateData?.firstName} {candidateData?.lastName}</strong></span>
                            </div>
                        </div>
                    </div>
                    {formattedDate && (
                        <div style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '5px 10px', borderRadius: '6px' }}>
                            <Calendar size={13} /> {formattedDate}
                        </div>
                    )}
                    <button 
                        onClick={handleLogout}
                        title="Changer de code / Se déconnecter"
                        style={{
                            marginLeft: formattedDate ? '10px' : 'auto',
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

                {/* Live Interactive ARTO 3D Viewport inside the room */}
                {/* FOND SOLIDE #0a0e1a = couleur réelle du canvas Spline → masques parfaitement invisibles */}
                <div style={{ position: 'relative', width: '100%', height: '240px', background: '#0a0e1a', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', flexShrink: 0, overflow: 'hidden' }}>
                    <Spline 
                        scene="https://prod.spline.design/14vMjuI-SUR2PrJP/scene.splinecode" 
                        onLoad={(spline) => { splineRef.current = spline; }}
                        onError={() => {}} 
                        style={{ width: '100%', height: '100%' }}
                    />
                    {/* Solid mask — même couleur exacte que le fond Spline (#0a0e1a) */}
                    <div aria-hidden="true" style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '260px',
                        height: '64px',
                        background: '#0a0e1a',
                        zIndex: 20,
                        pointerEvents: 'none'
                    }} />
                    {/* Bande complète en bas pour tout résidu */}
                    <div aria-hidden="true" style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '32px',
                        background: '#0a0e1a',
                        zIndex: 19,
                        pointerEvents: 'none'
                    }} />
                </div>

                {/* Messages Chat Area */}
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

                {/* Input Controls */}
                <div className={styles.inputArea}>
                    {currentStep >= 0 && currentStep < qLen && (
                        <form onSubmit={handleSendAnswer} style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            <input 
                                type="text"
                                className={styles.chatInput}
                                placeholder="Tapez votre réponse pour Arto..."
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
                            L'entretien avec Arto est clôturé. Merci pour vos réponses. L'administration vous contactera prochainement.
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
                    <h2>Chargement de la salle d'entretien d'Arto...</h2>
                </div>
            </div>
        }>
            <InterviewRoomContent />
        </Suspense>
    );
}
