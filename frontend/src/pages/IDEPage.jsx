import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────
   PROBLEM DATA
───────────────────────────────────────── */
const PROBLEMS = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    diffColor: 'text-green-600 bg-green-50',
    tags: ['Array', 'Hash Table'],
    acceptance: '49.2%',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return **indices** of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: null,
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
        explanation: null,
      },
    ],
    constraints: [
      '2 ≤ nums.length ≤ 10⁴',
      '-10⁹ ≤ nums[i] ≤ 10⁹',
      '-10⁹ ≤ target ≤ 10⁹',
      'Only one valid answer exists.',
    ],
    testCases: [
      { id: 1, input: 'nums = [2,7,11,15]\ntarget = 9',  expected: '[0,1]' },
      { id: 2, input: 'nums = [3,2,4]\ntarget = 6',      expected: '[1,2]' },
      { id: 3, input: 'nums = [3,3]\ntarget = 6',        expected: '[0,1]' },
    ],
  },
  {
    id: 2,
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    diffColor: 'text-green-600 bg-green-50',
    tags: ['Linked List', 'Recursion'],
    acceptance: '73.4%',
    description: `Given the \`head\` of a singly linked list, reverse the list, and return **the reversed list**.`,
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: null },
      { input: 'head = [1,2]',       output: '[2,1]',         explanation: null },
      { input: 'head = []',          output: '[]',            explanation: null },
    ],
    constraints: [
      'The number of nodes in the list is in the range [0, 5000].',
      '-5000 ≤ Node.val ≤ 5000',
    ],
    testCases: [
      { id: 1, input: 'head = [1,2,3,4,5]', expected: '[5,4,3,2,1]' },
      { id: 2, input: 'head = [1,2]',       expected: '[2,1]' },
      { id: 3, input: 'head = []',          expected: '[]' },
    ],
  },
  {
    id: 3,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    diffColor: 'text-green-600 bg-green-50',
    tags: ['String', 'Stack'],
    acceptance: '40.8%',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      { input: 's = "()"',      output: 'true',  explanation: null },
      { input: 's = "()[]{}"',  output: 'true',  explanation: null },
      { input: 's = "(]"',      output: 'false', explanation: null },
    ],
    constraints: [
      '1 ≤ s.length ≤ 10⁴',
      "s consists of parentheses only '()[]{}'.",
    ],
    testCases: [
      { id: 1, input: 's = "()"',     expected: 'true'  },
      { id: 2, input: 's = "()[]{}"', expected: 'true'  },
      { id: 3, input: 's = "(]"',     expected: 'false' },
    ],
  },
  {
    id: 4,
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    diffColor: 'text-yellow-600 bg-yellow-50',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    acceptance: '34.1%',
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"',    output: '1', explanation: 'The answer is "b", with the length of 1.' },
      { input: 's = "pwwkew"',   output: '3', explanation: 'The answer is "wke", with the length of 3.' },
    ],
    constraints: [
      '0 ≤ s.length ≤ 5 × 10⁴',
      's consists of English letters, digits, symbols and spaces.',
    ],
    testCases: [
      { id: 1, input: 's = "abcabcbb"', expected: '3' },
      { id: 2, input: 's = "bbbbb"',    expected: '1' },
      { id: 3, input: 's = "pwwkew"',   expected: '3' },
    ],
  },
  {
    id: 5,
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    diffColor: 'text-yellow-600 bg-yellow-50',
    tags: ['Array', 'Divide and Conquer', 'Dynamic Programming'],
    acceptance: '50.3%',
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return its sum.`,
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
      { input: 'nums = [1]',                      output: '1', explanation: null },
      { input: 'nums = [5,4,-1,7,8]',             output: '23', explanation: null },
    ],
    constraints: [
      '1 ≤ nums.length ≤ 10⁵',
      '-10⁴ ≤ nums[i] ≤ 10⁴',
    ],
    testCases: [
      { id: 1, input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', expected: '6'  },
      { id: 2, input: 'nums = [1]',                      expected: '1'  },
      { id: 3, input: 'nums = [5,4,-1,7,8]',             expected: '23' },
    ],
  },
];

/* ─────────────────────────────────────────
   STARTER CODE TEMPLATES
───────────────────────────────────────── */
const STARTER = {
  javascript: {
    1: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Your solution here
    
};`,
    2: `/**
 * @param {ListNode} head
 * @return {ListNode}
 */
function reverseList(head) {
    // Your solution here
    
};`,
    3: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
    // Your solution here
    
};`,
    4: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
    // Your solution here
    
};`,
    5: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArray(nums) {
    // Your solution here
    
};`,
  },
  python: {
    1: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Your solution here
        pass`,
    2: `class Solution:
    def reverseList(self, head):
        # Your solution here
        pass`,
    3: `class Solution:
    def isValid(self, s: str) -> bool:
        # Your solution here
        pass`,
    4: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # Your solution here
        pass`,
    5: `class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        # Your solution here
        pass`,
  },
  java: {
    1: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your solution here
        return new int[]{};
    }
}`,
    2: `class Solution {
    public ListNode reverseList(ListNode head) {
        // Your solution here
        return null;
    }
}`,
    3: `class Solution {
    public boolean isValid(String s) {
        // Your solution here
        return false;
    }
}`,
    4: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Your solution here
        return 0;
    }
}`,
    5: `class Solution {
    public int maxSubArray(int[] nums) {
        // Your solution here
        return 0;
    }
}`,
  },
  cpp: {
    1: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your solution here
        return {};
    }
};`,
    2: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        // Your solution here
        return nullptr;
    }
};`,
    3: `class Solution {
public:
    bool isValid(string s) {
        // Your solution here
        return false;
    }
};`,
    4: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // Your solution here
        return 0;
    }
};`,
    5: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // Your solution here
        return 0;
    }
};`,
  },
};

/* ─────────────────────────────────────────
   MOCK RUN RESULTS (simulated)
───────────────────────────────────────── */
const mockRun = (problemId, lang, code) => {
  // Simulate output based on whether the code has any content
  const hasAttempt = code.includes('return') && !code.includes('// Your solution here\n        \n');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        passed: hasAttempt ? 2 : 0,
        total: 3,
        results: [
          { id: 1, status: hasAttempt ? 'Accepted' : 'Wrong Answer', runtime: hasAttempt ? '52 ms' : null, memory: hasAttempt ? '42.1 MB' : null },
          { id: 2, status: hasAttempt ? 'Accepted' : 'Wrong Answer', runtime: hasAttempt ? '48 ms' : null, memory: hasAttempt ? '42.0 MB' : null },
          { id: 3, status: hasAttempt ? 'Wrong Answer' : 'Wrong Answer', runtime: null, memory: null },
        ],
        stdout: hasAttempt ? '[0,1]\n[1,2]' : 'null\nnull',
        time: hasAttempt ? '54 ms' : null,
      });
    }, 1400);
  });
};

const mockSubmit = (problemId, lang, code) => {
  const hasAttempt = code.includes('return') && !code.includes('// Your solution here\n        \n');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: hasAttempt ? 'Accepted' : 'Wrong Answer',
        passed: hasAttempt ? 57 : 12,
        total: 57,
        runtime: hasAttempt ? '68 ms' : null,
        runtimePct: hasAttempt ? '89.2' : null,
        memory: hasAttempt ? '42.8 MB' : null,
        memoryPct: hasAttempt ? '76.5' : null,
      });
    }, 2200);
  });
};

/* ─────────────────────────────────────────
   LANGUAGE CONFIG
───────────────────────────────────────── */
const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { id: 'python',     label: 'Python 3',   monaco: 'python' },
  { id: 'java',       label: 'Java',       monaco: 'java' },
  { id: 'cpp',        label: 'C++',        monaco: 'cpp' },
];

/* ─────────────────────────────────────────
   ICON HELPERS
───────────────────────────────────────── */
const Icon = ({ d, size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ─────────────────────────────────────────
   MARKDOWN-LITE RENDERER (bold + code)
───────────────────────────────────────── */
const renderDesc = (text) =>
  text.split('\n').map((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <span key={li} className="block">
        {parts.map((p, pi) => {
          if (p.startsWith('**') && p.endsWith('**'))
            return <strong key={pi}>{p.slice(2, -2)}</strong>;
          if (p.startsWith('`') && p.endsWith('`'))
            return <code key={pi} className="bg-gray-100 dark:bg-gray-700 text-primary px-1 rounded font-mono text-xs">{p.slice(1, -1)}</code>;
          return p;
        })}
      </span>
    );
  });

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
const IDEPage = () => {
  const navigate = useNavigate();

  /* ── state ── */
  const [activeProblem, setActiveProblem]   = useState(0);       // index in PROBLEMS
  const [lang, setLang]                     = useState('javascript');
  const [darkMode, setDarkMode]             = useState(true);
  const [fontSize, setFontSize]             = useState(14);
  const [code, setCode]                     = useState(() => STARTER.javascript[PROBLEMS[0].id]);
  const [leftTab, setLeftTab]               = useState('description'); // description | solutions | submissions
  const [bottomTab, setBottomTab]           = useState('testcase');    // testcase | result
  const [activeTest, setActiveTest]         = useState(0);
  const [runLoading, setRunLoading]         = useState(false);
  const [submitLoading, setSubmitLoading]   = useState(false);
  const [runResult, setRunResult]           = useState(null);
  const [submitResult, setSubmitResult]     = useState(null);
  const [consoleOpen, setConsoleOpen]       = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(38); // %
  const [bottomHeight, setBottomHeight]     = useState(220); // px
  const isDraggingH = useRef(false);
  const isDraggingV = useRef(false);
  const problem = PROBLEMS[activeProblem];

  /* ── change problem ── */
  const changeProblem = (idx) => {
    setActiveProblem(idx);
    setCode(STARTER[lang][PROBLEMS[idx].id]);
    setRunResult(null);
    setSubmitResult(null);
    setBottomTab('testcase');
  };

  /* ── change language ── */
  const changeLang = (l) => {
    setLang(l);
    setCode(STARTER[l][problem.id]);
    setRunResult(null);
  };

  /* ── run code ── */
  const handleRun = async () => {
    setRunLoading(true);
    setBottomTab('result');
    setConsoleOpen(true);
    setRunResult(null);
    const res = await mockRun(problem.id, lang, code);
    setRunResult(res);
    setRunLoading(false);
    if (res.passed === res.total) toast.success('All test cases passed!');
    else toast.error(`${res.passed}/${res.total} test cases passed`);
  };

  /* ── submit ── */
  const handleSubmit = async () => {
    setSubmitLoading(true);
    setBottomTab('result');
    setConsoleOpen(true);
    setRunResult(null);
    setSubmitResult(null);
    const res = await mockSubmit(problem.id, lang, code);
    setSubmitResult(res);
    setSubmitLoading(false);
    if (res.status === 'Accepted') toast.success('🎉 Accepted! Great work!');
    else toast.error('Wrong Answer — check your logic');
  };

  /* ── horizontal drag (left/right panels) ── */
  const startDragH = (e) => {
    isDraggingH.current = true;
    const startX = e.clientX;
    const startW = leftPanelWidth;
    const onMove = (ev) => {
      if (!isDraggingH.current) return;
      const dx = ((ev.clientX - startX) / window.innerWidth) * 100;
      setLeftPanelWidth(Math.min(60, Math.max(25, startW + dx)));
    };
    const onUp = () => { isDraggingH.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  /* ── vertical drag (editor/console) ── */
  const startDragV = (e) => {
    isDraggingV.current = true;
    const startY = e.clientY;
    const startH = bottomHeight;
    const onMove = (ev) => {
      if (!isDraggingV.current) return;
      const dy = startY - ev.clientY;
      setBottomHeight(Math.min(420, Math.max(80, startH + dy)));
    };
    const onUp = () => { isDraggingV.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  /* ───────────────── RENDER ───────────────── */
  return (
    <div className={`flex flex-col h-screen overflow-hidden ${darkMode ? 'bg-[#1e1e1e]' : 'bg-gray-50'}`}>

      {/* ══════════════════════════════════════
          TOP NAV BAR
      ══════════════════════════════════════ */}
      <header className={`flex items-center gap-3 px-4 h-12 border-b flex-shrink-0 ${darkMode ? 'bg-[#1a1a1a] border-[#3e3e3e]' : 'bg-white border-gray-200'}`}>

        {/* Brand */}
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <polyline points="16 18 22 12 16 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="8 6 2 12 8 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-sm text-primary">RVS</span>
          <span className={`font-semibold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>IDE</span>
        </button>

        {/* Divider */}
        <div className={`w-px h-5 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />

        {/* Problem picker */}
        <div className="flex items-center gap-1 flex-1 overflow-x-auto hide-scrollbar">
          {PROBLEMS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => changeProblem(i)}
              className={`flex-shrink-0 px-3 py-1 rounded text-xs font-medium transition-colors
                ${activeProblem === i
                  ? 'bg-primary text-white'
                  : darkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              {p.id}. {p.title}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Dark / light */}
          <button
            onClick={() => setDarkMode((v) => !v)}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Toggle theme"
          >
            {darkMode
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            }
          </button>

          {/* Font size */}
          <div className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${darkMode ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            <button onClick={() => setFontSize((f) => Math.max(10, f - 1))} className="hover:text-primary">A-</button>
            <span className="w-5 text-center">{fontSize}</span>
            <button onClick={() => setFontSize((f) => Math.min(22, f + 1))} className="hover:text-primary">A+</button>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-semibold px-3 py-1.5 rounded transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Dashboard
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════
          MAIN BODY
      ══════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ════ LEFT PANEL ════ */}
        <div
          className={`flex flex-col overflow-hidden flex-shrink-0 border-r ${darkMode ? 'bg-[#1a1a1a] border-[#3e3e3e]' : 'bg-white border-gray-200'}`}
          style={{ width: `${leftPanelWidth}%` }}
        >
          {/* Left tabs */}
          <div className={`flex items-center gap-0 border-b flex-shrink-0 ${darkMode ? 'border-[#3e3e3e]' : 'border-gray-200'}`}>
            {['description', 'solutions', 'submissions'].map((t) => (
              <button
                key={t}
                onClick={() => setLeftTab(t)}
                className={`px-4 py-2.5 text-xs font-medium capitalize transition-colors border-b-2
                  ${leftTab === t
                    ? 'border-primary text-primary'
                    : `border-transparent ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Left content */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {leftTab === 'description' && (
              <div>
                {/* Problem title row */}
                <div className="mb-4">
                  <h1 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {problem.id}. {problem.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${problem.diffColor}`}>
                      {problem.difficulty}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Acceptance: {problem.acceptance}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {problem.tags.map((tag) => (
                      <span key={tag} className={`text-[10px] font-medium px-2 py-0.5 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className={`text-sm leading-relaxed mb-5 space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {renderDesc(problem.description)}
                </div>

                {/* Examples */}
                {problem.examples.map((ex, ei) => (
                  <div key={ei} className="mb-4">
                    <p className={`text-sm font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Example {ei + 1}:
                    </p>
                    <div className={`rounded-lg p-3 text-xs font-mono leading-relaxed ${darkMode ? 'bg-[#2d2d2d]' : 'bg-gray-50 border border-gray-200'}`}>
                      <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Input:  </span>
                        {ex.input}
                      </p>
                      <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Output: </span>
                        {ex.output}
                      </p>
                      {ex.explanation && (
                        <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Explanation: </span>
                          {ex.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Constraints */}
                <div>
                  <p className={`text-sm font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Constraints:</p>
                  <ul className="space-y-1">
                    {problem.constraints.map((c, ci) => (
                      <li key={ci} className={`text-xs font-mono flex gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {leftTab === 'solutions' && (
              <div className={`flex flex-col items-center justify-center h-40 gap-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" opacity="0.4">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <p className="text-sm">Solutions unlocked after submission</p>
              </div>
            )}

            {leftTab === 'submissions' && (
              <div className={`flex flex-col items-center justify-center h-40 gap-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" opacity="0.4">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p className="text-sm">No submissions yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ══ Horizontal Drag Handle ══ */}
        <div
          onMouseDown={startDragH}
          className={`w-1 flex-shrink-0 cursor-col-resize transition-colors hover:bg-primary ${darkMode ? 'bg-[#3e3e3e]' : 'bg-gray-200'}`}
        />

        {/* ════ RIGHT PANEL (Editor + Console) ════ */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">

          {/* ── Editor toolbar ── */}
          <div className={`flex items-center gap-2 px-4 h-11 border-b flex-shrink-0 ${darkMode ? 'bg-[#1a1a1a] border-[#3e3e3e]' : 'bg-white border-gray-200'}`}>
            {/* Language selector */}
            <div className="relative">
              <select
                value={lang}
                onChange={(e) => changeLang(e.target.value)}
                className={`appearance-none pr-6 pl-3 py-1.5 rounded text-xs font-semibold border outline-none cursor-pointer transition-colors
                  ${darkMode
                    ? 'bg-[#2d2d2d] border-[#555] text-gray-200 hover:border-gray-400'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:border-primary'}`}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Reset */}
            <button
              onClick={() => setCode(STARTER[lang][problem.id])}
              title="Reset code"
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors
                ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div className="flex-1" />

            {/* Run */}
            <button
              onClick={handleRun}
              disabled={runLoading || submitLoading}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                ${darkMode
                  ? 'border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white'
                  : 'border-gray-300 text-gray-700 hover:border-primary hover:text-primary'}`}
            >
              {runLoading
                ? <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>
              }
              Run
            </button>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={runLoading || submitLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary-dark text-white rounded text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLoading
                ? <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              }
              Submit
            </button>
          </div>

          {/* ── Monaco Editor ── */}
          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            <Editor
              height="100%"
              language={LANGUAGES.find((l) => l.id === lang)?.monaco ?? 'javascript'}
              value={code}
              onChange={(v) => setCode(v ?? '')}
              theme={darkMode ? 'vs-dark' : 'light'}
              options={{
                fontSize,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                glyphMargin: false,
                folding: true,
                lineDecorationsWidth: 6,
                renderLineHighlight: 'line',
                tabSize: 4,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                renderWhitespace: 'selection',
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>

          {/* ══ Vertical Drag Handle ══ */}
          <div
            onMouseDown={startDragV}
            className={`h-1 flex-shrink-0 cursor-row-resize transition-colors hover:bg-primary ${darkMode ? 'bg-[#3e3e3e]' : 'bg-gray-200'}`}
          />

          {/* ── Bottom panel (Test Cases / Results) ── */}
          <div
            className={`flex flex-col flex-shrink-0 overflow-hidden border-t ${darkMode ? 'bg-[#1a1a1a] border-[#3e3e3e]' : 'bg-white border-gray-200'}`}
            style={{ height: consoleOpen ? bottomHeight : 40 }}
          >
            {/* Bottom tab bar */}
            <div className={`flex items-center gap-1 px-4 h-10 border-b flex-shrink-0 ${darkMode ? 'border-[#3e3e3e]' : 'border-gray-200'}`}>
              {['testcase', 'result'].map((t) => (
                <button
                  key={t}
                  onClick={() => { setBottomTab(t); setConsoleOpen(true); }}
                  className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors
                    ${bottomTab === t && consoleOpen
                      ? darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'
                      : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  {t === 'testcase' ? 'Test Cases' : 'Result'}
                </button>
              ))}
              <div className="flex-1" />
              <button
                onClick={() => setConsoleOpen((v) => !v)}
                className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d={consoleOpen ? 'M19 15l-7-7-7 7' : 'M6 9l6 6 6-6'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Bottom content */}
            {consoleOpen && (
              <div className="flex-1 overflow-y-auto p-4">

                {/* ── TEST CASES tab ── */}
                {bottomTab === 'testcase' && (
                  <div>
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {problem.testCases.map((tc, ti) => (
                        <button
                          key={tc.id}
                          onClick={() => setActiveTest(ti)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors
                            ${activeTest === ti
                              ? 'bg-primary text-white'
                              : darkMode ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          Case {ti + 1}
                        </button>
                      ))}
                    </div>
                    <div>
                      <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Input</p>
                      <div className={`rounded-lg p-3 font-mono text-xs whitespace-pre ${darkMode ? 'bg-[#2d2d2d] text-gray-300' : 'bg-gray-50 border border-gray-200 text-gray-700'}`}>
                        {problem.testCases[activeTest].input}
                      </div>
                      <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 mt-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Expected Output</p>
                      <div className={`rounded-lg p-3 font-mono text-xs ${darkMode ? 'bg-[#2d2d2d] text-gray-300' : 'bg-gray-50 border border-gray-200 text-gray-700'}`}>
                        {problem.testCases[activeTest].expected}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── RESULT tab ── */}
                {bottomTab === 'result' && (
                  <div>
                    {/* Loading */}
                    {(runLoading || submitLoading) && (
                      <div className="flex items-center gap-3 py-2">
                        <svg className="animate-spin w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {submitLoading ? 'Submitting...' : 'Running test cases...'}
                        </span>
                      </div>
                    )}

                    {/* Submit result */}
                    {submitResult && !submitLoading && (
                      <div>
                        <div className={`flex items-center gap-3 mb-4`}>
                          <span className={`text-xl font-extrabold ${submitResult.status === 'Accepted' ? 'text-green-500' : 'text-red-500'}`}>
                            {submitResult.status}
                          </span>
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {submitResult.passed}/{submitResult.total} test cases passed
                          </span>
                        </div>
                        {submitResult.status === 'Accepted' && (
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: 'Runtime',         value: submitResult.runtime,   pct: submitResult.runtimePct,   color: 'text-primary' },
                              { label: 'Memory',          value: submitResult.memory,    pct: submitResult.memoryPct,    color: 'text-green-500' },
                            ].map((s) => (
                              <div key={s.label} className={`rounded-lg p-3 ${darkMode ? 'bg-[#2d2d2d]' : 'bg-gray-50 border border-gray-200'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-1`}>{s.label}</p>
                                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                                <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-0.5`}>
                                  Faster than {s.pct}%
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Run result */}
                    {runResult && !runLoading && !submitResult && (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`text-base font-bold ${runResult.passed === runResult.total ? 'text-green-500' : 'text-red-500'}`}>
                            {runResult.passed === runResult.total ? '✓ All Passed' : `✗ ${runResult.passed}/${runResult.total} Passed`}
                          </span>
                          {runResult.time && (
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Runtime: {runResult.time}
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {runResult.results.map((r, ri) => (
                            <div key={r.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${darkMode ? 'bg-[#2d2d2d]' : 'bg-gray-50 border border-gray-200'}`}>
                              <span className={`text-xs font-bold flex-shrink-0 ${r.status === 'Accepted' ? 'text-green-500' : 'text-red-500'}`}>
                                {r.status === 'Accepted' ? '✓' : '✗'}
                              </span>
                              <span className={`text-xs flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Case {ri + 1}: {r.status}
                              </span>
                              {r.runtime && (
                                <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                  {r.runtime} · {r.memory}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        {runResult.stdout && (
                          <div className="mt-3">
                            <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Stdout</p>
                            <div className={`rounded-lg p-3 font-mono text-xs whitespace-pre ${darkMode ? 'bg-[#2d2d2d] text-green-400' : 'bg-gray-50 border border-gray-200 text-green-600'}`}>
                              {runResult.stdout}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Empty state */}
                    {!runLoading && !submitLoading && !runResult && !submitResult && (
                      <div className={`flex flex-col items-center justify-center py-6 gap-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" opacity="0.5">
                          <polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                        <p className="text-xs">Click Run or Submit to see results</p>
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

export default IDEPage;
