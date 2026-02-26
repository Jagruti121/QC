import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { MdAdminPanelSettings, MdSchool } from "react-icons/md";

const ADMIN_SECRET_KEY = "QC-ADMIN-2026"; // Hardcoded Admin Key

const Login = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Admin State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');

  // Faculty State
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyPassword, setFacultyPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in via LocalStorage
  useEffect(() => {
    if (localStorage.getItem('userRole') === 'Admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (localStorage.getItem('userRole') === 'Faculty') {
      navigate('/faculty/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (adminKey !== ADMIN_SECRET_KEY) {
      setError("Invalid Admin Key.");
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, "admins"), where("email", "==", adminEmail));
      const snapshot = await getDocs(q);

      if (snapshot.empty) throw new Error("Admin email not found.");

      let adminData = null;
      snapshot.forEach(doc => {
        if (doc.data().password === adminPassword) adminData = doc.data();
      });

      if (!adminData) throw new Error("Incorrect Password.");

      // Success
      localStorage.setItem('userRole', 'Admin');
      localStorage.setItem('userEmail', adminData.email);
      localStorage.setItem('userName', adminData.fullName);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFacultyLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const q = query(collection(db, "faculties"), where("email", "==", facultyEmail));
      const snapshot = await getDocs(q);

      if (snapshot.empty) throw new Error("Email not found.");

      let facultyData = null;
      snapshot.forEach(doc => {
        if (doc.data().password === facultyPassword) facultyData = doc.data();
      });

      if (!facultyData) throw new Error("Incorrect Password.");

      localStorage.setItem('userRole', 'Faculty');
      localStorage.setItem('userEmail', facultyData.email);
      localStorage.setItem('userName', facultyData.name);
      navigate('/faculty/dashboard', { replace: true });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="website-header">
        <h1 className="website-title">Quick Campus</h1>
        <p className="website-subtitle">Secure Portal Login</p>
      </div>

      {error && <div style={{ color: 'white', background: '#ef4444', padding: '10px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px', width: '100%', maxWidth: '800px' }}>{error}</div>}

      <div className="cards-container" style={{ alignItems: 'flex-start' }}>

        {/* ADMIN LOGIN CARD */}
        <div className="login-card">
          <MdAdminPanelSettings size={48} color="#4F46E5" style={{ marginBottom: '1rem' }} />
          <h2 className="card-title">Login as Admin</h2>
          <form onSubmit={handleAdminLogin} style={{ width: '100%' }}>
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
            </div>
            <div className="input-group" style={{ marginTop: '10px' }}>
              <label style={{ color: '#ef4444' }}>Admin Security Key</label>
              <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} required style={{ border: '1px solid #ef4444' }} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1.5rem', width: '100%' }}>
              {loading ? "Verifying..." : "Secure Admin Login"}
            </button>
          </form>
        </div>

        {/* FACULTY LOGIN CARD */}
        <div className="login-card">
          <MdSchool size={48} color="#4F46E5" style={{ marginBottom: '1rem' }} />
          <h2 className="card-title">Login as Faculty</h2>
          <form onSubmit={handleFacultyLogin} style={{ width: '100%' }}>
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" value={facultyEmail} onChange={(e) => setFacultyEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" value={facultyPassword} onChange={(e) => setFacultyPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1.5rem', width: '100%' }}>
              {loading ? "Verifying..." : "Secure Faculty Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;