import React from 'react';


export default function ControlPanel({ 
  voiceEnabled, 
  setVoiceEnabled, 
  sabarMode, 
  setSabarMode, 
  isMuted, 
  setIsMuted, 
  confidenceThreshold, 
  setConfidenceThreshold, 
  onSkipLevel,
  gameStarted,
  onSimulateSuccess,
  onSimulateFruit
}) {
  return (
    <div className="panel" style={{ marginTop: '20px' }}>
      <div className="panel-header">
        <span>Pengaturan & Aksesibilitas</span>
        <span style={{ fontSize: '20px' }}>⚙️</span>
      </div>
      
      <div className="settings-grid">
        {/* Toggle Audio Mute */}
        <div className="setting-item">
          <span className="setting-label">Efek Suara:</span>
          <button 
            className={`btn ${isMuted ? 'btn-danger' : 'btn-success'}`}
            style={{ fontSize: '1rem', padding: '8px 15px' }}
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <span>🔇</span> : <span>🔊</span>}
            <span>{isMuted ? 'Muted' : 'Aktif'}</span>
          </button>
        </div>

        {/* Toggle Voice Assist */}
        <div className="setting-item">
          <span className="setting-label">Bantuan Suara (TTS):</span>
          <button 
            className={`btn ${voiceEnabled ? 'btn-success' : 'btn-danger'}`}
            style={{ fontSize: '1rem', padding: '8px 15px' }}
            onClick={() => setVoiceEnabled(!voiceEnabled)}
          >
            {voiceEnabled ? <span>🔊</span> : <span>🔇</span>}
            <span>{voiceEnabled ? 'Aktif' : 'Nonaktif'}</span>
          </button>
        </div>

        {/* Toggle Sabar Mode */}
        <div className="setting-item">
          <span className="setting-label">Mode Sabar (Tanpa Waktu):</span>
          <button 
            className={`btn ${sabarMode ? 'btn-success' : 'btn-warning'}`}
            style={{ fontSize: '1rem', padding: '8px 15px' }}
            onClick={() => setSabarMode(!sabarMode)}
          >
            <span>⏳</span>
            <span>{sabarMode ? 'Aktif' : 'Nonaktif'}</span>
          </button>
        </div>

        {/* Skip Level Button */}
        <div className="setting-item">
          <span className="setting-label">Lewati Tugas:</span>
          <button 
            className="btn btn-primary"
            style={{ fontSize: '1rem', padding: '8px 15px' }}
            onClick={onSkipLevel}
            disabled={!gameStarted}
          >
            <span>⏭️</span>
            <span>Lewati Level</span>
          </button>
        </div>

        {/* Confidence Threshold slider */}
        <div className="setting-item" style={{ gridColumn: 'span 2', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', width: '100%' }}>
            <span className="setting-label" style={{ flex: 1 }}>Sensitivitas Deteksi (Conf):</span>
            <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{Math.round(confidenceThreshold * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0.30" 
            max="0.80" 
            step="0.05" 
            value={confidenceThreshold} 
            onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
            style={{ width: '100%', height: '8px', borderRadius: '4px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            *Turunkan persentase jika buah sulit terdeteksi di ruangan yang redup.
          </span>
        </div>

        {/* Simulator & Testing Section */}
        <div className="setting-item" style={{ gridColumn: 'span 2', marginTop: '15px', borderTop: '2px dashed var(--border-color)', paddingTop: '15px' }}>
          <span className="setting-label" style={{ marginBottom: '8px', color: 'var(--color-primary)' }}>🛠️ Alat Simulasi Deteksi (Untuk Uji Coba):</span>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Quick Level Success Button */}
            <button 
              className="btn btn-warning" 
              style={{ width: '100%', fontSize: '1.1rem', padding: '10px' }}
              onClick={onSimulateSuccess}
              disabled={!gameStarted}
            >
              <span>✨ Simulasikan Keberhasilan Level</span>
            </button>

            {/* Individual Fruit Buttons */}
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, fontSize: '0.9rem', padding: '8px' }}
                onClick={() => onSimulateFruit(0)}
                disabled={!gameStarted}
              >
                <span>Pisang 🍌</span>
              </button>
              <button 
                className="btn btn-danger" 
                style={{ flex: 1, fontSize: '0.9rem', padding: '8px' }}
                onClick={() => onSimulateFruit(1)}
                disabled={!gameStarted}
              >
                <span>Tomat Merah 🍅</span>
              </button>
              <button 
                className="btn btn-success" 
                style={{ flex: 1, fontSize: '0.9rem', padding: '8px' }}
                onClick={() => onSimulateFruit(2)}
                disabled={!gameStarted}
              >
                <span>Tomat Hijau 🍏</span>
              </button>
            </div>
          </div>
        </div>

        {/* Shutdown Button */}
        <div className="setting-item" style={{ gridColumn: 'span 2', marginTop: '15px', borderTop: '2px dashed var(--border-color)', paddingTop: '15px' }}>
          <button 
            className="btn btn-danger" 
            style={{ width: '100%', fontSize: '1.2rem', padding: '12px', fontWeight: 'bold' }}
            onClick={() => {
              if (window.confirm("Apakah Anda yakin ingin mematikan mesin SortEdu dan kamera?")) {
                fetch('/api/shutdown', { method: 'POST' }).then(() => {
                  alert("Sistem berhasil dimatikan. Anda boleh menutup tab browser ini.");
                  window.close();
                }).catch(e => {
                  // If fetch fails because server closed immediately, it's also a success
                  alert("Sistem berhasil dimatikan. Anda boleh menutup tab browser ini.");
                  window.close();
                });
              }
            }}
          >
            <span>🛑 MATIKAN SISTEM & KAMERA</span>
          </button>
        </div>

      </div>
    </div>
  );
}
