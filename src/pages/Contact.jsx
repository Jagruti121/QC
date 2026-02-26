import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Phone } from 'lucide-react';

const Contact = () => {
    const navigate = useNavigate();

    return (
        <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* NAVBAR */}
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 50px', backgroundColor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 50 }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#4f46e5', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <GraduationCap /> Quick Campus
                </h1>
                <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                    <Link to="/" style={{ textDecoration: 'none', color: '#475569', fontWeight: '600' }}>Home</Link>
                    <Link to="/about" style={{ textDecoration: 'none', color: '#475569', fontWeight: '600' }}>About Us</Link>
                    <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: '700', fontSize: '16px', cursor: 'pointer' }}>Login</button>
                </div>
            </nav>

            <section style={{ padding: '80px 20px', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#1e293b' }}>Contact Us</h2>
                    <div style={{ width: '80px', height: '4px', backgroundColor: '#4f46e5', margin: '15px auto' }}></div>
                    <p style={{ color: '#64748b', fontSize: '18px' }}>Get in touch with the creators and mentors of Quick Campus.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Jagruti Contact */}
                    <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#94a3b8', letterSpacing: '1px' }}>CREATOR & DEVELOPER</p>
                            <h3 style={{ margin: '5px 0', fontSize: '22px', color: '#1e293b' }}>Jagruti Rajan Morvekar</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4f46e5', fontWeight: 'bold', fontSize: '18px' }}>
                            <Phone size={20} /> [+91 93216 32938]
                        </div>
                    </div>

                    {/* Om Contact */}
                    <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#94a3b8', letterSpacing: '1px' }}>CREATOR & DEVELOPER</p>
                            <h3 style={{ margin: '5px 0', fontSize: '22px', color: '#1e293b' }}>Om Chandrashekhar Murkar</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4f46e5', fontWeight: 'bold', fontSize: '18px' }}>
                            <Phone size={20} /> [+91 91362 34409]
                        </div>
                    </div>

                    {/* Mentor Contact */}
                    <div style={{ backgroundColor: '#eef2ff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #c7d2fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#6366f1', letterSpacing: '1px' }}>PROJECT GUIDE & MENTOR</p>
                            <h3 style={{ margin: '5px 0', fontSize: '22px', color: '#312e81' }}>Asst. Prof. Rajesh Rajgor</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4338ca', fontWeight: 'bold', fontSize: '18px' }}>
                            <Phone size={20} /> [+91 99677 46143]
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
};

export default Contact;
