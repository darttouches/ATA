'use client';

import Link from 'next/link';
import styles from './page.module.css';

import { useState, useEffect } from 'react';
import { ArrowRight, Star, Users, Palette, Calendar as CalendarIcon, Clock, Bell } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

import ClientHomeFeatured from './ClientHomeFeatured';
import HomePolls from './HomePolls';

export default function Home() {
  const { t, language, formatDynamicText } = useLanguage();
  const [data, setData] = useState({
    user: null,
    featured: [],
    clubs: [],
    partners: [],
    upcomingNews: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const userRes = await fetch('/api/auth/me').then(res => res.json()).catch(() => null);
        const homeData = await fetch('/api/home/data').then(res => res.json()).catch(() => ({}));

        setData({
          user: userRes,
          featured: homeData.featured || [],
          clubs: homeData.clubs || [],
          partners: homeData.partners || [],
          upcomingNews: homeData.upcomingNews || []
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const { user, featured, clubs, partners, upcomingNews } = data;

  if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>{t('loading')}</div>;

  return (
    <div className="container">
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground} />
        <h1 className={styles.title}>
          {t('heroTitle')} <br />
          <span className={styles.titleHighlight}>{t('brandName')}</span>
        </h1>
        <p className={styles.subtitle}>
          {t('heroSubtitle')}
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/clubs" className="btn btn-primary">
            {t('discoverClubs')} <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </Link>
          {user && !user.error ? (
            <Link href="/dashboard" className="btn btn-secondary">
              {t('accessDashboard')}
            </Link>
          ) : (
            <Link href="/signup" className="btn btn-secondary">
              {t('joinUs')}
            </Link>
          )}
        </div>
      </section>

      {/* Actualités / Prochaines Activités */}
      {upcomingNews.length > 0 && (
        <section className={styles.section} style={{ background: 'rgba(56, 189, 248, 0.03)', padding: '3rem 1.5rem', borderRadius: '24px', margin: '2rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
            <div style={{ padding: '10px', background: 'var(--primary)', borderRadius: '12px', color: 'white' }}>
              <Bell size={24} className="animate-bounce" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{t('newsEvents')}</h2>
              <p style={{ opacity: 0.6 }}>{t('upcomingActivities')}</p>
            </div>
          </div>

          <div className={styles.grid}>
            {upcomingNews.map((news) => (
              <div key={news._id} className="card" style={{ border: '1px solid rgba(56, 189, 248, 0.2)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {formatDynamicText(news.club?.name)}
                  </span>
                  <div style={{ padding: '4px 8px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>
                    {news.type}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>{news.title}</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', opacity: 0.8 }}>
                    <CalendarIcon size={14} /> {new Date(news.date).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'long' })}
                  </div>
                  {news.time && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', opacity: 0.8 }}>
                      <Clock size={14} /> {news.time}
                    </div>
                  )}
                </div>

                <Link href={`/clubs/${news.club?.slug}`} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem' }}>
                  {t('viewPage')}
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dynamic Featured Section */}
      {featured.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('featured')}</h2>
          <ClientHomeFeatured featured={featured} gridStyle={styles.grid} />
        </section>
      )}

      {/* Features / Intro */}
      <section className={styles.section}>
        <div className={styles.grid}>
          <div className="card" style={{ textAlign: 'center' }}>
            <Palette size={40} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h3>{t('artCulture')}</h3>
            <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>
              {t('artCultureDesc')}
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <Users size={40} color="var(--secondary)" style={{ marginBottom: '1rem' }} />
            <h3>{t('community')}</h3>
            <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>
              {t('communityDesc')}
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <Star size={40} color="var(--accent)" style={{ marginBottom: '1rem' }} />
            <h3>{t('excellence')}</h3>
            <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>
              {t('excellenceDesc')}
            </p>
          </div>
        </div>
      </section>

      <HomePolls />
      {/* Preview Clubs Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('ourClubs')}</h2>
        <div className={styles.grid}>
          {clubs.map((club) => (
            <div key={club._id} className="card">
              <div style={{
                height: '160px',
                background: club.coverImage ? `url(${club.coverImage}) center/cover` : 'linear-gradient(45deg, #2a2a35, #1a1a20)',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.1)',
                overflow: 'hidden'
              }}>
                {!club.coverImage && formatDynamicText(club.name)}
              </div>
              <h3>{formatDynamicText(club.name)}</h3>
              <p style={{ margin: '0.5rem 0 1.5rem', opacity: 0.7, fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {club.description || t('noDescription')}
              </p>
              <Link href={`/clubs/${club.slug}`} className="btn btn-secondary" style={{ width: '100%' }}>
                {t('viewPage')}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Partners Marquee Section */}
      {partners.length > 0 && (
        <section className={styles.partnersMarquee}>
          <div className={styles.partnersTrack}>
            {[...partners, ...partners].map((partner, idx) => (
              <a
                key={`${partner._id}-${idx}`}
                href={partner.website || "#"}
                target={partner.website ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className={styles.partnerLink}
                title={partner.name}
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className={styles.partnerLogo}
                />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
