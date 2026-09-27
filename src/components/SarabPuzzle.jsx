import React, { useState, useEffect } from 'react';

export default function SarabPuzzle({ stage, onSolve, t }) {
    const { puzzleImage, puzzleGridSize, clueText } = stage;
    const gridSize = puzzleGridSize || 3;
    const totalPieces = gridSize * gridSize;

    const [pieces, setPieces] = useState([]);
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [isSolved, setIsSolved] = useState(false);
    const [imageRatio, setImageRatio] = useState(1);

    useEffect(() => {
        // Load aspect ratio
        if (typeof window !== 'undefined' && puzzleImage) {
            const img = new window.Image();
            img.onload = () => {
                if (img.height > 0) setImageRatio(img.width / img.height);
            };
            img.src = puzzleImage;
        }

        // Initialize and shuffle
        let initialPieces = Array.from({ length: totalPieces }, (_, i) => i);
        // Shuffle (Fisher-Yates)
        for (let i = initialPieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [initialPieces[i], initialPieces[j]] = [initialPieces[j], initialPieces[i]];
        }
        setPieces(initialPieces);
        setIsSolved(false);
    }, [puzzleImage, puzzleGridSize]);

    const handlePieceClick = (index) => {
        if (isSolved) return;

        if (selectedIdx === null) {
            setSelectedIdx(index);
        } else {
            // Swap
            if (selectedIdx !== index) {
                const newPieces = [...pieces];
                const temp = newPieces[selectedIdx];
                newPieces[selectedIdx] = newPieces[index];
                newPieces[index] = temp;
                setPieces(newPieces);

                // Check win
                const win = newPieces.every((val, i) => val === i);
                if (win) {
                    setIsSolved(true);
                }
            }
            setSelectedIdx(null);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: '20px' }}>
            {!isSolved ? (
                <>
                    <h3 style={{ fontFamily: 'Rajdhani', color: '#00e5ff', marginBottom: '15px' }}>{t('puzzleBtn') || 'Puzzle'}</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                        gap: '2px',
                        width: '100%',
                        maxWidth: '350px',
                        aspectRatio: imageRatio,
                        background: '#1a110b',
                        padding: '4px',
                        borderRadius: '8px',
                        boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)'
                    }}>
                        {pieces.map((originalIndex, currentIndex) => {
                            // Calculate position for background
                            const row = Math.floor(originalIndex / gridSize);
                            const col = originalIndex % gridSize;
                            
                            const bgPosX = (col / (gridSize - 1)) * 100;
                            const bgPosY = (row / (gridSize - 1)) * 100;

                            const isSelected = selectedIdx === currentIndex;

                            return (
                                <div
                                    key={currentIndex}
                                    onClick={() => handlePieceClick(currentIndex)}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        backgroundImage: `url(${puzzleImage})`,
                                        backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                                        backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                                        cursor: 'pointer',
                                        boxSizing: 'border-box',
                                        border: isSelected ? '3px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)',
                                        transition: 'border 0.2s, transform 0.1s',
                                        transform: isSelected ? 'scale(0.95)' : 'scale(1)'
                                    }}
                                />
                            );
                        })}
                    </div>
                    <div style={{ marginTop: '15px', color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
                        Cliquez sur deux pièces pour échanger leurs positions et reformer l'image.
                    </div>
                </>
            ) : (
                <div style={{ width: '100%', textAlign: 'center', animation: 'fadeIn 1s' }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '350px',
                        aspectRatio: imageRatio,
                        margin: '0 auto 20px',
                        backgroundImage: `url(${puzzleImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '12px',
                        border: '2px solid #00e599',
                        boxShadow: '0 0 20px rgba(0,229,153,0.4)'
                    }} />
                    
                    <h3 style={{ color: '#00e599', fontFamily: 'Rajdhani', fontSize: '1.5rem', marginBottom: '10px' }}>
                        {t('solvedPuzzleText') || "Bien joué ! Voici l'indice caché :"}
                    </h3>
                    
                    <div style={{ 
                        background: 'rgba(0, 229, 153, 0.1)', 
                        border: '1px solid #00e599', 
                        padding: '15px', 
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1.2rem',
                        marginBottom: '20px',
                        fontFamily: 'Orbitron'
                    }}>
                        {clueText}
                    </div>

                    <button 
                        onClick={onSolve}
                        style={{
                            background: 'linear-gradient(135deg, rgba(0, 229, 153, 0.8) 0%, rgba(0, 150, 0, 0.6) 100%)',
                            border: '1px solid #00e599',
                            color: '#fff',
                            padding: '12px 25px',
                            fontFamily: 'Rajdhani',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            boxShadow: '0 0 15px rgba(0,229,153,0.3)'
                        }}
                    >
                        {t('continueBtn') || "Passer à l'étape suivante"}
                    </button>
                </div>
            )}
        </div>
    );
}
