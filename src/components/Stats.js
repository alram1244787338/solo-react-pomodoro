import { useEffect, useRef, useState } from 'react';
import styles from './Stats.module.css';

const getDailyData = (history, days = 7) => {
  const data = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const record = history[dateStr] || { focusMinutes: 0, sessions: 0 };
    data.push({
      date: dateStr,
      label: i === 0 ? '今天' : `${date.getMonth() + 1}/${date.getDate()}`,
      focusMinutes: record.focusMinutes || 0,
      sessions: record.sessions || 0,
    });
  }
  return data;
};

const getWeeklyData = (history, weeks = 8) => {
  const data = [];
  const today = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const weekData = { focusMinutes: 0, sessions: 0, days: 0 };
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() - i * 7);

    for (let d = 0; d < 7; d++) {
      const date = new Date(endOfWeek);
      date.setDate(endOfWeek.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      const record = history[dateStr];
      if (record) {
        weekData.focusMinutes += record.focusMinutes || 0;
        weekData.sessions += record.sessions || 0;
        weekData.days++;
      }
    }

    const weekStart = new Date(endOfWeek);
    weekStart.setDate(endOfWeek.getDate() - 6);
    data.push({
      label: i === 0 ? '本周' : `第${weeks - i}周`,
      subLabel: `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${endOfWeek.getMonth() + 1}/${endOfWeek.getDate()}`,
      focusMinutes: weekData.focusMinutes,
      sessions: weekData.sessions,
    });
  }
  return data;
};

function getCSSVariable(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function drawBarChart(canvas, data) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const padding = { top: 20, right: 16, bottom: 36, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const textColor = getCSSVariable('--text-secondary') || '#64748b';
  const gridColor = getCSSVariable('--border-color') || '#e2e8f0';
  const barColor = getCSSVariable('--accent-primary') || '#8b5cf6';
  const barColorLight = getCSSVariable('--accent-work-light') || '#fecaca';

  ctx.clearRect(0, 0, width, height);

  const maxValue = Math.max(...data.map((d) => d.focusMinutes), 60);
  const niceMax = Math.ceil(maxValue / 30) * 30;

  ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartHeight * i) / gridLines;
    const value = Math.round(niceMax - (niceMax * i) / gridLines);

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.setLineDash([]);

    const label = value >= 60 ? `${(value / 60).toFixed(1)}h` : `${value}m`;
    ctx.fillText(label, padding.left - 8, y);
  }

  const barGap = 8;
  const barGroupWidth = chartWidth / data.length;
  const barWidth = Math.min(barGroupWidth - barGap, 40);

  data.forEach((d, i) => {
    const x = padding.left + barGroupWidth * i + (barGroupWidth - barWidth) / 2;
    const barHeight = (d.focusMinutes / niceMax) * chartHeight;
    const y = padding.top + chartHeight - barHeight;

    const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
    gradient.addColorStop(0, barColor);
    gradient.addColorStop(1, barColorLight);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    const radius = Math.min(6, barWidth / 2);
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + barWidth - radius, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
    ctx.lineTo(x + barWidth, y + barHeight);
    ctx.lineTo(x, y + barHeight);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(d.label, x + barWidth / 2, padding.top + chartHeight + 10);
  });
}

function drawLineChart(canvas, data) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const padding = { top: 20, right: 16, bottom: 44, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const textColor = getCSSVariable('--text-secondary') || '#64748b';
  const gridColor = getCSSVariable('--border-color') || '#e2e8f0';
  const lineColor = getCSSVariable('--accent-work') || '#ef4444';
  const lineColorLight = getCSSVariable('--accent-work-light') || '#fecaca';
  const pointColor = getCSSVariable('--bg-card') || '#ffffff';

  ctx.clearRect(0, 0, width, height);

  const maxValue = Math.max(...data.map((d) => d.focusMinutes), 60);
  const niceMax = Math.ceil(maxValue / 60) * 60;

  ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartHeight * i) / gridLines;
    const value = Math.round(niceMax - (niceMax * i) / gridLines);

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.setLineDash([]);

    const label = value >= 60 ? `${(value / 60).toFixed(1)}h` : `${value}m`;
    ctx.fillText(label, padding.left - 8, y);
  }

  const points = data.map((d, i) => {
    const x = padding.left + (chartWidth * i) / (data.length - 1 || 1);
    const y = padding.top + chartHeight - (d.focusMinutes / niceMax) * chartHeight;
    return { x, y, data: d };
  });

  if (points.length > 1) {
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    gradient.addColorStop(0, lineColorLight);
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartHeight);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else {
        const prev = points[i - 1];
        const cpx1 = prev.x + (p.x - prev.x) / 3;
        const cpx2 = prev.x + (2 * (p.x - prev.x)) / 3;
        ctx.bezierCurveTo(cpx1, prev.y, cpx2, p.y, p.x, p.y);
      }
    });
    ctx.stroke();
  }

  points.forEach((p) => {
    ctx.fillStyle = lineColor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = pointColor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(p.data.label, p.x, padding.top + chartHeight + 8);
    ctx.fillStyle = getCSSVariable('--text-muted') || '#94a3b8';
    ctx.fillText(p.data.subLabel || '', p.x, padding.top + chartHeight + 22);
  });
}

export default function Stats({ history, tasks }) {
  const barCanvasRef = useRef(null);
  const lineCanvasRef = useRef(null);
  const [range, setRange] = useState('daily');

  const dailyData = getDailyData(history, 7);
  const weeklyData = getWeeklyData(history, 8);
  const displayData = range === 'daily' ? dailyData : weeklyData;

  const totalFocusMinutes = Object.values(history).reduce((sum, h) => sum + (h.focusMinutes || 0), 0);
  const totalSessions = Object.values(history).reduce((sum, h) => sum + (h.sessions || 0), 0);
  const totalCompletedTasks = tasks.filter((t) => t.completed).length;

  const todayData = dailyData[dailyData.length - 1];
  const weekFocusMinutes = weeklyData[weeklyData.length - 1]?.focusMinutes || 0;

  useEffect(() => {
    const render = () => {
      if (barCanvasRef.current) {
        drawBarChart(barCanvasRef.current, dailyData);
      }
      if (lineCanvasRef.current) {
        drawLineChart(lineCanvasRef.current, displayData);
      }
    };

    render();
    window.addEventListener('resize', render);
    return () => window.removeEventListener('resize', render);
  }, [dailyData, displayData]);

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  const avgDaily = Math.round(totalFocusMinutes / Math.max(dailyData.length, 1));

  return (
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🎯</span>
          <div>
            <div className={styles.statValue}>{formatTime(totalFocusMinutes)}</div>
            <div className={styles.statLabel}>累计专注</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🍅</span>
          <div>
            <div className={styles.statValue}>{totalSessions}</div>
            <div className={styles.statLabel}>累计番茄</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>✅</span>
          <div>
            <div className={styles.statValue}>{totalCompletedTasks}</div>
            <div className={styles.statLabel}>完成任务</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📈</span>
          <div>
            <div className={styles.statValue}>{formatTime(avgDaily)}</div>
            <div className={styles.statLabel}>日均专注</div>
          </div>
        </div>
      </div>

      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>每日专注时长</h3>
            <p className={styles.chartSubtitle}>
              今日 {formatTime(todayData.focusMinutes)} · 本周 {formatTime(weekFocusMinutes)}
            </p>
          </div>
        </div>
        <div className={styles.canvasWrapper}>
          <canvas ref={barCanvasRef} className={styles.canvas} />
        </div>
      </div>

      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>专注趋势</h3>
            <p className={styles.chartSubtitle}>查看你过去一段时间的专注变化</p>
          </div>
          <div className={styles.rangeTabs}>
            <button
              className={`${styles.rangeTab} ${range === 'daily' ? styles.rangeTabActive : ''}`}
              onClick={() => setRange('daily')}
            >
              每日
            </button>
            <button
              className={`${styles.rangeTab} ${range === 'weekly' ? styles.rangeTabActive : ''}`}
              onClick={() => setRange('weekly')}
            >
              每周
            </button>
          </div>
        </div>
        <div className={styles.canvasWrapper}>
          <canvas ref={lineCanvasRef} className={styles.canvas} />
        </div>
      </div>

      {tasks.length > 0 && (
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>任务完成情况</h3>
          <div className={styles.taskStats}>
            <div className={styles.taskStatRow}>
              <span className={styles.taskStatLabel}>总任务</span>
              <span className={styles.taskStatValue}>{tasks.length}</span>
            </div>
            <div className={styles.taskStatRow}>
              <span className={styles.taskStatLabel}>已完成</span>
              <span className={styles.taskStatValue} style={{ color: 'var(--accent-break)' }}>
                {totalCompletedTasks}
              </span>
            </div>
            <div className={styles.taskStatRow}>
              <span className={styles.taskStatLabel}>进行中</span>
              <span className={styles.taskStatValue} style={{ color: 'var(--accent-work)' }}>
                {tasks.length - totalCompletedTasks}
              </span>
            </div>
            <div className={styles.taskStatRow}>
              <span className={styles.taskStatLabel}>完成率</span>
              <span className={styles.taskStatValue}>
                {tasks.length > 0 ? Math.round((totalCompletedTasks / tasks.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
