import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../components';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/logo/logo.jpeg';
import nbaLogo   from '../assets/logo/nba.jpeg';
import aplus     from '../assets/logo/a+.jpeg';

const LoginPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  const [formData, setFormData] = useState({ studentId: '', password: '' });
  const [loading,  setLoading]  = useState(false);

  // Clear any stale token/cookie from previous sessions on mount
  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Expire the httpOnly cookie by hitting logout (fire-and-forget)
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      // Clear any stale auth state before attempting login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      await login(formData);
      toast.success('Login successful! Welcome back.');
      navigate(from, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        data.errors.forEach((er) => toast.error(er.message));
      } else {
        toast.error(data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    navigate('/forgot-password');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Card body */}
          <div className="px-8 pt-10 pb-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img src={logoImage} alt="RVS College Logo" className="w-20 h-20 object-contain"/>
            </div>

            {/* Heading */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-primary leading-tight">Secure Login</h1>
              <p className="text-sm text-gray-500 mt-1">
                Access your <span className="text-primary font-medium">academic portal</span>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              {/* Student/Faculty ID */}
              <div className="mb-4">
                <label htmlFor="studentId" className="block text-xs font-semibold text-amber-600 mb-1.5">
                  Student/Faculty ID
                </label>
                <div className="flex items-center border border-gray-300 rounded focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 bg-white transition-all">
                  <span className="pl-3 text-gray-400 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                      <circle cx="8.5" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
                      <path d="M13 10h5M13 14h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    id="studentId" name="studentId" type="text"
                    placeholder="Enter your ID" value={formData.studentId}
                    onChange={handleChange} autoComplete="username"
                    className="w-full py-2.5 px-3 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-2">
                <label htmlFor="password" className="block text-xs font-semibold text-amber-600 mb-1.5">
                  Password
                </label>
                <div className="flex items-center border border-gray-300 rounded focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 bg-white transition-all">
                  <span className="pl-3 text-gray-400 flex-shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
                    </svg>
                  </span>
                  <input
                    id="password" name="password" type="password"
                    placeholder="Enter your password" value={formData.password}
                    onChange={handleChange} autoComplete="current-password"
                    className="w-full py-2.5 px-3 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Forgot password */}
              <div className="flex justify-end mb-6">
                <a href="#" onClick={handleForgotPassword} className="text-xs text-primary hover:underline">
                  Forgot Password?
                </a>
              </div>

              {/* Submit */}
              <Button
                type="submit" variant="primary" size="custom" fullWidth loading={loading}
                className="py-3 text-sm font-semibold tracking-wide rounded"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="10 17 15 12 10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                }
                iconPosition="left"
              >
                LOGIN TO PORTAL
              </Button>

              <div className="my-6 border-t border-gray-200" />

              <p className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }}
                   className="text-primary font-semibold hover:underline">
                  Register here.
                </a>
              </p>
            </form>
          </div>

          {/* Accreditation logos */}
          <div className="border-t border-gray-200 bg-gray-50 py-4 flex items-center justify-center gap-6">
            <img src={nbaLogo} alt="NBA Accredited"  className="h-12 w-auto object-contain"/>
            <img src={aplus}   alt="NAAC A+ Accredited" className="h-12 w-auto object-contain"/>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-4 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-gray-600 leading-relaxed max-w-xs">
            © 2024 <span className="text-primary font-medium">RVS College of Engineering &amp; Technology.</span>{' '}
            All Rights Reserved. Accredited with NAAC A+ and NBA.
          </p>
          <nav className="flex flex-wrap gap-x-5 gap-y-1">
            {['Privacy Policy', 'Terms of Service', 'Contact Us', 'Accreditation Details'].map((item) => (
              <a key={item} href="#" className="text-xs text-gray-600 hover:text-primary hover:underline whitespace-nowrap">{item}</a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
