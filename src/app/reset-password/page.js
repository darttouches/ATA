'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Jeton de réinitialisation manquant.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full text-center space-y-4 bg-white p-10 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-red-600">Erreur</h2>
                    <p className="text-gray-600">Lien de réinitialisation invalide ou manquant.</p>
                    <Link href="/forgot-password" class="text-[#11224E] hover:underline">
                        Demander un nouveau lien
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-[#11224E]">
                        Nouveau mot de passe
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Entrez votre nouveau mot de passe ci-dessous.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#11224E] focus:border-[#11224E] focus:z-10 sm:text-sm"
                                placeholder="Nouveau mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#11224E] focus:border-[#11224E] focus:z-10 sm:text-sm"
                                placeholder="Confirmer le mot de passe"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {message && (
                        <div className="text-green-600 text-sm text-center bg-green-50 p-2 rounded">
                            {message} Redirection vers la page de connexion...
                        </div>
                    )}
                    {error && (
                        <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#11224E] hover:bg-[#1a3a7a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#11224E] transition-colors duration-200"
                        >
                            {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ResetPassword() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
