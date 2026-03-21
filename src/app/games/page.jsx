"use client";

import { useState, useEffect } from 'react';
import styles from './games.module.css';
import Link from 'next/link';
import { Gamepad2, Users, Monitor, MapPin, Lock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function GamesHub() {
  const { t } = useLanguage();
  const [gamesConfig, setGamesConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.games) {
          setGamesConfig(data.games);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const allGames = [
    {
      id: 'loup-garou',
      name: 'Loup-Garou',
      description: 'Un jeu de bluff et de stratégie où le village doit débusquer les loups-garous infiltrés avant qu\'il ne soit trop tard.',
      icon: '🐺',
      modes: ['En ligne', 'Présentiel'],
      path: '/games/loup-garou',
      color: '#ef4444'
    },
    {
      id: 'xo',
      name: 'XO (Connect 4x4)',
      description: 'Une version stratégique sur une grille 4x4. Placez, déplacez et éjectez les pièces adverse pour aligner 4 symboles !',
      icon: '⭕',
      modes: ['En ligne', 'Présentiel'],
      path: '/games/xo',
      color: '#3b82f6'
    },
    {
      id: 'barbechni',
      name: 'Barbechni ! (بربشني !)',
      description: 'Exprimez-vous ! Envoyez anonymement des questions ou réclamations et votez pour lever le voile sur les mystères.',
      icon: '🕵️',
      modes: ['En ligne', 'Présentiel'],
      path: '/games/barbechni',
      color: '#7c3aed'
    },
    {
      id: 'soon-1',
      name: 'Bientôt...',
      description: 'D\'autres jeux passionnants arrivent bientôt pour pimenter vos rencontres artistiques.',
      icon: '🧩',
      modes: [],
      path: '#',
      color: '#94a3b8',
      disabled: true
    }
  ];

  if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>Chargement des jeux...</div>;

  // Filter games based on config
  const games = allGames.filter(game => {
    if (game.id === 'loup-garou') {
      return gamesConfig?.loupGarou?.isPublished !== false;
    }
    if (game.id === 'xo') {
      return gamesConfig?.xo?.isPublished !== false;
    }
    if (game.id === 'barbechni') {
      return gamesConfig?.barbechni?.isPublished !== false;
    }
    return true;
  });

  // If globally disabled, maybe show a message or just empty grid?
  // But usually access is controlled by the sidebar and direct link.

  return (
    <div className={styles.gamesContainer}>
      <header className={styles.header}>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: '20px'}}>
             <h1 style={{margin: 0}}>🎲 Espace Games</h1>
             <Link href="/dashboard" className={styles.quitBtn}>{t('quit') || 'Quitter'}</Link>
        </div>
        <p>Jouez, interagissez et vivez l'aventure Touches D'Art à travers nos jeux originaux.</p>
      </header>

      <div className={styles.gamesGrid}>
        {games.map((game) => (
          <div key={game.id} className={`${styles.gameCard} ${game.disabled ? styles.disabled : ''}`}>
            {game.disabled ? (
              <div className={styles.gameContent}>
                <div className={styles.gameIcon}>{game.icon}</div>
                <div className={styles.gameInfo}>
                    <div className={styles.badges}>
                      <span className={`${styles.badge} ${styles.badgeComingSoon}`}>À venir</span>
                    </div>
                  <h2>{game.name}</h2>
                  <p>{game.description}</p>
                </div>
              </div>
            ) : (
                <Link href={game.path} className={styles.gameLink}>
                    <div className={styles.cardDecoration} />
                    <div className={styles.gameContent}>
                        <div className={styles.gameIcon}>{game.icon}</div>
                        <div className={styles.gameInfo}>
                            <div className={styles.badges}>
                                {game.modes.map((mode, i) => {
                                    // Check if mode is allowed
                                    const allowed = (game.id === 'loup-garou' ? gamesConfig?.loupGarou?.modes : (game.id === 'xo' ? gamesConfig?.xo?.modes : (game.id === 'barbechni' ? gamesConfig?.barbechni?.modes : 'both'))) || 'both';
                                    const isModeVisible = 
                                        allowed === 'both' || 
                                        (allowed === 'online' && mode === 'En ligne') || 
                                        (allowed === 'presence' && mode === 'Présentiel');
                                    
                                    if (!isModeVisible) return null;

                                    return (
                                        <span key={i} className={`${styles.badge} ${mode === 'En ligne' ? styles.badgeOnline : styles.badgePresence}`}>
                                            {mode === 'En ligne' ? <Monitor size={12} inline="true" /> : <MapPin size={12} inline="true" />} {mode}
                                        </span>
                                    );
                                })}
                            </div>
                            <h2>{game.name}</h2>
                            <p>{game.description}</p>
                        </div>
                    </div>
                </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
