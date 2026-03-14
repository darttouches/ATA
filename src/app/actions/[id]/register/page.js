'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function PublicRegistrationPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [action, setAction] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        birthDate: '',
        nationality: 'Tunisienne',
        email: '',
        phone: '',
        occupation: 'etudiant',
        customAnswers: []
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch action
                const actionRes = await fetch(`/api/actions/${id}`);
                const actionData = await actionRes.json();
                if (!actionData.success) throw new Error(actionData.error);
                setAction(actionData.data);

                // Fetch current user (if logged in)
                const userRes = await fetch('/api/user/profile'); // Assuming this exists
                const userData = await userRes.json();
                if (userData.success) {
                    setUser(userData.data);
                    setFormData(prev => ({
                        ...prev,
                        firstName: userData.data.firstName || '',
                        lastName: userData.data.lastName || '',
                        email: userData.data.email || '',
                        phone: userData.data.phone || ''
                    }));
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Impossible de charger les détails de l\'événement.');
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const [regData, setRegData] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const res = await fetch(`/api/actions/${id}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    userId: user?._id
                })
            });

            const data = await res.json();
            if (res.ok) {
                setRegData(data);
                setSuccess(true);
            } else {
                setError(data.error || 'Une erreur est survenue lors de l\'inscription.');
            }
        } catch (err) {
            setError('Erreur technique. Veuillez réessayer.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] text-white">
            <Loader2 className="animate-spin" size={48} />
        </div>
    );

    if (error && !action) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] text-white p-4">
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl text-center max-w-md">
                <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
                <p>{error}</p>
            </div>
        </div>
    );

    if (action.visibility === 'members' && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] text-white p-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-8 rounded-xl text-center max-w-md">
                    <h2 className="text-2xl font-bold mb-4">Événement Réservé aux Membres</h2>
                    <p className="mb-6 opacity-80">Vous devez être connecté en tant que membre pour vous inscrire à cet événement.</p>
                    <button onClick={() => router.push('/login')} className="btn btn-primary w-full">Se connecter</button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] text-white p-4">
                <div className="bg-green-500/10 border border-green-500/20 p-10 rounded-2xl text-center max-w-lg shadow-2xl">
                    <CheckCircle className="mx-auto mb-6 text-green-500" size={64} />
                    <h2 className="text-3xl font-bold mb-4">Inscription Réussie !</h2>
                    <p className="text-lg opacity-90 mb-6">
                        Merci pour votre inscription à <strong>{action.title}</strong>.
                    </p>
                    <div className={`p-4 rounded-lg mb-8 ${regData?.emailSent ? 'bg-white/5' : 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-200'}`}>
                        <p>{regData?.message}</p>
                        {regData?.emailSent && (
                            <p className="text-sm mt-2 opacity-70">
                                Veuillez vérifier votre boîte de réception (<strong>{formData.email}</strong>).
                            </p>
                        )}
                    </div>
                    <button onClick={() => router.push('/')} className="btn btn-secondary">Retour à l'accueil</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f1e] text-white py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Inscription à l'événement
                    </h1>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 inline-block text-left">
                        <h2 className="text-2xl font-bold text-blue-400 mb-2">{action.title}</h2>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm opacity-80">
                            <p><strong>Date:</strong> {new Date(action.startDate).toLocaleDateString('fr-FR')}</p>
                            <p><strong>Heure:</strong> {action.localTime}</p>
                            <p><strong>Lieu:</strong> {action.location || 'À définir'}</p>
                            <p><strong>Frais:</strong> {action.fees || 'Gratuit'}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium opacity-70">Prénom</label>
                            <input
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium opacity-70">Nom</label>
                            <input
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium opacity-70">Date de naissance</label>
                            <input
                                required
                                type="date"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.birthDate}
                                onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium opacity-70">Nationalité</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.nationality}
                                onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                            >
                                <option value="Tunisienne">Tunisienne</option>
                                <option value="Française">Française</option>
                                <option value="Algérienne">Algérienne</option>
                                <option value="Marocaine">Marocaine</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium opacity-70">Email</label>
                            <input
                                required
                                type="email"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium opacity-70">Téléphone</label>
                            <input
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium opacity-70">Fonction / Occupation</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.occupation}
                                onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                            >
                                <option value="eleve">Élève</option>
                                <option value="etudiant">Étudiant</option>
                                <option value="fonctionnaire">Fonctionnaire</option>
                                <option value="professeur">Professeur</option>
                                <option value="autre">Autre</option>
                            </select>
                        </div>
                    </div>

                    {action.customQuestions && action.customQuestions.length > 0 && (
                        <div className="pt-6 border-t border-white/10 space-y-6">
                            <h3 className="text-xl font-bold">Questions complémentaires</h3>
                            {action.customQuestions.map((q, idx) => (
                                <div key={idx} className="space-y-2">
                                    <label className="text-sm font-medium opacity-70">
                                        {q.label} {q.required && <span className="text-red-500">*</span>}
                                    </label>
                                    {q.type === 'select' ? (
                                        <select
                                            required={q.required}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            onChange={e => {
                                                const newAnswers = [...formData.customAnswers];
                                                const existingIdx = newAnswers.findIndex(a => a.questionLabel === q.label);
                                                if (existingIdx > -1) newAnswers[existingIdx].answer = e.target.value;
                                                else newAnswers.push({ questionLabel: q.label, answer: e.target.value });
                                                setFormData({ ...formData, customAnswers: newAnswers });
                                            }}
                                        >
                                            <option value="">Sélectionnez une option</option>
                                            {q.options.map((opt, oIdx) => (
                                                <option key={oIdx} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={q.type === 'number' ? 'number' : 'text'}
                                            required={q.required}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            onChange={e => {
                                                const newAnswers = [...formData.customAnswers];
                                                const existingIdx = newAnswers.findIndex(a => a.questionLabel === q.label);
                                                if (existingIdx > -1) newAnswers[existingIdx].answer = e.target.value;
                                                else newAnswers.push({ questionLabel: q.label, answer: e.target.value });
                                                setFormData({ ...formData, customAnswers: newAnswers });
                                            }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Confirmer mon inscription'}
                    </button>
                </form>
            </div>
        </div>
    );
}
