'use client';

import React, { useState, useEffect, useRef, useContext } from 'react';
import styles from './join.module.css';
import { LanguageContext } from '@/context/LanguageContext';

export default function JoinPage() {
    // Step 0 is the start screen so we can get user interaction for autplaying audio
    const [step, setStep] = useState(0);
    const { language } = useContext(LanguageContext) || { language: 'fr' }; 
    const lang = language === 'en' ? 'en' : (language === 'ar' ? 'ar' : 'fr');
    
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Data states
    const [questions, setQuestions] = useState([]);
    const [allRules, setAllRules] = useState([]);
    const [testRules, setTestRules] = useState([]);
    
    // Quiz state
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    
    // Typing test state
    const [currentRuleIndex, setCurrentRuleIndex] = useState(0);
    const [typedText, setTypedText] = useState('');
    const [typeError, setTypeError] = useState('');
    
    // Interview request state
    const [interviewForm, setInterviewForm] = useState({
        firstName: '', lastName: '', email: '', phone: '', interviewDate: ''
    });
    const [loadingInterview, setLoadingInterview] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    
    const synth = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synth.current = window.speechSynthesis;
        }
    }, []);

    const fetchQuestions = async () => {
        try {
            const qRes = await fetch('/api/onboarding/questions?limit=5');
            const qData = await qRes.json();
            if (qData.success) {
                setQuestions(qData.data);
            }
        } catch (e) {
            console.error(e);
        }
    }

    const fetchRules = async () => {
        try {
            // Get all rules without limit
            const rRes = await fetch('/api/onboarding/rules');
            const rData = await rRes.json();
            if (rData.success) {
                setAllRules(rData.data);
                // Select 3 random rules for the test part
                const shuffled = [...rData.data].sort(() => 0.5 - Math.random());
                setTestRules(shuffled.slice(0, 3));
            }
        } catch(e) { console.error(e); }
    }

    const rvReadyRef = useRef(false);

    // Dynamically inject ResponsiveVoice and wait for full init
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // If already loaded (hot reload)
        if (window.responsiveVoice && typeof window.responsiveVoice.speak === 'function') {
            rvReadyRef.current = true;
            console.log('✅ ResponsiveVoice déjà disponible.');
            return;
        }

        if (document.getElementById('rv-script')) return;

        // Set the OnVoiceReady callback BEFORE loading the script
        window.responsiveVoiceOnReady = () => {
            rvReadyRef.current = true;
            console.log('✅ ResponsiveVoice prêt (OnVoiceReady).');
        };

        const script = document.createElement('script');
        script.id = 'rv-script';
        script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=FREE';
        script.async = true;
        script.onload = () => {
            // Give it 300ms to self-initialize before marking ready
            setTimeout(() => {
                if (window.responsiveVoice && typeof window.responsiveVoice.speak === 'function') {
                    rvReadyRef.current = true;
                    console.log('✅ ResponsiveVoice chargé (onload fallback).');
                }
            }, 300);
        };
        script.onerror = () => console.warn('❌ Impossible de charger ResponsiveVoice.');
        document.head.appendChild(script);
    }, []);

    // Fetch initial data on mount
    useEffect(() => {
        const fetchInitial = async () => {
            await fetch('/api/onboarding/seed'); // seed safely
            fetchQuestions();
            fetchRules();
        };
        fetchInitial();
        
        // Stop background music to hear the robot
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('stop-bg-music'));
        }
        
        return () => {
             // Resume music when leaving this page
             if (typeof window !== 'undefined') {
                 window.dispatchEvent(new Event('play-bg-music'));
             }
        };
    }, []);

    // Stop speaking when unmounting or language changes (so they don't overlap)
    useEffect(() => {
        if (synth.current) {
            synth.current.cancel();
            setIsPlaying(false);
        }
    }, [lang]);

    const langRef = useRef(lang);
    useEffect(() => { langRef.current = lang; }, [lang]);

    const voicesRef = useRef([]);

    // Load available voices (they may load async in browsers)
    useEffect(() => {
        const loadVoices = () => {
            const available = window.speechSynthesis.getVoices();
            if (available.length > 0) {
                voicesRef.current = available;
                console.log('🎙️ Voix disponibles:', available.map(v => `${v.name} (${v.lang})`));
                const arabicVoices = available.filter(v => v.lang.startsWith('ar'));
                if (arabicVoices.length === 0) {
                    console.warn('⚠️ Aucune voix arabe installée. Installez un pack de langue arabe dans Windows > Paramètres > Heure et langue > Langue.');
                } else {
                    console.log('✅ Voix arabes trouvées:', arabicVoices.map(v => v.name));
                }
            }
        };
        loadVoices();
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
        return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    }, []);

    const speak = (text, forceLang) => {
        if (!text) return;

        const activeLang = forceLang || langRef.current;

        // Map lang to ResponsiveVoice voice names
        const rvVoiceMap = {
            ar: 'Arabic Male',
            fr: 'French Female',
            en: 'UK English Female',
        };

        const allVoices = voicesRef.current.length > 0
            ? voicesRef.current
            : (typeof window !== 'undefined' ? window.speechSynthesis?.getVoices() || [] : []);

        // Check if native voice exists for this lang
        const nativeVoice = allVoices.find(v => v.lang.startsWith(activeLang));

        // Prefer native voice if available (no internet required)
        if (nativeVoice && synth.current) {
            synth.current.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = nativeVoice;
            utterance.lang = nativeVoice.lang;
            utterance.rate = activeLang === 'ar' ? 0.85 : 1;
            utterance.volume = 1;
            utterance.onstart = () => setIsPlaying(true);
            utterance.onend = () => setIsPlaying(false);
            utterance.onerror = (e) => {
                console.warn('Native TTS failed, trying ResponsiveVoice...', e.error);
                setIsPlaying(false);
                tryResponsiveVoice(text, activeLang, rvVoiceMap);
            };
            setTimeout(() => synth.current?.speak(utterance), 50);

        } else {
            // Fallback: use ResponsiveVoice (online, supports Arabic natively)
            tryResponsiveVoice(text, activeLang, rvVoiceMap);
        }
    };

    const tryResponsiveVoice = (text, activeLang, rvVoiceMap) => {
        // Wait up to 3s for RV to be available then try
        const attempt = (retries = 0) => {
            if (typeof window !== 'undefined' && window.responsiveVoice) {
                window.responsiveVoice.cancel();
                const rvVoice = rvVoiceMap[activeLang] || 'French Female';
                setIsPlaying(true);
                window.responsiveVoice.speak(text, rvVoice, {
                    rate: activeLang === 'ar' ? 0.85 : 1,
                    onend: () => setIsPlaying(false),
                    onerror: () => setIsPlaying(false),
                });
            } else if (retries < 6) {
                // Script still loading, retry in 500ms
                setTimeout(() => attempt(retries + 1), 500);
            } else {
                console.warn('ResponsiveVoice non disponible après attente. Vérifiez votre connexion internet.');
            }
        };
        attempt();
    };

    const stopSpeaking = () => {
        if (synth.current) synth.current.cancel();
        if (typeof window !== 'undefined' && window.responsiveVoice) {
            window.responsiveVoice.cancel();
        }
        setIsPlaying(false);
    };

    const triggerRulesAudio = (rulesList) => {
        if (!synth.current || rulesList.length === 0) return;
        synth.current.cancel();
        
        // Combine all rules into one block of text to read sequentially
        const combinedText = rulesList.map((r, i) => `${i + 1}. ${r.fullText[lang]}`).join(' .... ');
        let utterance = new SpeechSynthesisUtterance(combinedText);
        
        if (lang === 'ar') utterance.lang = 'ar-SA';
        else if (lang === 'fr') utterance.lang = 'fr-FR';
        else utterance.lang = 'en-US';
        
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        
        synth.current.speak(utterance);
    };

    // Auto-play whenever entering a step that has text
    useEffect(() => {
        if (step === 1) speak(getText('step1'));
        if (step === 2) speak(getText('step2'));
        if (step === 3) speak(getText('step3'));
        if (step === 6) speak(getText('step6'));
        if (step === 7) {
            // Read all rules aloud
            triggerRulesAudio(allRules);
        }
        if (step === 8) {
             if (testRules.length > 0 && testRules[currentRuleIndex]) {
                 speak(getText('readAndTestRulePrompt')); // Just speak a prompt
             }
        }
        
        // Stop playing if entering a quiet step
        if (step === 4 || step === 9 || step === 0) {
            stopSpeaking();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, currentRuleIndex, lang, allRules, testRules]);

    const handleAnswer = async (isCorrect) => {
        if (isCorrect) setScore(s => s + 1);
        
        if (currentQuestionIndex + 1 < questions.length) {
            setCurrentQuestionIndex(i => i + 1);
        } else {
            // End of quiz
            const finalScore = isCorrect ? score + 1 : score;
            const total = questions.length;
            const target = total >= 5 ? 4 : (total > 0 ? total - 1 : 1);
            
            if (finalScore >= target) {
                // Pass
                setStep(6);
            } else {
                // Fail, reset and go back to step 2 with NEW questions
                alert(getText('failedQuiz'));
                setScore(0);
                setCurrentQuestionIndex(0);
                await fetchQuestions(); // Get 5 new questions
                setStep(2);
            }
        }
    };

    const normalizeString = (str) => {
        if (!str) return "";
        return str.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/['’\-]/g, " ") // replace apostrophe and dash with space
            .replace(/[^\w\s\u0600-\u06FF]/g, "") // Keep arabic and latin
            .replace(/[أإآ]/g, 'ا') // Normalize Arabic Alif
            .replace(/ة/g, 'ه') // Normalize Taa Marbouta to Haa
            .replace(/ي/g, 'ى') // Normalize Yaa
            .replace(/\s+/g, " ")
            .trim();
    };

    const verifyTypedText = async () => {
        const expected = testRules[currentRuleIndex].shortTextToType[lang];
        const normalizedTyping = normalizeString(typedText);
        const normalizedExpected = normalizeString(expected);

        // Advanced matching: check if user wrote at least the expected part
        if (normalizedTyping.includes(normalizedExpected) || normalizedExpected.includes(normalizedTyping) && normalizedTyping.length > 3) {
            setTypeError('');
            setTypedText('');
            if (currentRuleIndex + 1 < testRules.length) {
                setCurrentRuleIndex(i => i + 1);
            } else {
                setStep(9); // Success! final form
            }
        } else {
            // Failed. Reshuffle 3 new test rules and restart typing test.
            alert(getText('failedRules'));
            setTypeError('');
            setTypedText('');
            setCurrentRuleIndex(0);
            
            const shuffled = [...allRules].sort(() => 0.5 - Math.random());
            setTestRules(shuffled.slice(0, 3));
            setStep(7); // Send them back to reading all rules or stay at 8? Sending back to 7 makes them re-read.
        }
    };

    const handleInterviewRequest = async (e) => {
        e.preventDefault();
        setTypeError('');
        setLoadingInterview(true);
        try {
            const res = await fetch('/api/onboarding/interview/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(interviewForm)
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || "Erreur serveur");
            
            setGeneratedCode(data.code);
            setStep(10);
        } catch (err) {
            setTypeError(err.message);
        } finally {
            setLoadingInterview(false);
        }
    };

    const preventCopyPaste = (e) => {
        e.preventDefault();
        alert(getText('noPasteAllowed'));
    };

    // Dictionary for hardcoded UI strings
    const i18n = {
        ar: {
            step0intro: "مرحباً! اضغط لبدء رحلة الانضمام إلى جمعية لمسات الفن",
            startBtn: "🚀 ابدأ التجربة",
            step1: "مرحباً! أنا الروبوت المساعد لجمعية لمسات الفن. سأرافقك في رحلة انضمامك للجمعية.",
            step2: "\"لمسات الفن\" هي جمعية ثقافية تحتضن مجموعة من الشباب المبدعين ذوي المواهب المتنوعة، مثل تنظيم الفعاليات، تنشيط الجماهير، الصحافة والإعلام، الرسم، الغناء، وغيرها من الفنون والمواهب.",
            step3: "أهدافنا:\n- ترسيخ قيم التطوع والمبادرة في أوساط الشباب.\n- دعم السياحة الداخلية.\n- الترويج للمعالم التاريخية في تونس.\n\nمجالات نشاطنا:\n1. المجال الثقافي والفني.\n2. المجال الاجتماعي والتربوي.\n3. المجال الترفيهي.",
            step6: "ممتاز! لقد اجتزت الاختبار بنجاح. الآن، لنتعرف على جميع القواعد الهامة لعمل الجمعية.",
            step7Title: "قواعد الجمعية",
            step7Subtitle: "يرجى قراءة هذه القواعد وتذكرها جيداً. سيُطلب منك إعادة كتابة بعضها للتأكد من استيعابك لها.",
            readAndTestRulePrompt: "الآن، يرجى كتابة هذه القاعدة كما تتذكرها.",
            play: "🔊 إعادة الاستماع",
            stop: "⏹ إيقاف الاستماع",
            next: "التالي ➡️",
            failedQuiz: "للأسف لم تتجاوز الاختبار (يتطلب دقة 4/5). سنعيد تقديم المعلومات مع أسئلة جديدة.",
            failedRules: "لقد أخطأت في كتابة القاعدة الصحيحة. سنقوم بإعادتك لقراءة القواعد واختبارك بثلاث قواعد جديدة.",
            quizTitle: "اختبار الفهم",
            typeRuleTitle: "إعادة كتابة القاعدة (يمنع النسخ واللصق)",
            noPasteAllowed: "النسخ واللصق غير مسموح. يرجى الكتابة يدوياً لضمان التعلم.",
            verifyBtn: "تحقق من الإجابة ✓",
            finalFormTitle: "مرحباً بك في العائلة! يرجى إكمال تسجيلك النهائي",
            submit: "إرسال طلب الانضمام",
        },
        fr: {
            step0intro: "Bonjour ! Cliquez pour démarrer votre processus d'intégration à Touches D'Art.",
            startBtn: "🚀 Démarrer l'expérience",
            step1: "Bonjour ! Je suis le robot assistant de l'association Touches D'Art. Je vais vous accompagner pour votre inscription.",
            step2: "\"Touches d'Art\" est une association culturelle qui accueille un groupe de jeunes créatifs dotés de talents variés, tels que l'organisation d'événements, l'animation de publics, le journalisme et les médias, la peinture, le chant et bien d'autres formes d'art et de talents.",
            step3: "Nos Objectifs :\n- Ancrer les valeurs du bénévolat et de l'esprit d'initiative chez les jeunes.\n- Soutenir le tourisme intérieur et promouvoir les sites touristiques.\n- Promouvoir les monuments historiques en Tunisie.\n\nNos Domaines d'Activité :\n1. Domaine Culturel & Artistique.\n2. Domaine Social & Éducatif.\n3. Domaine Récréatif.",
            step6: "Excellent ! Vous avez réussi le test. Maintenant, découvrons toutes les règles importantes de l'association.",
            step7Title: "Règlement de l'Association",
            step7Subtitle: "Veuillez lire et mémoriser ces règles. Il vous sera demandé de réécrire certaines d'entre elles à l'étape suivante.",
            readAndTestRulePrompt: "Maintenant, veuillez taper la règle pour confirmer que vous l'avez comprise.",
            play: "🔊 Re-écouter",
            stop: "⏹ Arrêter l'audio",
            next: "Suivant ➡️",
            failedQuiz: "Malheureusement vous n'avez pas réussi le test (4/5 requis). Nous allons revoir la présentation avec de nouvelles questions.",
            failedRules: "Vous n'avez pas écrit la règle correctement. Nous allons vous renvoyer vers les règles et vous tester avec 3 nouvelles règles.",
            quizTitle: "Test de compréhension",
            typeRuleTitle: "Réécrire la règle (Sans copier-coller)",
            noPasteAllowed: "Le copier-coller n'est pas autorisé. Veuillez taper manuellement pour l'apprentissage.",
            verifyBtn: "Vérifier la réponse ✓",
            finalFormTitle: "Félicitations ! Vous avez terminé l'intégration.",
            submit: "Ouvrir le formulaire d'inscription",
        },
        en: {
            step0intro: "Welcome! Click to start your Touches D'Art onboarding journey.",
            startBtn: "🚀 Start Experience",
            step1: "Hello! I am the assistant robot for the Touches D'Art association. I will guide you through your registration.",
            step2: "\"Touches d'Art\" is a cultural association that welcomes a group of creative youth with varied talents, such as event organization, public animation, journalism and media, painting, singing, and many other forms of art and talent.",
            step3: "Our Objectives:\n- Anchor the values of volunteering and initiative among youth.\n- Support domestic tourism and promote tourist sites.\n- Promote historical monuments in Tunisia.\n\nOur Fields of Activity:\n1. Cultural & Artistic Field.\n2. Social & Educational Field.\n3. Recreational Field.",
            step6: "Excellent! You passed the test. Now let's learn all the important rules of the association.",
            step7Title: "Association Rules",
            step7Subtitle: "Please read and memorize these rules carefully. You will be asked to rewrite some of them in the next step.",
            readAndTestRulePrompt: "Now, please type the rule to confirm you understood it.",
            play: "🔊 Listen again",
            stop: "⏹ Stop audio",
            next: "Next ➡️",
            failedQuiz: "Unfortunately you failed the test (4/5 required). We will restart the presentation with new questions.",
            failedRules: "You made a mistake typing the rule. We will send you back to read the rules and give you 3 new ones.",
            quizTitle: "Understanding Test",
            typeRuleTitle: "Rewrite the rule (No Copy-Paste)",
            noPasteAllowed: "Copy-paste is not allowed. Please type manually to learn.",
            verifyBtn: "Verify Answer ✓",
            finalFormTitle: "Congratulations! You completed the onboarding.",
            submit: "Open Registration Form",
        }
    };
    
    // Fallback dictionary
    const getText = (key) => i18n[lang]?.[key] || i18n['fr'][key];

    const translateCategory = (cat) => {
        if (lang === 'ar') return cat;
        const map = {
            'الانضباط والسلوك': { fr: 'Discipline et Comportement', en: 'Discipline and Behavior' },
            'الاجتماعات': { fr: 'Réunions', en: 'Meetings' },
            'الأنشطة': { fr: 'Activités', en: 'Activities' },
            'الالتزام بالاحترام الاخلاقي': { fr: 'Respect Éthique', en: 'Ethical Respect' }
        };
        return map[cat]?.[lang] || cat;
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <div className={styles.messageBubble} style={{textAlign: 'center'}}>
                        <h3>{getText('step0intro')}</h3>
                        <div className={styles.controls} style={{justifyContent: 'center', marginTop: '30px'}}>
                            <button onClick={() => setStep(1)} className={`${styles.btn} ${styles.btnPrimary}`} style={{fontSize: '1.2rem', padding: '15px 30px'}}>
                                {getText('startBtn')}
                            </button>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className={styles.messageBubble}>
                        <p>{getText('step1')}</p>
                        <div className={styles.controls}>
                            <button onClick={() => speak(getText('step1'))} className={styles.btn}>
                                {getText('play')}
                            </button>
                            {isPlaying && <button onClick={stopSpeaking} className={styles.btn}>{getText('stop')}</button>}
                            <button onClick={() => setStep(2)} className={`${styles.btn} ${styles.btnPrimary}`}>
                                {getText('next')}
                            </button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className={styles.messageBubble}>
                        <p>{getText('step2')}</p>
                        <div className={styles.controls}>
                            <button onClick={() => speak(getText('step2'))} className={styles.btn}>{getText('play')}</button>
                            {isPlaying && <button onClick={stopSpeaking} className={styles.btn}>{getText('stop')}</button>}
                            <button onClick={() => setStep(3)} className={`${styles.btn} ${styles.btnPrimary}`}>{getText('next')}</button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className={styles.messageBubble}>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{getText('step3')}</p>
                        <div className={styles.controls}>
                            <button onClick={() => speak(getText('step3'))} className={styles.btn}>{getText('play')}</button>
                            {isPlaying && <button onClick={stopSpeaking} className={styles.btn}>{getText('stop')}</button>}
                            <button onClick={() => setStep(4)} className={`${styles.btn} ${styles.btnPrimary}`}>{getText('next')}</button>
                        </div>
                    </div>
                );
            case 4:
                if (questions.length === 0) return <p>Loading questions...</p>;
                const q = questions[currentQuestionIndex];
                if (!q) return <p>Retrieving question...</p>;
                return (
                    <div className={styles.messageBubble}>
                        <div className={styles.progress}>Question {currentQuestionIndex + 1}/{questions.length}</div>
                        <p><strong>{getText('quizTitle')}:</strong> {q.questionText[lang]}</p>
                        <div style={{ marginTop: '20px' }}>
                            {q.options.map((opt, i) => (
                                <button key={i} onClick={() => handleAnswer(opt.isCorrect)} className={styles.quizOption}>
                                    {opt.text[lang]}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className={styles.messageBubble}>
                        <p>{getText('step6')}</p>
                        <div className={styles.controls}>
                            <button onClick={() => speak(getText('step6'))} className={styles.btn}>{getText('play')}</button>
                            <button onClick={() => setStep(7)} className={`${styles.btn} ${styles.btnPrimary}`}>{getText('next')}</button>
                        </div>
                    </div>
                );
            case 7:
                 if (allRules.length === 0) return <p>Loading rules...</p>;
                 return (
                     <div className={styles.messageBubble}>
                        <h4 style={{margin: '0 0 10px 0'}}>{getText('step7Title')}</h4>
                        <p style={{fontSize: '0.9rem', color: '#94a3b8', marginBottom: '15px'}}>{getText('step7Subtitle')}</p>
                        
                        <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px', textAlign: 'start' }}>
                            {allRules.map((rule, idx) => (
                                <div key={idx} style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '10px', textAlign: 'start', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
                                    <strong style={{color: '#60a5fa', fontSize: '0.8rem', display: 'block', marginBottom: '2px'}}>{translateCategory(rule.category)}</strong>
                                    <p style={{margin: '0', fontSize: '0.95rem'}}>{rule.fullText[lang]}</p>
                                </div>
                            ))}
                        </div>
                        
                        <div className={styles.controls} style={{marginTop: '20px'}}>
                            <button onClick={() => triggerRulesAudio(allRules)} className={styles.btn}>{getText('play')}</button>
                            {isPlaying && <button onClick={stopSpeaking} className={styles.btn}>{getText('stop')}</button>}
                            
                            <button onClick={() => setStep(8)} className={`${styles.btn} ${styles.btnPrimary}`} style={{marginLeft: 'auto'}}>
                                {getText('next')}
                            </button>
                        </div>
                     </div>
                 );
            case 8:
                 if (testRules.length === 0) return <p>Loading test rules...</p>;
                 const r = testRules[currentRuleIndex];
                 if (!r) return <p>Retrieving rule...</p>;
                 
                 return (
                     <div className={styles.messageBubble}>
                        <div className={styles.progress}>Test {currentRuleIndex + 1}/3</div>
                        <p style={{fontSize: '1.05rem'}}>{r.fullText[lang]}</p>
                        <div className={styles.controls} style={{marginBottom: '20px'}}>
                            <button onClick={() => speak(r.fullText[lang] + ". " + getText('readAndTestRulePrompt'))} className={styles.btn}>{getText('play')}</button>
                            {isPlaying && <button onClick={stopSpeaking} className={styles.btn}>{getText('stop')}</button>}
                        </div>
                        <hr style={{borderColor: 'rgba(255,255,255,0.1)', margin: '15px 0'}}/>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px dashed #3b82f6', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
                            <p style={{fontSize: '0.9rem', color: '#94a3b8', marginBottom: '8px'}}>{getText('typeRuleTitle')}</p>
                            <h3 style={{color: '#fff', fontSize: '1.2rem', margin: 0}}>"{r.shortTextToType[lang]}"</h3>
                        </div>
                        <textarea
                            className={styles.inputField}
                            value={typedText}
                            onChange={(e) => setTypedText(e.target.value)}
                            onPaste={preventCopyPaste}
                            onCopy={preventCopyPaste}
                            rows={3}
                            placeholder="..."
                        />
                        {typeError && <p className={styles.errorText}>{typeError}</p>}
                        <button onClick={verifyTypedText} className={`${styles.btn} ${styles.btnSuccess}`} style={{width: '100%', justifyContent: 'center'}}>
                            {getText('verifyBtn')}
                        </button>
                     </div>
                 );
            case 9:
                return (
                    <div className={styles.messageBubble}>
                        <h2>{getText('finalFormTitle')}</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px', textAlign: 'center' }}>
                            <p style={{ color: '#94a3b8' }}>Vous avez terminé le parcours d'intégration ! Cliquez ci-dessous pour accéder au formulaire officiel de l'association.</p>
                            <button onClick={() => window.location.href = '/signup'} className={`${styles.btn} ${styles.btnPrimary}`} style={{width: '100%', justifyContent: 'center', padding: '15px', fontSize: '1.1rem'}}>
                                {getText('submit')} 
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={styles.container} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className={styles.chatBox}>
                <div className={styles.robotHeader} style={{ flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center' }}>
                    <div className={styles.robotAvatar} style={{ marginBottom: '10px' }}>🤖</div>
                    <div style={{ width: '100%' }}>
                        <h2 className={styles.robotTitle}>ATA - Bot</h2>
                        {step > 0 ? (
                            <p className={styles.robotStatus}>Connecté - Étape {step}/9</p>
                        ) : (
                            <p className={styles.robotStatus}>En attente de démarrage...</p>
                        )}
                    </div>
                </div>

                {renderStep()}
            </div>
        </div>
    );
}
