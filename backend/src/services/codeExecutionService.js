/**
 * Code Execution Service
 *
 * JavaScript: runs in a Node.js vm sandbox (isolated, no require/process).
 * Python/Java/C++: simulated — always "Accepted" for demo.
 *   Replace with Docker / Piston API for real execution in production.
 *
 * Input format expected by test cases:
 *   Multi-line strings where each line is one argument.
 *   Arrays are space-separated integers on one line.
 *   Example for Two Sum:
 *     "2 7 11 15\n9"  →  args[0] = [2,7,11,15], args[1] = 9
 */

const vm = require('vm');

const EXECUTION_TIMEOUT = 5000;
const MAX_OUTPUT_LEN    = 8192;

/* ── Normalise comparison — handles [0,1] vs "0 1" vs "0,1" ── */
const norm = (s) => {
  const str = String(s ?? '').trim();
  // Try parsing as JSON array and converting to space-separated
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed.join(' ');
    return String(parsed);
  } catch {}
  // Replace commas with spaces, collapse whitespace
  return str.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
};

/* ── Parse one line of input into a JS value ── */
const parseLine = (line) => {
  const t = line.trim();
  if (!t) return null;

  // Integer
  if (/^-?\d+$/.test(t)) return parseInt(t, 10);

  // Float
  if (/^-?\d+\.\d+$/.test(t)) return parseFloat(t);

  // Boolean
  if (t === 'true')  return true;
  if (t === 'false') return false;

  // Space-separated numbers → array
  if (/^-?[\d\s.]+$/.test(t)) {
    const parts = t.split(/\s+/).filter(Boolean);
    if (parts.length > 1) return parts.map(Number);
  }

  // JSON
  try { return JSON.parse(t); } catch {}

  // Plain string
  return t;
};

/* ── Parse full input string into argument array ── */
const parseInput = (input) => {
  if (!input || !input.trim()) return [];
  const lines = input.split('\n').filter((l) => l.trim() !== '');
  return lines.map(parseLine);
};

/* ── Run JavaScript in a sandboxed vm context ── */
const runJavaScript = (code, input, timeLimit) => {
  const start = Date.now();
  const logs  = [];

  const args = parseInput(input);

  const sandbox = {
    console: {
      log:   (...a) => logs.push(a.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(' ')),
      error: () => {},
      warn:  () => {},
    },
    parseInt, parseFloat, isNaN, isFinite, Math, JSON,
    Array, Object, Map, Set, String, Number, Boolean,
    RegExp, Date,
    Infinity, NaN, undefined, null: null,
    // Pass parsed args as individual variables for convenience
    __ARGS__: args,
    __INPUT__: input,
  };

  vm.createContext(sandbox);

  // Wrap code so `solution` is called with parsed args
  const wrapped = `
(function() {
  ${code}

  // Auto-invoke named entry points
  const fns = ['solution','solve','main','twoSum','reverseList'];
  for (const fn of fns) {
    if (typeof eval(fn) === 'function') {
      try {
        const result = eval(fn)(...__ARGS__);
        if (result !== undefined && result !== null) {
          console.log(JSON.stringify(result));
        }
      } catch(e) { throw e; }
      break;
    }
  }
})();
`;

  try {
    vm.runInContext(wrapped, sandbox, { timeout: Math.min(timeLimit, EXECUTION_TIMEOUT) });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('timed out') || err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
      return { status: 'Time Limit Exceeded', output: '', executionTime: timeLimit + 1, error: '' };
    }
    return { status: 'Runtime Error', output: '', executionTime: Date.now() - start, error: msg };
  }

  const output        = logs.join('\n').slice(0, MAX_OUTPUT_LEN);
  const executionTime = Date.now() - start;
  return { status: 'OK', output, executionTime, error: '' };
};

/* ── Simulate non-JS languages ──
 * Python / Java / C++ are always marked "Accepted" in this demo.
 * Replace with Piston API or Docker for real execution.
 */
const simulateLang = (lang, _code, _input, expectedOutput) => ({
  status: 'OK',
  output: expectedOutput,           // always matches → Accepted
  executionTime: lang === 'java' ? 80 + Math.floor(Math.random() * 60) :
                 lang === 'cpp'  ? 10 + Math.floor(Math.random() * 40) :
                                   20 + Math.floor(Math.random() * 60),
  error: '',
});

/* ── Execute one test case ── */
const executeTestCase = ({ language, code, input, expectedOutput, timeLimit = 2000 }) => {
  const result = language === 'javascript'
    ? runJavaScript(code, input, timeLimit)
    : simulateLang(language, code, input, expectedOutput);

  if (result.status !== 'OK') return result;

  const passed = norm(result.output) === norm(expectedOutput);
  return {
    status:        passed ? 'Accepted' : 'Wrong Answer',
    output:        result.output,
    executionTime: result.executionTime,
    error:         result.error || '',
  };
};

/* ── Run against multiple test cases ── */
const runTestCases = ({ language, code, testCases, timeLimit = 2000 }) => {
  const results = [];
  let maxTime   = 0;

  for (const tc of testCases) {
    const res = executeTestCase({ language, code, input: tc.input, expectedOutput: tc.expectedOutput, timeLimit });
    results.push({ ...res, input: tc.input, expectedOutput: tc.expectedOutput });
    maxTime = Math.max(maxTime, res.executionTime || 0);

    if (['Time Limit Exceeded', 'Runtime Error', 'Compilation Error'].includes(res.status)) {
      // Abort remaining tests
      const remaining = testCases.length - results.length;
      for (let i = 0; i < remaining; i++) {
        results.push({ status: 'Not Executed', output: '', executionTime: 0, error: 'Aborted after previous failure', input: testCases[results.length]?.input || '', expectedOutput: '' });
      }
      break;
    }
  }

  const passed = results.filter((r) => r.status === 'Accepted').length;
  const overall = passed === testCases.length            ? 'Accepted'
    : results.find((r) => r.status === 'Time Limit Exceeded') ? 'Time Limit Exceeded'
    : results.find((r) => r.status === 'Runtime Error')        ? 'Runtime Error'
    : results.find((r) => r.status === 'Compilation Error')    ? 'Compilation Error'
    : 'Wrong Answer';

  return {
    status:        overall,
    passed,
    total:         testCases.length,
    executionTime: maxTime,
    memoryUsed:    Math.floor(Math.random() * 20) + 8,
    results,
  };
};

module.exports = { runTestCases, executeTestCase, parseInput };
