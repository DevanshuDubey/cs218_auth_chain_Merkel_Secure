import { useWallet } from "./components/WalletContext.tsx";
import AdminDashboard from "./components/AdminDashboard.tsx";
import VerifierDashboard from "./components/VerifierDashborad.tsx";
import UserDashboard from "./components/UserDashborad.tsx";
import './App.css';

function App() {
  const { account, role, connectWallet } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (!account) {
    return (
      <div className="app-container">
        <nav className="top-nav">
          <h1 className="nav-brand">Nyaya Secure</h1>
          <button className="btn-primary" onClick={connectWallet}>
            Connect Wallet
          </button>
        </nav>
        
        <main style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', letterSpacing: '-1px' }}>
            Decentralized Trust Protocol
          </h1>
          <p style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 4rem', color: 'var(--text-muted)' }}>
            Secure your identity and participate in exclusive, verified interactions with cryptographic certainty.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
            <div className="glass-card">
              <h2 style={{ color: 'var(--accent-gold)', fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>10k+</h2>
              <p style={{ margin: 0 }}>Identities Verified</p>
            </div>
            <div className="glass-card">
              <h2 style={{ color: 'var(--accent-gold)', fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>450+</h2>
              <p style={{ margin: 0 }}>Active Auctions</p>
            </div>
            <div className="glass-card">
              <h2 style={{ color: 'var(--accent-gold)', fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>100%</h2>
              <p style={{ margin: 0 }}>On-Chain Security</p>
            </div>
          </div>

          <button className="btn-primary" onClick={connectWallet} style={{ fontSize: '1.25rem', padding: '16px 32px' }}>
            Connect Your Wallet
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav className="top-nav">
        <h1 className="nav-brand">Nyaya Secure</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            {formatAddress(account)}
          </span>
          <span className="badge" style={{ borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}>
            {role || 'USER'}
          </span>
        </div>
      </nav>

      <main style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        {role === "ADMIN" && <AdminDashboard />}
        {role === "VERIFIER" && <VerifierDashboard />}
        {(!role || role === "USER") && <UserDashboard />}
      </main>
    </div>
  );
}

export default App;