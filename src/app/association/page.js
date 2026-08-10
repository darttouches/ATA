'use client';
import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Palette, Music, Theater, Camera, Users, Target, Heart, Award, ArrowRight } from 'lucide-react';
import styles from './association.module.css';
import Link from 'next/link';

export default function AssociationMagazine() {
    const [currentPage, setCurrentPage] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    
    // Disable right click / print for a real app feel
    useEffect(() => {
        const handleContext = (e) => e.preventDefault();
        window.addEventListener('contextmenu', handleContext);
        return () => window.removeEventListener('contextmenu', handleContext);
    }, []);

    const totalPages = 12;

    const nextPage = () => {
        if (currentPage < totalPages - 1 && !isAnimating) {
            setIsAnimating(true);
            setCurrentPage(p => p + 1);
            setTimeout(() => setIsAnimating(false), 600);
        }
    };

    const prevPage = () => {
        if (currentPage > 0 && !isAnimating) {
            setIsAnimating(true);
            setCurrentPage(p => p - 1);
            setTimeout(() => setIsAnimating(false), 600);
        }
    };

    const pages = [
        // Page 1: Cover (Index 0)
        <div key="cover" className={`${styles.pageContent} ${currentPage === 0 ? styles.pageActive : ''} ${currentPage > 0 ? styles.pagePrev : ''} ${styles.coverLayout}`}>
            <span className={styles.coverTag}>Année Culturelle 2026-2027</span>
            <h1 className={styles.coverTitle}>Touches d&apos;Art</h1>
            <p className={styles.coverSubtitle}>L&apos;association tunisienne dédiée à l&apos;expression artistique et culturelle de la jeunesse.</p>
        </div>,
        
        // Page 2: Qui sommes-nous (Index 1)
        <div key="p1" className={`${styles.pageContent} ${currentPage === 1 ? styles.pageActive : ''} ${currentPage > 1 ? styles.pagePrev : ''}`}>
            <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>Qui sommes-nous ?</h2>
                <p className={styles.pageIntro}>Présentation de l&apos;association Touches d&apos;Art</p>
            </div>
            <div className={styles.bentoGrid} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                <div className={styles.glassCard}>
                    <p className={styles.cardDesc} style={{fontSize: '1.2rem', lineHeight: '1.8'}}>
                        &quot;Touches d&apos;Art&quot; est une association culturelle qui accueille un groupe de jeunes créatifs dotés de talents variés, 
                        tels que l&apos;organisation d&apos;événements, l&apos;animation de publics, le journalisme et les médias, la peinture, le chant 
                        et bien d&apos;autres formes d&apos;art et de talents.
                    </p>
                </div>
            </div>
        </div>,

        // Page 3: Notre mission (Index 2)
        <div key="p2" className={`${styles.pageContent} ${currentPage === 2 ? styles.pageActive : ''} ${currentPage > 2 ? styles.pagePrev : ''}`}>
            <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>Notre Mission</h2>
            </div>
            <div className={styles.glassCard} style={{flex: 1, justifyContent: 'center', textAlign: 'center', padding: '3rem'}}>
                <Heart size={48} color="#ef4444" style={{margin: '0 auto 20px'}} />
                <h3 className={styles.cardTitle} style={{fontSize: '2rem'}}>Éveiller la jeunesse par l&apos;art</h3>
                <p className={styles.cardDesc} style={{fontSize: '1.2rem', marginTop: '20px'}}>
                    Nous existons pour offrir un espace sécurisé où les jeunes peuvent explorer leurs passions, 
                    développer leurs talents et construire une communauté solidaire à travers des initiatives culturelles et sociales.
                </p>
            </div>
        </div>,

        // Page 4: Nos objectifs (Index 3)
        <div key="p3" className={`${styles.pageContent} ${currentPage === 3 ? styles.pageActive : ''} ${currentPage > 3 ? styles.pagePrev : ''}`}>
            <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>Nos Objectifs</h2>
            </div>
            <div className={styles.bentoGrid}>
                {[
                    "Contribuer à ancrer les valeurs du bénévolat et de l'esprit d'initiative dans les milieux jeunes.",
                    "Soutenir le tourisme intérieur et promouvoir les sites touristiques.",
                    "Promouvoir les monuments historiques en Tunisie en coordination avec les responsables."
                ].map((obj, i) => (
                    <div key={i} className={styles.glassCard} style={{flexDirection: 'row', alignItems: 'center', gap: '15px'}}>
                        <Target size={24} color="#60a5fa" />
                        <span style={{fontSize: '1.1rem'}}>{obj}</span>
                    </div>
                ))}
            </div>
        </div>,

        // Page 5: Domaines d'activité 1 (Index 4)
        <div key="p4" className={`${styles.pageContent} ${currentPage === 4 ? styles.pageActive : ''} ${currentPage > 4 ? styles.pagePrev : ''}`}>
             <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>Nos Domaines d&apos;Activité</h2>
            </div>
            <div className={styles.bentoGrid} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                <div className={styles.glassCard}>
                    <div className={styles.cardIcon}><Palette /></div>
                    <h3 className={styles.cardTitle}>Domaine Culturel & Artistique</h3>
                    <p className={styles.cardDesc}>Le club se concentre sur l&apos;aspect culturel, particulièrement chez les jeunes, en organisant des activités culturelles visant à enrichir la scène culturelle et à apporter des touches artistiques.</p>
                </div>
            </div>
        </div>,
        
        // Page 6: Domaines d'activité 2 (Index 5)
        <div key="p5" className={`${styles.pageContent} ${currentPage === 5 ? styles.pageActive : ''} ${currentPage > 5 ? styles.pagePrev : ''}`}>
             <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>Domaines d&apos;Activité (Suite)</h2>
            </div>
            <div className={styles.bentoGrid} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                <div className={styles.glassCard}>
                    <div className={styles.cardIcon}><Users /></div>
                    <h3 className={styles.cardTitle}>Domaine Social & Éducatif</h3>
                    <p className={styles.cardDesc}>Nous créons une cohérence entre le nom et le thème de l&apos;association en favorisant l&apos;apprentissage collectif et le partage de savoir-faire entre les membres.</p>
                </div>
                <div className={styles.glassCard}>
                    <div className={styles.cardIcon}><Theater /></div>
                    <h3 className={styles.cardTitle}>Domaine Récréatif</h3>
                    <p className={styles.cardDesc}>Des moments de détente pour les membres, tout en ouvrant nos portes au public à travers l&apos;organisation d&apos;activités diverses et de sorties récréatives.</p>
                </div>
            </div>
        </div>,
        
        // Page 7: Intro aux événements (Index 6)
        <div key="p6" className={`${styles.pageContent} ${currentPage === 6 ? styles.pageActive : ''} ${currentPage > 6 ? styles.pagePrev : ''}`}>
            <div className={styles.glassCard} style={{flex: 1, justifyContent: 'center', textAlign: 'center', padding: '3rem'}}>
                <Camera size={48} color="#f59e0b" style={{margin: '0 auto 20px'}} />
                <h3 className={styles.cardTitle} style={{fontSize: '2rem'}}>4 Années d&apos;Action</h3>
                <p className={styles.cardDesc} style={{fontSize: '1.2rem', marginTop: '20px'}}>
                    Tournez les pages suivantes pour découvrir les temps forts et les événements marquants de l&apos;association Touches d&apos;Art depuis sa création.
                </p>
            </div>
        </div>,

        // Page 8: Timeline 1 (Index 7)
        <div key="p7" className={`${styles.pageContent} ${currentPage === 7 ? styles.pageActive : ''} ${currentPage > 7 ? styles.pagePrev : ''}`}>
             <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>Nos Événements Marquants (1/4)</h2>
            </div>
            <div className={styles.timeline}>
                {[
                    { year: "Août 2022", event: "Lancement officiel de club touches d'art" },
                    { year: "Août 2022", event: "100ans Cinéma", desc: "\"By the Sea in Monastir\"" },
                    { year: "Décembre 2022", event: "THE AREA", desc: "Participation en tant que partenaires à l'un des plus grands événements TI en Tunisie." },
                    { year: "Avril 2023", event: "Event Sport ISIMS", desc: "Événement sportif spécial en Ramadan, organisé à l’ISIMS !" }
                ].map((item, i) => (
                    <div key={i} className={styles.timelineNode}>
                        <div className={styles.timelineYear}>{item.year}</div>
                        <div className={styles.timelineEvent}>{item.event}</div>
                        {item.desc && <div className={styles.cardDesc}>{item.desc}</div>}
                    </div>
                ))}
            </div>
        </div>,

        // Page 9: Timeline 2 (Index 8)
        <div key="p8" className={`${styles.pageContent} ${currentPage === 8 ? styles.pageActive : ''} ${currentPage > 8 ? styles.pagePrev : ''}`}>
             <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>Nos Événements Marquants (2/4)</h2>
            </div>
            <div className={styles.timeline}>
                {[
                    { year: "Août 2023", event: "FITUM Monastir", desc: "Participation au Festival International du Théâtre Universitaire de Monastir edition 19." },
                    { year: "Avril 2024", event: "Forum International pour l'Éducation Citoyenne", desc: "Contributeurs au succès du Forum dans le domaine de l'organisation et de la médiatisation." },
                    { year: "Mai 2024", event: "Sortie au vélo au Mahdia", desc: "Zone touristique 'Skifa Kahla', tour de Mahdia." }
                ].map((item, i) => (
                    <div key={i} className={styles.timelineNode}>
                        <div className={styles.timelineYear}>{item.year}</div>
                        <div className={styles.timelineEvent}>{item.event}</div>
                        {item.desc && <div className={styles.cardDesc}>{item.desc}</div>}
                    </div>
                ))}
            </div>
        </div>,

        // Page 10: Timeline 3 (Index 9)
        <div key="p9" className={`${styles.pageContent} ${currentPage === 9 ? styles.pageActive : ''} ${currentPage > 9 ? styles.pagePrev : ''}`}>
             <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>Nos Événements Marquants (3/4)</h2>
            </div>
            <div className={styles.timeline}>
                {[
                    { year: "Novembre 2024", event: "Visite El Jam et Kairouan", desc: "Médina, Grande Mosquée, mausolée de Sidi Sahbi, et découverte du Colisée d'El Jem." },
                    { year: "Juillet 2025", event: "Camping", desc: "Camping à Oued El Ksab, Kélibia." },
                    { year: "Octobre 2025", event: "Festival National des Beaux-Arts", desc: "Participation au Festival National Universitaire des Beaux-Arts – Mahdia." },
                    { year: "Novembre 2025", event: "Café Artistique", desc: "Événement culturel à Monastir." }
                ].map((item, i) => (
                    <div key={i} className={styles.timelineNode}>
                        <div className={styles.timelineYear}>{item.year}</div>
                        <div className={styles.timelineEvent}>{item.event}</div>
                        {item.desc && <div className={styles.cardDesc}>{item.desc}</div>}
                    </div>
                ))}
            </div>
        </div>,

        // Page 11: Timeline 4 (Index 10)
        <div key="p10" className={`${styles.pageContent} ${currentPage === 10 ? styles.pageActive : ''} ${currentPage > 10 ? styles.pagePrev : ''}`}>
             <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>Nos Événements Marquants (4/4)</h2>
            </div>
            <div className={styles.timeline}>
                {[
                    { year: "Janvier 2026", event: "Camping", desc: "Camping au Borj Cedria." },
                    { year: "Février 2026", event: "Journée Community AI", desc: "Organisation de la Journée Community AI Mehdia 2026 dans sa première édition." },
                    { year: "Avril 2026", event: "Hackathon", desc: "Hackathon 'Marketing & AI Agent'." }
                ].map((item, i) => (
                    <div key={i} className={styles.timelineNode}>
                        <div className={styles.timelineYear}>{item.year}</div>
                        <div className={styles.timelineEvent}>{item.event}</div>
                        {item.desc && <div className={styles.cardDesc}>{item.desc}</div>}
                    </div>
                ))}
            </div>
        </div>,

        // Page 12: Rejoignez-nous (Index 11)
        <div key="p11" className={`${styles.pageContent} ${currentPage === 11 ? styles.pageActive : ''} ${currentPage > 11 ? styles.pagePrev : ''}`}>
             <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>Perspectives & Avenir</h2>
            </div>
            <p className={styles.pageIntro} style={{marginBottom: '2rem'}}>
                Et l&apos;aventure continue ! Touches d&apos;Art vise toujours plus haut pour impacter la jeunesse tunisienne.
            </p>
            <div className={styles.glassCard} style={{textAlign: 'center', background: 'rgba(59, 130, 246, 0.1)', flex: 1, justifyContent: 'center'}}>
                <h3 style={{fontSize: '2rem', marginBottom: '15px'}}>L&apos;aventure vous tente ?</h3>
                <p className={styles.cardDesc} style={{marginBottom: '30px'}}>
                    Rejoignez une famille d&apos;artistes et donnez vie à vos projets culturels !
                </p>
                <Link href="/join" className={styles.navBtn} style={{background: '#3b82f6', display: 'inline-flex', margin: '0 auto', fontSize: '1.2rem', padding: '15px 30px', color: '#fff'}}>
                    Rejoignez-nous <ArrowRight size={20}/>
                </Link>
            </div>
        </div>
    ];

    return (
        <div className={styles.wrapper}>
            <div className={styles.ambientGlow1}></div>
            <div className={styles.ambientGlow2}></div>

            <header className={styles.navHeader}>
                <div className={styles.pagination}>
                    <button onClick={prevPage} disabled={currentPage === 0} className={styles.navBtn}>
                        <ChevronLeft size={18} /> Précédent
                    </button>
                    <span className={styles.pageCounter}>
                        {(currentPage + 1).toString().padStart(2, '0')} / {totalPages.toString().padStart(2, '0')}
                    </span>
                    <button onClick={nextPage} disabled={currentPage === totalPages - 1} className={styles.navBtn}>
                        Suivant <ChevronRight size={18} />
                    </button>
                </div>
            </header>

            <main className={styles.bookContainer}>
                <div className={styles.pageWrapper}>
                    {pages}
                </div>
            </main>
        </div>
    );
}
