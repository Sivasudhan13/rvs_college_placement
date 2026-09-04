import React, { useState, useEffect } from 'react';
import { mockTestAPI } from '../../services/mockTestApi';
import toast from 'react-hot-toast';

const CATS = ['Aptitude','Logical Reasoning','Verbal Ability','Quantitative Aptitude','Technical','Programming','Company Specific','Mixed'];
const DIFFS= ['Easy','Medium','Hard','Mixed'];
const STATUSES = ['Draft','Published','Closed','Archived'];

const STATUS_COLORS = {
  Draft:     'bg-gray-100 text-gray-600',
  Published: 'bg-green-100 text-green-700',
  Closed:    'bg-red-100 text-red-700',
  Archived:  'bg-yellow-100 text-yellow-700',
};

const emptyForm = () => ({
  title: '', description: '', instructions: '',
  category: 'Aptitude', difficulty: 'Medium',
  duration: 30, passingPercentage: 60,
  startDate: '', endDate: '',
  status: 'Draft',
  showAnswers: false, showLeaderboard: true,
});

const emptyQ = () => ({
  question: '', questionType: 'MCQ',
  options: ['','','',''],
  correctAnswer: [0], explanation: '',
  marks: 1, negativeMarks: 0, difficulty: 'Medium',
});

/* ─────────────────────────────────────── */
export default function AdminMockTestsTab() {
  const [tests, setTests]         = useState([]);
  const [stats, setStats]         = useState({});
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState('list');   // list | create | edit | questions
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState(emptyForm());
  const [qForm, setQForm]         = useState(emptyQ());
  const [saving, setSaving]       = useState(false);
  const [qIdx, setQIdx]           = useState(null);     // editing question index

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [testsRes, statsRes] = await Promise.all([
        mockTestAPI.getTests({ limit: 50 }),
        mockTestAPI.getAdminStats(),
      ]);
      setTests(testsRes.data.tests || []);
      setStats(statsRes.data.stats || {});
    } catch { toast.error('Failed to load tests'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setForm(emptyForm()); setSelected(null); setView('create'); };
  const openEdit   = (t)  => { setForm({ ...emptyForm(), ...t, startDate: t.startDate?.split('T')[0] || '', endDate: t.endDate?.split('T')[0] || '' }); setSelected(t); setView('edit'); };
  const openQs     = (t)  => { setSelected(t); setQIdx(null); setQForm(emptyQ()); setView('questions'); };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return; }
    if (!form.duration || form.duration < 1) { toast.error('Duration required'); return; }
    setSaving(true);
    try {
      if (view === 'create') {
        const { data } = await mockTestAPI.createTest(form);
        setTests(prev => [data.test, ...prev]);
        toast.success('Test created');
        setSelected(data.test);
        setView('questions');
      } else {
        const { data } = await mockTestAPI.updateTest(selected._id, form);
        setTests(prev => prev.map(t => t._id === selected._id ? data.test : t));
        toast.success(form.status === 'Published' ? 'Test published! Students notified.' : 'Test updated');
        setView('list'); load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this test?')) return;
    try {
      await mockTestAPI.deleteTest(id);
      setTests(prev => prev.filter(t => t._id !== id));
      toast.success('Test deleted');
    } catch { toast.error('Delete failed'); }
  };

  /* ── Questions ── */
  const setQF = (k, v) => setQForm(q => ({ ...q, [k]: v }));
  const setOption = (i, v) => setQForm(q => { const o = [...q.options]; o[i] = v; return { ...q, options: o }; });
  const toggleCorrect = (i) => {
    setQForm(q => {
      if (q.questionType === 'MCQ' || q.questionType === 'TrueFalse')
        return { ...q, correctAnswer: [i] };
      const c = q.correctAnswer.includes(i)
        ? q.correctAnswer.filter(x => x !== i)
        : [...q.correctAnswer, i];
      return { ...q, correctAnswer: c };
    });
  };
  const addOption = () => setQForm(q => ({ ...q, options: [...q.options, ''] }));
  const removeOption = (i) => setQForm(q => ({ ...q, options: q.options.filter((_, idx) => idx !== i), correctAnswer: q.correctAnswer.filter(c => c !== i).map(c => c > i ? c - 1 : c) }));

  const saveQuestion = async () => {
    if (!qForm.question.trim()) { toast.error('Question text required'); return; }
    if (qForm.options.some(o => !o.trim())) { toast.error('All options must be filled'); return; }
    if (!qForm.correctAnswer.length) { toast.error('Select correct answer'); return; }
    setSaving(true);
    try {
      if (qIdx !== null) {
        const q = selected.questions[qIdx];
        const { data } = await mockTestAPI.updateQuestion(selected._id, q._id, qForm);
        setSelected(data.test);
      } else {
        const { data } = await mockTestAPI.addQuestion(selected._id, qForm);
        setSelected(data.test);
      }
      toast.success(qIdx !== null ? 'Question updated' : 'Question added');
      setQForm(emptyQ()); setQIdx(null);
    } catch { toast.error('Failed to save question'); }
    finally { setSaving(false); }
  };

  const delQuestion = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const { data } = await mockTestAPI.deleteQuestion(selected._id, qId);
      setSelected(data.test);
      toast.success('Question deleted');
    } catch { toast.error('Delete failed'); }
  };

  const editQuestion = (q, idx) => {
    setQIdx(idx);
    setQForm({ question: q.question, questionType: q.questionType, options: [...q.options], correctAnswer: [...q.correctAnswer], explanation: q.explanation || '', marks: q.marks, negativeMarks: q.negativeMarks, difficulty: q.difficulty });
  };

  /* ─────────────────────────────────────────
     RENDER
  ──────────────────────────────────────────── */
  if (loading) return (
    <div className="py-12 text-center">
      <svg className="animate-spin w-8 h-8 text-[#0c5273] mx-auto" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/>
      </svg>
    </div>
  );

  /* ── Stats banner ── */
  const StatBar = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
      {[
        { label: 'Total', value: stats.total || 0, c: 'text-blue-700 bg-blue-50' },
        { label: 'Published', value: stats.published || 0, c: 'text-green-700 bg-green-50' },
        { label: 'Draft', value: stats.draft || 0, c: 'text-gray-700 bg-gray-100' },
        { label: 'Attempts', value: stats.totalAttempts || 0, c: 'text-purple-700 bg-purple-50' },
        { label: 'Avg Score', value: `${stats.averageScore || 0}%`, c: 'text-indigo-700 bg-indigo-50' },
        { label: 'Pass Rate', value: `${stats.passPercentage || 0}%`, c: 'text-teal-700 bg-teal-50' },
      ].map(s => (
        <div key={s.label} className={`rounded-xl p-3 text-center ${s.c}`}>
          <p className="text-xl font-bold">{s.value}</p>
          <p className="text-[11px] font-medium mt-0.5 opacity-80">{s.label}</p>
        </div>
      ))}
    </div>
  );

  /* ── Question form ── */
  if (view === 'questions') return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => { setView('list'); load(); }} className="text-sm text-[#0c5273] hover:underline">← Back</button>
        <h2 className="text-lg font-bold text-gray-900 truncate">{selected?.title} — Questions ({selected?.questions?.length || 0})</h2>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-auto ${STATUS_COLORS[selected?.status]}`}>{selected?.status}</span>
        {selected?.status === 'Draft' && (
          <button onClick={() => { openEdit(selected); }}
            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
            Publish Test
          </button>
        )}
      </div>

      {/* Question add/edit form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-semibold text-sm text-gray-800">{qIdx !== null ? 'Edit Question' : 'Add New Question'}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select value={qForm.questionType} onChange={e => setQF('questionType', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="MCQ">MCQ</option>
            <option value="MultiSelect">Multiple Select</option>
            <option value="TrueFalse">True / False</option>
          </select>
          <select value={qForm.difficulty} onChange={e => setQF('difficulty', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            {DIFFS.map(d => <option key={d}>{d}</option>)}
          </select>
          <div className="flex gap-2">
            <input type="number" value={qForm.marks} onChange={e => setQF('marks', +e.target.value)} min="0" placeholder="+Marks" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <input type="number" value={qForm.negativeMarks} onChange={e => setQF('negativeMarks', +e.target.value)} min="0" step="0.25" placeholder="-Neg" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <textarea value={qForm.question} onChange={e => setQF('question', e.target.value)} placeholder="Question text…" rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0c5273]/20 focus:border-[#0c5273]"/>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600">Options — click circle to mark correct answer</p>
          {qForm.options.map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <button type="button" onClick={() => toggleCorrect(oi)}
                className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                  qForm.correctAnswer.includes(oi) ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 text-gray-500 hover:border-green-400'
                }`}>
                {String.fromCharCode(65+oi)}
              </button>
              <input value={opt} onChange={e => setOption(oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65+oi)}`}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c5273]/20 focus:border-[#0c5273]"/>
              {qForm.options.length > 2 && (
                <button onClick={() => removeOption(oi)} className="text-red-400 hover:text-red-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              )}
            </div>
          ))}
          {qForm.options.length < 6 && (
            <button onClick={addOption} className="text-xs text-[#0c5273] font-medium hover:underline">+ Add option</button>
          )}
        </div>

        <textarea value={qForm.explanation} onChange={e => setQF('explanation', e.target.value)} placeholder="Explanation (optional — shown after test if answers visible)" rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"/>

        <div className="flex gap-2">
          <button onClick={saveQuestion} disabled={saving}
            className="bg-[#0c5273] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#0a4561] disabled:opacity-60 transition-colors">
            {saving ? 'Saving…' : qIdx !== null ? 'Update Question' : 'Add Question'}
          </button>
          {qIdx !== null && (
            <button onClick={() => { setQIdx(null); setQForm(emptyQ()); }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Existing questions */}
      {selected?.questions?.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-700">Existing Questions ({selected.questions.length})</h3>
          {selected.questions.map((q, i) => (
            <div key={q._id || i} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-[#0c5273]/10 text-[#0c5273] rounded-full flex items-center justify-center text-xs font-bold">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-medium leading-snug">{q.question}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded ${q.correctAnswer.includes(oi) ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-500'}`}>
                        <span className="font-bold">{String.fromCharCode(65+oi)}.</span> {opt}
                        {q.correctAnswer.includes(oi) && <span className="text-green-600">✓</span>}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                    <span>+{q.marks}m</span>
                    {q.negativeMarks > 0 && <span className="text-red-400">−{q.negativeMarks}</span>}
                    <span className={`px-1.5 py-0.5 rounded ${q.difficulty === 'Easy' ? 'bg-green-50 text-green-600' : q.difficulty === 'Hard' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>{q.difficulty}</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => editQuestion(q, i)} className="p-1.5 text-gray-400 hover:text-[#0c5273] hover:bg-gray-100 rounded-lg">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                  <button onClick={() => delQuestion(q._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ── Create / Edit form ── */
  if (view === 'create' || view === 'edit') return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('list')} className="text-sm text-[#0c5273] hover:underline">← Back</button>
        <h2 className="text-lg font-bold text-gray-900">{view === 'create' ? 'Create New Test' : 'Edit Test'}</h2>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Test Title *</label>
          <input value={form.title} onChange={e => setF('title', e.target.value)} placeholder="e.g., Aptitude Mock Test 1"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c5273]/20 focus:border-[#0c5273]"/>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={e => setF('description', e.target.value)} rows={2} placeholder="Short description…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0c5273]/20 focus:border-[#0c5273]"/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
            <select value={form.category} onChange={e => setF('category', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Difficulty</label>
            <select value={form.difficulty} onChange={e => setF('difficulty', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {DIFFS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (min) *</label>
            <input type="number" value={form.duration} onChange={e => setF('duration', +e.target.value)} min="1"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Passing % *</label>
            <input type="number" value={form.passingPercentage} onChange={e => setF('passingPercentage', +e.target.value)} min="0" max="100"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
            <input type="date" value={form.startDate} onChange={e => setF('startDate', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
            <input type="date" value={form.endDate} onChange={e => setF('endDate', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"/>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Instructions</label>
          <textarea value={form.instructions} onChange={e => setF('instructions', e.target.value)} rows={3} placeholder="Test instructions shown before start…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={e => setF('status', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 mt-4 cursor-pointer">
            <input type="checkbox" checked={form.showAnswers} onChange={e => setF('showAnswers', e.target.checked)} className="w-4 h-4 accent-[#0c5273]"/>
            Show answers after test
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 mt-4 cursor-pointer">
            <input type="checkbox" checked={form.showLeaderboard} onChange={e => setF('showLeaderboard', e.target.checked)} className="w-4 h-4 accent-[#0c5273]"/>
            Show leaderboard
          </label>
        </div>
        {view === 'edit' && form.status === 'Published' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
            ✅ Saving as Published will notify all students by in-app notification and email.
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={saving}
            className="bg-[#0c5273] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0a4561] disabled:opacity-60 transition-colors">
            {saving ? 'Saving…' : view === 'create' ? 'Create Test' : 'Save Changes'}
          </button>
          <button onClick={() => setView('list')} className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  /* ── List view ── */
  return (
    <div className="space-y-5">
      <StatBar />
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">All Mock Tests</h2>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-[#0c5273] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0a4561] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
          Create Mock Test
        </button>
      </div>

      {tests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="text-gray-500 font-medium">No mock tests yet</h3>
          <button onClick={openCreate} className="mt-3 text-sm text-[#0c5273] font-semibold hover:underline">Create your first test →</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Test', 'Category', 'Questions', 'Duration', 'Attempts', 'Avg Score', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tests.map(t => (
                  <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px]">
                      <div className="truncate">{t.title}</div>
                      <div className="text-xs text-gray-400">{t.difficulty}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <span className="bg-blue-50 text-blue-700 text-[11px] font-medium px-2 py-0.5 rounded">{t.category}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.totalQuestions}</td>
                    <td className="px-4 py-3 text-gray-600">{t.duration}m</td>
                    <td className="px-4 py-3 text-gray-600">{t.totalAttempts || 0}</td>
                    <td className="px-4 py-3 text-gray-600">{t.averageScore ? `${t.averageScore}%` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status]}`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openQs(t)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Questions">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.8"/><rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg>
                        </button>
                        <button onClick={() => openEdit(t)} className="p-1.5 text-gray-400 hover:text-[#0c5273] hover:bg-gray-100 rounded-lg" title="Edit">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                        <button onClick={() => del(t._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
