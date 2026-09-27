import React, { useState, useEffect } from 'react';

export default function SarabTaquin({ stage, onSolve, t }) {
    const { puzzleGridSize, clueText } = stage;
    const gridSize = puzzleGridSize || 4;
    const totalPieces = gridSize * gridSize;

    const [tiles, setTiles] = useState([]);
    const [isSolved, setIsSolved] = useState(false);

    useEffect(() => {
        // Initialize finished state
        let initialTiles = Array.from({ length: totalPieces }, (_, i) => i + 1);
        initialTiles[totalPieces - 1] = 0; // 0 represents the empty block

        // Shuffle by making 500 random valid moves to ensure solvability
        let emptyPos = totalPieces - 1;
        
        for (let i = 0; i < 500; i++) {
            const possibleMoves = [];
            const row = Math.floor(emptyPos / gridSize);
            const col = emptyPos % gridSize;

            if (row > 0) possibleMoves.push(emptyPos - gridSize); // Top
            if (row < gridSize - 1) possibleMoves.push(emptyPos + gridSize); // Bottom
            if (col > 0) possibleMoves.push(emptyPos - 1); // Left
            if (col < gridSize - 1) possibleMoves.push(emptyPos + 1); // Right
            
            const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            
            // Swap
            initialTiles[emptyPos] = initialTiles[move];
            initialTiles[move] = 0;
            emptyPos = move;
        }

        setTiles(initialTiles);
        setIsSolved(false);
    }, [puzzleGridSize]);

    const handleTileClick = (index) => {
        if (isSolved) return;
        if (tiles[index] === 0) return;

        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        const emptyIndex = tiles.indexOf(0);
        const emptyRow = Math.floor(emptyIndex / gridSize);
        const emptyCol = emptyIndex % gridSize;

        // Check if adjacent
        const isAdjacent = Math.abs(row - emptyRow) + Math.abs(col - emptyCol) === 1;

        if (isAdjacent) {
            const newTiles = [...tiles];
            newTiles[emptyIndex] = newTiles[index];
            newTiles[index] = 0;
            setTiles(newTiles);

            // Check win
            let win = true;
            for (let i = 0; i < totalPieces - 1; i++) {
                if (newTiles[i] !== i + 1) {
                    win = false;
                    break;
                }
            }
            if (win && newTiles[totalPieces - 1] === 0) {
                setIsSolved(true);
            }
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'Rajdhani', color: '#ffd700', marginBottom: '15px' }}>{t('taquinBtn') || 'Taquin Mécanique'}</h3>
            
            <div style={{
                position: 'relative',
                padding: '12px',
                background: 'linear-gradient(135deg, #4a3424 0%, #2a1d12 100%)',
                border: '8px solid #3c2a1a',
                borderRadius: '8px',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,1), 0 0 15px rgba(0,0,0,0.5)',
                width: '100%',
                maxWidth: '350px'
            }}>
                {/* Decorative border gears abstraction */}
                <div style={{position: 'absolute', top: -10, left: -10, width: 20, height: 20, background: '#a67c52', borderRadius: '50%', boxShadow: ' inset -2px -2px 4px rgba(0,0,0,0.6)'}}></div>
                <div style={{position: 'absolute', top: -10, right: -10, width: 20, height: 20, background: '#a67c52', borderRadius: '50%', boxShadow: ' inset -2px -2px 4px rgba(0,0,0,0.6)'}}></div>
                <div style={{position: 'absolute', bottom: -10, left: -10, width: 20, height: 20, background: '#a67c52', borderRadius: '50%', boxShadow: ' inset -2px -2px 4px rgba(0,0,0,0.6)'}}></div>
                <div style={{position: 'absolute', bottom: -10, right: -10, width: 20, height: 20, background: '#a67c52', borderRadius: '50%', boxShadow: ' inset -2px -2px 4px rgba(0,0,0,0.6)'}}></div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    gap: '4px',
                    width: '100%',
                    aspectRatio: '1',
                }}>
                    {tiles.map((tile, index) => {
                        const isEmpty = tile === 0;

                        return (
                            <div
                                key={index}
                                onClick={() => handleTileClick(index)}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    background: isEmpty ? '#1a110b' : 'linear-gradient(135deg, #a67c52, #5a3d2b)',
                                    boxShadow: isEmpty ? 'inset 0 0 10px rgba(0,0,0,0.8)' : 'inset -2px -2px 5px rgba(0,0,0,0.7), inset 2px 2px 5px rgba(255,255,255,0.2), 2px 2px 5px rgba(0,0,0,0.5)',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: isEmpty ? 'default' : (isSolved ? 'default' : 'pointer'),
                                    transition: 'transform 0.1s',
                                }}
                            >
                                {!isEmpty && (
                                    <span style={{
                                        fontFamily: 'Orbitron',
                                        fontSize: gridSize > 4 ? '1.2rem' : '1.8rem',
                                        fontWeight: 'bold',
                                        color: '#d49a6a', // Bronze gold
                                        textShadow: '1px 1px 2px rgba(255,255,255,0.2), -1px -1px 2px rgba(0,0,0,0.8)'
                                    }}>
                                        {tile}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bronze Plaque Bottom */}
            {isSolved ? (
                <div style={{ marginTop: '20px', width: '100%', maxWidth: '350px', animation: 'fadeIn 1s' }}>
                    
                    <div style={{
                        background: 'linear-gradient(135deg, #d49a6a 0%, #a67c52 50%, #5a3d2b 100%)',
                        border: '2px solid #3c2a1a',
                        borderRadius: '4px',
                        padding: '15px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.5), inset 0 0 10px rgba(255,255,255,0.2)',
                        textAlign: 'center',
                        position: 'relative'
                    }}>
                        <h4 style={{ color: '#ffea00', fontFamily: 'Rajdhani', margin: '0 0 10px 0', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                             {t('solvedTaquinText') || "Mécanisme déverrouillé !"}
                        </h4>
                        <div style={{ 
                            color: '#1a110b', 
                            fontSize: '1.2rem', 
                            fontFamily: 'Orbitron', 
                            fontWeight: 'bold',
                            background: 'rgba(255,255,255,0.1)',
                            padding: '10px',
                            borderRadius: '4px',
                            border: '1px solid rgba(0,0,0,0.2)'
                        }}>
                            {clueText}
                        </div>
                    </div>

                    <button 
                        onClick={onSolve}
                        style={{
                            marginTop: '20px',
                            background: 'linear-gradient(135deg, #00e599 0%, #009600 100%)',
                            border: '1px solid #00ffaa',
                            color: '#fff',
                            padding: '12px 25px',
                            fontFamily: 'Rajdhani',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            width: '100%',
                            boxShadow: '0 0 15px rgba(0,229,153,0.3)'
                        }}
                    >
                        {t('continueBtn') || "Passer à l'étape suivante"}
                    </button>
                </div>
            ) : (
                <div style={{ marginTop: '15px', color: '#d49a6a', fontSize: '0.9rem', textAlign: 'center', maxWidth: '300px' }}>
                    Faites glisser les pierres dans la case vide pour rétablir l'ordre logique (1 à {totalPieces - 1}).
                </div>
            )}
        </div>
    );
}
