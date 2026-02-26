import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { X, GraduationCap, ShieldCheck } from 'lucide-react';

// Images
import BannerImg from '../assets/images/Screenshot_26-2-2026_211927_tsdcmumbai.in.jpeg';
import Campus1 from '../assets/images/TSEC-Building.jpeg';
import Campus2 from '../assets/images/Screenshot_26-2-2026_231037_www.bing.com.jpeg';
import Campus3 from '../assets/images/library.jpg';
import Campus4 from '../assets/images/cc2.jpg';
import Campus5 from '../assets/images/e-library.jpeg';
import Campus6 from '../assets/images/smartclassroom.jpg';

const ADMIN_SECRET_KEY = "QC-ADMIN-2026"; // Hardcoded Admin Key

const Home = () => {
  const navigate = useNavigate();
  const [showSignUp, setShowSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '', password: '', confirmPassword: '', adminKey: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return alert("Passwords do not match!");
    if (formData.adminKey !== ADMIN_SECRET_KEY) return alert("Invalid Admin Key! You are not authorized to create an Admin account.");

    setLoading(true);
    try {
      // Check if admin already exists
      const q = query(collection(db, "admins"), where("email", "==", formData.email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        alert("Admin with this email already exists.");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "admins"), {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        password: formData.password, // In production, hash this
        role: "Admin",
        createdAt: new Date().toISOString()
      });

      alert("Admin Account Created Successfully! You can now log in.");
      setShowSignUp(false);

      // Automatically redirect to login page after successful signup
      navigate('/login');
    } catch (error) {
      alert("Error creating account: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* NAVBAR */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 50px', backgroundColor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 50 }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#4f46e5', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <GraduationCap /> Quick Campus
        </h1>
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          <Link to="/about" style={{ textDecoration: 'none', color: '#475569', fontWeight: '600' }}>About Us</Link>
          <Link to="/contact" style={{ textDecoration: 'none', color: '#475569', fontWeight: '600' }}>Contact</Link>
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: '700', fontSize: '16px', cursor: 'pointer' }}>Login</button>
          <button onClick={() => setShowSignUp(true)} style={{ backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)' }}>
            Sign Up (Admin)
          </button>
        </div>
      </nav>

      {/* COLLEGE BANNER IMAGE */}
      <header style={{ width: '100%', backgroundColor: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px 0' }}>
        <img
          src={BannerImg}
          alt="ZSCT's Thakur Shyamnarayan Degree College Banner"
          style={{ width: '90%', maxWidth: '1200px', maxHeight: '250px', objectFit: 'contain', display: 'block' }}
        />
      </header>

      {/* PHOTO SCROLLING MARQUEE (Images only) */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap', backgroundColor: '#f1f5f9', padding: '40px 0' }}>
        <div style={{ display: 'inline-block', animation: 'scrollLeft 40s linear infinite' }}>
          {[Campus1, Campus2, Campus3, Campus4, Campus5, Campus6].map((imgSrc, idx) => (
            <img key={idx} src={imgSrc} alt={`Campus ${idx + 1}`} style={{ width: '600px', height: '400px', objectFit: 'cover', borderRadius: '16px', margin: '0 20px', display: 'inline-block', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
          ))}
          {/* Duplicated for seamless scrolling */}
          {[Campus1, Campus2, Campus3, Campus4, Campus5, Campus6].map((imgSrc, idx) => (
            <img key={`dup-${idx}`} src={imgSrc} alt={`Campus ${idx + 1}`} style={{ width: '600px', height: '400px', objectFit: 'cover', borderRadius: '16px', margin: '0 20px', display: 'inline-block', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
          ))}
        </div>
      </div>

      {/* FOOTER / MENTOR MARQUEE (Repeated to fill blank space) */}
      <footer style={{ backgroundColor: '#fef3c7', padding: '16px 0', borderTop: '1px solid #fde68a', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: 'auto' }}>
        <div style={{ display: 'inline-block', animation: 'scrollLeft 20s linear infinite', color: '#b45309', fontWeight: '800', fontSize: '18px', letterSpacing: '1px' }}>
          ⭐ GUIDE & MENTOR: ASSISTANT PROFESSOR RAJESH RAJGOR ⭐ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          ⭐ GUIDE & MENTOR: ASSISTANT PROFESSOR RAJESH RAJGOR ⭐ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          ⭐ GUIDE & MENTOR: ASSISTANT PROFESSOR RAJESH RAJGOR ⭐ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          ⭐ GUIDE & MENTOR: ASSISTANT PROFESSOR RAJESH RAJGOR ⭐ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </div>
      </footer>

      {/* SIGN UP MODAL */}
      {showSignUp && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', width: '450px', padding: '30px', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
            <button onClick={() => setShowSignUp(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck color="#4f46e5" /> Admin Registration
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '25px' }}>Authorized personnel only.</p>

            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" name="fullName" placeholder="Full Name" required value={formData.fullName} onChange={handleInputChange} style={inputStyle} />
              <input type="tel" name="phone" placeholder="Phone Number" required value={formData.phone} onChange={handleInputChange} style={inputStyle} />
              <input type="email" name="email" placeholder="Email Address" required value={formData.email} onChange={handleInputChange} style={inputStyle} />
              <input type="password" name="password" placeholder="Password" required value={formData.password} onChange={handleInputChange} style={inputStyle} />
              <input type="password" name="confirmPassword" placeholder="Confirm Password" required value={formData.confirmPassword} onChange={handleInputChange} style={inputStyle} />

              <div style={{ borderTop: '1px solid #e2e8f0', margin: '10px 0' }}></div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#ef4444' }}>REQUIRED AUTHORIZATION KEY</label>
              <input type="password" name="adminKey" placeholder="Enter Admin Secret Key" required value={formData.adminKey} onChange={handleInputChange} style={{ ...inputStyle, border: '2px solid #ef4444', backgroundColor: '#fef2f2' }} />

              <button type="submit" disabled={loading} style={{ marginTop: '10px', backgroundColor: '#4f46e5', color: 'white', padding: '14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
                {loading ? "Creating Account..." : "Create Admin Account"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Global Animation Styles */}
      <style>{`
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

const inputStyle = {
  width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
};

export default Home;