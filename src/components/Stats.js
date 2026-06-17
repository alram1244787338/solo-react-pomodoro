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
      weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()],
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

const generateDemoHistory = () => {
  const history = {};
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      const sessions = Math.floor(Math.random() * 8) + 2;
      history[dateStr] = {
        focusMinutes: sessions * 25,
        sessions: sessions,
      };
    } else {
      const sessions = Math.floor(Math.random() * 4);
      if (sessions > 0) {
        history[dateStr] = {
          focusMinutes: sessions * 25,
          sessions: sessions,
        };
      }
    }
  }
  return history;
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
  const padding = { top: 52, right: 16, bottom: 56, left: 52 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const textColor = getCSSVariable('--text-secondary') || '#64748b';
  const textPrimary = getCSSVariable('--text-primary') || '#0f172a';
  const gridColor = getCSSVariable('--border-color') || '#e2e8f0';
  const barColor = getCSSVariable('--accent-primary') || '#8b5cf6';
  const barColorLight = getCSSVariable('--accent-work-light') || '#fecaca';
  const bgCard = getCSSVariable('--bg-card') || '#ffffff';

  ctx.clearRect(0, 0, width, height);

  const hasData = data.some((d) => d.focusMinutes > 0);
  if (!hasData) {
    ctx.fillStyle = textColor;
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('暂无数据', width / 2, height / 2 - 10);
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = getCSSVariable('--text-muted') || '#94a3b8';
    ctx.fillText('完成番茄钟后这里会显示专注时长统计', width / 2, height / 2 + 14);
    return;
  }

  const stepSize = 30;
  const maxValue = Math.max(...data.map((d) => d.focusMinutes), 60);
  let niceMax = Math.ceil(maxValue / stepSize) * stepSize;
  while (maxValue / niceMax > 0.82) {
    niceMax += stepSize;
  }

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

  const barGap = 10;
  const barGroupWidth = chartWidth / data.length;
  const barWidth = Math.min(barGroupWidth - barGap, 50);

  data.forEach((d, i) => {
    const x = padding.left + barGroupWidth * i + (barGroupWidth - barWidth) / 2;
    const barHeight = Math.max(2, (d.focusMinutes / niceMax) * chartHeight);
    const y = padding.top + chartHeight - barHeight;

    const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
    gradient.addColorStop(0, barColor);
    gradient.addColorStop(1, barColorLight);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    const radius = Math.min(8, barWidth / 2);
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + barWidth - radius, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
    ctx.lineTo(x + barWidth, y + barHeight);
    ctx.lineTo(x, y + barHeight);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    if (d.focusMinutes > 0) {
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const valueLabel = d.focusMinutes >= 60
        ? `${(d.focusMinutes / 60).toFixed(1)}h`
        : `${d.focusMinutes}m`;
      ctx.fillText(valueLabel, x + barWidth / 2, y - 6);
    }

    ctx.fillStyle = textColor;
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(d.label, x + barWidth / 2, padding.top + chartHeight + 8);

    ctx.fillStyle = getCSSVariable('--text-muted') || '#94a3b8';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(d.weekday || '', x + barWidth / 2, padding.top + chartHeight + 24);
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
  const padding = { top: 60, right: 24, bottom: 66, left: 52 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const textColor = getCSSVariable('--text-secondary') || '#64748b';
  const textPrimary = getCSSVariable('--text-primary') || '#0f172a';
  const gridColor = getCSSVariable('--border-color') || '#e2e8f0';
  const lineColor = getCSSVariable('--accent-work') || '#ef4444';
  const lineColorLight = getCSSVariable('--accent-work-light') || '#fecaca';
  const pointColor = getCSSVariable('--bg-card') || '#ffffff';

  ctx.clearRect(0, 0, width, height);

  const hasData = data.some((d) => d.focusMinutes > 0);
  if (!hasData) {
    ctx.fillStyle = textColor;
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('暂无数据', width / 2, height / 2 - 10);
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = getCSSVariable('--text-muted') || '#94a3b8';
    ctx.fillText('积累更多数据后可以看到趋势变化', width / 2, height / 2 + 14);
    return;
  }

  const stepSize = 60;
  const maxValue = Math.max(...data.map((d) => d.focusMinutes), 60);
  let niceMax = Math.ceil(maxValue / stepSize) * stepSize;
  while (maxValue / niceMax > 0.78) {
    niceMax += stepSize;
  }

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
    const x = data.length === 1
      ? padding.left + chartWidth / 2
      : padding.left + (chartWidth * i) / (data.length - 1);
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
    ctx.lineWidth = 3;
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
    if (p.data.focusMinutes > 0) {
      const valueLabel = p.data.focusMinutes >= 60
        ? `${(p.data.focusMinutes / 60).toFixed(1)}h`
        : `${p.data.focusMinutes}m`;

      const labelWidth = ctx.measureText(valueLabel).width + 12;
      const labelHeight = 20;
      const labelAbove = p.y - padding.top > labelHeight + 16;
      const labelX = p.x - labelWidth / 2;
      const labelY = labelAbove
        ? p.y - labelHeight - 10
        : p.y + 10;

      ctx.fillStyle = lineColor;
      ctx.fillRect(labelX + 2, labelY + 2, labelWidth, labelHeight);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';

      ctx.fillStyle = lineColor;
      ctx.beginPath();
      const radius = 4;
      ctx.moveTo(labelX + radius, labelY);
      ctx.lineTo(labelX + labelWidth - radius, labelY);
      ctx.quadraticCurveTo(labelX + labelWidth, labelY, labelX + labelWidth, labelY + radius);
      ctx.lineTo(labelX + labelWidth, labelY + labelHeight - radius);
      ctx.quadraticCurveTo(labelX + labelWidth, labelY + labelHeight, labelX + labelWidth - radius, labelY + labelHeight);
      ctx.lineTo(labelX + radius, labelY + labelHeight);
      ctx.quadraticCurveTo(labelX, labelY + labelHeight, labelX, labelY + labelHeight - radius);
      ctx.lineTo(labelX, labelY + radius);
      ctx.quadraticCurveTo(labelX, labelY, labelX + radius, labelY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(valueLabel, p.x, labelY + labelHeight / 2);

      if (labelAbove) {
        ctx.beginPath();
        ctx.moveTo(p.x - 4, labelY + labelHeight);
        ctx.lineTo(p.x + 4, labelY + labelHeight);
        ctx.lineTo(p.x, labelY + labelHeight + 4);
        ctx.closePath();
        ctx.fillStyle = lineColor;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(p.x - 4, labelY);
        ctx.lineTo(p.x + 4, labelY);
        ctx.lineTo(p.x, labelY - 4);
        ctx.closePath();
        ctx.fillStyle = lineColor;
        ctx.fill();
      }
    }

    ctx.fillStyle = lineColor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = pointColor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(p.data.label, p.x, padding.top + chartHeight + 8);
    ctx.fillStyle = getCSSVariable('--text-muted') || '#94a3b8';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(p.data.subLabel || p.data.weekday || '', p.x, padding.top + chartHeight + 24);
  });
}

export default function Stats({ history, tasks, onGenerateDemo, onClearHistory }) {
  const barCanvasRef = useRef(null);
  const lineCanvasRef = useRef(null);
  const [range, setRange] = useState('daily');
  const [confirmClear, setConfirmClear] = useState(false);

  const dailyData = getDailyData(history, 7);
  const weeklyData = getWeeklyData(history, 8);
  const displayData = range === 'daily' ? dailyData : weeklyData;

  const totalFocusMinutes = Object.values(history).reduce((sum, h) => sum + (h.focusMinutes || 0), 0);
  const totalSessions = Object.values(history).reduce((sum, h) => sum + (h.sessions || 0), 0);
  const totalCompletedTasks = tasks.filter((t) => t.completed).length;

  const todayData = dailyData[dailyData.length - 1];
  const weekFocusMinutes = weeklyData[weeklyData.length - 1]?.focusMinutes || 0;
  const hasAnyData = totalFocusMinutes > 0;

  useEffect(() => {
    const render = () => {
      if (barCanvasRef.current) {
        drawBarChart(barCanvasRef.current, dailyData);
      }
      if (lineCanvasRef.current) {
        drawLineChart(lineCanvasRef.current, displayData);
      }
    };

    const timeout = setTimeout(render, 0);
    window.addEventListener('resize', render);
    const observer = new MutationObserver(render);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', render);
      observer.disconnect();
    };
  }, [dailyData, displayData]);

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  const avgDaily = Math.round(totalFocusMinutes / Math.max(Object.keys(history).length, 1));
  const bestDay = dailyData.reduce(
    (best, d) => (d.focusMinutes > (best?.focusMinutes || 0) ? d : best),
    null
  );

  return (
    <div className={styles.container}>
      {!hasAnyData && (
        <div className={styles.emptyBanner}>
          <div className={styles.emptyBannerIcon}>📊</div>
          <div className={styles.emptyBannerContent}>
            <h3 className={styles.emptyBannerTitle}>开始记录你的专注之旅</h3>
            <p className={styles.emptyBannerDesc}>完成番茄钟后，这里会展示丰富的统计图表和洞察</p>
          </div>
          <div className={styles.emptyBannerActions}>
            <button
              className={styles.primaryBtn}
              onClick={onGenerateDemo}
            >
              🎲 生成演示数据
            </button>
          </div>
        </div>
      )}

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

      {(bestDay && bestDay.focusMinutes > 0) || onGenerateDemo ? (
        <div className={styles.insightCard}>
          {bestDay && bestDay.focusMinutes > 0 ? (
            <>
              <span className={styles.insightEmoji}>🏆</span>
              <div>
                <span className={styles.insightText}>
                  最佳专注日：<strong>{bestDay.label}</strong> 完成了 <strong>{formatTime(bestDay.focusMinutes)}</strong>
                  {bestDay.sessions > 0 && ` (${bestDay.sessions} 个番茄)`}
                </span>
              </div>
            </>
          ) : (
            <>
              <span className={styles.insightEmoji}>💡</span>
              <div className={styles.insightText}>
                还没有历史数据。点击右侧按钮生成示例数据查看图表效果。
              </div>
            </>
          )}
          {onGenerateDemo && (
            <button
              className={styles.demoBtn}
              onClick={onGenerateDemo}
              title="生成演示数据查看图表效果"
            >
              🎲 演示数据
            </button>
          )}
        </div>
      ) : null}

      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>📊 每日专注时长</h3>
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
            <h3 className={styles.chartTitle}>📈 专注趋势</h3>
            <p className={styles.chartSubtitle}>查看你过去一段时间的专注变化</p>
          </div>
          <div className={styles.rangeTabs}>
            <button
              className={`${styles.rangeTab} ${range === 'daily' ? styles.rangeTabActive : ''}`}
              onClick={() => setRange('daily')}
            >
              每日 (7天)
            </button>
            <button
              className={`${styles.rangeTab} ${range === 'weekly' ? styles.rangeTabActive : ''}`}
              onClick={() => setRange('weekly')}
            >
              每周 (8周)
            </button>
          </div>
        </div>
        <div className={styles.canvasWrapper}>
          <canvas ref={lineCanvasRef} className={styles.canvas} />
        </div>
      </div>

      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>📋 最近 7 天详情</h3>
          {hasAnyData && onClearHistory && (
            <button
              className={styles.clearBtn}
              onClick={() => setConfirmClear(true)}
            >
              🗑️ 清除历史
            </button>
          )}
        </div>

        {confirmClear && (
          <div className={styles.confirmBox}>
            <p>确定要清除所有专注历史数据吗？此操作不可撤销。</p>
            <div className={styles.confirmActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setConfirmClear(false)}
              >
                取消
              </button>
              <button
                className={styles.dangerBtn}
                onClick={() => {
                  onClearHistory();
                  setConfirmClear(false);
                }}
              >
                确定清除
              </button>
            </div>
          </div>
        )}

        <div className={styles.dailyList}>
          {dailyData.map((d) => (
            <div key={d.date} className={styles.dailyRow}>
              <div className={styles.dailyDate}>
                <span className={styles.dailyLabel}>{d.label}</span>
                <span className={styles.dailyWeekday}>{d.weekday}</span>
              </div>
              <div className={styles.dailyBarOuter}>
                <div
                  className={styles.dailyBarInner}
                  style={{
                    width: `${Math.min(100, (d.focusMinutes / Math.max(...dailyData.map(x => x.focusMinutes), 60)) * 100)}%`,
                  }}
                />
              </div>
              <div className={styles.dailyValues}>
                <span className={styles.dailyFocus}>{formatTime(d.focusMinutes)}</span>
                {d.sessions > 0 && (
                  <span className={styles.dailySessions}>🍅 {d.sessions}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {tasks.length > 0 && (
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>🎯 任务完成情况</h3>
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
