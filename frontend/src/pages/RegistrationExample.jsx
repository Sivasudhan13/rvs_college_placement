import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Input, Select, Button, Card, Logo, FormLayout, Footer, Link } from '../components';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/logo/logo.jpeg';

const RegistrationExample = () => {
  const navigate     = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '', idCardNumber: '', phoneNumber: '',
    department: '', institutionalEmail: '', password: '', batch: '',
  });
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const batches = Array.from({ length: 7 }, (_, i) => {
    const start = currentYear - 3 + i;
    return { value: `${start}-${start + 4}`, label: `${start}-${start + 4}` };
  });

  const departments = [
    { value: 'cse',   label: 'Computer Science Engineering' },
    { value: 'it',    label: 'Information Technology' },
    { value: 'ece',   label: 'Electronics & Communication Engineering' },
    { value: 'eee',   label: 'Electrical & Electronics Engineering' },
    { value: 'me',    label: 'Mechanical Engineering' },
    { value: 'ce',    label: 'Civil Engineering' },
    { value: 'mca',   label: 'Master of Computer Applications' },
    { value: 'mba',   label: 'Master of Business Administration' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fullName, idCardNumber, phoneNumber, department, institutionalEmail, password } = formData;

    if (!fullName || !idCardNumber || !department || !institutionalEmail || !password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (phoneNumber && !/^[0-9+\-\s()]{7,15}$/.test(phoneNumber)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      await register({
        name:          fullName,
        studentId:     idCardNumber,   // studentId = ID Card Number
        idCardNumber,
        admissionNumber: idCardNumber, // legacy alias
        phoneNumber,
        email:         institutionalEmail,
        department,
        password,
        batch:         formData.batch,
      });
      toast.success('Registration successful! Welcome aboard.');
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        data.errors.forEach((e) => toast.error(e.message));
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
      <div className="mb-6">
        <h2 className="text-3xl md:text-2xl font-bold text-gray-800 mb-2">Student Registration</h2>
        <p className="text-base md:text-sm text-primary">Fill in your details to create an account.</p>
      </div>

      {/* Full Name */}
      <Input
        label="Full Name" name="fullName" placeholder="e.g., Arun Kumar"
        value={formData.fullName} onChange={handleChange} required
        icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 8C10.21 8 12 6.21 12 4S10.21 0 8 0 4 1.79 4 4s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg>}
      />

      {/* ID Card Number + Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
        <Input
          label="ID Card Number" name="idCardNumber" placeholder="e.g., 21BME001"
          value={formData.idCardNumber} onChange={handleChange} required
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="5.5" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8.5 6.5h4M8.5 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>}
        />
        <Input
          label="Phone Number" name="phoneNumber" placeholder="e.g., 9876543210" type="tel"
          value={formData.phoneNumber} onChange={handleChange}
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 1h3l1.5 3.5-1.75 1.25C6.8 8.1 7.9 9.2 9.25 9.25L10.5 7.5 14 9v3a1 1 0 0 1-1 1C6.27 13 2 8.73 2 2a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        />
      </div>

      {/* Department + Batch */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
        <Select
          label="Department" name="department" placeholder="Select Department"
          value={formData.department} onChange={handleChange} options={departments} required
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 0L0 6l8 6 6-4.73V12h2V6L8 0z" fill="currentColor" opacity=".8"/></svg>}
        />
        <Select
          label="Batch" name="batch" placeholder="Select Batch Year"
          value={formData.batch} onChange={handleChange} options={batches} required
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M1 6h14M5 2v4M11 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
        />
      </div>

      {/* Email */}
      <Input
        label=" Email" name="institutionalEmail" type="email"
        placeholder="student@gmail.com"
        value={formData.institutionalEmail} onChange={handleChange} required
        icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 2H2C.9 2 .01 2.9.01 4L0 12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 4l-6 3.5L2 6V4l6 3.5L14 4v2z" fill="currentColor"/></svg>}
      />

      {/* Password */}
      <Input
        label="Create Password" name="password" type="password" placeholder="Min 8 characters"
        value={formData.password} onChange={handleChange} required
        helperText="Must be at least 8 characters."
        icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 6V5a4 4 0 0 0-8 0v1H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2zM8 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm2.8-5H5.2V5a2.8 2.8 0 1 1 5.6 0v1z" fill="currentColor"/></svg>}
      />

      <Button type="submit" variant="primary" size="large" fullWidth loading={loading} onClick={handleSubmit}>
        Register Account
      </Button>

      <div className="text-center mt-6 text-base md:text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" variant="primary" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
          Sign In
        </Link>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <FormLayout leftPanel={leftPanelContent} rightPanel={rightPanelContent} onSubmit={handleSubmit} />
      <Footer
        collegeName="RVS College of Engineering & Technology"
        accreditation="© 2024 RVSCET. All Rights Reserved. Accredited with NAAC A+ and NBA."
        links={[
          { label: 'Privacy Policy', href: '#' },
          { label: 'Terms of Service', href: '#' },
          { label: 'Contact Us', href: '#' },
        ]}
        logos={[]}
      />
    </div>
  );
};

export default RegistrationExample;
