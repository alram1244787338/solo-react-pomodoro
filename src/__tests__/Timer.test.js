import { render, screen, fireEvent } from '@testing-library/react';
import Timer from '../components/Timer';
import { PHASES } from '../constants';

beforeEach(() => {
  jest.clearAllMocks();
  window.Notification.permission = 'granted';
});

const baseProps = {
  durationMinutes: 25,
  phase: PHASES.WORK,
  currentTask: null,
  onComplete: jest.fn(),
  autoStart: false,
  notificationsEnabled: false,
  soundEnabled: false,
};

describe('Timer display', () => {
  it('renders initial time correctly for 25 minutes', () => {
    render(<Timer {...baseProps} />);
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  it('renders initial time correctly for 5 minutes break', () => {
    render(<Timer {...baseProps} durationMinutes={5} phase={PHASES.BREAK} />);
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  it('shows correct phase badge for work', () => {
    render(<Timer {...baseProps} />);
    expect(screen.getByText(/专注时间/)).toBeInTheDocument();
    expect(screen.getByText('🍅')).toBeInTheDocument();
  });

  it('shows correct phase badge for break', () => {
    render(<Timer {...baseProps} phase={PHASES.BREAK} durationMinutes={5} />);
    expect(screen.getByText(/短休息/)).toBeInTheDocument();
    expect(screen.getByText('☕')).toBeInTheDocument();
  });

  it('shows correct phase badge for long break', () => {
    render(<Timer {...baseProps} phase={PHASES.LONG_BREAK} durationMinutes={15} />);
    expect(screen.getByText(/长休息/)).toBeInTheDocument();
    expect(screen.getByText('🌴')).toBeInTheDocument();
  });

  it('shows current task name when provided', () => {
    render(
      <Timer
        {...baseProps}
        currentTask={{ id: '1', name: '写周报', completedPomodoros: 0 }}
      />
    );
    expect(screen.getByText('写周报')).toBeInTheDocument();
  });

  it('shows 0% progress at start', () => {
    render(<Timer {...baseProps} />);
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });
});

describe('Timer controls', () => {
  it('shows start button when not running', () => {
    render(<Timer {...baseProps} />);
    expect(screen.getByRole('button', { name: '开始' })).toBeInTheDocument();
  });

  it('switches to pause button after clicking start', () => {
    render(<Timer {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: '开始' }));
    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();
  });

  it('resets to full time on reset click', () => {
    render(<Timer {...baseProps} durationMinutes={1} />);
    fireEvent.click(screen.getByRole('button', { name: '开始' }));
    fireEvent.click(screen.getByRole('button', { name: '暂停' }));
    fireEvent.click(screen.getByRole('button', { name: '重置' }));
    expect(screen.getByText('01:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '开始' })).toBeInTheDocument();
  });

  it('shows continue label after pause', () => {
    render(<Timer {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: '开始' }));
    fireEvent.click(screen.getByRole('button', { name: '暂停' }));
    expect(screen.getByRole('button', { name: '继续' })).toBeInTheDocument();
  });
});

describe('Timer notifications and sound', () => {
  it('requests notification permission when notifications enabled', () => {
    window.Notification.permission = 'default';
    render(<Timer {...baseProps} notificationsEnabled />);
    expect(window.Notification.requestPermission).toHaveBeenCalled();
  });
});

describe('Timer skip', () => {
  it('calls onComplete with 0 when skipping a break', () => {
    const onComplete = jest.fn();
    render(
      <Timer
        {...baseProps}
        phase={PHASES.BREAK}
        durationMinutes={5}
        onComplete={onComplete}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '跳过' }));
    expect(onComplete).toHaveBeenCalledWith(0);
  });

  it('calls onComplete with 0 when skipping work (skip logic)', () => {
    const onComplete = jest.fn();
    render(<Timer {...baseProps} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button', { name: '跳过' }));
    expect(onComplete).toHaveBeenCalledWith(0);
  });
});
