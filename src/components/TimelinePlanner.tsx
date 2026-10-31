import React, { useState, useMemo } from 'react';
import { TimelineTask, EventProfile, TaskStatus } from '../types';
import { formatEventDate, downloadICS, getDaysRemaining } from '../utils/formatters';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2, 
  Download, 
  Filter, 
  Columns, 
  ListOrdered, 
  CalendarDays,
  User,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerMilestoneCelebration } from '../utils/celebration';

interface TimelinePlannerProps {
  event: EventProfile;
  tasks: TimelineTask[];
  setTasks: React.Dispatch<React.SetStateAction<TimelineTask[]>>;
  onAskCopilot: (prompt: string) => void;
  onMilestoneComplete?: (task: TimelineTask) => void;
}

export const TimelinePlanner: React.FC<TimelinePlannerProps> = ({
  event,
  tasks,
  setTasks,
  onAskCopilot,
  onMilestoneComplete,
}) => {
  const [activeView, setActiveView] = useState<'timeline' | 'kanban' | 'calendar'>('timeline');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Planning');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newAssignee, setNewAssignee] = useState(event.ownerName || 'Lead Planner');

  // Categories list
  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(tasks.map((t) => t.category)))];
  }, [tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchCat = filterCategory === 'All' || t.category === filterCategory;
      const matchPri = filterPriority === 'All' || t.priority === filterPriority;
      const matchSta = filterStatus === 'All' || t.status === filterStatus;
      return matchCat && matchPri && matchSta;
    });
  }, [tasks, filterCategory, filterPriority, filterStatus]);

  // Tasks sorted by due date
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [filteredTasks]);

  // Grouped by status for Kanban
  const kanbanColumns = useMemo(() => {
    return {
      todo: filteredTasks.filter((t) => t.status === 'todo'),
      in_progress: filteredTasks.filter((t) => t.status === 'in_progress'),
      done: filteredTasks.filter((t) => t.status === 'done'),
    };
  }, [filteredTasks]);

  // Toggle complete
  const handleToggleStatus = (id: string, currentStatus: TaskStatus) => {
    const nextStatus: TaskStatus = currentStatus === 'done' ? 'todo' : 'done';
    const targetTask = tasks.find((t) => t.id === id);

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextStatus, completed: nextStatus === 'done' } : t))
    );

    if (nextStatus === 'done' && targetTask) {
      const isMajor = targetTask.priority === 'high' || targetTask.category === 'Final Week' || targetTask.category === 'Venue' || targetTask.category === 'Catering';
      if (isMajor) {
        if (onMilestoneComplete) {
          onMilestoneComplete(targetTask);
        } else {
          triggerMilestoneCelebration();
        }
      } else {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 },
        });
      }
    }
  };

  const handleUpdateStatus = (id: string, newStatus: TaskStatus) => {
    const targetTask = tasks.find((t) => t.id === id);
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus, completed: newStatus === 'done' } : t))
    );
    if (newStatus === 'done' && targetTask) {
      const isMajor = targetTask.priority === 'high' || targetTask.category === 'Final Week' || targetTask.category === 'Venue' || targetTask.category === 'Catering';
      if (isMajor) {
        if (onMilestoneComplete) {
          onMilestoneComplete(targetTask);
        } else {
          triggerMilestoneCelebration();
        }
      } else {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const taskDate = newDueDate || new Date().toISOString().split('T')[0];
    const newTask: TimelineTask = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      category: newCategory,
      dueDate: taskDate,
      priority: newPriority,
      status: 'todo',
      assignee: newAssignee.trim() || 'Lead Planner',
      completed: false,
    };

    setTasks((prev) => [...prev, newTask]);
    setNewTitle('');
    setNewDesc('');
    setIsAddModalOpen(false);
  };

  // Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Progress Header */}
      <div className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 festive-card-glow">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-display font-black text-stone-900 text-xl">Milestone Countdown Timeline</h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {completedTasks}/{totalTasks} Completed ({progressPercent}%)
            </span>
          </div>
          <p className="font-serif-festive italic text-xs text-amber-800 mt-1">
            Backwards scheduled from celebration day: <strong className="text-stone-900 font-sans not-italic font-bold">{formatEventDate(event.date)}</strong>
          </p>
          <div className="w-64 bg-amber-100/60 h-2 rounded-full mt-2.5 overflow-hidden border border-amber-200/50">
            <div
              className="bg-linear-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* View Switcher */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold border border-stone-200">
            <button
              type="button"
              onClick={() => setActiveView('timeline')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'timeline' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('kanban')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'kanban' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('calendar')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'calendar' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          {/* Export to ICS Calendar */}
          <button
            type="button"
            onClick={() => downloadICS(event, tasks)}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 px-3 py-2 rounded-xl transition-colors shadow-xs"
            title="Download .ICS file to import into Google Calendar or Apple Calendar"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export .ICS</span>
          </button>

          {/* Add Task */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-2 rounded-xl transition-colors shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-stone-400 font-semibold flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filters:
        </span>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-white border border-stone-200 text-stone-700 font-medium rounded-lg px-2.5 py-1.5 focus:outline-hidden"
        >
          {categories.map((c) => (
            <option key={c} value={c}>Category: {c}</option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-white border border-stone-200 text-stone-700 font-medium rounded-lg px-2.5 py-1.5 focus:outline-hidden"
        >
          <option value="All">Priority: All</option>
          <option value="high">High Only</option>
          <option value="medium">Medium Only</option>
          <option value="low">Low Only</option>
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-stone-200 text-stone-700 font-medium rounded-lg px-2.5 py-1.5 focus:outline-hidden"
        >
          <option value="All">Status: All</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Completed</option>
        </select>

        <button
          type="button"
          onClick={() => onAskCopilot(`Can you review our timeline for "${event.title}" and suggest if any critical milestones or vendor payment dates are missing?`)}
          className="ml-auto text-xs text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Audit Timeline with AI</span>
        </button>
      </div>

      {/* VIEW 1: Chronological Timeline */}
      {activeView === 'timeline' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:inset-0 before:left-[19px] sm:before:left-[27px] before:w-0.5 before:bg-stone-200">
            {sortedTasks.map((task) => {
              const isDone = task.status === 'done';
              const daysInfo = getDaysRemaining(task.dueDate);
              const isOverdue = daysInfo.isPast && !isDone;

              return (
                <div key={task.id} className="relative group">
                  
                  {/* Timeline Node Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(task.id, task.status)}
                    className={`absolute -left-[30px] sm:-left-[38px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs'
                        : isOverdue
                        ? 'bg-rose-50 border-rose-400 text-rose-600 hover:bg-rose-100'
                        : 'bg-white border-stone-300 text-transparent hover:border-stone-500'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${isDone ? 'opacity-100' : 'opacity-0 hover:opacity-40'}`} />
                  </button>

                  {/* Task Card */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    isDone
                      ? 'bg-stone-50/70 border-stone-200 opacity-75'
                      : isOverdue
                      ? 'bg-rose-50/30 border-rose-200 hover:border-rose-300'
                      : 'bg-white border-stone-200 hover:border-stone-300 shadow-xs'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-sm ${isDone ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                          {task.title}
                        </span>
                        
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                          {task.category}
                        </span>

                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          task.priority === 'high'
                            ? 'bg-rose-100 text-rose-800'
                            : task.priority === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs shrink-0">
                        <span className={`flex items-center gap-1 font-semibold ${
                          isOverdue ? 'text-rose-600' : 'text-stone-600'
                        }`}>
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          {formatEventDate(task.dueDate)}
                          {isOverdue && <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold">Overdue</span>}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          aria-label={`Delete task ${task.title}`}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-stone-400 hover:text-rose-600 focus:text-rose-600 transition-opacity focus:outline-hidden focus:ring-2 focus:ring-rose-400 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-xs text-stone-500 leading-relaxed mb-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px] text-stone-400">
                      <span className="flex items-center gap-1 text-stone-600 font-medium">
                        <User className="w-3 h-3 text-stone-400" /> {task.assignee}
                      </span>

                      {/* Status Selector */}
                      <div className="flex items-center gap-1">
                        {(['todo', 'in_progress', 'done'] as TaskStatus[]).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdateStatus(task.id, st)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition-colors ${
                              task.status === st
                                ? st === 'done'
                                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                                  : st === 'in_progress'
                                  ? 'bg-amber-100 text-amber-800 font-bold'
                                  : 'bg-stone-200 text-stone-800 font-bold'
                                : 'text-stone-400 hover:text-stone-600'
                            }`}
                          >
                            {st === 'in_progress' ? 'In Progress' : st}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Kanban Columns */}
      {activeView === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* To Do Column */}
          <div className="bg-stone-100/70 rounded-2xl p-4 border border-stone-200">
            <div className="flex items-center justify-between mb-3 text-stone-700">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                To Do ({kanbanColumns.todo.length})
              </span>
            </div>
            <div className="space-y-3">
              {kanbanColumns.todo.map((task) => (
                <div key={task.id} className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-stone-900 leading-snug">{task.title}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 uppercase">
                      {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-[11px] text-stone-500 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-stone-100">
                    <span>{formatEventDate(task.dueDate)}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5"
                    >
                      <span>Start</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200">
            <div className="flex items-center justify-between mb-3 text-amber-900">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                In Progress ({kanbanColumns.in_progress.length})
              </span>
            </div>
            <div className="space-y-3">
              {kanbanColumns.in_progress.map((task) => (
                <div key={task.id} className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-stone-900 leading-snug">{task.title}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
                      {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-[11px] text-stone-500 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(task.id, 'todo')}
                      className="text-stone-400 hover:text-stone-600"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(task.id, 'done')}
                      className="text-emerald-600 hover:text-emerald-800 font-semibold flex items-center gap-0.5"
                    >
                      <span>Complete</span>
                      <CheckCircle2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Column */}
          <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200">
            <div className="flex items-center justify-between mb-3 text-emerald-900">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Done ({kanbanColumns.done.length})
              </span>
            </div>
            <div className="space-y-3">
              {kanbanColumns.done.map((task) => (
                <div key={task.id} className="bg-white/90 p-3.5 rounded-xl border border-emerald-200 shadow-xs space-y-2 opacity-85">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-stone-500 line-through leading-snug">{task.title}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                    <span>Finished</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(task.id, 'todo')}
                      className="text-xs text-stone-400 hover:text-stone-600"
                    >
                      Reopen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* VIEW 3: Calendar Month View */}
      {activeView === 'calendar' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-amber-500" />
              <span>Event Date Alignment: {formatEventDate(event.date)}</span>
            </h4>
            <span className="text-xs text-stone-400">
              All tasks positioned relative to event countdown
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedTasks.map((task) => {
              const isDone = task.status === 'done';
              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    isDone ? 'bg-stone-50 border-stone-200 opacity-70' : 'bg-white border-stone-200 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                      <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                        {formatEventDate(task.dueDate)}
                      </span>
                      <span className="uppercase font-semibold">{task.category}</span>
                    </div>
                    <div className={`font-bold text-xs mt-1 ${isDone ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                      {task.title}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-stone-100">
                    <span className="text-[11px] text-stone-500">{task.assignee}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(task.id, task.status)}
                      className="text-xs font-semibold text-emerald-600 hover:underline"
                    >
                      {isDone ? 'Mark Incomplete' : 'Mark Done'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="font-bold text-lg text-stone-900 mb-1">Add Timeline Task</h3>
            <p className="text-xs text-stone-500 mb-4">
              Create a new countdown milestone or vendor deadline.
            </p>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Finalize seating chart / Confirm floral load-in"
                  className="w-full text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Description / Checklist</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What specifically needs to be checked or completed?"
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                  >
                    <option value="Venue">Venue</option>
                    <option value="Vendors">Vendors</option>
                    <option value="Catering">Catering</option>
                    <option value="Decor">Decor</option>
                    <option value="Invitations">Invitations</option>
                    <option value="Program">Program</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Final Week">Final Week</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Assignee</label>
                  <input
                    type="text"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    placeholder="Assign to..."
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
