import { useState, useEffect } from 'react';
import styles from './Settings.module.css';

export default function Settings({ settings, onSave, onClose }) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleChange = (key, value) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(localSettings);
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setLocalSettings({
      workDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      workSessionsBeforeLongBreak: 4,
      autoStartBreak: false,
      autoStartWork: false,
      notificationsEnabled: true,
      soundEnabled: true,
    });
    setSaved(false);
  };

  const durationInputs = [
    {
      key: 'workDuration',
      label: '专注时间',
      min: 5,
      max: 90,
      step: 5,
      unit: '分钟',
      emoji: '🍅',
      desc: '一个番茄钟的工作时长',
    },
    {
      key: 'breakDuration',
      label: '短休息',
      min: 1,
      max: 30,
      step: 1,
      unit: '分钟',
      emoji: '☕',
      desc: '每个番茄钟之间的休息时间',
    },
    {
      key: 'longBreakDuration',
      label: '长休息',
      min: 5,
      max: 60,
      step: 5,
      unit: '分钟',
      emoji: '🌴',
      desc: '完成多轮后的长时间休息',
    },
    {
      key: 'workSessionsBeforeLongBreak',
      label: '长休息间隔',
      min: 2,
      max: 10,
      step: 1,
      unit: '轮',
      emoji: '🔄',
      desc: '多少个番茄钟后进入长休息',
    },
  ];

  const toggleInputs = [
    {
      key: 'autoStartBreak',
      label: '自动开始休息',
      desc: '专注结束后自动进入休息计时',
    },
    {
      key: 'autoStartWork',
      label: '自动开始专注',
      desc: '休息结束后自动进入专注计时',
    },
    {
      key: 'notificationsEnabled',
      label: '浏览器通知',
      desc: '到时间时发送桌面通知',
    },
    {
      key: 'soundEnabled',
      label: '提示音效',
      desc: '到时间时播放提示音',
    },
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>设置</h2>
            <p className={styles.subtitle}>自定义你的番茄钟体验</p>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="关闭设置"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>⏱ 时间设置</h3>
            <div className={styles.grid}>
              {durationInputs.map((input) => (
                <div key={input.key} className={styles.inputGroup}>
                  <div className={styles.inputHeader}>
                    <span className={styles.inputEmoji}>{input.emoji}</span>
                    <div className={styles.inputLabels}>
                      <label className={styles.inputLabel}>{input.label}</label>
                      <span className={styles.inputDesc}>{input.desc}</span>
                    </div>
                  </div>
                  <div className={styles.inputWrapper}>
                    <input
                      type="number"
                      min={input.min}
                      max={input.max}
                      step={input.step}
                      value={localSettings[input.key]}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          handleChange(input.key, Math.min(input.max, Math.max(input.min, val)));
                        }
                      }}
                      className={styles.numberInput}
                    />
                    <span className={styles.inputUnit}>{input.unit}</span>
                  </div>
                  <input
                    type="range"
                    min={input.min}
                    max={input.max}
                    step={input.step}
                    value={localSettings[input.key]}
                    onChange={(e) => handleChange(input.key, parseInt(e.target.value, 10))}
                    className={styles.rangeInput}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>⚙️ 行为设置</h3>
            <div className={styles.toggleList}>
              {toggleInputs.map((input) => (
                <div key={input.key} className={styles.toggleItem}>
                  <div className={styles.toggleLabels}>
                    <label className={styles.toggleLabel}>{input.label}</label>
                    <span className={styles.toggleDesc}>{input.desc}</span>
                  </div>
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${localSettings[input.key] ? styles.toggleOn : ''}`}
                    onClick={() => handleChange(input.key, !localSettings[input.key])}
                    role="switch"
                    aria-checked={localSettings[input.key]}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.resetButton}
              onClick={handleReset}
            >
              恢复默认
            </button>
            <div className={styles.actionsRight}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={onClose}
              >
                取消
              </button>
              <button
                type="submit"
                className={`${styles.saveButton} ${saved ? styles.saveButtonSaved : ''}`}
              >
                {saved ? '✓ 已保存' : '保存设置'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
