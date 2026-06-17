import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

beforeEach(() => {
  window.localStorage.clear();
  jest.clearAllMocks();
});

const fillAddTask = (name) => {
  const input = screen.getByPlaceholderText('添加一个任务...');
  fireEvent.change(input, { target: { value: name } });
  fireEvent.submit(input.closest('form'));
};

describe('App initial render', () => {
  it('renders timer and task list sections', () => {
    render(<App />);
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText(/专注时间/)).toBeInTheDocument();
    expect(screen.getByText(/任务列表/)).toBeInTheDocument();
  });

  it('renders header navigation buttons', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /番茄钟/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /统计/ })).toBeInTheDocument();
  });
});

describe('App task management flow', () => {
  it('adds a new task and shows it in the list', () => {
    render(<App />);
    fillAddTask('写测试');
    expect(screen.getAllByText('写测试').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/1 个任务/)).toBeInTheDocument();
  });

  it('persists tasks across renders via localStorage', () => {
    const { unmount } = render(<App />);
    fillAddTask('持久化任务');
    unmount();
    const saved = JSON.parse(window.localStorage.getItem('pomodoro-tasks'));
    expect(saved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '持久化任务' }),
      ])
    );
  });

  it('edits a task name', () => {
    render(<App />);
    fillAddTask('旧名字');
    const editBtn = screen.getByRole('button', { name: '编辑任务' });
    fireEvent.click(editBtn);
    const input = screen.getByDisplayValue('旧名字');
    fireEvent.change(input, { target: { value: '新名字' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(screen.getAllByText('新名字').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('旧名字')).not.toBeInTheDocument();
  });

  it('deletes a task', () => {
    render(<App />);
    fillAddTask('要删除');
    const delBtn = screen.getByRole('button', { name: '删除任务' });
    fireEvent.click(delBtn);
    expect(screen.queryByText('要删除')).not.toBeInTheDocument();
  });

  it('toggles task completion', () => {
    render(<App />);
    fillAddTask('切换任务');
    const cb = screen.getByRole('button', { name: '标记为完成' });
    fireEvent.click(cb);
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '标记为未完成' })).toBeInTheDocument();
  });
});

describe('App phase switching via skip', () => {
  it('switches from work to short break after skip', () => {
    render(<App />);
    expect(screen.getByText(/专注时间/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '跳过' }));
    expect(screen.getByText(/短休息/)).toBeInTheDocument();
  });

  it('switches from short break back to work', () => {
    render(<App />);
    expect(screen.getByText(/专注时间/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '跳过' }));
    expect(screen.getByText(/短休息/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '跳过' }));
    expect(screen.getByText(/专注时间/)).toBeInTheDocument();
  });

  it('switches to long break after 4 work sessions', () => {
    render(<App />);
    for (let i = 0; i < 7; i++) {
      fireEvent.click(screen.getByRole('button', { name: '跳过' }));
    }
    expect(screen.getByText(/长休息/)).toBeInTheDocument();
  });
});

describe('App history recording', () => {
  it('records focus minutes to history after work session skipped', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '跳过' }));
    const history = JSON.parse(window.localStorage.getItem('pomodoro-history')) || {};
    const todayKey = new Date().toISOString().split('T')[0];
    expect(history[todayKey]).toEqual(
      expect.objectContaining({ sessions: 1 })
    );
  });
});

describe('App completedPomodoros tracking', () => {
  it('increments completedPomodoros on selected task after work session skip', () => {
    render(<App />);
    fillAddTask('主任务');
    fireEvent.click(screen.getByRole('button', { name: '跳过' }));
    expect(screen.getByText('🍅 1')).toBeInTheDocument();
  });
});

describe('App settings persistence', () => {
  it('persists custom settings to localStorage', () => {
    const { unmount } = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '设置' }));
    const allNumberInputs = screen.getAllByRole('spinbutton');
    const workInput = allNumberInputs[0];
    fireEvent.change(workInput, { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: /保存设置/ }));
    unmount();
    const saved = JSON.parse(window.localStorage.getItem('pomodoro-settings'));
    expect(saved.workDuration).toBe(30);
  });
});

describe('App theme toggle', () => {
  it('toggles theme on button click and persists', () => {
    render(<App />);
    const initial = document.documentElement.getAttribute('data-theme');
    fireEvent.click(screen.getByRole('button', { name: '切换主题' }));
    expect(document.documentElement.getAttribute('data-theme')).not.toBe(initial);
    expect(JSON.parse(window.localStorage.getItem('pomodoro-theme'))).toBe(
      document.documentElement.getAttribute('data-theme')
    );
  });
});
