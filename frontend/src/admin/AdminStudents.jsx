import React, { useState, useEffect } from 'react';
import toast from "react-hot-toast";
import { adminAPI } from "../services/adminApi";

const deptLabel = {
  cse: "CSE",
  ece: "ECE",
  eee: "EEE",
  me: "ME",
  ce: "CE",
  other: "Other",
  it: "IT",
  mca: "MCA",
  mba: "MBA",
};
const DEPTS = ["All", "CSE", "ECE", "EEE", "ME", "CE", "IT", "MCA", "MBA"];
const DEPT_VALS = {
  CSE: "cse",
  ECE: "ece",
  EEE: "eee",
  ME: "me",
  CE: "ce",
  IT: "it",
  MCA: "mca",
  MBA: "mba",
};
const ROLES = ["student", "faculty"];
const CGPA_PRESETS = [
  { label: "All", min: "", max: "" },
  { label: "≥ 8.5", min: "8.5", max: "" },
  { label: "7.5 – 8.5", min: "7.5", max: "8.49" },
  { label: "6.5 – 7.5", min: "6.5", max: "7.49" },
  { label: "< 6.5", min: "", max: "6.49" },
];
const DOMAIN_SUGGESTIONS = [
  "Software Development",
  "Data Science",
  "Machine Learning",
  "Cybersecurity",
  "Cloud Computing",
  "Web Development",
  "Mobile Development",
  "DevOps",
  "IoT",
  "Blockchain",
  "Networking",
  "Database",
  "AI",
  "Full Stack",
];

const currentYear = new Date().getFullYear();
const BATCHES = [
  "All",
  ...Array.from({ length: 10 }, (_, i) => {
    const s = currentYear - 6 + i;
    return `${s}-${s + 4}`;
  }),
];

const StudentAvatar = ({ student, size = 32, className = "" }) => {
  const src = student?.avatar || student?.photoCertificate;
  const initials = student?.name?.slice(0, 2)?.toUpperCase() || "👤";
  if (src) {
    return (
      <img
        src={src}
        alt={student?.name || "Student"}
        onError={(e) => {
          e.target.style.display = "none";
          e.target.nextSibling.style.display = "flex";
        }}
        style={{ width: size, height: size, display: "block" }}
        className={`rounded-full object-cover flex-shrink-0 ring-2 ring-white ${className}`}
      />
    );
  }
  return null;
};

const Spin = () => (
  <div className="flex justify-center py-16">
    <svg
      className="animate-spin h-6 w-6 text-amber-400"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  </div>
);

/* ── Add User Modal ── */
const AddUserModal = ({ onClose, onAdded }) => {
  const inp =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-white";
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    studentId: "",
    admissionNumber: "",
    department: "cse",
    batch: `${currentYear}-${currentYear + 4}`,
    role: "student",
    password: "",
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.studentId || !form.password) {
      toast.error("Name, Email, Student ID and Password are required");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      await adminAPI.createStudent(form);
      toast.success("User created successfully!");
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">Add New User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Full Name *
            </label>
            <input
              className={inp}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Ravi Kumar"
              autoFocus
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Institutional Email *
            </label>
            <input
              type="email"
              className={inp}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="student@rvscet.ac.in"
            />
          </div>

          {/* Student ID + Admission Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Student / Faculty ID *
              </label>
              <input
                className={inp}
                value={form.studentId}
                onChange={(e) => set("studentId", e.target.value)}
                placeholder="e.g. 21CSE001"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Admission Number
              </label>
              <input
                className={inp}
                value={form.admissionNumber}
                onChange={(e) => set("admissionNumber", e.target.value)}
                placeholder="Same as ID if blank"
              />
            </div>
          </div>

          {/* Department + Batch */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Department
              </label>
              <select
                className={inp}
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
              >
                {[
                  ["cse", "CSE"],
                  ["ece", "ECE"],
                  ["eee", "EEE"],
                  ["me", "ME"],
                  ["ce", "CE"],
                  ["other", "Other"],
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Batch
              </label>
              <select
                className={inp}
                value={form.batch}
                onChange={(e) => set("batch", e.target.value)}
              >
                {BATCHES.filter((b) => b !== "All").map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Role + Password */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Role
              </label>
              <select
                className={inp}
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r} className="capitalize">
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Password *
              </label>
              <input
                type="password"
                className={inp}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Min 8 characters"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main Component ── */
const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [batch, setBatch] = useState("All");
  const [minCgpa, setMinCgpa] = useState("");
  const [maxCgpa, setMaxCgpa] = useState("");
  const [cgpaPreset, setCgpaPreset] = useState("All");
  const [domainSearch, setDomainSearch] = useState("");
  const [showDomainDropdown, setShowDomainDropdown] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailImageOpen, setDetailImageOpen] = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (search) params.search = search;
      if (dept !== "All")
        params.department = DEPT_VALS[dept] || dept.toLowerCase();
      if (batch !== "All") params.batch = batch;
      if (minCgpa) params.minCgpa = minCgpa;
      if (maxCgpa) params.maxCgpa = maxCgpa;
      if (domainSearch) params.interestedDomain = domainSearch;
      const { data } = await adminAPI.getStudents(params);
      setStudents(data.students || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const applyCgpaPreset = (label) => {
    setCgpaPreset(label);
    const preset = CGPA_PRESETS.find((p) => p.label === label);
    if (preset) {
      setMinCgpa(preset.min);
      setMaxCgpa(preset.max);
    }
  };

  useEffect(() => {
    load(1);
    setPage(1);
  }, [search, dept, batch, minCgpa, maxCgpa, domainSearch]);

  const loadDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const { data } = await adminAPI.getStudent(id);
      setDetail(data);
    } catch {
      toast.error("Failed to load details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const toggleActive = async (s) => {
    try {
      await adminAPI.updateStudent(s._id, { isActive: !s.isActive });
      toast.success(s.isActive ? "Student deactivated" : "Student activated");
      load(page);
      if (selected?._id === s._id) loadDetail(s._id);
    } catch {
      toast.error("Failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this student and all their data?"))
      return;
    try {
      await adminAPI.deleteStudent(id);
      toast.success("Student deleted");
      load(page);
      if (selected?._id === id) {
        setSelected(null);
        setDetail(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const avgScore = (subs) => {
    if (!subs?.length) return 0;
    return Math.round(
      subs.reduce((s, sub) => s + sub.percentage, 0) / subs.length,
    );
  };

  return (
    <div>
      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            load(1);
            setPage(1);
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} registered students
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <line
              x1="12"
              y1="5"
              x2="12"
              y2="19"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="5"
              y1="12"
              x2="19"
              y2="12"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          Add User
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* ── Student list ── */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 space-y-3">
            {/* Department filter */}
            <div className="flex gap-1.5 flex-wrap">
              {DEPTS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDept(d)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors
                    ${dept === d ? "bg-amber-400 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Batch filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex-shrink-0">
                Batch:
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {BATCHES.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBatch(b)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors
                      ${batch === b ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* CGPA filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex-shrink-0">
                CGPA:
              </span>
              <div className="flex gap-1.5 flex-wrap flex-1 items-center">
                {CGPA_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => applyCgpaPreset(p.label)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors
                      ${cgpaPreset === p.label ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {p.label}
                  </button>
                ))}
                <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-200">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="Min"
                    value={minCgpa}
                    onChange={(e) => {
                      setMinCgpa(e.target.value);
                      setCgpaPreset("Custom");
                    }}
                    className="w-14 px-2 py-1 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-green-300"
                  />
                  <span className="text-[10px] text-gray-400">–</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="Max"
                    value={maxCgpa}
                    onChange={(e) => {
                      setMaxCgpa(e.target.value);
                      setCgpaPreset("Custom");
                    }}
                    className="w-14 px-2 py-1 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-green-300"
                  />
                  {(minCgpa || maxCgpa) && (
                    <button
                      onClick={() => {
                        setMinCgpa("");
                        setMaxCgpa("");
                        setCgpaPreset("All");
                      }}
                      className="text-[10px] text-gray-400 hover:text-red-500 px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Domain search with suggestions */}
            <div className="relative flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex-shrink-0 w-14">
                Domain:
              </span>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="🎯 Search interested domain (e.g. Data Science, ML)…"
                  value={domainSearch}
                  onFocus={() => setShowDomainDropdown(true)}
                  onBlur={() =>
                    setTimeout(() => setShowDomainDropdown(false), 150)
                  }
                  onChange={(e) => {
                    setDomainSearch(e.target.value);
                    setShowDomainDropdown(true);
                  }}
                  className="w-full text-xs text-gray-700 placeholder:text-gray-400 outline-none bg-gray-50 rounded-lg px-3 py-1.5 border border-transparent focus:border-purple-300 transition-all"
                />
                {showDomainDropdown && (
                  <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {DOMAIN_SUGGESTIONS.filter((d) =>
                      d.toLowerCase().includes(domainSearch.toLowerCase()),
                    ).map((d) => (
                      <div
                        key={d}
                        onMouseDown={() => {
                          setDomainSearch(d);
                          setShowDomainDropdown(false);
                        }}
                        className="px-3 py-1.5 text-xs text-gray-700 hover:bg-purple-50 cursor-pointer flex items-center gap-2"
                      >
                        <span className="text-purple-500">🎯</span> {d}
                      </div>
                    ))}
                    {domainSearch &&
                      !DOMAIN_SUGGESTIONS.some(
                        (d) => d.toLowerCase() === domainSearch.toLowerCase(),
                      ) && (
                        <div className="px-3 py-1.5 text-xs text-gray-400 italic border-t border-gray-100">
                          Using custom search: "{domainSearch}"
                        </div>
                      )}
                  </div>
                )}
              </div>
              {domainSearch && (
                <button
                  onClick={() => setDomainSearch("")}
                  className="text-[10px] text-gray-400 hover:text-red-500 px-1.5 py-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="🔍 Search by name, ID, email, domain…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-gray-50 rounded-lg px-3 py-2 border border-transparent focus:border-amber-300 transition-all"
            />
          </div>

          {loading ? (
            <Spin />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                        Student
                      </th>
                      <th className="text-left px-3 py-3 text-xs font-bold text-gray-500 uppercase">
                        Dept
                      </th>
                      <th className="text-left px-3 py-3 text-xs font-bold text-gray-500 uppercase">
                        CGPA
                      </th>
                      <th className="text-left px-3 py-3 text-xs font-bold text-gray-500 uppercase">
                        Batch
                      </th>
                      <th className="text-center px-3 py-3 text-xs font-bold text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map((s) => (
                      <tr
                        key={s._id}
                        onClick={() => {
                          setSelected(s);
                          loadDetail(s._id);
                        }}
                        className={`cursor-pointer transition-colors ${selected?._id === s._id ? "bg-amber-50" : "hover:bg-gray-50"}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <StudentAvatar student={s} size={32} />
                              {!s.avatar && !s.photoCertificate && (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 overflow-hidden">
                                  {s.name?.[0]?.toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
                                {s.name}
                                {s.interestedDomain && (
                                  <span
                                    className="hidden sm:inline text-[9px] font-semibold bg-purple-50 text-purple-600 border border-purple-100 px-1.5 py-0.5 rounded-full"
                                    title={`Interested Domain: ${s.interestedDomain}`}
                                  >
                                    🎯{" "}
                                    {s.interestedDomain.length > 14
                                      ? s.interestedDomain.slice(0, 14) + "…"
                                      : s.interestedDomain}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap">
                                <span>{s.studentId}</span>
                                {s.email && (
                                  <span className="hidden sm:inline text-gray-300">
                                    ·
                                  </span>
                                )}
                                <span className="hidden sm:inline truncate max-w-[150px]">
                                  {s.email}
                                </span>
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-xs text-gray-600">
                          {deptLabel[s.department] || s.department}
                        </td>

                        <td className="px-3 py-3">
                          {s.cgpa != null && !isNaN(s.cgpa) ? (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                s.cgpa >= 8.5
                                  ? "bg-green-100 text-green-700"
                                  : s.cgpa >= 7
                                    ? "bg-amber-100 text-amber-700"
                                    : s.cgpa >= 6
                                      ? "bg-orange-100 text-orange-600"
                                      : "bg-red-100 text-red-600"
                              }`}
                            >
                              ⭐ {Number(s.cgpa).toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-medium">
                              —
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          {s.batch ? (
                            <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {s.batch}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">—</span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                          >
                            {s.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleActive(s);
                              }}
                              className="p-1.5 rounded text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                              title="Toggle active"
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <path
                                  d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(s._id);
                              }}
                              className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <polyline
                                  points="3 6 5 6 21 6"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!students.length && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-10 text-center text-gray-400 text-sm"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl">🔍</span>
                            <p>No students found</p>
                            {(minCgpa || maxCgpa || domainSearch || search) && (
                              <p className="text-[11px] text-gray-300">
                                Try clearing CGPA, domain, or text filters
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 py-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      const p = Math.max(1, page - 1);
                      setPage(p);
                      load(p);
                    }}
                    disabled={page === 1}
                    className="px-3 py-1 text-xs font-medium rounded border border-gray-200 disabled:opacity-40"
                  >
                    ←
                  </button>
                  <span className="px-3 py-1 text-xs text-gray-600">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => {
                      const p = Math.min(totalPages, page + 1);
                      setPage(p);
                      load(p);
                    }}
                    disabled={page === totalPages}
                    className="px-3 py-1 text-xs font-medium rounded border border-gray-200 disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Student detail ── */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {detailImageOpen && detail?.student?.avatar && (
            <div
              className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-6"
              onClick={() => setDetailImageOpen(false)}
            >
              <img
                src={detail.student.avatar}
                alt={detail.student.name}
                className="max-w-[80vw] max-h-[80vh] rounded-2xl shadow-2xl object-contain cursor-pointer"
              />
            </div>
          )}

          {!selected ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                className="opacity-30"
              >
                <path
                  d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle
                  cx="12"
                  cy="7"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <p className="text-sm">Select a student to view details</p>
            </div>
          ) : loadingDetail ? (
            <Spin />
          ) : (
            detail && (
              <div className="overflow-y-auto max-h-[780px]">
                {/* Hero header with image */}
                <div className="relative bg-gradient-to-br from-primary/15 via-primary/5 to-amber-50 px-5 pt-5 pb-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="relative group cursor-pointer flex-shrink-0"
                      onClick={() => detail.student?.avatar && setDetailImageOpen(true)}
                    >
                      {detail.student?.avatar || detail.student?.photoCertificate ? (
                        <>
                          <img
                            src={detail.student?.avatar || detail.student?.photoCertificate}
                            alt={detail.student?.name}
                            onError={(e) => { e.target.style.display = 'none'; }}
                            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-lg group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center text-[10px] shadow-md border border-gray-100 group-hover:scale-110 transition-transform">
                            🔍
                          </span>
                        </>
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-white shadow-lg ring-4 ring-white flex items-center justify-center text-3xl font-extrabold text-primary flex-shrink-0">
                          {detail.student?.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold text-gray-900 leading-tight truncate">
                        {detail.student?.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {detail.student?.email}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 flex-wrap">
                        <span className="font-semibold text-gray-500">{detail.student?.studentId}</span>
                        <span>·</span>
                        <span>{deptLabel[detail.student?.department]}</span>
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {detail.student?.batch && (
                          <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            📚 {detail.student.batch}
                          </span>
                        )}
                        {detail.student?.cgpa != null && !isNaN(detail.student?.cgpa) && (
                          <span className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            ⭐ {Number(detail.student.cgpa).toFixed(1)} CGPA
                          </span>
                        )}
                        {detail.student?.year && (
                          <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            Year {detail.student.year}
                          </span>
                        )}
                        {detail.student?.section && (
                          <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            Sec {detail.student.section}
                          </span>
                        )}
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${detail.student?.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {detail.student?.isActive ? "✓ Active" : "✗ Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {detail.student?.interestedDomain && (
                    <div className="mt-4 bg-white/80 border border-purple-100 rounded-xl p-3 flex items-start gap-2.5">
                      <span className="text-lg flex-shrink-0">🎯</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wide">
                          Interested Domain
                        </p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">
                          {detail.student.interestedDomain}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-5">
                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-primary">
                        {detail.submissions?.length || 0}
                      </p>
                      <p className="text-[9px] text-gray-500 mt-0.5">Attempts</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-green-600">
                        {avgScore(detail.submissions)}%
                      </p>
                      <p className="text-[9px] text-gray-500 mt-0.5">Avg Score</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-amber-500">
                        {detail.interviews?.length || 0}
                      </p>
                      <p className="text-[9px] text-gray-500 mt-0.5">Interviews</p>
                    </div>
                  </div>

                  {/* Profile info grid */}
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2.5">
                      Profile Information
                    </h4>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { label: "Phone", val: detail.student?.phoneNumber || detail.student?.mobile, icon: "📱" },
                        { label: "CGPA", val: detail.student?.cgpa != null && !isNaN(detail.student?.cgpa) ? Number(detail.student.cgpa).toFixed(2) : "—", icon: "⭐" },
                        { label: "ID Card", val: detail.student?.idCardNumber || detail.student?.admissionNumber || "—", icon: "🪪" },
                        { label: "Father", val: detail.student?.fatherName || "—", icon: "👨" },
                        { label: "Mother", val: detail.student?.motherName || "—", icon: "👩" },
                        { label: "Occupation", val: detail.student?.occupation || "—", icon: "💼" },
                      ].map((f) => (
                        <div key={f.label} className="bg-gray-50/70 rounded-lg p-2.5 min-w-0">
                          <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-1">
                            <span>{f.icon}</span> {f.label}
                          </p>
                          <p className="text-xs font-semibold text-gray-800 mt-0.5 truncate" title={f.val}>
                            {f.val}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {detail.student?.bio && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3">
                      <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wide mb-1">
                        📝 Bio
                      </p>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {detail.student.bio}
                      </p>
                    </div>
                  )}

                  {/* Interview sessions */}
                  {detail.interviews?.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2.5">
                        Recent Interviews
                      </h4>
                      <div className="space-y-2">
                        {detail.interviews.slice(0, 3).map((iv) => (
                          <div key={iv._id} className="border border-purple-100 bg-purple-50/50 rounded-lg p-2.5">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-gray-800">
                                {iv.jobRole || "HR Interview"}
                              </p>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                iv.status === "completed" ? "bg-green-100 text-green-700" :
                                iv.status === "in_progress" ? "bg-amber-100 text-amber-700" :
                                "bg-gray-100 text-gray-600"
                              }`}>
                                {iv.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[10px] text-gray-400">
                                {new Date(iv.createdAt).toLocaleDateString()}
                              </p>
                              {iv.overallScore != null && (
                                <p className="text-[10px] font-bold text-purple-600">
                                  Score: {iv.overallScore}/10
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submission history */}
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2.5">
                      Submission History
                    </h4>
                    <div className="space-y-1.5">
                      {(detail.submissions || []).slice(0, 8).map((sub, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-gray-800 truncate">
                              {sub.quiz?.title || "Untitled Quiz"}
                            </p>
                            <p className="text-[9px] text-gray-400 mt-0.5">
                              {sub.quiz?.category || "—"} · {new Date(sub.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-bold flex-shrink-0 px-2 py-0.5 rounded ${
                              sub.percentage >= 60
                                ? "bg-green-100 text-green-700"
                                : "bg-red-50 text-red-500"
                            }`}
                          >
                            {sub.percentage}%
                          </span>
                        </div>
                      ))}
                      {!detail.submissions?.length && (
                        <div className="text-xs text-gray-400 py-4 text-center bg-gray-50 rounded-lg">
                          📝 No submissions yet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Last login / created */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                    <span>
                      🗓️ Joined: {detail.student?.createdAt ? new Date(detail.student.createdAt).toLocaleDateString() : "—"}
                    </span>
                    <span>
                      {detail.student?.lastLogin ? `🕐 Last: ${new Date(detail.student.lastLogin).toLocaleDateString()}` : "🕐 Never logged in"}
                    </span>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStudents;
