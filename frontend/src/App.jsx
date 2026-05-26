import React, { useState, useEffect, useRef } from 'react';

import confetti from 'canvas-confetti';
import { gameAudio } from './utils/audio';
import { ttsAssist } from './utils/tts';

// Components
import GameScreen from './components/GameScreen';
import ScoreBoard from './components/ScoreBoard';
import ActivityLog from './components/ActivityLog';
import ControlPanel from './components/ControlPanel';

const LEVELS = [
  {
    level: 1,
    title: "Cari Pisang Kuning! 🍌",
    prompt: "Tunjukkan Pisang Kuning ke kamera!",
    ttsText: "Tugas pertama. Tunjukkan pisang kuning ke kamera.",
    targetText: "Pisang Kuning 🍌",
    points: 100,
    check: (detections, threshold) => {
      return detections.some(d => d.class_id === 0 && d.confidence >= threshold);
    }
  },
  {
    level: 2,
    title: "Cari Tomat Merah! 🍅",
    prompt: "Tunjukkan Tomat Merah ke kamera!",
    ttsText: "Tugas kedua. Tunjukkan tomat merah ke kamera.",
    targetText: "Tomat Merah 🍅",
    points: 100,
    check: (detections, threshold) => {
      return detections.some(d => d.class_id === 1 && d.confidence >= threshold);
    }
  },
  {
    level: 3,
    title: "Cari Tomat Hijau! 🍏",
    prompt: "Tunjukkan Tomat Hijau yang belum matang ke kamera!",
    ttsText: "Tugas ketiga. Tunjukkan tomat hijau ke kamera.",
    targetText: "Tomat Hijau 🍏",
    points: 100,
    check: (detections, threshold) => {
      return detections.some(d => d.class_id === 2 && d.confidence >= threshold);
    }
  },
  {
    level: 4,
    title: "Tugas Ganda! 🍌 + 🍅",
    prompt: "Tunjukkan Pisang Kuning DAN Tomat Merah bersamaan!",
    ttsText: "Tugas ganda. Tunjukkan pisang dan tomat merah secara bersamaan.",
    targetText: "Pisang + Tomat Merah",
    points: 200,
    check: (detections, threshold) => {
      const hasBanana = detections.some(d => d.class_id === 0 && d.confidence >= threshold);
      const hasRedTomato = detections.some(d => d.class_id === 1 && d.confidence >= threshold);
      return hasBanana && hasRedTomato;
    }
  },
  {
    level: 5,
    title: "Sortir Buah! 🍏 ➔ 🔲 ➔ 🍅",
    prompt: "Masukkan Tomat Hijau ke Kiri 🍏, dan Tomat Merah ke Kanan 🍅!",
    ttsText: "Tugas akhir. Sortir buah. Letakkan tomat hijau di sebelah kiri, dan tomat merah di sebelah kanan.",
    targetText: "Sortir Tomat (Hijau Kiri, Merah Kanan)",
    points: 200,
    check: (detections, threshold) => {
      // Raw coordinates x1, x2 are 0 to 1.
      // Raw midpoint = (x1 + x2)/2
      // Mirrored visual midpoint = 1 - raw_midpoint
      // Left side of video is visual_midpoint < 0.5 -> raw_midpoint > 0.5
      // Right side of video is visual_midpoint > 0.5 -> raw_midpoint < 0.5
      let greenSorted = false;
      let redSorted = false;

      detections.forEach(d => {
        if (d.confidence < threshold) return;
        const rawMidX = (d.bbox[0] + d.bbox[2]) / 2;
        const visualMidX = 1 - rawMidX;

        // Class 2 is green tomato
        if (d.class_id === 2) {
          if (visualMidX < 0.5) { // Left half
            greenSorted = true;
          }
        }
        // Class 1 is red tomato
        if (d.class_id === 1) {
          if (visualMidX > 0.5) { // Right half
            redSorted = true;
          }
        }
      });

      return greenSorted && redSorted;
    }
  }
];

const BOT_MESSAGES = [
  "Robot Pintar: Aku sedang mencari buah pisang! 🍌",
  "Robot Pintar: Wah, permainan ini sangat menyenangkan! 😄",
  "Robot Pintar: Kamu hebat sekali! Ayo tunjukkan buahnya! 🌟",
  "Robot Pintar: Hore! Kita pasti bisa menyelesaikan ini! 💪",
  "Robot Pintar: Ingat, tomat merah warnanya cerah sekali! 🍅",
  "Robot Pintar: Tomat hijau itu belum matang tapi sehat lho! 🍏",
];

const AVATARS = ['🐻', '🐶', '🐵', '🐱', '🦁', '🐼'];

export default function App() {
  // Game states
  const [gameStarted, setGameStarted] = useState(false);
  const [levelIndex, setLevelIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds per level
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // New state to pause game during celebrations

  // Customization & Accessibility
  const [playerName, setPlayerName] = useState("Pemain Cilik");
  const [avatar, setAvatar] = useState("🐻");
  const [isMuted, setIsMuted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [sabarMode, setSabarMode] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.55);

  // Game logs
  const [logs, setLogs] = useState([
    { id: 1, type: 'system', text: "System: Selamat datang di SortEdu! 🎉" },
    { id: 2, type: 'system', text: "System: Tulis namamu dan pilih avatar, lalu klik MULAI BERMAIN! 🍌🍅" }
  ]);

  const timerRef = useRef(null);
  const botTimerRef = useRef(null);

  // Sync settings with utils
  useEffect(() => {
    gameAudio.setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    ttsAssist.setEnabled(voiceEnabled);
  }, [voiceEnabled]);

  // Preload TTS Audio files
  useEffect(() => {
    const staticPhrases = [
      ...LEVELS.map(l => l.ttsText),
      "Waktu habis! Coba lagi ya.",
      "Bagus sekali! Kamu berhasil!",
      "Level dilewati."
    ];
    staticPhrases.forEach(text => {
      ttsAssist.preload(text);
    });
  }, []);

  // Preload dynamic playerName phrases when name changes (with slight delay)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (playerName) {
        ttsAssist.preload(`Halo ${playerName}! Mari kita mulai bermain.`);
        ttsAssist.preload(`Hebat sekali ${playerName}! Kamu telah menyelesaikan semua permainan!`);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [playerName]);

  // Main Timer loop
  useEffect(() => {
    if (gameStarted && !isGameOver && !sabarMode && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time up!
            clearInterval(timerRef.current);
            handleTimeUp();
            return 0;
          }
          if (prev <= 6) {
            // Tick-tock sound for last 5 seconds
            gameAudio.playTick();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, isGameOver, sabarMode, isPaused, levelIndex]);

  // Bot activity loop
  useEffect(() => {
    if (gameStarted && !isGameOver) {
      botTimerRef.current = setInterval(() => {
        // 1. Chance to add chat message
        if (Math.random() > 0.4) {
          const message = BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)];
          addLog(message, 'chat');
        }

        // 2. Chance to gain points
        if (Math.random() > 0.6) {
          setBotScore(prev => prev + 100);
          addLog("Robot Pintar mendapatkan bintang! ⭐ (+100)", "system");
          gameAudio.playTick();
        }
      }, 15000); // Check every 15s
    } else {
      if (botTimerRef.current) clearInterval(botTimerRef.current);
    }

    return () => {
      if (botTimerRef.current) clearInterval(botTimerRef.current);
    };
  }, [gameStarted, isGameOver]);

  const addLog = (text, type = 'system') => {
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), type, text }]);
  };

  const handleStartGame = () => {
    setGameStarted(true);
    setIsGameOver(false);
    setIsPaused(false);
    setLevelIndex(0);
    setScore(0);
    setBotScore(0);
    setTimeLeft(60);
    setLogs([
      { id: 1, type: 'system', text: `System: Game dimulai! Semangat bermain, ${playerName}! 🎮` }
    ]);

    // Play sound and voice
    gameAudio.playBGM();
    gameAudio.playLevelUp();
    ttsAssist.speak(`Halo ${playerName}! Mari kita mulai bermain.`);

    setTimeout(() => {
      speakLevelPrompt(0);
    }, 2500);
  };

  const speakLevelPrompt = (idx) => {
    if (idx >= LEVELS.length) return;
    const current = LEVELS[idx];
    addLog(`System: Misi Level ${current.level}: ${current.prompt}`, 'system');
    ttsAssist.speak(current.ttsText);
  };

  const handleTimeUp = () => {
    gameAudio.playError();
    addLog(`System: Yah, waktu habis di Level ${levelIndex + 1}! 😭`, 'error');
    ttsAssist.speak("Waktu habis! Coba lagi ya.");

    // Go to next level anyway to not frustrate the child, or let them repeat
    // For kids with motor issues, it's better to NOT lock them, let's auto-advance but give 0 points
    setTimeout(() => {
      handleNextLevel(false);
    }, 2000);
  };

  const handleNextLevel = (successEarned = true) => {
    if (levelIndex < LEVELS.length - 1) {
      const nextIdx = levelIndex + 1;
      setLevelIndex(nextIdx);
      setTimeLeft(60);
      speakLevelPrompt(nextIdx);
    } else {
      // Game Complete!
      setIsGameOver(true);
      setGameStarted(false);
      gameAudio.stopBGM();
      gameAudio.playLevelUp();
      triggerConfettiFanfare();

      const victoryMessage = `Luar biasa! Kamu menyelesaikan semua level dengan total ${score} Bintang! 🎉🏆`;
      addLog(`System: ${victoryMessage}`, 'success');
      ttsAssist.speak(`Hebat sekali ${playerName}! Kamu telah menyelesaikan semua permainan!`);
    }
  };

  const triggerConfettiFanfare = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  // Real-time inference results callback
  const handleDetections = (detections) => {
    if (!gameStarted || isGameOver || isPaused) return;

    const currentLevel = LEVELS[levelIndex];
    const isSuccess = currentLevel.check(detections, confidenceThreshold);

    if (isSuccess) {
      // Prevents multiple rapid triggers without kicking user to setup screen
      setIsPaused(true);

      // Score points
      const pointsEarned = currentLevel.points;
      setScore(prev => prev + pointsEarned);

      // Effects
      gameAudio.playSuccess();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });

      addLog(`Game: Yey! Kamu berhasil mendeteksi ${currentLevel.targetText}! (+${pointsEarned} Bintang) 🌟`, 'success');
      ttsAssist.speak("Bagus sekali! Kamu berhasil!");

      // Pause briefly for celebration, then load next level
      setTimeout(() => {
        setIsPaused(false);
        handleNextLevel(true);
      }, 3000);
    }
  };

  const handleSkipLevel = () => {
    addLog(`System: Tugas Level ${levelIndex + 1} dilewati.`, 'system');
    ttsAssist.speak("Level dilewati.");
    handleNextLevel(false);
  };

  const handleSimulateDetection = () => {
    if (!gameStarted || isGameOver) return;

    const current = LEVELS[levelIndex];
    let mockDetections = [];

    if (current.level === 1) {
      mockDetections = [{ class_id: 0, confidence: 0.95, label: "Pisang Kuning 🍌", bbox: [0.3, 0.2, 0.5, 0.8] }];
    } else if (current.level === 2) {
      mockDetections = [{ class_id: 1, confidence: 0.95, label: "Tomat Merah 🍅", bbox: [0.3, 0.2, 0.5, 0.8] }];
    } else if (current.level === 3) {
      mockDetections = [{ class_id: 2, confidence: 0.95, label: "Tomat Hijau 🍏", bbox: [0.3, 0.2, 0.5, 0.8] }];
    } else if (current.level === 4) {
      mockDetections = [
        { class_id: 0, confidence: 0.95, label: "Pisang Kuning 🍌", bbox: [0.1, 0.2, 0.3, 0.8] },
        { class_id: 1, confidence: 0.95, label: "Tomat Merah 🍅", bbox: [0.6, 0.2, 0.8, 0.8] }
      ];
    } else if (current.level === 5) {
      mockDetections = [
        { class_id: 2, confidence: 0.95, label: "Tomat Hijau 🍏", bbox: [0.6, 0.2, 0.8, 0.8] }, // Midpoint 0.7 (Visual 0.3 - Left)
        { class_id: 1, confidence: 0.95, label: "Tomat Merah 🍅", bbox: [0.2, 0.2, 0.4, 0.8] }  // Midpoint 0.3 (Visual 0.7 - Right)
      ];
    }

    addLog(`System: Menyimulasikan keberhasilan untuk level ${current.level} (${current.targetText})...`, 'system');
    handleDetections(mockDetections);
  };

  const handleSimulateFruit = (classId) => {
    if (!gameStarted || isGameOver) return;

    let label = "";
    if (classId === 0) label = "Pisang Kuning 🍌";
    if (classId === 1) label = "Tomat Merah 🍅";
    if (classId === 2) label = "Tomat Hijau 🍏";

    // We send a mock detection
    // If it's sorting, put it on left/right accordingly
    let bbox = [0.3, 0.2, 0.5, 0.8];
    if (classId === 2) bbox = [0.6, 0.2, 0.8, 0.8]; // Green Left

    const mockDetections = [{
      class_id: classId,
      confidence: 0.95,
      label: label,
      bbox: bbox
    }];

    addLog(`System: Menyimulasikan deteksi objek: ${label}...`, 'system');
    handleDetections(mockDetections);
  };

  const currentLevel = LEVELS[levelIndex];

  // Helper for progress bar classes
  const getTimerBarClass = () => {
    if (timeLeft <= 15) return 'timer-bar danger';
    if (timeLeft <= 30) return 'timer-bar warning';
    return 'timer-bar';
  };

  return (
    <div className="app-container">
      {/* Header Area */}
      <header className="app-header">
        <div className="logo-container">
          <span className="logo-icon">🍌</span>
          <h1 className="logo-title">SortEdu</h1>
          <span className="logo-icon" style={{ animationDelay: '1.5s' }}>🍅</span>
        </div>

        <div className="header-status">
          <div className="stat-box">
            <span style={{ fontSize: '18px', filter: 'grayscale(100%) brightness(0)' }}>😀</span>
            <span>Halo, {playerName}!</span>
          </div>

          <div className="stat-box">
            <span style={{ fontSize: '18px', filter: 'grayscale(100%) brightness(0)' }}>🏆</span>
            <span>Skor: {score} ⭐</span>
          </div>
        </div>
      </header>

      {/* Setup screen if game has not started and not Game Over */}
      {!gameStarted && !isGameOver ? (
        <div className="panel" style={{ padding: '40px', maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-fun)', fontSize: '2.5rem', marginBottom: '20px', color: 'var(--color-primary)' }}>
            Main Sortir Buah Pintar! 🎮
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontWeight: 600 }}>
            Tunjukkan buah Pisang Kuning, Tomat Merah, atau Tomat Hijau ke kamera untuk menyelesaikan misi seru!
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left', marginBottom: '30px' }}>
            <div className="setting-item">
              <span className="setting-label">Nama Pemain:</span>
              <input
                type="text"
                className="setting-input"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={15}
              />
            </div>

            <div className="setting-item">
              <span className="setting-label">Pilih Avatar:</span>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                {AVATARS.map(av => (
                  <button
                    key={av}
                    className={`btn ${avatar === av ? 'btn-success' : ''}`}
                    style={{ fontSize: '2rem', padding: '10px', minWidth: '60px', width: 'auto', borderRadius: '15px' }}
                    onClick={() => {
                      setAvatar(av);
                      gameAudio.playTick();
                    }}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button className="btn btn-primary" style={{ fontSize: '2rem', width: '100%', padding: '15px' }} onClick={handleStartGame}>
            <span style={{ fontSize: '28px', marginRight: '10px' }}>▶️</span>
            <span>MULAI BERMAIN</span>
          </button>

          <div style={{ marginTop: '25px', display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center', color: '#15803d', fontWeight: 800 }}>
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <span>Dilengkapi Bantuan Suara & Mode Aksesibilitas Motorik</span>
          </div>
        </div>
      ) : isGameOver ? (
        // Game Over / Victory Screen
        <div className="panel" style={{ padding: '50px', maxWidth: '650px', margin: '40px auto', textAlign: 'center', backgroundImage: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' }}>
          <span style={{ fontSize: '5rem' }}>🏆🎉</span>
          <h2 style={{ fontFamily: 'var(--font-fun)', fontSize: '3rem', margin: '20px 0', color: 'var(--color-primary)' }}>
            Permainan Selesai!
          </h2>

          <div style={{ background: 'white', border: '3px solid var(--border-color)', borderRadius: '20px', padding: '25px', margin: '30px 0', boxShadow: 'var(--card-shadow)' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)' }}>
              Selamat {playerName}!
            </p>
            <p style={{ fontSize: '2.2rem', fontFamily: 'var(--font-fun)', color: 'var(--color-warning)', textShadow: '1px 1px 0 var(--border-color)' }}>
              {score} Bintang ⭐
            </p>
            <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem' }}>
              Hebat! Kamu memiliki koordinasi mata dan tangan yang luar biasa!
            </p>
          </div>

          <button className="btn btn-success" style={{ fontSize: '1.8rem', width: '100%', padding: '15px' }} onClick={handleStartGame}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>🔄</span>
            <span>MAIN LAGI</span>
          </button>
        </div>
      ) : (
        // Core Gartic.io style Game Board layout
        <main className="main-layout">
          {/* Left Column: Scoreboard */}
          <ScoreBoard
            score={score}
            playerName={playerName}
            avatar={avatar}
            botScore={botScore}
          />

          {/* Center Column: Camera Screen & Instructions */}
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
            <div className="instruction-bubble">
              <div className="instruction-text">
                Level {currentLevel.level}: {currentLevel.prompt}
              </div>
            </div>

            <GameScreen
              activeLevel={currentLevel.level}
              onDetections={handleDetections}
              confidenceThreshold={confidenceThreshold}
              gameStarted={gameStarted}
            />

            {/* Timer bar display */}
            {!sabarMode && (
              <div className="timer-container">
                <div
                  className={getTimerBarClass()}
                  style={{ width: `${(timeLeft / 60) * 100}%` }}
                />
              </div>
            )}

            {/* Bottom info stats */}
            <div className="game-info-bar">
              <div className="stat-box">
                <span>Misi: <b>{currentLevel.targetText}</b></span>
              </div>

              {!sabarMode ? (
                <div className="stat-box" style={{ borderColor: timeLeft <= 15 ? 'var(--color-danger)' : 'var(--border-color)' }}>
                  <span>Waktu: <b>{timeLeft}s</b></span>
                </div>
              ) : (
                <div className="stat-box" style={{ borderColor: 'var(--color-success)' }}>
                  <span>Mode Sabar: <b>Aktif ⏱️</b></span>
                </div>
              )}
            </div>

            {/* Accessibility Settings directly in the center for quick adjustments */}
            <ControlPanel
              voiceEnabled={voiceEnabled}
              setVoiceEnabled={setVoiceEnabled}
              sabarMode={sabarMode}
              setSabarMode={setSabarMode}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              confidenceThreshold={confidenceThreshold}
              setConfidenceThreshold={setConfidenceThreshold}
              onSkipLevel={handleSkipLevel}
              gameStarted={gameStarted}
              onSimulateSuccess={handleSimulateDetection}
              onSimulateFruit={handleSimulateFruit}
            />
          </div>

          {/* Right Column: Chat Activity Logs */}
          <ActivityLog logs={logs} />
        </main>
      )}

      {/* Footer information */}
      <footer style={{ marginTop: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
        Data Science PENS for Kids Motor Development - SortEdu © 2026
      </footer>
    </div>
  );
}
