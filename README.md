# 🍅 番茄钟（Pomodoro Timer）

一个使用 **React 18 + webpack 5** 从零搭建的番茄钟应用，零脚手架、纯 CSS 实现 UI，无任何 UI 组件库。

## ✨ 功能特性

### 核心番茄钟
- **25 分钟工作 + 5 分钟短休息** 循环
- **每 4 个工作轮次后自动进入 15 分钟长休息**
- 所有时间均可自定义（工作/短休息/长休息时长、长休息间隔）
- 支持开始、暂停、继续、重置、跳过操作
- 可视化进度圆环 + 百分比显示

### 任务管理
- 开始前添加任务，支持设置当前任务
- 任务完成后打勾标记
- 支持**双击或按钮**编辑任务名称
- 自动统计今日完成番茄数
- `completedPomodoros` 实时跟踪每个任务的番茄数

### 数据统计（Canvas 图表）
- **柱状图**：最近 7 天每日专注时长
- **折线图**：最近 8 周专注趋势（支持日/周切换）
- 累计专注、累计番茄、完成任务、日均专注统计卡
- 任务完成率、完成情况一览
- 最近 7 天详情列表，自动高亮最佳专注日
- 空数据友好提示，一键生成演示数据
- 支持清除所有历史数据
- Y 轴动态刻度，数据再多也不会溢出画布

### 提醒机制
- **浏览器系统通知**（Web Notification API）
- **音频提示**（Web Audio API 生成多音符旋律）
- 标题闪烁提醒（页面隐藏时）
- 后台/锁屏后切回自动补播提醒

### 个性化设置
- **深色/浅色主题** 一键切换
- 自动开始休息、自动开始专注
- 通知、音效开关
- 所有设置自动持久化

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式（热更新）
```bash
npm run dev
# 或
npm start
```

浏览器打开 http://localhost:3000 即可。

### 生产构建
```bash
npm run build
```

构建产物输出到 `dist/` 目录。

## 🧪 测试

项目使用 **Jest + React Testing Library** 编写了 **94 个测试用例**，覆盖核心逻辑。

### 运行测试
```bash
npm test
```

### 监听模式
```bash
npm run test:watch
```

### 覆盖率报告
```bash
npm run test:coverage
```

### 测试覆盖范围

| 模块 | 测试文件 | 重点内容 |
|------|----------|----------|
| 计时器逻辑 | `Timer.test.js` | 阶段显示、开始/暂停/重置、跳过、通知权限 |
| 任务管理 | `TaskList.test.js` | 新增、编辑、删除、完成切换、当前任务高亮、番茄计数 |
| 数据统计 | `Stats.test.js` | 图表渲染、日/周切换、演示数据生成、清除历史、最佳专注日 |
| 数据聚合 | `aggregators.test.js` | getDailyData、getWeeklyData、calcProgress、formatFocusTime |
| 本地存储 | `useLocalStorage.test.js` | 初始化、序列化/反序列化、异常回退 |
| 常量定义 | `constants.test.js` | PHASES 常量完整性 |
| 应用集成 | `App.test.js` | 阶段切换、任务-计时器联动、localStorage 持久化、主题切换 |

## 📁 文件结构

```
.
├── public/
│   └── index.html              # HTML 入口模板
├── src/
│   ├── __tests__/              # 测试文件目录
│   │   ├── App.test.js
│   │   ├── Stats.test.js
│   │   ├── TaskList.test.js
│   │   ├── Timer.test.js
│   │   ├── aggregators.test.js
│   │   ├── constants.test.js
│   │   ├── setup.js            # Jest 测试前置脚本
│   │   └── useLocalStorage.test.js
│   ├── __mocks__/
│   │   └── fileMock.js         # 静态资源 mock
│   ├── components/             # React 组件
│   │   ├── Header.js           # 顶部导航栏
│   │   ├── Timer.js            # 计时器核心组件
│   │   ├── TaskList.js         # 任务列表
│   │   ├── Stats.js            # 统计页（Canvas 图表）
│   │   └── Settings.js         # 设置弹窗
│   ├── hooks/
│   │   └── useLocalStorage.js  # 本地存储自定义 Hook
│   ├── utils/
│   │   └── aggregators.js      # 数据聚合与格式化纯函数
│   ├── styles/
│   │   └── globals.css         # 全局样式 + CSS 变量主题
│   ├── App.js                  # 应用根组件，全局状态管理
│   ├── App.module.css
│   ├── constants.js            # 常量定义（PHASES 等）
│   └── index.js                # React 挂载入口
├── babel.config.json           # Babel 配置（Jest + webpack 共用）
├── jest.config.js              # Jest 测试配置
├── webpack.config.js           # webpack 配置（开发 + 生产）
└── package.json
```

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2 | UI 框架 |
| webpack | 5.89 | 模块打包器 |
| Babel | 7.23 | ES6+/JSX 转译 |
| CSS Modules | - | 样式模块化 |
| Canvas 2D | - | 柱状图/折线图绘制 |
| Web Notification API | - | 系统通知 |
| Web Audio API | - | 提示音效生成 |
| localStorage | - | 数据持久化 |
| Jest | 29.7 | 测试框架 |
| React Testing Library | 14.3 | 组件测试 |
| jsdom | 29.7 | 浏览器环境模拟 |

### webpack 特性
- ✅ JSX / ES6+ 转译
- ✅ CSS Modules（类名哈希 `[name]__[local]__[hash:base64:5]`）
- ✅ 开发环境热更新（HMR）
- ✅ 生产环境代码分割、CSS 提取、资源优化
- ✅ HtmlWebpackPlugin 自动注入

## 🎨 主题系统

通过 CSS 变量实现深色/浅色主题切换：

```css
:root[data-theme="light"] {
  --bg-primary: #f8fafc;
  --text-primary: #0f172a;
  --accent-primary: #8b5cf6;
  ...
}

:root[data-theme="dark"] {
  --bg-primary: #0f172a;
  --text-primary: #f8fafc;
  --accent-primary: #a78bfa;
  ...
}
```

所有组件（包括 Canvas 图表）自动响应主题变化。

## 💾 本地存储键名

| Key | 说明 |
|-----|------|
| `pomodoro-theme` | 主题 `light` / `dark` |
| `pomodoro-settings` | 用户自定义设置（时长、开关等） |
| `pomodoro-tasks` | 任务列表 |
| `pomodoro-history` | 历史记录 `{ [date]: { focusMinutes, sessions } }` |

## 📝 开发说明

### 纯函数抽离
数据聚合与格式化逻辑全部抽取到 `src/utils/aggregators.js`，便于单元测试：

- `getDailyData(history, days, today)` — 最近 N 天数据
- `getWeeklyData(history, weeks, today)` — 最近 N 周数据
- `getNextPhase(phase, completedWorkSessions, settings)` — 阶段切换逻辑
- `calcProgress(remaining, total)` — 进度百分比
- `formatFocusTime(minutes)` — 时间格式化
- `generateDemoHistory(randomFn, today)` — 生成演示数据

### 计时器实现
使用 `Date.now()` 绝对时间戳 + `setInterval` 轮询（250ms）的方式，避免浏览器后台节流导致计时不准：

```
endTime = startTime + duration
每 250ms 检查: remaining = max(0, endTime - Date.now())
remaining <= 0 时触发完成回调
```

同时监听 `visibilitychange` 和 `focus` 事件，后台切回时自动校正时间并检查是否到点。

## 📄 License

MIT
