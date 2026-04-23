import { useState } from "react";
import { useWallet } from "./components/WalletContext.tsx";
import AdminDashboard from "./components/AdminDashboard.tsx";
import VerifierDashboard from "./components/VerifierDashborad.tsx";
import UserDashboard from "./components/UserDashborad.tsx";
import AuctionPanel from "./components/AuctionPanel.tsx";
import IdentityRecordPanel from "./components/IdentityRecordPanel.tsx";
import './App.css';

function App() {
  const { account, role, connectWallet } = useWallet();
  const [activeView, setActiveView] = useState<"dashboard" | "auction" | "identity">("dashboard");

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (!account) {
    return (
      <div className="app-container" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>

        <nav className="top-nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
          <h1 className="nav-brand">Identigate</h1>
          <button className="btn-primary" onClick={connectWallet}>
            Connect Wallet
          </button>
        </nav>
        
        <main style={{ padding: '6rem 2rem 4rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center', flex: 1, zIndex: 1, position: 'relative' }}>
          <h1 className="hero-title">
            Decentralized Trust Protocol
          </h1>
          <p className="hero-subtitle">
            Secure your identity and participate in exclusive, verified interactions with cryptographic certainty on the blockchain.
          </p>

          <button className="btn-primary" onClick={connectWallet} style={{ fontSize: '1.25rem', padding: '16px 32px', marginBottom: '4rem', animation: 'fadeUp 0.8s ease 0.3s forwards', opacity: 0 }}>
            Connect Your Wallet
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '4rem', animation: 'fadeUp 0.8s ease 0.4s forwards', opacity: 0 }}>
            <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
              <h2 style={{ color: 'var(--accent-gold)', fontSize: '3rem', margin: '0 0 0.5rem 0', fontFamily: 'var(--font-heading)' }}>10k+</h2>
              <p style={{ margin: 0, fontWeight: 500 }}>Identities Verified</p>
            </div>
            <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
              <h2 style={{ color: 'var(--accent-gold)', fontSize: '3rem', margin: '0 0 0.5rem 0', fontFamily: 'var(--font-heading)' }}>450+</h2>
              <p style={{ margin: 0, fontWeight: 500 }}>Active Auctions</p>
            </div>
            <div className="glass-card" style={{ padding: '2.5rem 2rem' }}>
              <h2 style={{ color: 'var(--accent-gold)', fontSize: '3rem', margin: '0 0 0.5rem 0', fontFamily: 'var(--font-heading)' }}>100%</h2>
              <p style={{ margin: 0, fontWeight: 500 }}>On-Chain Security</p>
            </div>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Zero-Knowledge Security</h3>
              <p>Your actual document is heavily encrypted off-chain. Only a cryptographic hash is permanently settled on the blockchain.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚖️</div>
              <h3>Gated DeFi Auctions</h3>
              <p>Participate in high-stakes financial instruments knowing every counterparty has been cryptographically vetted.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Public Verifiability</h3>
              <p>Anyone can query the blockchain to verify an identity status without ever exposing underlying PII data.</p>
            </div>
          </div>
        </main>
        
        <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', marginTop: 'auto', zIndex: 1, position: 'relative', background: 'rgba(2, 6, 23, 0.8)' }}>
          <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} Identigate. All rights reserved.</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>Powered by Blockchain Security</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <nav className="top-nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <h1 className="nav-brand" style={{ margin: 0 }}>Identigate</h1>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            onClick={() => setActiveView("dashboard")} 
            className={activeView === "dashboard" ? "btn-primary" : "btn-secondary"}
            style={activeView !== "dashboard" ? { background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '8px 16px', fontSize: '0.9rem' } : { padding: '8px 16px', fontSize: '0.9rem' }}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveView("auction")} 
            className={activeView === "auction" ? "btn-primary" : "btn-secondary"}
            style={activeView !== "auction" ? { background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '8px 16px', fontSize: '0.9rem' } : { padding: '8px 16px', fontSize: '0.9rem' }}
          >
            Live Auction
          </button>
          <button 
            onClick={() => setActiveView("identity")} 
            className={activeView === "identity" ? "btn-primary" : "btn-secondary"}
            style={activeView !== "identity" ? { background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '8px 16px', fontSize: '0.9rem' } : { padding: '8px 16px', fontSize: '0.9rem' }}
          >
            Identity Record
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            {formatAddress(account)}
          </span>
          <span className="badge" style={{ borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}>
            {role || 'USER'}
          </span>
        </div>
      </nav>

      <main style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%', flex: 1, zIndex: 1, position: 'relative' }}>
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

      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', marginTop: 'auto', zIndex: 1, position: 'relative', background: 'rgba(2, 6, 23, 0.8)' }}>
        <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} Identigate. All rights reserved.</p>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>Powered by Blockchain Security</p>
      </footer>
    </div>
  );
}

export default App;