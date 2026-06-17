import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Timer from './components/Timer';
import TaskList from './components/TaskList';
import Stats from './components/Stats';
import Settings from './components/Settings';
import useLocalStorage from './hooks/useLocalStorage';
import { PHASES } from './constants';
import styles from './App.module.css';

const DEFAULT_SETTINGS = {
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  workSessionsBeforeLongBreak: 4,
  autoStartBreak: false,
  autoStartWork: false,
  notificationsEnabled: true,
  soundEnabled: true,
};

const DEFAULT_TASKS = [];
const DEFAULT_HISTORY = {};

export default function App() {
  const [currentView, setCurrentView] = useState('timer');
  const [theme, setTheme] = useLocalStorage('pomodoro-theme', 'light');
  const [settings, setSettings] = useLocalStorage('pomodoro-settings', DEFAULT_SETTINGS);
  const [tasks, setTasks] = useLocalStorage('pomodoro-tasks', DEFAULT_TASKS);
  const [history, setHistory] = useLocalStorage('pomodoro-history', DEFAULT_HISTORY);

  const [phase, setPhase] = useState(PHASES.WORK);
  const [completedWorkSessions, setCompletedWorkSessions] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const todayRecord = history[today];
    if (todayRecord) {
      setTodayFocusMinutes(todayRecord.focusMinutes || 0);
    } else {
      setTodayFocusMinutes(0);
    }
  }, [history, today]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  const recordSession = useCallback((durationMinutes, phaseType) => {
    if (phaseType === PHASES.WORK) {
      setHistory((prev) => {
        const newHistory = { ...prev };
        if (!newHistory[today]) {
          newHistory[today] = { focusMinutes: 0, sessions: 0 };
        }
        newHistory[today].focusMinutes = (newHistory[today].focusMinutes || 0) + durationMinutes;
        newHistory[today].sessions = (newHistory[today].sessions || 0) + 1;
        return newHistory;
      });
    }
  }, [setHistory, today]);

  const handlePhaseComplete = useCallback((durationMinutes) => {
    recordSession(durationMinutes, phase);

    if (phase === PHASES.WORK) {
      const newCompletedSessions = completedWorkSessions + 1;
      setCompletedWorkSessions(newCompletedSessions);

      if (currentTaskId) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === currentTaskId
              ? { ...t, completedPomodoros: (t.completedPomodoros || 0) + 1 }
              : t
          )
        );
      }

      if (newCompletedSessions % settings.workSessionsBeforeLongBreak === 0) {
        setPhase(PHASES.LONG_BREAK);
      } else {
        setPhase(PHASES.BREAK);
      }
    } else {
      setPhase(PHASES.WORK);
    }
  }, [phase, completedWorkSessions, settings.workSessionsBeforeLongBreak, currentTaskId, setTasks, recordSession]);

  const addTask = useCallback((name) => {
    const newTask = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
      completed: false,
      completedPomodoros: 0,
    };
    setTasks((prev) => [newTask, ...prev]);
    if (!currentTaskId) {
      setCurrentTaskId(newTask.id);
    }
  }, [setTasks, currentTaskId]);

  const toggleTask = useCallback((taskId) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null } : t
      )
    );
  }, [setTasks]);

  const deleteTask = useCallback((taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (currentTaskId === taskId) {
      setCurrentTaskId(null);
    }
  }, [setTasks, currentTaskId]);

  const selectTask = useCallback((taskId) => {
    setCurrentTaskId(taskId);
  }, []);

  const getPhaseDuration = () => {
    switch (phase) {
      case PHASES.WORK:
        return settings.workDuration;
      case PHASES.BREAK:
        return settings.breakDuration;
      case PHASES.LONG_BREAK:
        return settings.longBreakDuration;
      default:
        return settings.workDuration;
    }
  };

  const shouldAutoStart = () => {
    if (phase === PHASES.WORK) return settings.autoStartBreak;
    return settings.autoStartWork;
  };

  const todayCompletedTasks = tasks.filter(
    (t) => t.completed && t.completedAt && t.completedAt.startsWith(today)
  ).length;

  return (
    <div className={styles.app}>
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className={styles.main}>
        {currentView === 'timer' && (
          <div className={styles.timerSection}>
            <Timer
              key={`${phase}-${getPhaseDuration()}`}
              durationMinutes={getPhaseDuration()}
              phase={phase}
              currentTask={tasks.find((t) => t.id === currentTaskId)}
              onComplete={handlePhaseComplete}
              autoStart={shouldAutoStart()}
              notificationsEnabled={settings.notificationsEnabled}
              soundEnabled={settings.soundEnabled}
            />

            <TaskList
              tasks={tasks}
              currentTaskId={currentTaskId}
              onAdd={addTask}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onSelect={selectTask}
              todayCompletedTasks={todayCompletedTasks}
              todayFocusMinutes={todayFocusMinutes}
            />
          </div>
        )}

        {currentView === 'stats' && (
          <Stats history={history} tasks={tasks} />
        )}
      </main>

      {showSettings && (
        <Settings
          settings={settings}
          onSave={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
