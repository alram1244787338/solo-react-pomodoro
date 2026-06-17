import { render, screen, fireEvent } from '@testing-library/react';
import TaskList from '../components/TaskList';

jest.useFakeTimers();

const makeTasks = (count = 2) =>
  Array.from({ length: count }, (_, i) => ({
    id: `t${i + 1}`,
    name: `任务 ${i + 1}`,
    createdAt: new Date().toISOString(),
    completed: false,
    completedPomodoros: i,
  }));

const baseProps = {
  tasks: makeTasks(2),
  currentTaskId: null,
  onAdd: jest.fn(),
  onToggle: jest.fn(),
  onDelete: jest.fn(),
  onSelect: jest.fn(),
  onEdit: jest.fn(),
  todayCompletedTasks: 0,
  todayFocusMinutes: 0,
};

describe('TaskList add task', () => {
  it('renders input and add button', () => {
    render(<TaskList {...baseProps} />);
    expect(screen.getByPlaceholderText('添加一个任务...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '添加' })).toBeInTheDocument();
  });

  it('add button disabled when input is empty', () => {
    render(<TaskList {...baseProps} />);
    expect(screen.getByRole('button', { name: '添加' })).toBeDisabled();
  });

  it('enables add button when typing', () => {
    render(<TaskList {...baseProps} />);
    const input = screen.getByPlaceholderText('添加一个任务...');
    fireEvent.change(input, { target: { value: '新任务' } });
    expect(screen.getByRole('button', { name: '添加' })).not.toBeDisabled();
  });

  it('calls onAdd with name on submit', () => {
    const onAdd = jest.fn();
    render(<TaskList {...baseProps} onAdd={onAdd} />);
    const input = screen.getByPlaceholderText('添加一个任务...');
    fireEvent.change(input, { target: { value: '写周报' } });
    fireEvent.submit(input.closest('form'));
    expect(onAdd).toHaveBeenCalledWith('写周报');
    expect(input.value).toBe('');
  });

  it('trims whitespace before adding', () => {
    const onAdd = jest.fn();
    render(<TaskList {...baseProps} onAdd={onAdd} />);
    const input = screen.getByPlaceholderText('添加一个任务...');
    fireEvent.change(input, { target: { value: '  开发  ' } });
    fireEvent.submit(input.closest('form'));
    expect(onAdd).toHaveBeenCalledWith('开发');
  });

  it('does not call onAdd for empty string', () => {
    const onAdd = jest.fn();
    render(<TaskList {...baseProps} onAdd={onAdd} />);
    const input = screen.getByPlaceholderText('添加一个任务...');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form'));
    expect(onAdd).not.toHaveBeenCalled();
  });
});

describe('TaskList display', () => {
  it('renders all task names', () => {
    render(<TaskList {...baseProps} />);
    expect(screen.getByText('任务 1')).toBeInTheDocument();
    expect(screen.getByText('任务 2')).toBeInTheDocument();
  });

  it('shows completed pomodoro count', () => {
    const tasks = [
      { id: '1', name: 'UniqueA', createdAt: new Date().toISOString(), completed: false, completedPomodoros: 3 },
      { id: '2', name: 'UniqueB', createdAt: new Date().toISOString(), completed: false, completedPomodoros: 0 },
    ];
    render(<TaskList {...baseProps} tasks={tasks} />);
    expect(screen.getByText('🍅 3')).toBeInTheDocument();
  });

  it('highlights current task', () => {
    render(<TaskList {...baseProps} tasks={makeTasks(2)} currentTaskId="t2" />);
    const items = screen.getAllByRole('button', { name: '标记为完成' });
    const taskRow = items[1].closest('div');
    expect(taskRow.className).toMatch(/Active/);
  });

  it('shows task count', () => {
    render(<TaskList {...baseProps} tasks={makeTasks(3)} />);
    expect(screen.getByText(/3 个任务/)).toBeInTheDocument();
  });

  it('displays today stats', () => {
    render(<TaskList {...baseProps} todayCompletedTasks={3} todayFocusMinutes={75} />);
    expect(screen.getByText('1小时15分钟')).toBeInTheDocument();
  });
});

describe('TaskList toggle complete', () => {
  it('calls onToggle with task id', () => {
    const onToggle = jest.fn();
    const tasks = makeTasks(2);
    render(<TaskList {...baseProps} tasks={tasks} onToggle={onToggle} />);
    const buttons = screen.getAllByRole('button', { name: '标记为完成' });
    fireEvent.click(buttons[0]);
    expect(onToggle).toHaveBeenCalledWith('t1');
  });

  it('renders completed task with checkmark', () => {
    const tasks = [
      { id: '1', name: 'doneTask', createdAt: new Date().toISOString(), completed: true, completedPomodoros: 2 },
    ];
    render(<TaskList {...baseProps} tasks={tasks} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });
});

describe('TaskList delete', () => {
  it('calls onDelete with task id', () => {
    const onDelete = jest.fn();
    const tasks = makeTasks(1);
    render(<TaskList {...baseProps} tasks={tasks} onDelete={onDelete} />);
    const deleteBtn = screen.getByRole('button', { name: '删除任务' });
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith('t1');
  });
});

describe('TaskList select', () => {
  it('calls onSelect when clicking a task row', () => {
    const onSelect = jest.fn();
    const tasks = makeTasks(1);
    render(<TaskList {...baseProps} tasks={tasks} onSelect={onSelect} />);
    const row = screen.getByText('任务 1').closest('[class]');
    const taskItem = row.parentElement.parentElement;
    fireEvent.click(taskItem);
    expect(onSelect).toHaveBeenCalledWith('t1');
  });

  it('does not call onSelect for completed task', () => {
    const onSelect = jest.fn();
    const tasks = [
      { id: '1', name: 'done', createdAt: new Date().toISOString(), completed: true, completedPomodoros: 1 },
    ];
    render(<TaskList {...baseProps} tasks={tasks} onSelect={onSelect} />);
    const row = screen.getByText('done').closest('[class]');
    fireEvent.click(row);
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('TaskList edit', () => {
  it('shows edit input when edit button clicked', () => {
    const tasks = makeTasks(1);
    render(<TaskList {...baseProps} tasks={tasks} />);
    const editBtn = screen.getByRole('button', { name: '编辑任务' });
    fireEvent.click(editBtn);
    expect(screen.getByDisplayValue('任务 1')).toBeInTheDocument();
  });

  it('calls onEdit with new name on Enter', () => {
    const onEdit = jest.fn();
    const tasks = makeTasks(1);
    render(<TaskList {...baseProps} tasks={tasks} onEdit={onEdit} />);
    const editBtn = screen.getByRole('button', { name: '编辑任务' });
    fireEvent.click(editBtn);
    const input = screen.getByDisplayValue('任务 1');
    fireEvent.change(input, { target: { value: '修改后名字' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onEdit).toHaveBeenCalledWith('t1', '修改后名字');
  });

  it('cancels edit on Escape', () => {
    const onEdit = jest.fn();
    const tasks = makeTasks(1);
    render(<TaskList {...baseProps} tasks={tasks} onEdit={onEdit} />);
    const editBtn = screen.getByRole('button', { name: '编辑任务' });
    fireEvent.click(editBtn);
    const input = screen.getByDisplayValue('任务 1');
    fireEvent.change(input, { target: { value: '会被取消' } });
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByText('任务 1')).toBeInTheDocument();
  });

  it('saves on blur when value is valid', () => {
    const onEdit = jest.fn();
    const tasks = makeTasks(1);
    render(<TaskList {...baseProps} tasks={tasks} onEdit={onEdit} />);
    const editBtn = screen.getByRole('button', { name: '编辑任务' });
    fireEvent.click(editBtn);
    const input = screen.getByDisplayValue('任务 1');
    fireEvent.change(input, { target: { value: '模糊保存' } });
    fireEvent.blur(input);
    expect(onEdit).toHaveBeenCalledWith('t1', '模糊保存');
  });

  it('does not save empty name on Enter (and stays in edit mode)', () => {
    const onEdit = jest.fn();
    const tasks = makeTasks(1);
    render(<TaskList {...baseProps} tasks={tasks} onEdit={onEdit} />);
    const editBtn = screen.getByRole('button', { name: '编辑任务' });
    fireEvent.click(editBtn);
    const input = screen.getByDisplayValue('任务 1');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('任务名称不能为空')).toBeInTheDocument();
  });

  it('cancels on blur when value is empty (restores original name)', () => {
    const onEdit = jest.fn();
    const tasks = makeTasks(1);
    render(<TaskList {...baseProps} tasks={tasks} onEdit={onEdit} />);
    const editBtn = screen.getByRole('button', { name: '编辑任务' });
    fireEvent.click(editBtn);
    const input = screen.getByDisplayValue('任务 1');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.blur(input);
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByText('任务 1')).toBeInTheDocument();
  });

  it('trims name before saving', () => {
    const onEdit = jest.fn();
    const tasks = makeTasks(1);
    render(<TaskList {...baseProps} tasks={tasks} onEdit={onEdit} />);
    const editBtn = screen.getByRole('button', { name: '编辑任务' });
    fireEvent.click(editBtn);
    const input = screen.getByDisplayValue('任务 1');
    fireEvent.change(input, { target: { value: '  好 名字  ' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onEdit).toHaveBeenCalledWith('t1', '好 名字');
  });
});
