"use client";

import { useState, useEffect, useRef } from 'react';
import styles from './interview.module.css';
import { useRouter } from 'next/navigation';
import { LogIn, Send, CheckCircle2 } from 'lucide-react';

export default function InterviewRoomPage() {
    const router = useRouter();
    const [candidateData, setCandidateData] = useState(null);
    const [loginCode, setLoginCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Interview State
    const [candidateId, setCandidateId] = useState(null);
    const [currentStep, setCurrentStep] = useState(-1); // -1: Not started, 0..N: Questions, N+1: Remarks, N+2: Rules confirmation
    const [chatHistory, setChatHistory] = useState([]);
    const [answerText, setAnswerText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    // Voice synth
    const synth = useRef(null);
    const rvReadyRef = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined') synth.current = window.speechSynthesis;
    }, []);

    const speak = (text) => {
        if (!text) return;
        if (synth.current) {
            synth.current.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'fr-FR';
            synth.current.speak(utterance);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/onboarding/interview/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: loginCode })
            });
            const data = await res.json();
            
            if (!res.ok || !data.success) throw new Error(data.error);
            
            setCandidateId(data.candidateId);
            fetchCandidateData(data.candidateId);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
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
                    
                    const welcomeMsg = `Bienvenue ${data.data.firstName}. Je suis prêt pour votre entretien. Commençons avec la première question.`;
                    setChatHistory([{ sender: 'bot', text: welcomeMsg }]);
                    speak(welcomeMsg);
                    
                    setTimeout(() => setCurrentStep(0), 1000);
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
                    setChatHistory([{ sender: 'bot', text: "Votre entretien est déjà terminé. Merci." }]);
                }
            }
        } catch(err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // When step changes, if it's a new question from the bot
    useEffect(() => {
        if (!candidateData || currentStep === -1) return;
        
        const qLen = candidateData.questions.length;
        
        if (currentStep >= 0 && currentStep < qLen) {
            const questionText = candidateData.questions[currentStep].text || "Veuillez répondre à la question suivante.";
            setChatHistory(prev => [...prev, { sender: 'bot', text: questionText }]);
            speak(questionText);
        } else if (currentStep === qLen) {
            // Remarks
            const rLen = candidateData.remarks.length;
            if (rLen > 0) {
                setChatHistory(prev => [...prev, { sender: 'bot', text: "Voici quelques remarques importantes pour vous." }]);
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
             const confirmMsg = "Avez-vous bien compris nos règles et vous engagez-vous à les respecter ?";
             setChatHistory(prev => [...prev, { sender: 'bot', text: confirmMsg }]);
             speak(confirmMsg);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, candidateData?.questions?.length]); // removed candidateData dependency to avoid infinite loops

    const handleSendAnswer = async (e) => {
        e.preventDefault();
        if (!answerText.trim()) return;

        const val = answerText;
        setAnswerText('');
        setChatHistory(prev => [...prev, { sender: 'user', text: val }]);
        
        const qLen = candidateData.questions.length;
        
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
            
            const msg = "Félicitations. Votre entretien est terminé.";
            setChatHistory(prev => [...prev, { sender: 'user', text: "Oui, je m'engage à respecter les règles." }]);
            setTimeout(() => {
                 setChatHistory(prev => [...prev, { sender: 'bot', text: msg }]);
                 speak(msg);
                 setCurrentStep(999);
            }, 1000);
        } catch (err) { console.error(err); }
    };

    if (!candidateId) {
        return (
            <div className={styles.container}>
                <div className={styles.loginCard}>
                    <div className={styles.botIcon}>🤖</div>
                    <h2>Entretien ATA</h2>
                    <p>Veuillez entrer votre code d'entretien à 8 chiffres.</p>
                    {error && <div className={styles.error}>{error}</div>}
                    <form onSubmit={handleLogin}>
                        <input 
                            type="text" 
                            placeholder="Code d'entretien (Ex: ABC123XY)" 
                            className={styles.input}
                            value={loginCode}
                            onChange={(e) => setLoginCode(e.target.value.toUpperCase())}
                            maxLength={8}
                            required
                        />
                        <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}} disabled={loading}>
                            {loading ? 'Vérification...' : 'Se connecter'} <LogIn size={18} />
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const qLen = candidateData?.questions?.length || 0;

    return (
        <div className={styles.container}>
            <div className={styles.chatBox}>
                <div className={styles.header}>
                    <div className={styles.botIconSmall}>🤖</div>
                    <div>
                        <h3 style={{margin: 0, color: 'white'}}>Robot ATA</h3>
                        <div style={{fontSize: '0.8rem', color: '#10b981'}}>● En ligne avec {candidateData?.firstName}</div>
                    </div>
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
                </div>

                <div className={styles.inputArea}>
                    {currentStep >= 0 && currentStep < qLen && (
                        <form onSubmit={handleSendAnswer} style={{display: 'flex', gap: '10px', width: '100%'}}>
                            <input 
                                type="text"
                                className={styles.chatInput}
                                placeholder="Tapez votre réponse ici..."
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                disabled={isTyping}
                            />
                            <button type="submit" className={styles.sendBtn} disabled={isTyping || !answerText.trim()}>
                                <Send size={20} />
                            </button>
                        </form>
                    )}
                    
                    {currentStep === qLen + 1 && (
                        <div style={{width: '100%', display: 'flex', justifyContent: 'center'}}>
                            <button onClick={handleConfirmRules} className="btn btn-success" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <CheckCircle2 size={18} /> Je confirme et je m'engage
                            </button>
                        </div>
                    )}

                    {currentStep === 999 && (
                        <div style={{width: '100%', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', padding: '10px'}}>
                            L'entretien est clôturé. Merci pour vos réponses. L'administration vous contactera prochainement.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
