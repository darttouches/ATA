"use client";

import { useState, useEffect } from 'react';
import styles from './games.module.css';
import Link from 'next/link';
import { Gamepad2, Users, Monitor, MapPin, Lock, Zap, Trophy, Play } from 'lucide-react';
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
      path: '/games/loup-garou'
    },
    {
      id: 'xo',
      name: 'XO (Connect 4x4)',
      description: 'Une version stratégique sur une grille 4x4. Placez, déplacez et éjectez les pièces adverse pour aligner 4 symboles !',
      icon: '⭕',
      modes: ['En ligne', 'Présentiel'],
      path: '/games/xo'
    },
    {
      id: 'barbechni',
      name: 'Barbechni !',
      description: 'Exprimez-vous ! Envoyez anonymement des questions ou réclamations et votez pour lever le voile sur les mystères.',
      icon: '🕵️',
      modes: ['En ligne', 'Présentiel'],
      path: '/games/barbechni'
    },
    {
      id: 'wasaaa3',
      name: 'Wasaaa3 ⚡',
      description: 'Course effrénée ! Évitez les obstacles, collectez l\'énergie et survivez le plus longtemps possible avec votre propre avatar.',
      icon: '🏃‍♂️',
      modes: ['Présentiel'],
      path: '/games/wasaaa3'
    },
    {
      id: 'soon-1',
      name: 'Bientôt...',
      description: 'D\'autres jeux passionnants arrivent bientôt pour pimenter vos rencontres artistiques.',
      icon: '🧩',
      modes: [],
      path: '#',
      disabled: true
    }
  ];

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Chargement des jeux...</div>;

  // Filter and config map
  const getGameConfig = (gameId) => {
    const keyMap = {
      'loup-garou': 'loupGarou',
      'xo': 'xo',
      'barbechni': 'barbechni',
      'wasaaa3': 'wasaaa3'
    };
    const key = keyMap[gameId] || gameId;
    return gamesConfig?.[key] || { isPublished: true, modes: 'both' };
  };

  const games = allGames.filter(game => {
    if (game.disabled) return true;
    const config = getGameConfig(game.id);
    return config.isPublished !== false;
  });

  return (
    <div className={styles.gamesContainer}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>🎲 Espace Games</h1>
          <Link href="/dashboard" className={styles.quitBtn}>{t('quit') || 'Quitter'}</Link>
        </div>
        <p>Jouez, interagissez et vivez l'aventure Touches D'Art à travers nos jeux originaux.</p>
      </header>

      <div className={styles.gamesGrid}>
        {games.map((game) => {
          const config = getGameConfig(game.id);
          const allowedModes = config.modes || 'both';

          return (
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
                  <div className={styles.gameContent}>
                    <div className={styles.gameIcon}>{game.icon}</div>
                    <div className={styles.gameInfo}>
                      <div className={styles.badges}>
                        {game.modes.map((mode, i) => {
                          const isModeVisible =
                            allowedModes === 'both' ||
                            (allowedModes === 'online' && mode === 'En ligne') ||
                            (allowedModes === 'presence' && mode === 'Présentiel');

                          if (!isModeVisible) return null;

                          return (
                            <span key={i} className={`${styles.badge} ${mode === 'En ligne' ? styles.badgeOnline : styles.badgePresence}`}>
                              {mode === 'En ligne' ? <Monitor size={12} /> : <MapPin size={12} />} {mode}
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
          );
        })}
      </div>
    </div>
  );
}
