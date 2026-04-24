import { useState } from "react";
import { useWallet } from "./components/WalletContext.tsx";
import AdminDashboard from "./components/AdminDashboard.tsx";
import VerifierDashboard from "./components/VerifierDashborad.tsx";
import UserDashboard from "./components/UserDashborad.tsx";
import AuctionPanel from "./components/AuctionPanel.tsx";
import IdentityRecordPanel from "./components/IdentityRecordPanel.tsx";
import './App.css';

// A simple component to render the floating background bubbles
const Bubbles = () => (
  <div className="bubbles">
    {[...Array(15)].map((_, i) => {
      const size = Math.random() * 80 + 20;
      const left = Math.random() * 100;
      const delay = Math.random() * 15;
      const duration = Math.random() * 10 + 10;
      return (
        <div
          key={i}
          className="bubble"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`
          }}
        />
      );
    })}
  </div>
);



function App() {
  const { account, role, connectWallet } = useWallet();
  const [activeView, setActiveView] = useState<"dashboard" | "auction" | "identity">("dashboard");

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Unauthenticated Landing Page (Frutiger Aero Style)
  if (!account) {
    return (
      <div className="app-container" style={{ overflowX: 'hidden' }}>
        <Bubbles />
        
        {/* Navbar */}
        <nav className="top-nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
          <div className="nav-brand">
            <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>⬡</span>
            Kredent
          </div>

          <button className="btn-primary" onClick={connectWallet}>
            Connect Wallet
          </button>
        </nav>
        
        <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '4rem 2rem', width: '100%', position: 'relative', zIndex: 10 }}>
          
          {/* Hero Section */}
          <div style={{ textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h1 className="text-gradient" style={{ fontSize: '5rem', lineHeight: 1.1, marginBottom: '1.5rem', animation: 'fadeUp 0.8s ease forwards' }}>
              Make Your Identity <br/> Verification Secure
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#334155', maxWidth: '600px', marginBottom: '3rem', animation: 'fadeUp 0.8s ease 0.2s forwards', opacity: 0 }}>
              Upload your identity document once, verify it infinitely. AES-256 encrypted off-chain, immutable verification on-chain.
            </p>
            <div style={{ display: 'flex', gap: '1rem', animation: 'fadeUp 0.8s ease 0.4s forwards', opacity: 0 }}>
              <button className="btn-primary" onClick={connectWallet} style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
                Get Started
              </button>
            </div>
          </div>

          {/* Featured Archive / Visual Gallery Grid */}
          <div style={{ textAlign: 'center', marginTop: '4rem', marginBottom: '3rem' }}>
             <h2 className="text-gradient" style={{ fontSize: '2.5rem' }}>Platform Statistics</h2>
             <p style={{ maxWidth: '600px', margin: '0 auto' }}>Explore securely verified metrics from the Kredent identity network.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '6rem' }}>
            
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <h3 style={{ fontSize: '1.75rem', margin: '0.5rem 0', color: '#0f172a' }}>Zero-Knowledge KYC</h3>
              <p style={{ color: '#059669', fontSize: '0.9rem', fontWeight: 700, margin: '0 0 1rem 0' }}>14,532 Identities Secured</p>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Complete privacy preservation through cryptographic hashes.</p>
              <a href="#" style={{ display: 'block', marginTop: '1.5rem', fontSize: '1rem', fontWeight: 600 }}>Learn More →</a>
            </div>

            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <h3 style={{ fontSize: '1.75rem', margin: '0.5rem 0', color: '#0f172a' }}>Decentralized Auditing</h3>
              <p style={{ color: '#059669', fontSize: '0.9rem', fontWeight: 700, margin: '0 0 1rem 0' }}>8,421 Active Verifiers</p>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>A robust network of trusted authorities validating documents.</p>
              <a href="#" style={{ display: 'block', marginTop: '1.5rem', fontSize: '1rem', fontWeight: 600 }}>Learn More →</a>
            </div>

            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <h3 style={{ fontSize: '1.75rem', margin: '0.5rem 0', color: '#0f172a' }}>Lightning Fast</h3>
              <p style={{ color: '#059669', fontSize: '0.9rem', fontWeight: 700, margin: '0 0 1rem 0' }}>3.2s Average Time</p>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Get verified instantly after manual review approval.</p>
              <a href="#" style={{ display: 'block', marginTop: '1.5rem', fontSize: '1rem', fontWeight: 600 }}>Learn More →</a>
            </div>

          </div>

          {/* Contribution CTA Section */}
          <div className="glass-card" style={{ padding: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4rem', borderTop: '2px solid rgba(255,255,255,0.9)', boxShadow: '0 20px 50px rgba(2, 132, 199, 0.2), inset 0 0 40px rgba(255,255,255,0.5)' }}>
             <div style={{ flex: 1 }}>
               <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Join Kredent Today</h2>
               <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>Get notified about platform updates, new verifier partnerships, and decentralization milestones.</p>
               
               <div style={{ display: 'flex', gap: '1rem' }}>
                 <input type="email" className="input-field" placeholder="Enter your email address..." style={{ maxWidth: '400px', background: 'rgba(255,255,255,0.9)' }} />
                 <button className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Subscribe</button>
               </div>
             </div>
             <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{ fontSize: '8rem', filter: 'drop-shadow(0 20px 30px rgba(2, 132, 199, 0.4))', animation: 'floatUp 6s infinite alternate ease-in-out' }}>
                  ⬡
                </div>
             </div>
          </div>

        </main>
        
        <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.6)', color: '#64748b', position: 'relative', zIndex: 10 }}>
          <p style={{ margin: 0, fontWeight: 500 }}>&copy; {new Date().getFullYear()} Kredent. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  // Authenticated View (Dashboards - utilizing the same CSS classes for the Aero theme)
  return (
    <div className="app-container">
      <Bubbles />
      
      {/* Authenticated Navbar */}
      <nav className="top-nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="nav-brand">
          <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>⬡</span>
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
          <span style={{ fontSize: '0.95rem', color: '#334155', fontWeight: 600 }}>
            {formatAddress(account)}
          </span>
          <span className="badge">
            {role || 'USER'}
          </span>
        </div>
      </nav>

      {/* Dashboard Main Content Area */}
      <main style={{ padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%', flex: 1, position: 'relative', zIndex: 10 }}>
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

      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.6)', color: '#64748b', position: 'relative', zIndex: 10 }}>
        <p style={{ margin: 0, fontWeight: 500 }}>&copy; {new Date().getFullYear()} Kredent. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;