import { useState, useRef, useEffect } from 'react';
import styles from './TaskList.module.css';

export default function TaskList({
  tasks,
  currentTaskId,
  onAdd,
  onToggle,
  onDelete,
  onSelect,
  onEdit,
  todayCompletedTasks,
  todayFocusMinutes,
}) {
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [editError, setEditError] = useState(false);
  const editInputRef = useRef(null);
  const shakeTimeoutRef = useRef(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (editError && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editError]);

  const triggerShake = () => {
    setEditError(true);
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
    }
    shakeTimeoutRef.current = setTimeout(() => {
      setEditError(false);
    }, 600);
  };

  const startEditing = (task, e) => {
    if (e) e.stopPropagation();
    setEditingId(task.id);
    setEditingValue(task.name);
    setEditError(false);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingValue('');
    setEditError(false);
  };

  const saveEditing = () => {
    const newName = editingValue.trim();
    if (!newName) {
      triggerShake();
      return;
    }
    if (editingId) {
      onEdit(editingId, newName);
    }
    cancelEditing();
  };

  const handleEditBlur = () => {
    const newName = editingValue.trim();
    if (newName && editingId) {
      onEdit(editingId, newName);
    }
    cancelEditing();
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditing();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

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
              onClick={() => !task.completed && !editingId && onSelect(task.id)}
              onDoubleClick={(e) => !task.completed && startEditing(task, e)}
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
                {editingId === task.id ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingValue}
                    onChange={(e) => {
                      setEditingValue(e.target.value);
                      if (editError) setEditError(false);
                    }}
                    onBlur={handleEditBlur}
                    onKeyDown={handleEditKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className={`${styles.editInput} ${editError ? styles.editInputError : ''}`}
                    maxLength={100}
                    placeholder="任务名称不能为空"
                  />
                ) : (
                  <>
                    <span className={styles.taskName} title="双击可编辑">{task.name}</span>
                    <div className={styles.taskMeta}>
                      {task.completedPomodoros > 0 && (
                        <span className={styles.pomodoroBadge}>
                          🍅 {task.completedPomodoros}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className={styles.taskActions}>
                {editingId !== task.id && (
                  <button
                    className={styles.editButton}
                    onClick={(e) => startEditing(task, e)}
                    aria-label="编辑任务"
                    title="编辑任务"
                  >
                    ✏️
                  </button>
                )}
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}
