import {
  getDailyData,
  getWeeklyData,
  generateDemoHistory,
  formatFocusTime,
  getNextPhase,
  calcProgress,
} from '../utils/aggregators';

describe('formatFocusTime', () => {
  it('formats minutes only', () => {
    expect(formatFocusTime(0)).toBe('0分钟');
    expect(formatFocusTime(25)).toBe('25分钟');
    expect(formatFocusTime(59)).toBe('59分钟');
  });

  it('formats hours only', () => {
    expect(formatFocusTime(60)).toBe('1小时');
    expect(formatFocusTime(120)).toBe('2小时');
  });

  it('formats hours and minutes', () => {
    expect(formatFocusTime(75)).toBe('1小时15分钟');
    expect(formatFocusTime(150)).toBe('2小时30分钟');
  });

  it('handles invalid input', () => {
    expect(formatFocusTime(-5)).toBe('0分钟');
    expect(formatFocusTime(null)).toBe('0分钟');
    expect(formatFocusTime(undefined)).toBe('0分钟');
  });
});

describe('calcProgress', () => {
  it('returns 0 at start', () => {
    expect(calcProgress(25 * 60, 25 * 60)).toBe(0);
  });

  it('returns 100 when done', () => {
    expect(calcProgress(0, 25 * 60)).toBe(100);
  });

  it('calculates mid progress', () => {
    expect(calcProgress(750, 1500)).toBe(50);
  });

  it('clamps to valid range', () => {
    expect(calcProgress(-10, 1500)).toBe(100);
    expect(calcProgress(2000, 1500)).toBe(0);
  });

  it('handles zero total', () => {
    expect(calcProgress(0, 0)).toBe(0);
  });
});

describe('getNextPhase', () => {
  it('switches work to short break when not every 4th', () => {
    expect(getNextPhase('work', 0)).toBe('break');
    expect(getNextPhase('work', 1)).toBe('break');
    expect(getNextPhase('work', 2)).toBe('break');
  });

  it('switches work to long break every 4th session', () => {
    expect(getNextPhase('work', 3)).toBe('long_break');
    expect(getNextPhase('work', 7)).toBe('long_break');
  });

  it('supports custom long break interval', () => {
    expect(getNextPhase('work', 1, 2)).toBe('long_break');
    expect(getNextPhase('work', 0, 2)).toBe('break');
  });

  it('returns work after any break', () => {
    expect(getNextPhase('break', 0)).toBe('work');
    expect(getNextPhase('long_break', 4)).toBe('work');
  });
});

describe('getDailyData', () => {
  const fixedToday = new Date('2024-06-14T10:00:00Z');

  it('returns array of correct length', () => {
    expect(getDailyData({}, 7, fixedToday)).toHaveLength(7);
    expect(getDailyData({}, 3, fixedToday)).toHaveLength(3);
  });

  it('fills missing dates with zeros', () => {
    const data = getDailyData({}, 2, fixedToday);
    data.forEach((d) => {
      expect(d.focusMinutes).toBe(0);
      expect(d.sessions).toBe(0);
    });
  });

  it('uses real data when available', () => {
    const history = {
      '2024-06-13': { focusMinutes: 50, sessions: 2 },
      '2024-06-14': { focusMinutes: 75, sessions: 3 },
    };
    const data = getDailyData(history, 2, fixedToday);
    expect(data[0].focusMinutes).toBe(50);
    expect(data[0].sessions).toBe(2);
    expect(data[1].focusMinutes).toBe(75);
    expect(data[1].sessions).toBe(3);
  });

  it('labels today correctly', () => {
    const data = getDailyData({}, 3, fixedToday);
    expect(data[2].label).toBe('今天');
    expect(data[1].label).toBe('6/13');
    expect(data[0].label).toBe('6/12');
  });

  it('includes weekday names', () => {
    const data = getDailyData({}, 2, fixedToday);
    expect(['周日', '周一', '周二', '周三', '周四', '周五', '周六']).toContain(data[0].weekday);
    expect(['周日', '周一', '周二', '周三', '周四', '周五', '周六']).toContain(data[1].weekday);
  });

  it('includes ISO date string', () => {
    const data = getDailyData({}, 2, fixedToday);
    expect(data[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getWeeklyData', () => {
  const fixedToday = new Date('2024-06-14T10:00:00Z');

  it('returns correct number of weeks', () => {
    expect(getWeeklyData({}, 4, fixedToday)).toHaveLength(4);
    expect(getWeeklyData({}, 8, fixedToday)).toHaveLength(8);
  });

  it('aggregates 7 days of history', () => {
    const history = {
      '2024-06-12': { focusMinutes: 25, sessions: 1 },
      '2024-06-13': { focusMinutes: 50, sessions: 2 },
      '2024-06-14': { focusMinutes: 75, sessions: 3 },
    };
    const weeks = getWeeklyData(history, 1, fixedToday);
    expect(weeks[0].focusMinutes).toBe(25 + 50 + 75);
    expect(weeks[0].sessions).toBe(1 + 2 + 3);
    expect(weeks[0].label).toBe('本周');
  });

  it('handles empty history with zeros', () => {
    const weeks = getWeeklyData({}, 2, fixedToday);
    weeks.forEach((w) => {
      expect(w.focusMinutes).toBe(0);
      expect(w.sessions).toBe(0);
    });
  });

  it('provides date range sublabel', () => {
    const weeks = getWeeklyData({}, 2, fixedToday);
    expect(weeks[1].subLabel).toMatch(/^\d+\/\d+-\d+\/\d+$/);
    expect(weeks[1].label).toBe('本周');
    expect(weeks[0].label).toMatch(/^第\d+周$/);
  });
});

describe('generateDemoHistory', () => {
  it('returns an object keyed by date strings', () => {
    const history = generateDemoHistory(() => 0.5, new Date('2024-06-14T10:00:00Z'));
    expect(typeof history).toBe('object');
    expect(Object.keys(history).length).toBeGreaterThan(10);
    Object.keys(history).forEach((k) => {
      expect(k).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('records have focusMinutes and sessions', () => {
    const history = generateDemoHistory(() => 0.5, new Date('2024-06-14T10:00:00Z'));
    Object.values(history).forEach((v) => {
      expect(v).toHaveProperty('focusMinutes');
      expect(v).toHaveProperty('sessions');
      expect(v.focusMinutes).toBe(v.sessions * 25);
    });
  });

  it('weekdays always produce sessions with deterministic random', () => {
    const alwaysHigh = () => 0.99;
    const history = generateDemoHistory(alwaysHigh, new Date('2024-06-14T10:00:00Z'));
    expect(Object.keys(history).length).toBeGreaterThan(15);
  });
});
