"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, UserPlus, Bot, Receipt, ShieldCheck, PhoneCall, ArrowLeft, AlertTriangle } from 'lucide-react';
import styles from './login.module.css';
import { useLanguage } from '@/context/LanguageContext';

// WhatsApp SVG Logo
function WhatsAppIcon({ size = 20 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
    );
}

// Payment Pending Notice — trilingual (FR / EN / AR)
function PaymentPendingNotice({ onBack }) {
    const WHATSAPP_NUMBER = '21623468877';
    const WHATSAPP_DISPLAY = '+216 23 468 877';
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Bonjour, je souhaite obtenir des informations sur mon compte Touches D\'Art.')}`;

    const content = [
        {
            lang: 'FR', flag: '🇫🇷', dir: 'ltr',
            title: 'Compte en attente de paiement',
            subtitle: 'Bienvenue ! Votre dossier est bien enregistré.',
            steps: [
                { icon: <Receipt size={18}/>, text: 'Rendez-vous chez le président de votre club pour effectuer le paiement.' },
                { icon: <ShieldCheck size={18}/>, text: 'Obtenez un reçu officiel avec le cachet du club, votre nom et prénom.' },
                { icon: <ShieldCheck size={18}/>, text: 'Conservez précieusement ce reçu — il est votre preuve de paiement et votre clé pour la carte membre.' },
            ],
            contactText: 'Pour toute information ou réclamation, contactez le responsable au Bureau National :',
            backText: 'Retour à la connexion',
        },
        {
            lang: 'EN', flag: '🇬🇧', dir: 'ltr',
            title: 'Account Pending Payment',
            subtitle: 'Welcome! Your application is registered.',
            steps: [
                { icon: <Receipt size={18}/>, text: 'Visit your club president to complete your membership payment.' },
                { icon: <ShieldCheck size={18}/>, text: 'Get an official receipt stamped by the club with your full name.' },
                { icon: <ShieldCheck size={18}/>, text: 'Keep this receipt safe — it serves as proof of payment and grants you your membership card.' },
            ],
            contactText: 'For any information or complaint, contact the National Board representative:',
            backText: 'Back to Login',
        },
        {
            lang: 'AR', flag: '🇹🇳', dir: 'rtl',
            title: 'الحساب بانتظار الدفع',
            subtitle: 'أهلاً! ملفك مسجّل لدينا.',
            steps: [
                { icon: <Receipt size={18}/>, text: 'توجّه إلى رئيس ناديك لدفع رسوم العضوية.' },
                { icon: <ShieldCheck size={18}/>, text: 'احصل على وصل رسمي مختوم بختم النادي مع اسمك الكامل.' },
                { icon: <ShieldCheck size={18}/>, text: 'احتفظ بالوصل — فهو دليل الدفع ومفتاح الحصول على بطاقة العضوية.' },
            ],
            contactText: 'للاستفسار أو تقديم شكوى، تواصل مع المسؤول في المكتب الوطني:',
            backText: 'العودة إلى تسجيل الدخول',
        },
    ];

    return (
        <div className={styles.paymentPendingOverlay}>
            <div className={styles.paymentPendingCard}>
                {/* Header */}
                <div className={styles.ppHeader}>
                    <div className={styles.ppIconWrapper}>
                        <AlertTriangle size={28} />
                    </div>
                    <h2 className={styles.ppMainTitle}>💳 Paiement requis · Payment Required · الدفع مطلوب</h2>
                </div>

                {/* Language Tabs */}
                <div className={styles.ppLangs}>
                    {content.map((c) => (
                        <div key={c.lang} className={styles.ppLangBlock} dir={c.dir}>
                            <div className={styles.ppLangBadge}>{c.flag} {c.lang}</div>
                            <p className={styles.ppTitle}>{c.title}</p>
                            <p className={styles.ppSubtitle}>{c.subtitle}</p>
                            <div className={styles.ppSteps}>
                                {c.steps.map((step, i) => (
                                    <div key={i} className={styles.ppStep}>
                                        <div className={styles.ppStepNum}>{i + 1}</div>
                                        <div className={styles.ppStepIcon}>{step.icon}</div>
                                        <p className={styles.ppStepText}>{step.text}</p>
                                    </div>
                                ))}
                            </div>
                            <p className={styles.ppContactLabel}>{c.contactText}</p>
                        </div>
                    ))}
                </div>

                {/* WhatsApp CTA */}
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.ppWhatsapp}
                    id="whatsapp-contact-btn"
                >
                    <WhatsAppIcon size={22} />
                    <span>{WHATSAPP_DISPLAY}</span>
                    <span className={styles.ppWhatsappTag}>WhatsApp</span>
                </a>

                {/* Back Button */}
                <button onClick={onBack} className={styles.ppBack}>
                    <ArrowLeft size={16} />
                    Retour · Back · العودة
                </button>
            </div>
        </div>
    );
}

function LoginForm() {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isRecruitmentOpen, setIsRecruitmentOpen] = useState(true);

    useEffect(() => {
        fetch('/api/admin/settings')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.recruitment) {
                    const { isOpen, startDate, endDate } = data.recruitment;
                    if (!isOpen) {
                        setIsRecruitmentOpen(false);
                        return;
                    }
                    
                    const now = new Date();
                    if (startDate && new Date(startDate) > now) {
                        setIsRecruitmentOpen(false);
                        return;
                    }
                    
                    if (endDate) {
                        const end = new Date(endDate);
                        end.setHours(23, 59, 59, 999);
                        if (end < now) {
                            setIsRecruitmentOpen(false);
                            return;
                        }
                    }
                }
            })
            .catch(() => {});
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const [showPaymentNotice, setShowPaymentNotice] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.errorCode === 'PAYMENT_PENDING' || data.error === 'PAYMENT_PENDING') {
                    setShowPaymentNotice(true);
                    return;
                }
                throw new Error(data.error || t('error'));
            }

            // Refresh router to update server components (e.g. Navbar)
            router.refresh();

            // Redirect to dashboard for everyone authenticated
            router.push('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (showPaymentNotice) {
        return <PaymentPendingNotice onBack={() => setShowPaymentNotice(false)} />;
    }

    return (
        <>
        <div className={styles.container}>
            <div className={styles.formCard}>
                <h1 className={styles.title}>{t('loginTitle')}</h1>
                <p className={styles.subtitle}>{t('welcomeBack')}</p>

                {registered && (
                    <div className={styles.success}>
                        {t('accountCreatedSuccess')}
                    </div>
                )}

                {error && <div className={styles.error} style={{ whiteSpace: 'pre-wrap', textAlign: 'left', lineHeight: '1.5' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label} htmlFor="email">{t('email')}</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className={styles.input}
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="votre@email.com"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className={styles.label} htmlFor="password">{t('password')}</label>
                            <Link href="/forgot-password" className={styles.link} style={{ fontSize: '0.8rem' }}>
                                {t('forgotPassword')}
                            </Link>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                className={styles.input}
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                style={{ paddingRight: '45px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '12px', top: '50%',
                                    transform: 'translateY(-50%)', background: 'none',
                                    border: 'none', color: 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer', display: 'flex'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? t('logInProgress') : t('loginAction')}
                    </button>
                </form>

                <div className={styles.footer}>
                    {t('noAccountYet')}
                    <Link href="/signup" className={styles.link}>{t('signupAction')}</Link>
                </div>
                
                {isRecruitmentOpen && (
                    <>
                        <div className={styles.joinSection}>
                            <p className={styles.joinText}>
                                Vous souhaitez devenir membre officiel de l'association ?
                            </p>
                            <Link href="/join" className={styles.joinBtn}>
                                <UserPlus size={18} />
                                <span>Faire une demande d'adhésion</span>
                            </Link>
                        </div>

                        <div className={styles.joinSection} style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                            <p className={styles.joinText}>
                                Vous avez un code d'entretien candidat ?
                            </p>
                            <Link 
                                href="/interview-room" 
                                className={styles.joinBtn} 
                                style={{ background: 'rgba(124, 58, 237, 0.15)', borderColor: 'rgba(124, 58, 237, 0.4)', color: '#c084fc' }}
                            >
                                <Bot size={18} />
                                <span>Accéder à la salle d'entretien</span>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
        </>
    );
}

export default function Login() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}
