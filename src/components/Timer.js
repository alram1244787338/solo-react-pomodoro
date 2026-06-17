import { useState, useEffect, useRef, useCallback } from 'react';
import { PHASES } from '../constants';
import styles from './Timer.module.css';

const PHASE_INFO = {
  [PHASES.WORK]: {
    label: '专注时间',
    emoji: '🍅',
    color: 'work',
    accent: 'var(--accent-work)',
    accentLight: 'var(--accent-work-light)',
    message: '专注工作，加油！',
  },
  [PHASES.BREAK]: {
    label: '短休息',
    emoji: '☕',
    color: 'break',
    accent: 'var(--accent-break)',
    accentLight: 'var(--accent-break-light)',
    message: '休息一下，喝口水~',
  },
  [PHASES.LONG_BREAK]: {
    label: '长休息',
    emoji: '🌴',
    color: 'long',
    accent: 'var(--accent-long)',
    accentLight: 'var(--accent-long-light)',
    message: '好好放松一下吧！',
  },
};

function playBeep() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 1000;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.6);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.1);
      osc2.start(audioContext.currentTime + 0.6);
      osc2.stop(audioContext.currentTime + 1.1);
    }, 600);
  } catch (e) {
    console.log('Audio playback failed:', e);
  }
}

function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
  return Notification.permission === 'granted';
}

function sendNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '🍅' });
    } catch (e) {
      console.log('Notification failed:', e);
    }
  }
}

export default function Timer({
  durationMinutes,
  phase,
  currentTask,
  onComplete,
  autoStart,
  notificationsEnabled,
  soundEnabled,
}) {
  const [totalSeconds, setTotalSeconds] = useState(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedBeforePauseRef = useRef(0);
  const hasCompletedRef = useRef(false);

  const phaseInfo = PHASE_INFO[phase];
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress = ((durationMinutes * 60 - totalSeconds) / (durationMinutes * 60)) * 100;
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleComplete = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    if (soundEnabled) {
      playBeep();
    }
    if (notificationsEnabled) {
      const notificationTitle = phase === PHASES.WORK ? '🎯 专注完成！' : '⏰ 休息结束！';
      const notificationBody = phase === PHASES.WORK
        ? `${durationMinutes} 分钟专注已完成，休息一下吧！`
        : `${durationMinutes} 分钟休息结束，继续加油！`;
      sendNotification(notificationTitle, notificationBody);
    }
    onComplete(durationMinutes);
  }, [soundEnabled, notificationsEnabled, phase, durationMinutes, onComplete]);

  useEffect(() => {
    if (!isRunning) return;

    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current * 1000;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - startTimeRef.current;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const remaining = Math.max(0, durationMinutes * 60 - elapsedSeconds);

      setTotalSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setIsRunning(false);
        handleComplete();
      }
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, durationMinutes, handleComplete]);

  useEffect(() => {
    if (notificationsEnabled) {
      requestNotificationPermission();
    }
  }, [notificationsEnabled]);

  const handleStart = () => {
    hasCompletedRef.current = false;
    if (!isPaused) {
      elapsedBeforePauseRef.current = 0;
      setTotalSeconds(durationMinutes * 60);
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    const elapsedSeconds = durationMinutes * 60 - totalSeconds;
    elapsedBeforePauseRef.current = elapsedSeconds;
    setIsRunning(false);
    setIsPaused(true);
  };

  const handleReset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    elapsedBeforePauseRef.current = 0;
    startTimeRef.current = null;
    hasCompletedRef.current = false;
    setIsRunning(false);
    setIsPaused(false);
    setTotalSeconds(durationMinutes * 60);
  };

  const handleSkip = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    const elapsed = durationMinutes * 60 - totalSeconds;
    const elapsedMinutes = Math.max(0, Math.floor((durationMinutes * 60 - totalSeconds) / 60));
    elapsedBeforePauseRef.current = 0;
    setIsRunning(false);
    setIsPaused(false);
    if (phase === PHASES.WORK && elapsedMinutes > 0) {
      onComplete(Math.round(elapsedMinutes));
    } else {
      onComplete(0);
    }
  };

  return (
    <div className={`${styles.card} ${styles['card' + phaseInfo.color.charAt(0).toUpperCase() + phaseInfo.color.slice(1)]}`}>
      <div className={styles.phaseBadge}>
        <span className={styles.phaseEmoji}>{phaseInfo.emoji}</span>
        <span className={styles.phaseLabel}>{phaseInfo.label}</span>
      </div>

      <p className={styles.phaseMessage}>{phaseInfo.message}</p>

      <div className={styles.timerWrapper}>
        <svg className={styles.progressRing} viewBox="0 0 300 300">
          <circle
            className={styles.progressRingBg}
            cx="150"
            cy="150"
            r="140"
            fill="none"
            strokeWidth="8"
          />
          <circle
            className={styles.progressRingCircle}
            cx="150"
            cy="150"
            r="140"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ stroke: phaseInfo.accent }}
          />
        </svg>
        <div className={styles.timerDisplay}>
          <span className={styles.timeText} style={{ color: phaseInfo.accent }}>
            {timeString}
          </span>
          {currentTask && (
            <div className={styles.currentTask}>
              <span className={styles.currentTaskLabel}>当前任务</span>
              <span className={styles.currentTaskName} title={currentTask.name}>
                {currentTask.name}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.progressBarWrapper}>
        <div
          className={styles.progressBarBg}>
          <div
            className={styles.progressBarFill}
            style={{
              width: `${progress}%`,
              backgroundColor: phaseInfo.accent,
            }}
          />
        </div>
        <span className={styles.progressText}>{Math.round(progress)}%</span>
      </div>

      <div className={styles.controls}>
        {!isRunning ? (
          <button
            className={`${styles.primaryButton} ${styles.startButton}`}
            onClick={handleStart}
            style={{ backgroundColor: phaseInfo.accent }}
          >
            {isPaused ? '继续' : '开始'}
          </button>
        ) : (
          <button
            className={`${styles.primaryButton} ${styles.pauseButton}`}
            onClick={handlePause}
            style={{ backgroundColor: phaseInfo.accent }}
          >
            暂停
          </button>
        )}
        <button className={styles.secondaryButton} onClick={handleReset}>
          重置
        </button>
        <button className={styles.secondaryButton} onClick={handleSkip}>
          跳过
        </button>
      </div>
    </div>
  );
}
