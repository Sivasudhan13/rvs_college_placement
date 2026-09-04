import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { dsaAPI } from '../services/dsaApi';

/* ──────────────────────────────────────────
   CONSTANTS
────────────────────────────────────────── */
const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { id: 'python',     label: 'Python 3',   monaco: 'python'     },
  { id: 'java',       label: 'Java',       monaco: 'java'       },
  { id: 'cpp',        label: 'C++',        monaco: 'cpp'        },
];

const diffColor = { Easy:'text-green-500', Medium:'text-yellow-500', Hard:'text-red-500' };
const diffBg    = { Easy:'bg-green-50 border-green-200', Medium:'bg-yellow-50 border-yellow-200', Hard:'bg-red-50 border-red-200' };
const statusColor = {
  Accepted:'text-green-500', 'Wrong Answer':'text-red-500',
  'Runtime Error':'text-orange-500', 'Compilation Error':'text-red-600',
  'Time Limit Exceeded':'text-amber-500', Pending:'text-gray-500',
};

/* ──────────────────────────────────────────
   NEXT PROBLEM MODAL
────────────────────────────────────────── */
const NextProblemModal = ({ result, problem, nextProblem, onContinue, onClose }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-4xl">🎉</span>
      </div>
      <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Problem Solved!</h2>
      <p className="text-gray-500 text-sm mb-5">You completed: <strong>{problem?.title}</strong></p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 rounded-xl p-3">
          <p className="text-xl font-bold text-green-600">{result.passedTests}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Passed</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xl font-bold text-primary">{result.executionTime}ms</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Runtime</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3">
          <p className="text-xl font-bold text-purple-600">{result.memoryUsed}MB</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Memory</p>
        </div>
      </div>

      {result.newAchievements?.length > 0 && (
        <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs font-bold text-amber-700 mb-1">🏆 New Achievement{result.newAchievements.length>1?'s':''}!</p>
          {result.newAchievements.map(a => (
            <p key={a} className="text-sm text-amber-600 font-semibold">{a}</p>
          ))}
        </div>
      )}

      {nextProblem ? (
        <>
          <p className="text-xs text-gray-400 mb-2">Next Problem:</p>
          <p className="text-base font-bold text-gray-900 mb-5">{nextProblem.title}
            <span className={`ml-2 text-xs ${diffColor[nextProblem.difficulty]}`}>{nextProblem.difficulty}</span>
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50">
              Stay Here
            </button>
            <button onClick={onContinue} className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
              Continue →
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-5">🏆 You've completed all available problems!</p>
          <button onClick={onClose} className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            Back to Problems
          </button>
        </>
      )}
    </div>
  </div>
);

/* ──────────────────────────────────────────
   MAIN PAGE
────────────────────────────────────────── */
const DSACodingPage = () => {
  const { slug }    = useParams();
  const navigate    = useNavigate();

  const [problem,    setProblem]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [lang,       setLang]       = useState('javascript');
  const [code,       setCode]       = useState('');
  const [darkMode,   setDarkMode]   = useState(true);
  const [fontSize,   setFontSize]   = useState(14);
  const [activeLeft, setActiveLeft] = useState('description'); // description | examples | submissions
  const [bottomTab,  setBottomTab]  = useState('testcase');
  const [consoleOpen,setConsoleOpen]= useState(true);
  const [bottomH,    setBottomH]    = useState(220);
  const [leftW,      setLeftW]      = useState(38); // %
  const [running,    setRunning]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult,  setRunResult]  = useState(null);
  const [submitResult,setSubmitResult] = useState(null);
  const [showNext,   setShowNext]   = useState(false);
  const [submissions,setSubmissions]= useState([]);
  const [loadingSubs,setLoadingSubs]= useState(false);
  const isDragH = useRef(false);
  const isDragV = useRef(false);

  /* ── Load problem ── */
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await dsaAPI.getProblem(slug);
        setProblem(data.problem);
        const starter = data.problem.starterCode?.[lang] || `function solution() {\n    // Write your solution\n}`;
        setCode(starter);
      } catch { toast.error('Problem not found'); navigate('/dsa'); }
      finally  { setLoading(false); }
    };
    load();
  }, [slug]);

  /* ── Change language ── */
  const changeLang = (l) => {
    setLang(l);
    if (problem) {
      setCode(problem.starterCode?.[l] || `// Write your ${l} solution here\n`);
    }
    setRunResult(null);
    setSubmitResult(null);
  };

  /* ── Load submissions ── */
  const loadSubmissions = async () => {
    if (!problem) return;
    setLoadingSubs(true);
    try {
      const { data } = await dsaAPI.getSubmissions({ problemId: problem._id });
      setSubmissions(data.submissions || []);
    } catch { /* silent */ }
    finally { setLoadingSubs(false); }
  };

  useEffect(() => {
    if (activeLeft === 'submissions' && problem) loadSubmissions();
  }, [activeLeft, problem]);

  /* ── Keyboard shortcut: Ctrl+Enter = submit ── */
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [code, lang, problem]);

  /* ── Run code ── */
  const handleRun = async () => {
    if (!problem || running) return;
    setRunning(true);
    setBottomTab('result');
    setConsoleOpen(true);
    setRunResult(null);
    setSubmitResult(null);
    try {
      const { data } = await dsaAPI.runCode(problem._id, { language: lang, sourceCode: code });
      setRunResult(data);
      if (data.passed === data.total) toast.success(`✓ All ${data.total} test cases passed!`);
      else toast.error(`${data.passed}/${data.total} test cases passed`);
    } catch (err) { toast.error(err.response?.data?.message || 'Run failed'); }
    finally { setRunning(false); }
  };

  /* ── Submit code ── */
  const handleSubmit = useCallback(async () => {
    if (!problem || submitting) return;
    setSubmitting(true);
    setBottomTab('result');
    setConsoleOpen(true);
    setRunResult(null);
    setSubmitResult(null);
    try {
      const { data } = await dsaAPI.submitCode(problem._id, { language: lang, sourceCode: code });
      setSubmitResult(data);
      if (data.status === 'Accepted') {
        toast.success('🎉 Accepted!');
        setShowNext(true);
      } else {
        toast.error(`${data.status} — ${data.passedTests}/${data.totalTests} tests passed`);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed'); }
    finally { setSubmitting(false); }
  }, [problem, lang, code, submitting]);

  /* ── Horizontal drag ── */
  const startDragH = (e) => {
    isDragH.current = true;
    const sx = e.clientX; const sw = leftW;
    const onMove = (ev) => { if (isDragH.current) setLeftW(Math.max(25, Math.min(60, sw + ((ev.clientX - sx) / window.innerWidth) * 100))); };
    const onUp   = () => { isDragH.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  /* ── Vertical drag ── */
  const startDragV = (e) => {
    isDragV.current = true;
    const sy = e.clientY; const sh = bottomH;
    const onMove = (ev) => { if (isDragV.current) setBottomH(Math.max(80, Math.min(420, sh + (sy - ev.clientY)))); };
    const onUp   = () => { isDragV.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <svg className="animate-spin h-8 w-8 text-amber-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  if (!problem) return null;

  const currentTC = problem.testCases?.[0];

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${darkMode ? 'bg-[#1e1e1e]' : 'bg-gray-50'}`}>

      {/* ── Next Problem Modal ── */}
      {showNext && submitResult && (
        <NextProblemModal
          result={submitResult}
          problem={problem}
          nextProblem={submitResult.nextProblem}
          onContinue={() => { setShowNext(false); navigate(`/dsa/${submitResult.nextProblem.slug}`); }}
          onClose={() => { setShowNext(false); navigate('/dsa'); }}
        />
      )}

      {/* ══════ TOP BAR ══════ */}
      <header className={`flex items-center gap-3 px-4 h-12 border-b flex-shrink-0 ${darkMode ? 'bg-[#1a1a1a] border-[#3e3e3e]' : 'bg-white border-gray-200'}`}>
        {/* Back */}
        <button onClick={() => navigate('/dsa')} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Problems
        </button>
        <div className={`w-px h-5 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}/>

        {/* Problem title + difficulty */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`text-sm font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{problem.order}. {problem.title}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${diffBg[problem.difficulty]} ${diffColor[problem.difficulty]}`}>{problem.difficulty}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Dark mode */}
          <button onClick={() => setDarkMode(v => !v)} className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}>
            {darkMode
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            }
          </button>
          {/* Font size */}
          <div className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${darkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            <button onClick={() => setFontSize(f => Math.max(10,f-1))}>A-</button>
            <span className="w-5 text-center">{fontSize}</span>
            <button onClick={() => setFontSize(f => Math.min(22,f+1))}>A+</button>
          </div>
          {/* Run */}
          <button onClick={handleRun} disabled={running || submitting}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border transition-colors disabled:opacity-50
              ${darkMode ? 'border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white' : 'border-gray-300 text-gray-700 hover:border-primary hover:text-primary'}`}>
            {running
              ? <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>
            }
            Run
          </button>
          {/* Submit */}
          <button onClick={handleSubmit} disabled={running || submitting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded transition-colors disabled:opacity-50">
            {submitting
              ? <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            }
            Submit <span className={`hidden sm:inline ${darkMode ? 'text-gray-400' : 'text-blue-200'} text-[10px]`}>(Ctrl+↵)</span>
          </button>
        </div>
      </header>

      {/* ══════ BODY ══════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ════ LEFT PANEL ════ */}
        <div className={`flex flex-col flex-shrink-0 overflow-hidden border-r ${darkMode ? 'bg-[#1a1a1a] border-[#3e3e3e]' : 'bg-white border-gray-200'}`}
          style={{ width: `${leftW}%` }}>

          {/* Left tabs */}
          <div className={`flex border-b flex-shrink-0 ${darkMode ? 'border-[#3e3e3e]' : 'border-gray-200'}`}>
            {[['description','Description'],['examples','Examples'],['submissions','Submissions']].map(([id,label]) => (
              <button key={id} onClick={() => setActiveLeft(id)}
                className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 flex-shrink-0
                  ${activeLeft===id ? 'border-primary text-primary' : `border-transparent ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Left content */}
          <div className="flex-1 overflow-y-auto p-5 text-sm">

            {/* ── Description ── */}
            {activeLeft === 'description' && (
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(problem.tags||[]).map(t => (
                    <span key={t} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{t}</span>
                  ))}
                </div>
                <div className={`leading-relaxed space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {problem.description.split('\n').map((line,i) => (
                    <p key={i} className={line.startsWith('**') ? 'font-bold text-white' : ''}>
                      {line.replace(/\`([^`]+)\`/g, (_, c) => c).split(/(\`[^`]+\`)/).map((part,j) =>
                        part.startsWith('`') && part.endsWith('`')
                          ? <code key={j} className={`px-1.5 py-0.5 rounded text-xs font-mono ${darkMode ? 'bg-gray-700 text-amber-300' : 'bg-gray-100 text-primary'}`}>{part.slice(1,-1)}</code>
                          : part
                      )}
                    </p>
                  ))}
                </div>
                {problem.constraints && (
                  <div className="mt-5">
                    <p className={`text-xs font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Constraints:</p>
                    {problem.constraints.split('\n').map((c,i) => (
                      <p key={i} className={`text-xs font-mono flex gap-2 mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span className="text-primary">•</span>{c}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Examples ── */}
            {activeLeft === 'examples' && (
              <div className="space-y-4">
                {(problem.examples||[]).map((ex,i) => (
                  <div key={i}>
                    <p className={`text-sm font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Example {i+1}:</p>
                    <div className={`rounded-lg p-3 text-xs font-mono leading-relaxed ${darkMode ? 'bg-[#2d2d2d]' : 'bg-gray-50 border border-gray-200'}`}>
                      {ex.input && <p className={darkMode?'text-gray-300':'text-gray-700'}><span className="text-gray-500">Input: </span>{ex.input}</p>}
                      {ex.output && <p className={`mt-1 ${darkMode?'text-gray-300':'text-gray-700'}`}><span className="text-gray-500">Output: </span>{ex.output}</p>}
                      {ex.explanation && <p className={`mt-1 ${darkMode?'text-gray-400':'text-gray-500'}`}><span className="text-gray-500">Explanation: </span>{ex.explanation}</p>}
                    </div>
                  </div>
                ))}
                {!problem.examples?.length && <p className={`text-sm ${darkMode?'text-gray-500':'text-gray-400'}`}>No examples available.</p>}
              </div>
            )}

            {/* ── Submissions ── */}
            {activeLeft === 'submissions' && (
              <div>
                {loadingSubs ? (
                  <div className="flex justify-center py-8">
                    <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  </div>
                ) : submissions.length === 0 ? (
                  <p className={`text-sm ${darkMode?'text-gray-500':'text-gray-400'}`}>No submissions yet for this problem.</p>
                ) : (
                  <div className="space-y-2">
                    {submissions.map(sub => (
                      <div key={sub._id} className={`p-3 rounded-lg border ${darkMode ? 'bg-[#2d2d2d] border-[#3e3e3e]' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${statusColor[sub.status]||'text-gray-500'}`}>{sub.status}</span>
                          <span className={`text-[10px] ${darkMode?'text-gray-500':'text-gray-400'}`}>{new Date(sub.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className={`flex gap-3 mt-1 text-[10px] ${darkMode?'text-gray-500':'text-gray-400'}`}>
                          <span>{sub.language}</span>
                          <span>{sub.passedTests}/{sub.totalTests} tests</span>
                          {sub.executionTime > 0 && <span>{sub.executionTime}ms</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ══ Horizontal drag ══ */}
        <div onMouseDown={startDragH} className={`w-1 flex-shrink-0 cursor-col-resize hover:bg-primary transition-colors ${darkMode ? 'bg-[#3e3e3e]' : 'bg-gray-200'}`}/>

        {/* ════ RIGHT PANEL (Editor + Console) ════ */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">

          {/* Editor toolbar */}
          <div className={`flex items-center gap-2 px-4 h-10 border-b flex-shrink-0 ${darkMode ? 'bg-[#1a1a1a] border-[#3e3e3e]' : 'bg-white border-gray-200'}`}>
            <div className="relative">
              <select value={lang} onChange={e => changeLang(e.target.value)}
                className={`appearance-none pr-6 pl-3 py-1.5 rounded text-xs font-semibold border outline-none cursor-pointer transition-colors
                  ${darkMode ? 'bg-[#2d2d2d] border-[#555] text-gray-200' : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-primary'}`}>
                {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode?'text-gray-400':'text-gray-500'}`}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <button onClick={() => setCode(problem.starterCode?.[lang] || '')} title="Reset to starter"
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            <Editor
              height="100%"
              language={LANGUAGES.find(l => l.id === lang)?.monaco || 'javascript'}
              value={code}
              onChange={v => setCode(v || '')}
              theme={darkMode ? 'vs-dark' : 'light'}
              options={{
                fontSize,
                fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                glyphMargin: false,
                folding: true,
                tabSize: 4,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>

          {/* ══ Vertical drag ══ */}
          <div onMouseDown={startDragV} className={`h-1 flex-shrink-0 cursor-row-resize hover:bg-primary transition-colors ${darkMode ? 'bg-[#3e3e3e]' : 'bg-gray-200'}`}/>

          {/* ══ Bottom Console ══ */}
          <div className={`flex flex-col flex-shrink-0 overflow-hidden border-t ${darkMode ? 'bg-[#1a1a1a] border-[#3e3e3e]' : 'bg-white border-gray-200'}`}
            style={{ height: consoleOpen ? bottomH : 40 }}>

            {/* Console tabs */}
            <div className={`flex items-center gap-1 px-4 h-10 border-b flex-shrink-0 ${darkMode ? 'border-[#3e3e3e]' : 'border-gray-200'}`}>
              {[['testcase','Test Cases'],['result','Result']].map(([id,label]) => (
                <button key={id} onClick={() => { setBottomTab(id); setConsoleOpen(true); }}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors
                    ${bottomTab===id && consoleOpen ? darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900' : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                  {label}
                </button>
              ))}
              <div className="flex-1"/>
              <button onClick={() => setConsoleOpen(v => !v)} className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500'}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d={consoleOpen ? 'M19 15l-7-7-7 7' : 'M5 15l7-7 7 7'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Console content */}
            {consoleOpen && (
              <div className="flex-1 overflow-y-auto p-4">

                {/* Test Cases */}
                {bottomTab === 'testcase' && (
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-wide mb-2 ${darkMode?'text-gray-500':'text-gray-400'}`}>Input</p>
                    <div className={`rounded-lg p-3 font-mono text-xs whitespace-pre-wrap mb-3 ${darkMode ? 'bg-[#2d2d2d] text-gray-300' : 'bg-gray-50 border border-gray-200 text-gray-700'}`}>
                      {currentTC?.input || 'No test cases'}
                    </div>
                    <p className={`text-[10px] font-semibold uppercase tracking-wide mb-2 ${darkMode?'text-gray-500':'text-gray-400'}`}>Expected Output</p>
                    <div className={`rounded-lg p-3 font-mono text-xs ${darkMode ? 'bg-[#2d2d2d] text-gray-300' : 'bg-gray-50 border border-gray-200 text-gray-700'}`}>
                      {currentTC?.expectedOutput || '—'}
                    </div>
                  </div>
                )}

                {/* Result */}
                {bottomTab === 'result' && (
                  <div>
                    {(running || submitting) && (
                      <div className="flex items-center gap-3 py-2">
                        <svg className="animate-spin w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        <span className={`text-sm ${darkMode?'text-gray-300':'text-gray-600'}`}>{submitting ? 'Submitting against all test cases…' : 'Running test cases…'}</span>
                      </div>
                    )}

                    {/* Submit result */}
                    {submitResult && !submitting && (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`text-xl font-extrabold ${statusColor[submitResult.status]||'text-gray-400'}`}>{submitResult.status}</span>
                          <span className={`text-sm ${darkMode?'text-gray-400':'text-gray-500'}`}>{submitResult.passedTests}/{submitResult.totalTests} tests passed</span>
                          {submitResult.executionTime > 0 && <span className={`text-xs ${darkMode?'text-gray-500':'text-gray-400'}`}>{submitResult.executionTime}ms</span>}
                        </div>
                        {submitResult.status === 'Accepted' && !submitResult.alreadySolved && (
                          <div className={`p-3 rounded-lg mb-3 ${darkMode?'bg-green-500/10 border border-green-500/20':'bg-green-50 border border-green-200'}`}>
                            <p className="text-green-500 text-sm font-semibold">+{submitResult.status === 'Accepted' ? '' : ''} Score: {submitResult.score}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Run result */}
                    {runResult && !running && !submitResult && (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`text-base font-bold ${runResult.passed === runResult.total ? 'text-green-500' : 'text-red-500'}`}>
                            {runResult.passed === runResult.total ? '✓ All Passed' : `✗ ${runResult.passed}/${runResult.total} Passed`}
                          </span>
                          {runResult.executionTime > 0 && (
                            <span className={`text-xs ${darkMode?'text-gray-400':'text-gray-500'}`}>{runResult.executionTime}ms</span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {(runResult.results||[]).map((r,i) => (
                            <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg ${darkMode?'bg-[#2d2d2d]':'bg-gray-50 border border-gray-200'}`}>
                              <span className={`text-xs font-bold flex-shrink-0 ${r.status==='Accepted'?'text-green-500':'text-red-500'}`}>{r.status==='Accepted'?'✓':'✗'}</span>
                              <span className={`text-xs flex-1 ${darkMode?'text-gray-300':'text-gray-700'}`}>Case {i+1}: {r.status}</span>
                              {r.executionTime > 0 && <span className={`text-[10px] ${darkMode?'text-gray-500':'text-gray-400'}`}>{r.executionTime}ms</span>}
                            </div>
                          ))}
                        </div>
                        {runResult.results?.some(r => r.output) && (
                          <div className="mt-3">
                            <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${darkMode?'text-gray-500':'text-gray-400'}`}>Output</p>
                            <div className={`rounded-lg p-3 font-mono text-xs whitespace-pre-wrap ${darkMode?'bg-[#2d2d2d] text-green-400':'bg-gray-50 border border-gray-200 text-green-600'}`}>
                              {runResult.results.find(r=>r.output)?.output || '(empty)'}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Empty */}
                    {!running && !submitting && !runResult && !submitResult && (
                      <div className={`flex flex-col items-center justify-center py-6 gap-2 ${darkMode?'text-gray-600':'text-gray-400'}`}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-40"><polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
                        <p className="text-xs">Click Run to test · Click Submit to evaluate all test cases</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DSACodingPage;
