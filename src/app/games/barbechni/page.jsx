"use client";

import { useState, useEffect } from 'react';
import BarbechniGame from './BarbechniGame';

export default function BarbechniPage() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.ok ? res.json() : null)
            .then(setUser);
    }, []);

    if (!user) return <div style={{padding: '50px', textAlign: 'center'}}>Chargement...</div>;

    return <BarbechniGame user={user} />;
}
