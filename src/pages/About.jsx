import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Users } from 'lucide-react';

const About = () => {
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
                    <Link to="/contact" style={{ textDecoration: 'none', color: '#475569', fontWeight: '600' }}>Contact</Link>
                    <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: '700', fontSize: '16px', cursor: 'pointer' }}>Login</button>
                </div>
            </nav>

            <section style={{ padding: '80px 20px', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#1e293b' }}>About Quick Campus</h2>
                    <div style={{ width: '80px', height: '4px', backgroundColor: '#4f46e5', margin: '15px auto' }}></div>
                </div>

                <div style={{ display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <p style={{ fontSize: '18px', color: '#475569', lineHeight: '1.8', marginBottom: '20px' }}>
                            Quick Campus is an advanced automated academic management system designed to streamline college operations, dynamic exam allocations, live attendance tracking, and AI-assisted official notice generation.
                        </p>
                        <p style={{ fontSize: '18px', color: '#475569', lineHeight: '1.8' }}>
                            Proudly developed by TY BSc Computer Science students, this platform aims to bring cutting-edge digital transformation to our campus infrastructure.
                        </p>
                    </div>
                    <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', marginBottom: '20px' }}><Users color="#4f46e5" /> The Team</h3>

                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#94a3b8', letterSpacing: '1px' }}>CREATORS & DEVELOPERS</p>
                            <p style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: '700', color: '#334155' }}>Jagruti Rajan Morvekar</p>
                            <p style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: '700', color: '#334155' }}>Om Chandrashekhar Murkar</p>
                        </div>

                        <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#94a3b8', letterSpacing: '1px' }}>PROJECT GUIDE</p>
                            <p style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: '700', color: '#4f46e5' }}>Asst. Prof. Rajesh Rajgor</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
