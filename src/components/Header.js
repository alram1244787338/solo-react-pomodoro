import styles from './Header.module.css';

export default function Header({ currentView, onViewChange, theme, onToggleTheme, onOpenSettings }) {
  const navItems = [
    { id: 'timer', label: '番茄钟', icon: '⏱' },
    { id: 'stats', label: '统计', icon: '📊' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🍅</span>
          <span className={styles.logoText}>番茄钟</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`${styles.navItem} ${currentView === item.id ? styles.navItemActive : ''}`}
              onClick={() => onViewChange(item.id)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.actions}>
          <button
            className={styles.iconButton}
            onClick={onOpenSettings}
            title="设置"
            aria-label="设置"
          >
            ⚙️
          </button>
          <button
            className={styles.iconButton}
            onClick={onToggleTheme}
            title={theme === 'light' ? '切换到深色主题' : '切换到浅色主题'}
            aria-label="切换主题"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </header>
  );
}
