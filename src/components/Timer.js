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

let sharedAudioContext = null;

function getAudioContext() {
  if (!sharedAudioContext) {
    try {
      sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext not supported');
    }
  }
  if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume();
  }
  return sharedAudioContext;
}

function playBeep() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const startDelay = ctx.state === 'running' ? 0 : 0.1;

    const notes = [
      { freq: 523.25, start: startDelay + 0, end: startDelay + 0.35 },
      { freq: 659.25, start: startDelay + 0.15, end: startDelay + 0.5 },
      { freq: 783.99, start: startDelay + 0.3, end: startDelay + 0.65 },
      { freq: 1046.5, start: startDelay + 0.5, end: startDelay + 0.9 },
    ];

    notes.forEach(({ freq, start, end }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.05);
      gain.gain.setValueAtTime(0.3, end - 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, end);
      osc.start(start);
      osc.stop(end + 0.05);
    });

    setTimeout(() => {
      const ctx2 = getAudioContext();
      if (!ctx2) return;
      if (ctx2.state === 'suspended') ctx2.resume();
      const now2 = ctx2.currentTime;
      const osc2 = ctx2.createOscillator();
      const gain2 = ctx2.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx2.destination);
      osc2.frequency.value = 783.99;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0, now2);
      gain2.gain.linearRampToValueAtTime(0.25, now2 + 0.05);
      gain2.gain.setValueAtTime(0.25, now2 + 0.4);
      gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.65);
      osc2.start(now2);
      osc2.stop(now2 + 0.7);
    }, 1100);
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
}

function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  if (Notification.permission === 'default') {
    try {
      if (Notification.requestPermission.length === 0) {
        Notification.requestPermission();
      } else {
        Notification.requestPermission(() => {});
      }
    } catch (e) {
      console.warn('Notification permission request failed:', e);
    }
  }
  return Notification.permission;
}

let originalTitle = document.title;
let blinkInterval = null;

function startTitleBlink(message) {
  stopTitleBlink();
  if (!message) return;
  let showMessage = true;
  originalTitle = document.title;
  blinkInterval = setInterval(() => {
    document.title = showMessage ? message : originalTitle;
    showMessage = !showMessage;
  }, 1000);

  const stopOnFocus = () => {
    if (document.visibilityState === 'visible') {
      stopTitleBlink();
      document.removeEventListener('visibilitychange', stopOnFocus);
      window.removeEventListener('focus', stopOnFocus);
    }
  };
  document.addEventListener('visibilitychange', stopOnFocus);
  window.addEventListener('focus', stopOnFocus);
}

function stopTitleBlink() {
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
    document.title = originalTitle;
  }
}

let lastNotificationTag = '';

function sendNotification(title, body) {
  if (!('Notification' in window)) return;

  const tag = 'pomodoro-' + Date.now();
  lastNotificationTag = tag;

  try {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍅</text></svg>'),
        badge: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text y="20" font-size="20">🍅</text></svg>'),
        tag,
        requireInteraction: true,
        silent: true,
        vibrate: [200, 100, 200],
        renotify: true,
        priority: 'high',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 30000);
    }
  } catch (e) {
    console.warn('Notification failed:', e);
  }

  if (document.visibilityState === 'hidden') {
    startTitleBlink(title);
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
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);
  const elapsedBeforePauseRef = useRef(0);
  const hasCompletedRef = useRef(false);
  const completedAtRef = useRef(null);
  const lastBeepAtRef = useRef(0);

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
    completedAtRef.current = Date.now();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsRunning(false);

    if (soundEnabled) {
      playBeep();
      lastBeepAtRef.current = Date.now();
    }
    if (notificationsEnabled) {
      requestNotificationPermission();
      let notificationTitle, notificationBody;
      if (phase === PHASES.WORK) {
        notificationTitle = '🎯 专注完成！';
        notificationBody = `太棒了！完成了 ${durationMinutes} 分钟专注工作。`;
        if (currentTask?.name) {
          notificationBody = `「${currentTask.name}」\n` + notificationBody;
        }
        notificationBody += '\n去休息一下喝杯水吧 ☕';
      } else if (phase === PHASES.LONG_BREAK) {
        notificationTitle = '🌴 长休息结束！';
        notificationBody = `${durationMinutes} 分钟长休息已结束\n准备好迎接新一轮挑战了吗？💪`;
      } else {
        notificationTitle = '☕ 休息结束！';
        notificationBody = `${durationMinutes} 分钟休息已结束\n回到专注状态，继续加油！🍅`;
      }
      sendNotification(notificationTitle, notificationBody);
    }
    onComplete(durationMinutes);
  }, [soundEnabled, notificationsEnabled, phase, durationMinutes, currentTask, onComplete]);

  const checkAndUpdate = useCallback(() => {
    if (!endTimeRef.current || hasCompletedRef.current) return;
    const now = Date.now();
    const remainingMs = Math.max(0, endTimeRef.current - now);
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    setTotalSeconds(remainingSeconds);
    if (remainingMs <= 0) {
      handleComplete();
    }
  }, [handleComplete]);

  useEffect(() => {
    if (!isRunning) return;

    startTimeRef.current = Date.now() - elapsedBeforePauseRef.current * 1000;
    endTimeRef.current = startTimeRef.current + durationMinutes * 60 * 1000;

    timerRef.current = setInterval(() => {
      checkAndUpdate();
    }, 250);

    const remainingMs = endTimeRef.current - Date.now();
    timeoutRef.current = setTimeout(() => {
      checkAndUpdate();
    }, Math.max(0, remainingMs));

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAndUpdate();
        const now = Date.now();
        if (soundEnabled && hasCompletedRef.current && completedAtRef.current) {
          const sinceComplete = now - completedAtRef.current;
          const sinceLastBeep = now - lastBeepAtRef.current;
          if (sinceComplete < 5 * 60 * 1000 && sinceLastBeep > 30 * 1000) {
            playBeep();
            lastBeepAtRef.current = now;
          }
        }
      }
    };

    const handleFocus = () => {
      checkAndUpdate();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isRunning, durationMinutes, checkAndUpdate, soundEnabled]);

  useEffect(() => {
    if (notificationsEnabled) {
      requestNotificationPermission();
    }
  }, [notificationsEnabled]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

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
