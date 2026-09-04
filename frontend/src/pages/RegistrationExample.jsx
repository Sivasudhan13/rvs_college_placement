import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Input, Select, Button, Card, Logo, FormLayout, Footer, Link } from '../components';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/logo/logo.jpeg';

const RegistrationExample = () => {
  const navigate    = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '', admissionNumber: '', department: '', institutionalEmail: '', password: '', batch: '',
  });
  const [loading, setLoading] = useState(false);

  // Generate batches: current year ±3
  const currentYear = new Date().getFullYear();
  const batches = Array.from({ length: 7 }, (_, i) => {
    const start = currentYear - 3 + i;
    return { value: `${start}-${start + 4}`, label: `${start}-${start + 4}` };
  });

  const departments = [
    { value: 'cse', label: 'Computer Science Engineering' },
    { value: 'ece', label: 'Electronics & Communication Engineering' },
    { value: 'eee', label: 'Electrical & Electronics Engineering' },
    { value: 'me',  label: 'Mechanical Engineering' },
    { value: 'ce',  label: 'Civil Engineering' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fullName, admissionNumber, department, institutionalEmail, password } = formData;

    if (!fullName || !admissionNumber || !department || !institutionalEmail || !password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        name:            fullName,
        studentId:       admissionNumber,
        admissionNumber,
        email:           institutionalEmail,
        department,
        password,
        batch:           formData.batch,
      });
      toast.success('Registration successful! Welcome aboard.');
      navigate('/dashboard');
    } catch (err) {
      // Surface field-level validation errors from the backend
      const data = err.response?.data;
      if (data?.errors?.length) {
        data.errors.forEach((e) => toast.error(`${e.message}`));
      } else {
        toast.error(data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const leftPanelContent = (
    <div className="w-full flex flex-col items-center justify-center text-center">
      <Logo
        src={logoImage} alt="RVS College Logo" size="large" centered
        collegeName="RVS College of Engineering & Technology"
        tagline="Empowering minds, engineering the future. Register for your student account to access the academic portal."
      />
    </div>
  );

  const rightPanelContent = (
    <Card padding="none" shadow={false}>
      <div className="mb-8 md:mb-6">
        <h2 className="text-3xl md:text-2xl font-bold text-gray-800 mb-2">Student Registration</h2>
        <p className="text-base md:text-sm text-primary">Please fill in your details to create an account.</p>
      </div>

      <Input label="Full Name" name="fullName" placeholder="e.g., John Doe"
        value={formData.fullName} onChange={handleChange} required
        icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z" fill="currentColor"/></svg>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0">
        <Input label="Admission Number" name="admissionNumber" placeholder="e.g., 21BME001"
          value={formData.admissionNumber} onChange={handleChange} required
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 2H10.5L9.5 1H6.5L5.5 2H2V4H14V2ZM3 14C3 14.5304 3.21071 15.0391 3.58579 15.4142C3.96086 15.7893 4.46957 16 5 16H11C11.5304 16 12.0391 15.7893 12.4142 15.4142C12.7893 15.0391 13 14.5304 13 14V5H3V14Z" fill="currentColor"/></svg>}
        />
        <Select label="Department" name="department" placeholder="Select Department"
          value={formData.department} onChange={handleChange} options={departments} required
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 0L0 6L8 12L14 7.27V12H16V6L8 0ZM2 10.27V13.27L8 17L14 13.27V10.27L8 14L2 10.27Z" fill="currentColor"/></svg>}
        />
      </div>

      <Select label="Batch" name="batch" placeholder="Select Batch Year"
        value={formData.batch} onChange={handleChange} options={batches} required
        icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M1 6h14M5 2v4M11 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
      />

      <Input label="Institutional Email" name="institutionalEmail" type="email" placeholder="student@rvscet.ac.in"
        value={formData.institutionalEmail} onChange={handleChange} required
        icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 2H2C0.9 2 0.00999999 2.9 0.00999999 4L0 12C0 13.1 0.9 14 2 14H14C15.1 14 16 13.1 16 12V4C16 2.9 15.1 2 14 2ZM14 6L8 9.5L2 6V4L8 7.5L14 4V6Z" fill="currentColor"/></svg>}
      />

      <Input label="Create Password" name="password" type="password" placeholder="••••••••"
        value={formData.password} onChange={handleChange} required helperText="Must be at least 8 characters."
        icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 6V5C12 2.79 10.21 1 8 1C5.79 1 4 2.79 4 5V6C2.9 6 2 6.9 2 8V13C2 14.1 2.9 15 4 15H12C13.1 15 14 14.1 14 13V8C14 6.9 13.1 6 12 6ZM8 12C6.9 12 6 11.1 6 10C6 8.9 6.9 8 8 8C9.1 8 10 8.9 10 10C10 11.1 9.1 12 8 12ZM5.8 6V5C5.8 3.78 6.78 2.8 8 2.8C9.22 2.8 10.2 3.78 10.2 5V6H5.8Z" fill="currentColor"/></svg>}
      />

      <Button type="submit" variant="primary" size="large" fullWidth loading={loading} onClick={handleSubmit}>
        Register Account
      </Button>

      <div className="text-center mt-6 text-base md:text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" variant="primary" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
          Return to Login
        </Link>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <FormLayout leftPanel={leftPanelContent} rightPanel={rightPanelContent} onSubmit={handleSubmit}/>
      <Footer
        collegeName="RVS College of Engineering & Technology"
        accreditation="© 2024 RVS College of Engineering & Technology. All Rights Reserved. Accredited with NAAC A+ and NBA."
        links={[{ label: 'Privacy Policy', href: '#' }, { label: 'Terms of Service', href: '#' }, { label: 'Contact Us', href: '#' }, { label: 'Accreditation Details', href: '#' }]}
        logos={[{ src: '/icons.svg', alt: 'NAAC Logo' }, { src: '/icons.svg', alt: 'NBA Logo' }]}
      />
    </div>
  );
};

export default RegistrationExample;
