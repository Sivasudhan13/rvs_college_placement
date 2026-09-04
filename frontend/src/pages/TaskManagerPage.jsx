import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import { taskAPI } from '../services/api';

const COLUMNS    = ['Todo', 'In Progress', 'Completed'];
const CATEGORIES = ['All', 'Assignment', 'Study', 'Career', 'Practice', 'Assessment'];
const PRIORITIES = ['All', 'High', 'Medium', 'Low'];

const priorityColor = { High: 'bg-red-100 text-red-600', Medium: 'bg-yellow-100 text-yellow-600', Low: 'bg-green-100 text-green-600' };
const categoryColor = { Assignment: 'bg-blue-100 text-blue-600', Study: 'bg-purple-100 text-purple-600', Career: 'bg-primary/10 text-primary', Practice: 'bg-orange-100 text-orange-600', Assessment: 'bg-pink-100 text-pink-600' };

/* ── Task card ── */
const TaskCard = ({ task, onMove, onDelete }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
    <div className="flex items-start justify-between gap-2 mb-2">
      <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">{task.title}</p>
      <button onClick={() => onDelete(task._id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500 flex-shrink-0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>
    </div>
    {task.description && <p className="text-xs text-gray-500 mb-3 leading-relaxed">{task.description}</p>}
    <div className="flex flex-wrap gap-1.5 mb-3">
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${categoryColor[task.category] || 'bg-gray-100 text-gray-500'}`}>{task.category}</span>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColor[task.priority]}`}>{task.priority}</span>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'No due date'}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.status !== 'Todo' && (
          <button onClick={() => onMove(task._id, -1)} className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 hover:bg-primary hover:text-white text-gray-500 transition-colors text-xs">‹</button>
        )}
        {task.status !== 'Completed' && (
          <button onClick={() => onMove(task._id, 1)} className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 hover:bg-primary hover:text-white text-gray-500 transition-colors text-xs">›</button>
        )}
      </div>
    </div>
  </div>
);

/* ── Add task modal ── */
const AddModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({ title: '', description: '', category: 'Study', priority: 'Medium', status: 'Todo', dueDate: '' });
  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    await onAdd(form);
    onClose();
  };
  const cls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all';
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">New Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="block text-xs font-semibold text-gray-700 mb-1">Title *</label><input name="title" value={form.title} onChange={handle} className={cls} autoFocus/></div>
          <div><label className="block text-xs font-semibold text-gray-700 mb-1">Description</label><textarea name="description" value={form.description} onChange={handle} rows={2} className={cls}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Category</label><select name="category" value={form.category} onChange={handle} className={cls}>{CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label><select name="priority" value={form.priority} onChange={handle} className={cls}>{PRIORITIES.filter((p) => p !== 'All').map((p) => <option key={p}>{p}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Status</label><select name="status" value={form.status} onChange={handle} className={cls}>{COLUMNS.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label><input name="dueDate" type="date" value={form.dueDate} onChange={handle} className={cls}/></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">Add Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Page ── */
const TaskManagerPage = () => {
  const [tasks,     setTasks]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [catFilter, setCatFilter] = useState('All');
  const [priFilter, setPriFilter] = useState('All');
  const [search,    setSearch]    = useState('');

  const load = async () => {
    try {
      const { data } = await taskAPI.getAll();
      setTasks(data.tasks || []);
    } catch { toast.error('Failed to load tasks'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = tasks.filter((t) => {
    const matchCat  = catFilter === 'All' || t.category === catFilter;
    const matchPri  = priFilter === 'All' || t.priority === priFilter;
    const matchSrch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchPri && matchSrch;
  });

  const moveTask = async (id, dir) => {
    const task = tasks.find((t) => t._id === id);
    if (!task) return;
    const idx    = COLUMNS.indexOf(task.status) + dir;
    const status = COLUMNS[Math.max(0, Math.min(COLUMNS.length - 1, idx))];
    try {
      await taskAPI.updateStatus(id, status);
      setTasks((prev) => prev.map((t) => t._id === id ? { ...t, status } : t));
    } catch { toast.error('Failed to update task'); }
  };

  const deleteTask = async (id) => {
    try {
      await taskAPI.remove(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      toast('Task removed', { icon: '🗑️' });
    } catch { toast.error('Failed to delete task'); }
  };

  const addTask = async (form) => {
    try {
      const { data } = await taskAPI.create(form);
      setTasks((prev) => [data.task, ...prev]);
      toast.success('Task added!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add task'); }
  };

  const stats = { total: tasks.length, todo: tasks.filter((t) => t.status === 'Todo').length, inProgress: tasks.filter((t) => t.status === 'In Progress').length, completed: tasks.filter((t) => t.status === 'Completed').length, high: tasks.filter((t) => t.priority === 'High' && t.status !== 'Completed').length };

  return (
    <DashboardLayout>
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={addTask}/>}

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Organize your academic and placement tasks.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
          New Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[['Total', stats.total,'bg-gray-400'],['Todo',stats.todo,'bg-blue-400'],['In Progress',stats.inProgress,'bg-primary'],['Completed',stats.completed,'bg-green-400'],['High Priority',stats.high,'bg-red-400']].map(([label,val,acc]) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${acc}`}/>
            <p className="text-2xl font-extrabold text-gray-900 pl-2">{val}</p>
            <p className="text-[11px] text-gray-400 pl-2 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray-400 flex-shrink-0"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <input type="text" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent"/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${catFilter === c ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}>{c}</button>)}
        </div>
        <div className="flex gap-2">
          {PRIORITIES.map((p) => <button key={p} onClick={() => setPriFilter(p)} className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${priFilter === p ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}>{p}</button>)}
        </div>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="flex justify-center py-16"><svg className="animate-spin h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {COLUMNS.map((col) => {
            const colTasks = filtered.filter((t) => t.status === col);
            return (
              <div key={col}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col === 'Todo' ? 'bg-blue-400' : col === 'In Progress' ? 'bg-primary' : 'bg-green-400'}`}/>
                    <h3 className="text-sm font-bold text-gray-900">{col}</h3>
                  </div>
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                <div className="space-y-3 min-h-[120px]">
                  {colTasks.length === 0
                    ? <div className="border-2 border-dashed border-gray-200 rounded-xl h-24 flex items-center justify-center"><p className="text-xs text-gray-400">No tasks</p></div>
                    : colTasks.map((task) => <TaskCard key={task._id} task={task} onMove={moveTask} onDelete={deleteTask}/>)
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default TaskManagerPage;
