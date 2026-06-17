import { useState } from 'react';
import styles from './TaskList.module.css';

export default function TaskList({
  tasks,
  currentTaskId,
  onAdd,
  onToggle,
  onDelete,
  onSelect,
  todayCompletedTasks,
  todayFocusMinutes,
}) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = inputValue.trim();
    if (name) {
      onAdd(name);
      setInputValue('');
    }
  };

  const today = new Date();
  const todayTasks = tasks.filter(
    (t) => t.createdAt.startsWith(today.toISOString().split('T')[0])
  );

  const formatFocusTime = (minutes) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  return (
    <div className={styles.card}>
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>✅</span>
          <div>
            <div className={styles.statValue}>{todayCompletedTasks}</div>
            <div className={styles.statLabel}>今日完成任务</div>
          </div>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>🍅</span>
          <div>
            <div className={styles.statValue}>{todayTasks.filter(t => t.completedPomodoros > 0).reduce((sum, t) => sum + (t.completedPomodoros || 0), 0)}</div>
            <div className={styles.statLabel}>今日番茄</div>
          </div>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>⏱</span>
          <div>
            <div className={styles.statValue}>{formatFocusTime(todayFocusMinutes)}</div>
            <div className={styles.statLabel}>专注时长</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.addForm}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="添加一个任务..."
          className={styles.input}
          maxLength={100}
        />
        <button
          type="submit"
          className={styles.addButton}
          disabled={!inputValue.trim()}
        >
          添加
        </button>
      </form>

      <div className={styles.tasksHeader}>
        <h3 className={styles.tasksTitle}>任务列表</h3>
        <span className={styles.tasksCount}>{tasks.length} 个任务</span>
      </div>

      <div className={styles.taskList}>
        {tasks.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📝</span>
            <p className={styles.emptyText}>还没有任务</p>
            <p className={styles.emptyHint}>添加一个任务开始专注吧！</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`${styles.taskItem} ${task.id === currentTaskId ? styles.taskItemActive : ''} ${task.completed ? styles.taskItemCompleted : ''}`}
              onClick={() => !task.completed && onSelect(task.id)}
            >
              <button
                className={styles.checkbox}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(task.id);
                }}
                aria-label={task.completed ? '标记为未完成' : '标记为完成'}
              >
                {task.completed && <span className={styles.checkmark}>✓</span>}
              </button>

              <div className={styles.taskContent}>
                <span className={styles.taskName}>{task.name}</span>
                <div className={styles.taskMeta}>
                  {task.completedPomodoros > 0 && (
                    <span className={styles.pomodoroBadge}>
                      🍅 {task.completedPomodoros}
                    </span>
                  )}
                </div>
              </div>

              <button
                className={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                aria-label="删除任务"
                title="删除任务"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
