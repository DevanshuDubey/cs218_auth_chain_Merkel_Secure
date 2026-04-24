import { useState } from "react";
import { useWallet } from "./components/WalletContext.tsx";
import AdminDashboard from "./components/AdminDashboard.tsx";
import VerifierDashboard from "./components/VerifierDashborad.tsx";
import UserDashboard from "./components/UserDashborad.tsx";
import AuctionPanel from "./components/AuctionPanel.tsx";
import IdentityRecordPanel from "./components/IdentityRecordPanel.tsx";
import './App.css';

// SVG components for clean, hand-coded graphics instead of AI images
const BlockchainGraphic = () => (
  <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: "fadeUp 1s ease forwards" }}>
    {/* Base Grid/Platform */}
    <path d="M200 350L50 263.4V136.6L200 50L350 136.6V263.4L200 350Z" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="2" strokeDasharray="4 4" />
    
    {/* Center Node */}
    <g transform="translate(150, 150)">
      <path d="M50 100L0 71.13V28.87L50 0L100 28.87V71.13L50 100Z" fill="url(#grad_center)" stroke="#06B6D4" strokeWidth="2" />
      <path d="M50 50L0 28.87M50 50L100 28.87M50 50V100" stroke="#06B6D4" strokeWidth="2" />
      {/* Glow */}
      <circle cx="50" cy="50" r="40" fill="#06B6D4" filter="blur(20px)" opacity="0.3" />
    </g>

    {/* Satellite Node 1 */}
    <g transform="translate(50, 80) scale(0.6)">
      <path d="M50 100L0 71.13V28.87L50 0L100 28.87V71.13L50 100Z" fill="url(#grad_center)" stroke="#3B82F6" strokeWidth="2" />
      <path d="M50 50L0 28.87M50 50L100 28.87M50 50V100" stroke="#3B82F6" strokeWidth="2" />
    </g>

    {/* Satellite Node 2 */}
    <g transform="translate(250, 80) scale(0.6)">
      <path d="M50 100L0 71.13V28.87L50 0L100 28.87V71.13L50 100Z" fill="url(#grad_center)" stroke="#3B82F6" strokeWidth="2" />
      <path d="M50 50L0 28.87M50 50L100 28.87M50 50V100" stroke="#3B82F6" strokeWidth="2" />
    </g>

    {/* Satellite Node 3 */}
    <g transform="translate(150, 280) scale(0.6)">
      <path d="M50 100L0 71.13V28.87L50 0L100 28.87V71.13L50 100Z" fill="url(#grad_center)" stroke="#3B82F6" strokeWidth="2" />
      <path d="M50 50L0 28.87M50 50L100 28.87M50 50V100" stroke="#3B82F6" strokeWidth="2" />
    </g>

    {/* Connecting Lines */}
    <path d="M100 125L175 165M280 125L225 165M200 280V225" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 4" />
    
    <defs>
      <linearGradient id="grad_center" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0B0E14" />
      </linearGradient>
    </defs>
  </svg>
);

const ChartGraphic = () => (
  <svg className="chart-svg" viewBox="0 0 200 60" preserveAspectRatio="none">
    <defs>
      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(6, 182, 212, 0.4)" />
        <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
      </linearGradient>
    </defs>
    <path d="M0,60 L0,40 C20,40 40,20 60,30 C80,40 100,10 120,20 C140,30 160,0 200,10 L200,60 Z" fill="url(#chartGrad)" />
    <path d="M0,40 C20,40 40,20 60,30 C80,40 100,10 120,20 C140,30 160,0 200,10" fill="none" stroke="#06B6D4" strokeWidth="2" />
  </svg>
);

function App() {
  const { account, role, connectWallet } = useWallet();
  const [activeView, setActiveView] = useState<"dashboard" | "auction" | "identity">("dashboard");

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // If user is not connected, show the highly stylized landing page
  if (!account) {
    return (
      <div className="app-container" style={{ overflowX: 'hidden' }}>
        
        {/* Navbar */}
        <nav className="top-nav" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div className="nav-brand">
            <span className="nav-brand-icon">⬡</span>
            Kredent
          </div>
          
          {/* <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>
            <span style={{ cursor: 'pointer', color: 'var(--text-main)' }}>Platform</span>
            <span style={{ cursor: 'pointer' }}>Solutions</span>
            <span style={{ cursor: 'pointer' }}>Developers</span>
            <span style={{ cursor: 'pointer' }}>Company</span>
          </div> */}

          <button className="btn-primary" onClick={connectWallet}>
            Connect Wallet
          </button>
        </nav>
        
        <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '4rem 2rem', width: '100%' }}>
          
          {/* Hero Section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4rem', minHeight: '60vh' }}>
            <div style={{ flex: 1, maxWidth: '600px' }}>
              <p style={{ color: 'var(--accent-glow)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '1rem', textTransform: 'uppercase' }}>
                Zero-Knowledge Privacy Protocol
              </p>
              <h1 style={{ fontSize: '4.5rem', lineHeight: 1.1, marginBottom: '2rem', animation: 'fadeUp 0.8s ease forwards' }}>
                Make Your Identity <br/> Verification Secure.
              </h1>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '3rem', animation: 'fadeUp 0.8s ease 0.2s forwards', opacity: 0 }}>
                Experience the future of decentralized finance and unified blockchain identity management in one cryptographically secure platform.
              </p>
              <button className="btn-primary" onClick={connectWallet} style={{ fontSize: '1.1rem', padding: '1rem 2.5rem', animation: 'fadeUp 0.8s ease 0.4s forwards', opacity: 0 }}>
                Get Started
              </button>
            </div>
            
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
               <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.1) 0%, transparent 70%)', zIndex: -1 }}></div>
               <BlockchainGraphic />
           
            </div>
          </div> 

          {/* Features Cards Section */}
          <div style={{ textAlign: 'center', marginTop: '6rem', marginBottom: '3rem' }}>
             <h2 style={{ fontSize: '2.5rem' }}>Top Protocol Stats</h2>
             <p style={{ maxWidth: '600px', margin: '0 auto' }}>Leveraging immutable ledger technology to secure thousands of unique user identities globally.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '6rem' }}>
            
            <div className="glass-card card-active" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div className="crypto-card-icon" style={{ color: '#F7931A' }}>₿</div>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Identities Secured</p>
              <h3 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>14,532</h3>
              <p style={{ color: '#34D399', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>▲ +12.4% this week</p>
              <ChartGraphic />
              <a href="#" style={{ display: 'block', marginTop: '1rem', fontSize: '0.9rem' }}>Learn More →</a>
            </div>

            <div className="glass-card card-active" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div className="crypto-card-icon" style={{ color: '#627EEA' }}>Ξ</div>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Active Auctions</p>
              <h3 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>856</h3>
              <p style={{ color: '#34D399', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>▲ +5.2% this week</p>
              <ChartGraphic />
              <a href="#" style={{ display: 'block', marginTop: '1rem', fontSize: '0.9rem' }}>Learn More →</a>
            </div>

            <div className="glass-card card-active" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div className="crypto-card-icon" style={{ color: '#06B6D4' }}>⬡</div>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Network Uptime</p>
              <h3 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>100%</h3>
              <p style={{ color: '#34D399', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>Immutable</p>
              <ChartGraphic />
              <a href="#" style={{ display: 'block', marginTop: '1rem', fontSize: '0.9rem' }}>Learn More →</a>
            </div>

          </div>
          

        </main>
        
        <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', marginTop: 'auto' }}>
          <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} Kredent. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  // Authenticated View
  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Authenticated Navbar */}
      <nav className="top-nav" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-base)' }}>
        <div className="nav-brand">
          <span className="nav-brand-icon">⬡</span>
          Kredent
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={() => setActiveView("dashboard")} 
            className={`btn-secondary ${activeView === "dashboard" ? "active" : ""}`}
          >
            Dashboard
          </button>
          {(!role || role === 'USER') && (
            <button 
              onClick={() => setActiveView("auction")} 
              className={`btn-secondary ${activeView === "auction" ? "active" : ""}`}
            >
              Live Auction
            </button>
          )}
          <button 
            onClick={() => setActiveView("identity")} 
            className={`btn-secondary ${activeView === "identity" ? "active" : ""}`}
          >
            Identity Record
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            {formatAddress(account)}
          </span>
          <span className="badge" style={{ borderColor: 'var(--accent-glow)', color: 'var(--accent-glow)' }}>
            {role || 'USER'}
          </span>
        </div>
      </nav>

      {/* Dashboard Main Content Area */}
      <main style={{ padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%', flex: 1 }}>
        {activeView === "dashboard" && (
          <>
            {role === "ADMIN" && <AdminDashboard />}
            {role === "VERIFIER" && <VerifierDashboard />}
            {(!role || role === "USER") && <UserDashboard />}
          </>
        )}
        {activeView === "auction" && <AuctionPanel />}
        {activeView === "identity" && <IdentityRecordPanel />}
      </main>

      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', marginTop: 'auto' }}>
        <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} Kredent. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;