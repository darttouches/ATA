'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shield, ShieldAlert, Cpu, Users, Eye, Zap, Crosshair, ArrowRight, CheckCircle2, Download, Link as LinkIcon, Trash2, Edit3, X } from 'lucide-react';
import styles from '../admin.module.css';
import QRCode from 'qrcode';
import { useLanguage } from '@/context/LanguageContext';

export default function PhygitalGameDetails() {
    const { t, language } = useLanguage();
    const params = useParams();
    const router = useRouter();
    const [game, setGame] = useState(null);
    const [teams, setTeams] = useState([]);
    
    // Form States
    const [clueText, setClueText] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [points, setPoints] = useState(100);
    const [validationType, setValidationType] = useState('text');
    const [choiceCount, setChoiceCount] = useState(3);
    const [choicesArray, setChoicesArray] = useState(['', '', '']);
    const [correctChoiceIndices, setCorrectChoiceIndices] = useState([0]);
    const [editingStageId, setEditingStageId] = useState(null);
    const [teamName, setTeamName] = useState('');

    useEffect(() => {
        if (params.id) {
            fetchGame();
            fetchTeams();
            
            const interval = setInterval(() => {
                fetchTeams();
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [params.id]);

    const fetchGame = async () => {
        const res = await fetch(`/api/games/sarab-quest/admin/games/${params.id}`);
        const data = await res.json();
        if (data.success) setGame(data.data);
    };

    const fetchTeams = async () => {
        const res = await fetch(`/api/games/sarab-quest/admin/teams?gameId=${params.id}`);
        const data = await res.json();
        if (data.success) setTeams(data.data);
    };

    const handleSaveStage = async (e) => {
        e.preventDefault();
        
        let finalCorrectAnswer = correctAnswer;
        if (validationType === 'choice') {
            finalCorrectAnswer = choicesArray.filter((_, i) => correctChoiceIndices.includes(i)).sort().join(',');
        } else if ((validationType === 'qr' || validationType === 'nfc') && !editingStageId) {
            // Only auto-generate if it's a new stage, don't overwrite if editing unless needed
            finalCorrectAnswer = `PHYGITAL-CODE-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*1000)}`;
        }

        const bodyPayload = {
            gameId: params.id,
            clueText,
            correctAnswer: finalCorrectAnswer,
            basePoints: points,
            validationType: validationType,
            choices: validationType === 'choice' ? choicesArray.filter(s=>s.trim() !== '') : []
        };
        
        let url = '/api/games/sarab-quest/admin/stages';
        let method = 'POST';
        
        if (editingStageId) {
            bodyPayload.stageId = editingStageId;
            method = 'PUT';
            // If editing QR/NFC and they didn't manually change the hidden correct answer, keep the old one by not overriding finalCorrectAnswer above
        }
        
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
        });
        if ((await res.json()).success) {
            fetchGame();
            resetStageForm();
        }
    };

    const resetStageForm = () => {
        setEditingStageId(null);
        setClueText(''); setCorrectAnswer(''); setChoiceCount(3); setChoicesArray(['', '', '']); setCorrectChoiceIndices([0]); setPoints(100); setValidationType('text');
    };

    const handleEditStageClick = (stage) => {
        setEditingStageId(stage._id);
        setClueText(stage.clueText || '');
        setPoints(stage.basePoints || 100);
        setValidationType(stage.validationType || 'text');
        
        if (stage.validationType === 'choice') {
            setChoiceCount(stage.choices?.length || 2);
            setChoicesArray(stage.choices || ['', '']);
            
            // Map correct choice string back to indices
            if (stage.correctAnswer) {
                const correctStrings = stage.correctAnswer.split(',');
                const indices = [];
                (stage.choices || []).forEach((c, idx) => {
                    if (correctStrings.includes(c)) indices.push(idx);
                });
                setCorrectChoiceIndices(indices.length ? indices : [0]);
            }
        } else {
            setCorrectAnswer(stage.correctAnswer || '');
        }
    };

    const handleDeleteStage = async (stageId) => {
        if (!confirm(t('confirmDeleteStage'))) return;
        const res = await fetch(`/api/games/sarab-quest/admin/stages?stageId=${stageId}&gameId=${params.id}`, {
            method: 'DELETE'
        });
        if ((await res.json()).success) {
            fetchGame();
            if (editingStageId === stageId) resetStageForm();
        }
    };

    const handleAddTeam = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/games/sarab-quest/admin/teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId: params.id, teamName })
        });
        if ((await res.json()).success) {
            fetchTeams();
            setTeamName('');
        }
    };

    const handleUpdateStatus = async (status) => {
        const res = await fetch(`/api/games/sarab-quest/admin/games/${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if ((await res.json()).success) {
            fetchGame();
        }
    };

    const downloadQR = async (stage, index) => {
        try {
            const qrDataUrl = await QRCode.toDataURL(stage.correctAnswer, { 
                width: 400, 
                margin: 2,
                color: { dark: '#0a0a0a', light: '#ffffff' }
            });
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 500;
            const ctx = canvas.getContext('2d');
            
            // White Background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                
                // Add texts
                ctx.fillStyle = '#0a0a0a';
                ctx.textAlign = 'center';
                
                ctx.font = 'bold 24px sans-serif';
                ctx.fillText(`المهمة: ${game.name}`, 200, 430);
                
                ctx.font = '20px sans-serif';
                ctx.fillText(`مرحلة رقم #${index + 1}`, 200, 465);
                
                const a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = `QR_Game_${game.name}_Stage_${index + 1}.png`;
                a.click();
            };
            img.src = qrDataUrl;
        } catch (err) {
            console.error('Error generating QR', err);
        }
    };

    const copyNfcUrl = (code) => {
        const url = `${window.location.origin}/games/sarab-quest?nfc_payload=${code}`;
        navigator.clipboard.writeText(url).then(() => {
            alert(t('nfcCopySuccessTitle'));
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    };

    if (!game) return <div className={styles.adminContainer} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', direction: language === 'ar' ? 'rtl' : 'ltr'}}><div style={{color:'#00f0ff'}}>{t('loadingData')}</div></div>;

    return (
        <div className={styles.adminContainer} style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
            <button onClick={() => router.back()} className={styles.btnSecondary} style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px', width: 'fit-content'}}>
                {language !== 'ar' && <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />}
                {t('mainDashboardBtn')}
                {language === 'ar' && <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />}
            </button>
            
            <div className={styles.statusBar} style={{ flexDirection: language === 'ar' ? 'row-reverse' : 'row' }}>
                <div style={{flex: 1, textAlign: language === 'ar' ? 'right' : 'left'}}>
                    <h1 style={{fontSize: '2rem', fontFamily: 'Rajdhani', color: '#fff', margin: 0}}>{game.name}</h1>
                    <div style={{color: '#a67c52', fontSize: '0.9rem', marginTop: '5px'}}>
                        {t('startTime')} <span style={{ direction: 'ltr', display: 'inline-block' }}>{new Date(game.startTime).toLocaleString()}</span>
                    </div>
                </div>
                
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    {game.status !== 'ready' && <button onClick={() => handleUpdateStatus('ready')} className={styles.btnSecondary}>{t('setAsReadyBtn')}</button>}
                    {game.status !== 'active' && <button onClick={() => handleUpdateStatus('active')} className={styles.btnPrimary} style={{background: 'linear-gradient(135deg, rgba(0, 150, 0, 0.8) 0%, rgba(0, 229, 153, 0.6) 100%)', borderColor: '#00e599'}}>{t('startMissionActionBtn')}</button>}
                    {game.status === 'active' && <button onClick={() => handleUpdateStatus('completed')} className={styles.btnSecondary} style={{borderColor: '#ef4444', color: '#ef4444'}}>{t('endMissionActionBtn')}</button>}
                    
                    <div style={{marginRight: language === 'ar' ? '15px' : '0', marginLeft: language === 'ar' ? '0' : '15px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase'}}>{t('statusLabel')} 
                        <span style={{color: game.status === 'active' ? '#00e599' : '#fff', fontWeight: 'bold', marginLeft: '5px'}}>
                            {game.status === 'active' ? t('activeStatus') : game.status === 'completed' ? t('completedStatus') : t('draftStatus')}
                        </span>
                    </div>
                </div>
            </div>

            <div className={styles.grid} style={{gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '30px', direction: language === 'ar' ? 'rtl' : 'ltr'}}>
                
                {/* Clues / Stages */}
                <div className={styles.card}>
                    <div className={styles.cardHeader} style={{flexDirection: language === 'ar' ? 'row-reverse' : 'row'}}>
                        <span style={{color: '#00f0ff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', flexDirection: language === 'ar' ? 'row-reverse' : 'row'}}></span>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}><Crosshair size={18} /> {t('cluesAndStages')} ({game.stages?.length || 0})</div>
                    </div>
                    
                    <form onSubmit={handleSaveStage} style={{background: '#131922', padding: '15px', borderRadius: '8px', border: editingStageId ? '1px solid #ff9900' : '1px solid rgba(166,124,82,0.3)', marginBottom: '20px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px', flexDirection: language === 'ar' ? 'row' : 'row-reverse'}}>
                            <div style={{color: editingStageId ? '#ff9900' : '#00f0ff', fontSize: '0.9rem', fontFamily: 'Rajdhani', fontWeight: 'bold'}}>
                                {editingStageId ? t('editingClue') : t('addNewClue')}
                            </div>
                            {editingStageId && (
                                <button type="button" onClick={resetStageForm} style={{background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer'}}><X size={16}/></button>
                            )}
                        </div>
                        <input className={styles.input} placeholder={t('clueTextPlaceholder')} required value={clueText} onChange={e=>setClueText(e.target.value)} style={{ textAlign: language === 'ar' ? 'right' : 'left' }} />
                        
                        <div style={{display: 'flex', gap: '10px', marginBottom: '15px', background: '#090c10', padding: '5px', borderRadius: '8px', flexWrap: 'wrap'}}>
                            {[
                                { id: 'text', label: t('textBtn') },
                                { id: 'choice', label: t('choiceBtn') },
                                { id: 'qr', label: t('qrBtn') },
                                { id: 'nfc', label: t('nfcBtn') }
                            ].map(type => (
                                <button 
                                    key={type.id}
                                    type="button"
                                    onClick={() => setValidationType(type.id)}
                                    style={{
                                        flex: 1, 
                                        padding: '8px 5px', 
                                        borderRadius: '6px', 
                                        border: 'none',
                                        background: validationType === type.id ? 'linear-gradient(135deg, rgba(0, 229, 153, 0.2) 0%, rgba(0, 150, 0, 0.4) 100%)' : 'transparent',
                                        color: validationType === type.id ? '#00e599' : '#94a3b8',
                                        cursor: 'pointer',
                                        fontFamily: 'Rajdhani',
                                        fontWeight: validationType === type.id ? 'bold' : 'normal',
                                        border: validationType === type.id ? '1px solid #00e599' : '1px solid transparent'
                                    }}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                        
                        <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                            <div style={{flex: 1}}></div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <span style={{color: '#94a3b8', fontSize: '0.9rem'}}>{t('stagePointsLevel')}</span>
                                <input type="number" className={styles.input} style={{width: '100px', textAlign: 'center'}} placeholder={t('pointsPlaceholder')} value={points} onChange={e=>setPoints(e.target.value)} />
                            </div>
                        </div>
                        
                        {validationType === 'choice' && (
                            <div style={{background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', marginBottom: '15px'}}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', flexWrap: 'wrap'}}>
                                    <span style={{color: '#94a3b8', fontSize: '0.9rem', fontFamily: 'Orbitron'}}>{t('choiceCountLabel')}</span>
                                    <input 
                                        type="number" 
                                        min="2" max="6"
                                        className={styles.input} 
                                        value={choiceCount} 
                                        onChange={e => {
                                            const val = parseInt(e.target.value) || 2;
                                            setChoiceCount(val);
                                            const newArr = [...choicesArray];
                                            while (newArr.length < val) newArr.push('');
                                            setChoicesArray(newArr.slice(0, val));
                                        }}
                                        style={{width: '80px', padding: '5px', textAlign: 'center'}}
                                    />
                                    <span style={{color: '#a67c52', fontSize: '0.8rem', margin: language === 'ar' ? '0 10px 0 0' : '0 0 0 10px'}}>{t('selectCorrectAnswerInfo')}</span>
                                </div>

                                {choicesArray.map((choiceTxt, idx) => (
                                    <div key={idx} style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                                        <div 
                                            onClick={() => {
                                                if (correctChoiceIndices.includes(idx)) {
                                                    setCorrectChoiceIndices(correctChoiceIndices.filter(i => i !== idx));
                                                } else {
                                                    setCorrectChoiceIndices([...correctChoiceIndices, idx]);
                                                }
                                            }}
                                            style={{
                                                width: '24px', height: '24px', 
                                                borderRadius: '4px',
                                                border: '2px solid #00e599',
                                                background: correctChoiceIndices.includes(idx) ? '#00e599' : 'transparent',
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            {correctChoiceIndices.includes(idx) && <CheckCircle2 size={16} color="#000" />}
                                        </div>
                                        <div style={{color: '#ffb74d', fontFamily: 'Orbitron', fontWeight: 'bold'}}>{String.fromCharCode(65 + idx)}</div>
                                        <input 
                                            className={styles.input} 
                                            placeholder={`${t('choicePlaceholder')} ${idx + 1}`}
                                            required 
                                            value={choiceTxt} 
                                            onChange={e => {
                                                const newArr = [...choicesArray];
                                                newArr[idx] = e.target.value;
                                                setChoicesArray(newArr);
                                            }}
                                            style={{flex: 1, padding: '8px'}}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {validationType === 'text' && (
                           <input className={styles.input} placeholder={t('correctAnswerSecret')} required value={correctAnswer} onChange={e=>setCorrectAnswer(e.target.value)} style={{marginBottom: '10px', textAlign: language === 'ar' ? 'right' : 'left'}} />
                        )}
                        
                        <button className={styles.btnSecondary} style={{width: '100%', borderColor: editingStageId ? '#ff9900' : '#00f0ff', color: editingStageId ? '#ff9900' : '#00f0ff'}}>
                            {editingStageId ? t('saveEditsBtn') : t('addStageBtn')}
                        </button>
                    </form>

                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                        {game.stages?.map((stage, idx) => {
                            let typeLabel = t('writtenAnswer');
                            if(stage.validationType === 'choice') typeLabel = t('qcmChoices');
                            if(stage.validationType === 'qr') typeLabel = t('scanQr');
                            if(stage.validationType === 'nfc') typeLabel = t('scanNfc');
                            
                            return (
                                <div key={idx} style={{background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '6px', borderRight: '3px solid #d49a6a', borderLeft: 'none', position: 'relative'}}>
                                    <div style={{position: 'absolute', top: '10px', right: language === 'ar' ? 'auto' : '10px', left: language === 'ar' ? '10px' : 'auto', display: 'flex', gap: '5px'}}>
                                        <button type="button" onClick={() => handleEditStageClick(stage)} style={{background: 'transparent', border: 'none', color: '#ff9900', cursor: 'pointer', padding: '5px'}}><Edit3 size={16} /></button>
                                        <button type="button" onClick={() => handleDeleteStage(stage._id)} style={{background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px'}}><Trash2 size={16} /></button>
                                    </div>
                                    <div style={{color: '#d49a6a', fontSize: '0.8rem', fontFamily: 'Rajdhani', display: 'flex', justifyContent: 'flex-start', gap: '10px', marginBottom: '10px'}}>
                                        <span>{t('clueNumberPrefix')} {idx + 1} | {stage.basePoints} {t('pointsSuffix')}</span>
                                        <span style={{color: '#00f0ff', background: 'rgba(0,240,255,0.1)', padding: '2px 8px', borderRadius: '4px'}}>{typeLabel}</span>
                                    </div>
                                    <div style={{color: '#fff', margin: '5px 0'}}>{stage.clueText}</div>
                                    <div style={{fontSize: '0.8rem', color: '#00e599', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap'}}>
                                        <ShieldAlert size={12}/> {t('answerLabel')} {t('encryptedText')}
                                        {stage.validationType === 'choice' && <span style={{color: '#94a3b8', fontSize:'0.7rem', margin: language === 'ar' ? '0 10px 0 0' : '0 0 0 10px'}}>{t('choicesLabel')} {stage.choices?.join('، ')}</span>}
                                        
                                        {stage.validationType === 'qr' && (
                                            <button 
                                                type="button"
                                                onClick={() => downloadQR(stage, idx)}
                                                className={styles.btnSecondary} 
                                                style={{margin: language === 'ar' ? 'auto auto 0 0' : 'auto 0 0 auto', padding: '4px 10px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '5px'}}
                                            >
                                                <Download size={14} /> {t('downloadQrBtn')}
                                            </button>
                                        )}
                                        
                                        {stage.validationType === 'nfc' && (
                                            <button 
                                                type="button"
                                                onClick={() => copyNfcUrl(stage.correctAnswer)}
                                                className={styles.btnSecondary} 
                                                style={{margin: language === 'ar' ? 'auto auto 0 0' : 'auto 0 0 auto', padding: '4px 10px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '5px', borderColor: '#ff9900', color: '#ff9900'}}
                                            >
                                                <LinkIcon size={14} /> {t('copyNfcLinkBtn')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Teams / Liverboard */}
                <div className={styles.card}>
                    <div className={styles.cardHeader} style={{flexDirection: language === 'ar' ? 'row-reverse' : 'row'}}>
                        <span style={{color: '#00f0ff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', flexDirection: language === 'ar' ? 'row-reverse' : 'row'}}><Cpu size={12} /> {t('synchronized')}</span>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}><Users size={18} /> {t('competingTeams')} ({teams.length})</div>
                    </div>
                    
                    <form onSubmit={handleAddTeam} style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
                        <input className={styles.input} style={{marginBottom: 0, textAlign: language === 'ar' ? 'right' : 'left'}} placeholder={t('newTeamPlaceholder')} required value={teamName} onChange={e=>setTeamName(e.target.value)} />
                        <button className={styles.btnPrimary}>{t('addTeamBtn')}</button>
                    </form>

                    <table className={styles.table} style={{textAlign: language === 'ar' ? 'right' : 'left'}}>
                        <thead>
                            <tr>
                                <th style={{textAlign: language === 'ar' ? 'right' : 'left'}}>{t('teamCol')}</th>
                                <th style={{textAlign: language === 'ar' ? 'right' : 'left'}}>{t('accessCodeCol')}</th>
                                <th style={{textAlign: language === 'ar' ? 'right' : 'left'}}>{t('stageCol')}</th>
                                <th style={{textAlign: language === 'ar' ? 'right' : 'left'}}>{t('pointsCol')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams.map((team, idx) => (
                                <tr key={idx} style={{background: idx === 0 && team.score > 0 ? 'rgba(255, 153, 0, 0.1)' : 'transparent'}}>
                                    <td style={{fontWeight: 'bold', color: idx === 0 && team.score > 0 ? '#ff9900' : '#fff'}}>
                                        {idx === 0 && team.score > 0 && '👑 '}
                                        {team.teamName}
                                    </td>
                                    <td><span className={styles.codeBox}>{team.accessCode}</span></td>
                                    <td style={{color: '#a67c52', direction: 'ltr', textAlign: language === 'ar' ? 'right' : 'left'}}>{team.currentStageIndex} / {game.stages?.length}</td>
                                    <td style={{color: '#00f0ff', fontFamily: 'Orbitron', fontWeight: 'bold'}}>{team.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
