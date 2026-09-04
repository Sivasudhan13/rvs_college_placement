import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../services/adminApi';

const DIFFICULTIES = ['Easy','Medium','Hard'];
const diffColor    = { Easy:'bg-green-100 text-green-700', Medium:'bg-yellow-100 text-yellow-700', Hard:'bg-red-100 text-red-700' };
const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-white';

const Spin = () => (
  <div className="flex justify-center py-16">
    <svg className="animate-spin h-6 w-6 text-amber-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
);

/* ── Question modal ── */
const QuestionModal = ({ quizId, question, onClose, onSaved }) => {
  const isEdit = !!question?._id;
  const blank  = { questionText:'', options:['','','',''], correctAnswer:0, marks:4, negativeMarks:1, explanation:'', difficulty:'Medium' };
  const [form, setForm] = useState(isEdit ? { ...question, options:[...question.options] } : blank);
  const [saving, setSaving] = useState(false);
  const setOpt = (i,v) => { const o=[...form.options]; o[i]=v; setForm(p=>({...p,options:o})); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.questionText.trim()) { toast.error('Question text required'); return; }
    if (form.options.some(o=>!o.trim())) { toast.error('All 4 options required'); return; }
    setSaving(true);
    try {
      if (isEdit) await adminAPI.updateQuestion(quizId, question._id, form);
      else await adminAPI.addQuestion(quizId, form);
      toast.success(isEdit?'Question updated!':'Question added!');
      onSaved();
    } catch(err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-gray-900">{isEdit?'Edit Question':'Add Question'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Question Text *</label>
            <textarea rows={3} className={inp} value={form.questionText} onChange={e=>setForm(p=>({...p,questionText:e.target.value}))}/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Options * <span className="text-gray-400 font-normal">(radio = correct answer)</span></label>
            {form.options.map((opt,i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input type="radio" name="correct" checked={form.correctAnswer===i} onChange={()=>setForm(p=>({...p,correctAnswer:i}))} className="w-4 h-4 accent-amber-400 flex-shrink-0"/>
                <input className={inp} value={opt} placeholder={`Option ${String.fromCharCode(65+i)}`} onChange={e=>setOpt(i,e.target.value)}/>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Marks</label><input type="number" className={inp} value={form.marks} onChange={e=>setForm(p=>({...p,marks:+e.target.value}))}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Negative</label><input type="number" className={inp} value={form.negativeMarks} onChange={e=>setForm(p=>({...p,negativeMarks:+e.target.value}))}/></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Difficulty</label>
              <select className={inp} value={form.difficulty} onChange={e=>setForm(p=>({...p,difficulty:e.target.value}))}>
                {DIFFICULTIES.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Explanation</label><textarea rows={2} className={inp} value={form.explanation} onChange={e=>setForm(p=>({...p,explanation:e.target.value}))}/></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-60 transition-colors">
              {saving?'Saving…':isEdit?'Update':'Add Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminQuestions = () => {
  const [searchParams] = useSearchParams();
  const preselectedId  = searchParams.get('quiz');

  const [quizzes,      setQuizzes]      = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizDetail,   setQuizDetail]   = useState(null);
  const [loadingQ,     setLoadingQ]     = useState(false);
  const [loadingList,  setLoadingList]  = useState(true);
  const [modal,        setModal]        = useState(false);
  const [editingQ,     setEditingQ]     = useState(null);
  const [search,       setSearch]       = useState('');

  /* load quiz list */
  useEffect(() => {
    adminAPI.getQuizzes()
      .then(({ data }) => {
        setQuizzes(data.quizzes || []);
        if (preselectedId) {
          const found = (data.quizzes || []).find(q => q._id === preselectedId);
          if (found) { setSelectedQuiz(found); loadDetail(preselectedId); }
        }
      })
      .catch(() => toast.error('Failed to load quizzes'))
      .finally(() => setLoadingList(false));
  }, []);

  const loadDetail = async (id) => {
    setLoadingQ(true);
    try { const { data } = await adminAPI.getQuiz(id); setQuizDetail(data.quiz); }
    catch { toast.error('Failed to load questions'); }
    finally { setLoadingQ(false); }
  };

  const handleSelectQuiz = (q) => { setSelectedQuiz(q); loadDetail(q._id); };

  const handleDeleteQ = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    try { await adminAPI.deleteQuestion(selectedQuiz._id, qId); toast.success('Question deleted'); loadDetail(selectedQuiz._id); }
    catch(err) { toast.error(err.response?.data?.message||'Failed'); }
  };

  const filteredQuestions = (quizDetail?.questions||[]).filter(q =>
    q.questionText.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {modal && selectedQuiz && (
        <QuestionModal quizId={selectedQuiz._id} question={editingQ}
          onClose={()=>{setModal(false);setEditingQ(null);}}
          onSaved={()=>{setModal(false);setEditingQ(null);loadDetail(selectedQuiz._id);}}/>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
        <p className="text-sm text-gray-500 mt-1">Select a quiz to view and manage its questions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Quiz selector */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">Select Quiz</p>
          </div>
          {loadingList ? <Spin/> : (
            <div className="overflow-y-auto max-h-[650px]">
              {quizzes.map(q => (
                <button key={q._id} onClick={()=>handleSelectQuiz(q)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left border-b border-gray-50 transition-colors
                    ${selectedQuiz?._id===q._id?'bg-amber-50 border-l-2 border-l-amber-400':'hover:bg-gray-50'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{q.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${diffColor[q.difficulty]||''}`}>{q.difficulty}</span>
                      <span className="text-[10px] text-gray-400">{q.totalQuestions} Qs · {q.duration} min</span>
                    </div>
                  </div>
                  {selectedQuiz?._id===q._id && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-amber-400 flex-shrink-0 mt-1">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
              {!quizzes.length && <p className="px-4 py-6 text-sm text-gray-400 text-center">No quizzes yet</p>}
            </div>
          )}
        </div>

        {/* Question list */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {!selectedQuiz ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="opacity-30">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <p className="text-sm">Select a quiz to manage questions</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-900">{selectedQuiz.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{quizDetail?.questions?.length||0} questions</p>
                </div>
                <button onClick={()=>{setEditingQ(null);setModal(true);}}
                  className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                  Add Question
                </button>
              </div>
              {/* search within questions */}
              <div className="px-4 py-2 border-b border-gray-100">
                <input type="text" placeholder="Search questions…" value={search} onChange={e=>setSearch(e.target.value)}
                  className="w-full text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-gray-50 rounded-lg px-3 py-2"/>
              </div>
              {loadingQ ? <Spin/> : (
                <div className="overflow-y-auto max-h-[590px] divide-y divide-gray-50">
                  {filteredQuestions.map((q,i) => (
                    <div key={q._id||i} className="px-5 py-4 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">
                          <span className="text-amber-500 mr-1.5">Q{i+1}.</span>{q.questionText}
                        </p>
                        <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={()=>{setEditingQ(q);setModal(true);}}
                            className="p-1.5 rounded text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                          </button>
                          <button onClick={()=>handleDeleteQ(q._id)}
                            className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 mb-2">
                        {(q.options||[]).map((opt,oi) => (
                          <div key={oi} className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg
                            ${oi===q.correctAnswer?'bg-green-50 text-green-700 font-semibold':'text-gray-500 bg-gray-50'}`}>
                            {oi===q.correctAnswer && <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            <span>{String.fromCharCode(65+oi)}. {opt}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${diffColor[q.difficulty]||''}`}>{q.difficulty}</span>
                        <span className="text-[10px] text-gray-400">+{q.marks} / -{q.negativeMarks}</span>
                        {q.explanation && <span className="text-[10px] text-gray-400 italic truncate">💡 {q.explanation}</span>}
                      </div>
                    </div>
                  ))}
                  {!filteredQuestions.length && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                      <p className="text-sm">{search?'No matching questions':'No questions yet'}</p>
                      {!search && <button onClick={()=>{setEditingQ(null);setModal(true);}} className="text-xs text-amber-500 hover:underline">Add the first question</button>}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminQuestions;
