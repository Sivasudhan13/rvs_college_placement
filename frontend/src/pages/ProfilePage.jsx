import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* ─── Image Upload Widget ─────────────────────────────── */
const ImageUpload = ({ label, currentUrl, onUpload, onDelete, uploading, accept = 'image/*' }) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(currentUrl || '');

  useEffect(() => { setPreview(currentUrl || ''); }, [currentUrl]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG or WebP images allowed'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5 MB'); return;
    }

    // Local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    const fd = new FormData();
    fd.append(label === 'Profile Photo' ? 'photo' : 'certificate', file);
    await onUpload(fd);
    e.target.value = '';
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove ${label}?`)) return;
    setPreview('');
    await onDelete();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Preview */}
      <div
        className="relative w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50
                   flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#0c5273] transition-colors group"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-semibold">Change</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 p-3 text-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-gray-400">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span className="text-[11px] text-gray-400">Upload</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <svg className="animate-spin w-6 h-6 text-[#0c5273]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/>
            </svg>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile}/>
      <p className="text-xs font-semibold text-gray-600">{label}</p>
      <p className="text-[10px] text-gray-400">JPEG / PNG / WebP · max 5 MB</p>
      {preview && (
        <button
          onClick={handleDelete}
          className="text-[11px] text-red-500 hover:text-red-700 font-medium"
        >
          Remove
        </button>
      )}
    </div>
  );
};

/* ─── Field row helper ────────────────────────────────── */
const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0c5273]/20 focus:border-[#0c5273] transition-colors';

const DEPTS = [
  { value: 'cse', label: 'CSE' }, { value: 'it',  label: 'IT' },
  { value: 'ece', label: 'ECE' }, { value: 'eee', label: 'EEE' },
  { value: 'me',  label: 'ME'  }, { value: 'ce',  label: 'CE'  },
  { value: 'mca', label: 'MCA' }, { value: 'mba', label: 'MBA' },
  { value: 'other', label: 'Other' },
];

/* ─── Main Component ──────────────────────────────────── */
export default function ProfilePage() {
  const { updateUser } = useAuth();
  const [profile,  setProfile]   = useState(null);
  const [form,     setForm]      = useState({});
  const [editing,  setEditing]   = useState(false);
  const [saving,   setSaving]    = useState(false);
  const [loading,  setLoading]   = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCert,  setUploadingCert]  = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await profileAPI.get();
      setProfile(data.user);
      setForm(buildForm(data.user));
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  const buildForm = (u) => ({
    name:        u.name        || '',
    idCardNumber:u.idCardNumber|| '',
    phoneNumber: u.phoneNumber || '',
    fatherName:  u.fatherName  || '',
    motherName:  u.motherName  || '',
    occupation:  u.occupation  || '',
    cgpa:        u.cgpa != null ? String(u.cgpa) : '',
    bio:         u.bio         || '',
    department:  u.department  || 'cse',
    batch:       u.batch       || '',
    year:        u.year        || '',
    section:     u.section     || '',
    interestedDomain: u.interestedDomain || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.cgpa !== '') payload.cgpa = parseFloat(payload.cgpa);
      else delete payload.cgpa;

      const { data } = await profileAPI.update(payload);
      setProfile(data.user);
      setForm(buildForm(data.user));
      updateUser(data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleUploadPhoto = async (fd) => {
    setUploadingPhoto(true);
    try {
      const { data } = await profileAPI.uploadPhoto(fd);
      setProfile(p => ({ ...p, avatar: data.url }));
      updateUser({ ...profile, avatar: data.url });
      toast.success('Photo uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploadingPhoto(false); }
  };

  const handleDeletePhoto = async () => {
    try {
      const { data } = await profileAPI.deletePhoto();
      setProfile(p => ({ ...p, avatar: '' }));
      updateUser({ ...profile, avatar: '' });
      toast.success('Photo removed');
    } catch { toast.error('Failed to remove photo'); }
  };

  const handleUploadCert = async (fd) => {
    setUploadingCert(true);
    try {
      const { data } = await profileAPI.uploadCertificate(fd);
      setProfile(p => ({
        ...p,
        photoCertificate: data.user?.photoCertificate || data.url,
        certificates: data.user?.certificates || p?.certificates || [],
      }));
      toast.success('Certificate uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploadingCert(false); }
  };

  const handleDeleteCert = async (index) => {
    try {
      const { data } = await profileAPI.deleteCertificate(index);
      setProfile(p => ({
        ...p,
        photoCertificate: data.user?.photoCertificate || '',
        certificates: data.user?.certificates || [],
      }));
      toast.success('Certificate removed');
    } catch { toast.error('Failed to remove certificate'); }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg className="animate-spin w-10 h-10 text-[#0c5273]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/>
        </svg>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-500 mt-0.5">{profile?.email}</p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 bg-[#0c5273] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#0a4561] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setForm(buildForm(profile)); }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-[#0c5273] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#0a4561] disabled:opacity-60 transition-colors">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* ── Photos ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-5">Photos & Documents</h2>
          <div className="flex flex-wrap gap-10 justify-start">
            <ImageUpload
              label="Profile Photo"
              currentUrl={profile?.avatar}
              onUpload={handleUploadPhoto}
              onDelete={handleDeletePhoto}
              uploading={uploadingPhoto}
            />
          </div>
          <div className="mt-6">
            <p className="text-xs font-semibold text-gray-600 mb-4">Certificates</p>
            <div className="flex flex-wrap gap-6">
              {(profile?.certificates || []).map((certificateUrl, index) => (
                <ImageUpload
                  key={`${certificateUrl}-${index}`}
                  label={`Certificate ${index + 1}`}
                  currentUrl={certificateUrl}
                  onUpload={handleUploadCert}
                  onDelete={() => handleDeleteCert(index)}
                  uploading={uploadingCert}
                />
              ))}
              <ImageUpload
                key={`add-certificate-${(profile?.certificates || []).length}`}
                label="Add Certificate"
                currentUrl=""
                onUpload={handleUploadCert}
                onDelete={() => {}}
                uploading={uploadingCert}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-3">
              Add as many certificates as needed. The first certificate is used as the primary fallback preview.
            </p>
          </div>
        </div>

        {/* ── Personal Info ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-700 mb-1">Personal Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name">
              {editing
                ? <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)}/>
                : <p className="text-sm text-gray-900 py-2">{profile?.name || '—'}</p>}
            </Field>

            <Field label="Email">
              <p className="text-sm text-gray-900 py-2">{profile?.email || '—'}</p>
              {editing && <p className="text-[11px] text-gray-400 mt-0.5">Email cannot be changed here</p>}
            </Field>

            <Field label="ID Card Number">
              {editing
                ? <input className={inputCls} value={form.idCardNumber} onChange={e => set('idCardNumber', e.target.value)} placeholder="e.g., 21BME001"/>
                : <p className="text-sm text-gray-900 py-2">{profile?.idCardNumber || '—'}</p>}
            </Field>

            <Field label="Phone Number">
              {editing
                ? <input className={inputCls} value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} placeholder="e.g., 9876543210" type="tel"/>
                : <p className="text-sm text-gray-900 py-2">{profile?.phoneNumber || '—'}</p>}
            </Field>

            <Field label="Father's Name">
              {editing
                ? <input className={inputCls} value={form.fatherName} onChange={e => set('fatherName', e.target.value)} placeholder="Father's full name"/>
                : <p className="text-sm text-gray-900 py-2">{profile?.fatherName || '—'}</p>}
            </Field>

            <Field label="Mother's Name">
              {editing
                ? <input className={inputCls} value={form.motherName} onChange={e => set('motherName', e.target.value)} placeholder="Mother's full name"/>
                : <p className="text-sm text-gray-900 py-2">{profile?.motherName || '—'}</p>}
            </Field>

            <Field label="Occupation (Parent/Guardian)">
              {editing
                ? <input className={inputCls} value={form.occupation} onChange={e => set('occupation', e.target.value)} placeholder="e.g., Engineer, Teacher"/>
                : <p className="text-sm text-gray-900 py-2">{profile?.occupation || '—'}</p>}
            </Field>

            <Field label="Current CGPA">
              {editing
                ? <input className={inputCls} value={form.cgpa} onChange={e => set('cgpa', e.target.value)} placeholder="e.g., 8.5" type="number" min="0" max="10" step="0.01"/>
                : <p className="text-sm text-gray-900 py-2">{profile?.cgpa != null ? profile.cgpa : '—'}</p>}
            </Field>

            <Field label="Interested Domain">
              {editing
                ? <input className={inputCls} value={form.interestedDomain} onChange={e => set('interestedDomain', e.target.value)} placeholder="e.g., Full Stack Development, Data Science"/>
                : <p className="text-sm text-gray-900 py-2">{profile?.interestedDomain || '—'}</p>}
            </Field>
          </div>

          {editing && (
            <Field label="Bio">
              <textarea className={`${inputCls} resize-none`} rows={3}
                value={form.bio} onChange={e => set('bio', e.target.value)}
                placeholder="A short bio about yourself…"/>
            </Field>
          )}
          {!editing && profile?.bio && (
            <Field label="Bio">
              <p className="text-sm text-gray-700 py-2">{profile.bio}</p>
            </Field>
          )}
        </div>

        {/* ── Academic Info ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-700 mb-1">Academic Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Department">
              {editing ? (
                <select className={inputCls} value={form.department} onChange={e => set('department', e.target.value)}>
                  {DEPTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              ) : (
                <p className="text-sm text-gray-900 py-2 uppercase">{profile?.department || '—'}</p>
              )}
            </Field>

            <Field label="Batch">
              {editing
                ? <input className={inputCls} value={form.batch} onChange={e => set('batch', e.target.value)} placeholder="e.g., 2023-2027"/>
                : <p className="text-sm text-gray-900 py-2">{profile?.batch || '—'}</p>}
            </Field>

            <Field label="Year">
              {editing ? (
                <select className={inputCls} value={form.year} onChange={e => set('year', e.target.value)}>
                  <option value="">Select</option>
                  {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              ) : (
                <p className="text-sm text-gray-900 py-2">{profile?.year ? `Year ${profile.year}` : '—'}</p>
              )}
            </Field>

            <Field label="Section">
              {editing
                ? <input className={inputCls} value={form.section} onChange={e => set('section', e.target.value)} placeholder="e.g., A"/>
                : <p className="text-sm text-gray-900 py-2">{profile?.section || '—'}</p>}
            </Field>

            <Field label="Role">
              <p className="text-sm text-gray-900 py-2 capitalize">{profile?.role || '—'}</p>
            </Field>

            <Field label="Student ID">
              <p className="text-sm text-gray-900 py-2">{profile?.studentId || '—'}</p>
            </Field>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
