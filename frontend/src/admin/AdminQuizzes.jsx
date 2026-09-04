import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../services/adminApi';

const CATEGORIES   = ['Aptitude','Technical','HR / Soft Skills','Coding','Reasoning'];
const DIFFICULTIES = ['Easy','Medium','Hard'];
const catColor  = { Aptitude:'bg-blue-100 text-blue-700', Technical:'bg-green-100 text-green-700', 'HR / Soft Skills':'bg-red-100 text-red-700', Coding:'bg-purple-100 text-purple-700', Reasoning:'bg-orange-100 text-orange-700' };
const diffColor = { Easy:'bg-green-100 text-green-700', Medium:'bg-yellow-100 text-yellow-700', Hard:'bg-red-100 text-red-700' };

const Spin = () => (
  <div className="flex justify-center py-16">
    <svg className="animate-spin h-6 w-6 text-amber-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-white';

/* ── Quiz modal ── */
const QuizModal = ({ quiz, onClose, onSaved }) => {
  const isEdit = !!quiz?._id;
  const [form, setForm] = useState(isEdit
    ? { title: quiz.title, category: quiz.category, difficulty: quiz.difficulty, duration: quiz.duration, totalQuestions: quiz.totalQuestions, description: quiz.description||'', tags: (quiz.tags||[]).join(', '), isPublished: quiz.isPublished }
    : { title:'', category:'Aptitude', difficulty:'Medium', duration:30, totalQuestions:0, description:'', tags:'', isPublished:true });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean) };
      if (isEdit) await adminAPI.updateQuiz(quiz._id, payload);
      else await adminAPI.createQuiz(payload);
      toast.success(isEdit ? 'Quiz updated!' : 'Quiz created!');
      onSaved();
    } catch(err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-bold text-gray-900">{isEdit?'Edit Quiz':'New Quiz'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label><input className={inp} value={form.title} onChange={e=>set('title',e.target.value)} autoFocus/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
              <select className={inp} value={form.category} onChange={e=>set('category',e.target.value)}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Difficulty</label>
              <select className={inp} value={form.difficulty} onChange={e=>set('difficulty',e.target.value)}>{DIFFICULTIES.map(d=><option key={d}>{d}</option>)}</select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Duration (mins)</label><input type="number" className={inp} value={form.duration} onChange={e=>set('duration',+e.target.value)}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Total Questions</label><input type="number" className={inp} value={form.totalQuestions} onChange={e=>set('totalQuestions',+e.target.value)}/></div>
          </div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Description</label><textarea rows={2} className={inp} value={form.description} onChange={e=>set('description',e.target.value)}/></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Tags (comma separated)</label><input className={inp} value={form.tags} onChange={e=>set('tags',e.target.value)}/></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublished} onChange={e=>set('isPublished',e.target.checked)} className="w-4 h-4 accent-amber-400"/>
            <span className="text-sm text-gray-700">Published (visible to students)</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-60 transition-colors">
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminQuizzes = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [modal, setModal]   = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const {data} = await adminAPI.getQuizzes(); setQuizzes(data.quizzes||[]); }
    catch { toast.error('Failed to load quizzes'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this quiz and all questions?')) return;
    try { await adminAPI.deleteQuiz(id); toast.success('Quiz deleted'); load(); }
    catch(err) { toast.error(err.response?.data?.message||'Failed'); }
  };

  const filtered = quizzes.filter(q => {
    const matchCat = catFilter==='All' || q.category===catFilter;
    const matchSrch = q.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSrch;
  });

  return (
    <div>
      {modal && <QuizModal quiz={editing} onClose={()=>{setModal(false);setEditing(null);}} onSaved={()=>{setModal(false);setEditing(null);load();}}/>}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quizzes</h1>
          <p className="text-sm text-gray-500 mt-1">{quizzes.length} quizzes in the platform</p>
        </div>
        <button onClick={()=>{setEditing(null);setModal(true);}}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
          New Quiz
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray-400"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <input type="text" placeholder="Search quizzes…" value={search} onChange={e=>setSearch(e.target.value)} className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent"/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All',...CATEGORIES].map(c => (
            <button key={c} onClick={()=>setCatFilter(c)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${catFilter===c?'bg-amber-400 text-white border-amber-400':'bg-white text-gray-600 border-gray-200 hover:border-amber-400'}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? <Spin/> : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Difficulty</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Duration</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Questions</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(q => (
                  <tr key={q._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{q.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{(q.tags||[]).join(', ')}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${catColor[q.category]||'bg-gray-100 text-gray-500'}`}>{q.category}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${diffColor[q.difficulty]}`}>{q.difficulty}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-gray-600">{q.duration} min</td>
                    <td className="px-4 py-3.5 text-center text-gray-600">{q.totalQuestions}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${q.isPublished?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                        {q.isPublished?'Published':'Draft'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={()=>navigate(`/admin/questions?quiz=${q._id}`)}
                          className="text-xs font-semibold text-primary hover:underline">Questions</button>
                        <button onClick={()=>{setEditing(q);setModal(true);}}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                        <button onClick={()=>handleDelete(q._id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">No quizzes found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuizzes;
