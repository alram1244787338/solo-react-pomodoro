export const getDailyData = (history, days = 7, today = new Date()) => {
  const data = [];
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

export const getWeeklyData = (history, weeks = 8, today = new Date()) => {
  const data = [];
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

export const generateDemoHistory = (randomFn = Math.random, today = new Date()) => {
  const history = {};
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    let sessions;
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      sessions = Math.floor(randomFn() * 8) + 2;
    } else {
      sessions = Math.floor(randomFn() * 4);
    }
    if (sessions > 0) {
      history[dateStr] = {
        focusMinutes: sessions * 25,
        sessions: sessions,
      };
    }
  }
  return history;
};

export const formatFocusTime = (minutes) => {
  if (!minutes || minutes < 0) return '0分钟';
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

export const getNextPhase = (currentPhase, completedWorkSessions, longBreakEvery = 4) => {
  if (currentPhase === 'work') {
    const nextCount = completedWorkSessions + 1;
    return nextCount % longBreakEvery === 0 ? 'long_break' : 'break';
  }
  return 'work';
};

export const calcProgress = (remaining, total) => {
  if (!total) return 0;
  if (remaining <= 0) return 100;
  if (remaining >= total) return 0;
  return Math.round(((total - remaining) / total) * 100);
};
