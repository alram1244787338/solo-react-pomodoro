import { render, screen, fireEvent } from '@testing-library/react';
import Stats from '../components/Stats';

const sampleTasks = [
  { id: '1', name: '任务 A', completed: true, completedPomodoros: 3, createdAt: new Date().toISOString(), completedAt: new Date().toISOString() },
  { id: '2', name: '任务 B', completed: true, completedPomodoros: 1, createdAt: new Date().toISOString(), completedAt: new Date().toISOString() },
  { id: '3', name: '任务 C', completed: false, completedPomodoros: 0, createdAt: new Date().toISOString() },
];

const baseProps = {
  tasks: sampleTasks,
  history: {},
  onGenerateDemo: jest.fn(),
  onClearHistory: jest.fn(),
};

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().split('T')[0];
}

describe('Stats summary cards', () => {
  it('aggregates total focus minutes and sessions', () => {
    const history = {
      [todayISO(0)]: { focusMinutes: 50, sessions: 2 },
      [todayISO(1)]: { focusMinutes: 75, sessions: 3 },
      [todayISO(5)]: { focusMinutes: 25, sessions: 1 },
    };
    render(<Stats {...baseProps} history={history} />);
    expect(screen.getByText('2小时30分钟')).toBeInTheDocument();
    expect(screen.getByText('6', { selector: '.statsGrid .statCard:nth-child(2) .statValue, div > div:nth-child(2) > div > div' })).toBeInTheDocument();
  });

  it('shows task completion rate percentage', () => {
    render(<Stats {...baseProps} history={{ [todayISO(0)]: { focusMinutes: 25, sessions: 1 } }} />);
    expect(screen.getByText(/67%/)).toBeInTheDocument();
  });
});

describe('Stats charts rendering', () => {
  it('renders bar and line canvases when there is data', () => {
    const history = {
      [todayISO(0)]: { focusMinutes: 50, sessions: 2 },
      [todayISO(1)]: { focusMinutes: 25, sessions: 1 },
    };
    const { container } = render(<Stats {...baseProps} history={history} />);
    const canvases = container.querySelectorAll('canvas');
    expect(canvases.length).toBe(2);
  });

  it('switches between daily and weekly range tabs', () => {
    const history = {};
    for (let i = 0; i < 14; i++) {
      history[todayISO(i)] = { focusMinutes: 25, sessions: 1 };
    }
    render(<Stats {...baseProps} history={history} />);
    const weeklyTab = screen.getByRole('button', { name: /每周/ });
    fireEvent.click(weeklyTab);
    expect(weeklyTab.className).toMatch(/Active|active/);
  });
});

describe('Stats action buttons', () => {
  it('calls onGenerateDemo when demo button clicked', () => {
    const gen = jest.fn();
    render(<Stats {...baseProps} history={{}} tasks={[]} onGenerateDemo={gen} />);
    const btns = screen.getAllByRole('button').filter(b => /演示数据/.test(b.textContent));
    fireEvent.click(btns[0]);
    expect(gen).toHaveBeenCalled();
  });

  it('calls onClearHistory when clear button confirmed', () => {
    const clear = jest.fn();
    const history = { [todayISO(0)]: { focusMinutes: 25, sessions: 1 } };
    render(<Stats {...baseProps} history={history} onClearHistory={clear} />);
    fireEvent.click(screen.getByRole('button', { name: /清除历史/ }));
    fireEvent.click(screen.getByRole('button', { name: /确定清除/ }));
    expect(clear).toHaveBeenCalled();
  });
});

describe('Stats recent days list', () => {
  it('lists recent 7 days with focus minutes', () => {
    const history = {};
    for (let i = 0; i < 7; i++) {
      history[todayISO(i)] = { focusMinutes: (i + 1) * 25, sessions: i + 1 };
    }
    render(<Stats {...baseProps} history={history} />);
    expect(screen.getByText(/最近 7 天详情/)).toBeInTheDocument();
  });

  it('highlights best focus day', () => {
    const history = {
      [todayISO(0)]: { focusMinutes: 25, sessions: 1 },
      [todayISO(1)]: { focusMinutes: 200, sessions: 8 },
      [todayISO(2)]: { focusMinutes: 50, sessions: 2 },
    };
    render(<Stats {...baseProps} history={history} />);
    expect(screen.getByText(/最佳专注日/)).toBeInTheDocument();
    expect(screen.getAllByText('3小时20分钟').length).toBeGreaterThanOrEqual(1);
  });
});
