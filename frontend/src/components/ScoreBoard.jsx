import React from 'react';


export default function ScoreBoard({ score, playerName, avatar, botScore }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span>Pemain & Skor</span>
        <span style={{ fontSize: '20px' }}>🏆</span>
      </div>
      
      <ul className="scoreboard-list">
        {/* User Card */}
        <li className="player-card active">
          <div className="avatar-circle" style={{ backgroundColor: '#ffcc80' }}>
            {avatar}
          </div>
          <div className="player-info">
            <div className="player-name">{playerName} (Kamu)</div>
            <div className="player-score">
              <span style={{ fontSize: '16px', filter: 'grayscale(100%) brightness(0)' }}>⭐</span>
              <span>{score} Bintang</span>
            </div>
          </div>
        </li>

        {/* Robot Teammate Card */}
        <li className="player-card bot">
          <div className="avatar-circle" style={{ backgroundColor: '#a5d6a7' }}>
            🤖
          </div>
          <div className="player-info">
            <div className="player-name">Robot Pintar</div>
            <div className="player-score">
              <span style={{ fontSize: '16px', filter: 'grayscale(100%) brightness(0)' }}>⭐</span>
              <span>{botScore} Bintang</span>
            </div>
          </div>
        </li>
      </ul>
      
      <div style={{ padding: '12px', borderTop: '2px solid var(--border-color)', background: '#fafafa', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Tunjukan buah ke kamera untuk mendapat Bintang! ⭐
      </div>
    </div>
  );
}
