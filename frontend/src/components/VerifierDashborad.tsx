import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "./WalletContext.tsx";
import IdentityABI from "../abis/IdentityVerifier.json";

const IDENTITY_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const BACKEND_URL = "http://localhost:5001";

const VerifierDashboard = () => {
  const { signer, account } = useWallet();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [documentBase64, setDocumentBase64] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [hashMatched, setHashMatched] = useState<boolean | null>(null);
  const [blockchainHash, setBlockchainHash] = useState("");

  const fetchPending = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/documents/pending`);
      const data = await res.json();
      if (res.ok) {
        setPendingRequests(data.pending);
      }
    } catch (err) {
      console.error("Error fetching pending requests", err);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchDocument = async (address: string) => {
    try {
      setLoading(true);
      setHashMatched(null);
      setBlockchainHash("");
      
      const res = await fetch(`${BACKEND_URL}/api/documents/${address}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to fetch document");
      
      setDocumentBase64(data.documentBase64);
      setSelectedUser(address);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyHash = async () => {
    if (!documentBase64 || !selectedUser) return;
    try {
      setLoading(true);

      // 1. Fetch on-chain hash
      const identityContract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, signer);
      const identityData = await identityContract.identities(selectedUser);
      const onChainHash = identityData.document_hash;
      setBlockchainHash(onChainHash);

      // 2. Hash the local document data
      // Convert base64 back to Uint8Array
      const base64Data = documentBase64.split(',')[1];
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const localHash = ethers.keccak256(ethers.hexlify(bytes));

      if (localHash === onChainHash) {
        setHashMatched(true);
      } else {
        setHashMatched(false);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to verify hash against blockchain.");
    } finally {
      setLoading(false);
    }
  };

  const grantVerification = async () => {
    if (!selectedUser || !hashMatched) return alert("Must verify hash first!");
    try {
      setLoading(true);

      // 1. On-Chain Approval
      const identityContract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, signer);
      const tx = await identityContract.verifyIdentity(selectedUser);
      await tx.wait();

      // 2. Database Sync
      await fetch(`${BACKEND_URL}/api/documents/${selectedUser}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Verified', verifierAddress: account })
      });

      alert("User verified successfully!");
      setDocumentBase64(null);
      setSelectedUser("");
      fetchPending();
    } catch (error: any) {
      console.error(error);
      if (error.code === 'ACTION_REJECTED' || (error.message && error.message.toLowerCase().includes("user rejected"))) {
        alert("Transaction cancelled by user.");
      } else {
        alert("Verification failed: " + (error.reason || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const rejectUser = async (addressToReject: string) => {
    if (!addressToReject) return alert("Please select a pending request.");
    try {
      setLoading(true);

      // 1. On-Chain Rejection
      const identityContract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, signer);
      const tx = await identityContract.rejectIdentity(addressToReject);
      await tx.wait();

      // 2. Database Sync
      await fetch(`${BACKEND_URL}/api/documents/${addressToReject}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected', verifierAddress: account })
      });

      alert("User request rejected successfully!");
      if (addressToReject === selectedUser) {
        setDocumentBase64(null);
        setSelectedUser("");
      }
      fetchPending();
    } catch (error: any) {
      console.error(error);
      if (error.code === 'ACTION_REJECTED' || (error.message && error.message.toLowerCase().includes("user rejected"))) {
        alert("Transaction cancelled by user.");
      } else {
        alert("Rejection failed: " + (error.reason || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const revokeUser = async (addressToRevoke: string) => {
    if (!addressToRevoke) return alert("Please select or enter an address.");
    try {
      setLoading(true);

      // 1. On-Chain Revocation
      const identityContract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, signer);
      const tx = await identityContract.revokeIdentity(addressToRevoke);
      await tx.wait();

      // 2. Database Sync
      await fetch(`${BACKEND_URL}/api/documents/${addressToRevoke}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Revoked', verifierAddress: account })
      });

      alert("User identity revoked successfully!");
      if (addressToRevoke === selectedUser) {
        setDocumentBase64(null);
        setSelectedUser("");
      }
      fetchPending();
    } catch (error: any) {
      console.error(error);
      if (error.code === 'ACTION_REJECTED' || (error.message && error.message.toLowerCase().includes("user rejected"))) {
        alert("Transaction cancelled by user.");
      } else {
        alert("Revocation failed: " + (error.reason || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <header className="mb-8">
        <h2 style={{ margin: 0, color: 'var(--accent-glow)' }}>Verifier Portal</h2>
        <p>Restricted access: Authorized Verification Agents Only.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Left Column: Pending List */}
        <div className="glass-card">
          <h3 style={{ color: 'var(--accent-glow)' }}>Pending Requests</h3>
          <p className="mb-4" style={{ fontSize: '0.9rem' }}>Click an address to securely fetch and decrypt their KYC document.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingRequests.length === 0 ? (
              <p style={{ opacity: 0.7 }}>No pending requests.</p>
            ) : (
              pendingRequests.map((req, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '0.75rem', 
                    background: selectedUser === req.walletAddress ? 'rgba(6, 182, 212, 0.2)' : 'rgba(0,0,0,0.2)',
                    border: selectedUser === req.walletAddress ? '1px solid var(--accent-glow)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem'
                  }}
                  onClick={() => fetchDocument(req.walletAddress)}
                >
                  {req.walletAddress.substring(0, 8)}...{req.walletAddress.substring(38)}
                  <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '4px' }}>
                    {new Date(req.uploadedAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Document Review Area */}
        <div className="glass-card">
          <h3>Document Verification</h3>
          
          {!selectedUser ? (
            <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
              Select a pending request to begin verification.
            </div>
          ) : (
            <>
              <p style={{ fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Reviewing: <span style={{ color: 'var(--accent-glow)' }}>{selectedUser}</span>
              </p>

              {documentBase64 ? (
                <div style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px', 
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  {documentBase64.startsWith('data:image') ? (
                    <img src={documentBase64} alt="KYC Document" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                  ) : documentBase64.startsWith('data:application/pdf') ? (
                    <iframe src={documentBase64} width="100%" height="400px" title="KYC PDF"></iframe>
                  ) : (
                    <p>Unsupported document format.</p>
                  )}
                </div>
              ) : (
                <p>Loading document...</p>
              )}

              {/* Hash Verification Panel */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0 }}>Cryptographic Proof</h4>
                    <button className="btn-primary" onClick={verifyHash} disabled={loading} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                        {loading ? "Computing..." : "Verify Hash"}
                    </button>
                 </div>
                 {loading && (
                    <div className="processing-bar-container" style={{ marginBottom: '1rem' }}>
                      <div className="processing-bar"></div>
                    </div>
                 )}
                 
                 {blockchainHash && (
                    <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', opacity: 0.8, wordBreak: 'break-all' }}>
                        On-Chain Hash: {blockchainHash}
                    </div>
                 )}

                 {hashMatched !== null && (
                    <div style={{ 
                        marginTop: '1rem', 
                        padding: '0.5rem', 
                        borderRadius: '4px',
                        background: hashMatched ? 'rgba(72, 187, 120, 0.2)' : 'rgba(229, 62, 62, 0.2)',
                        color: hashMatched ? '#48bb78' : '#e53e3e',
                        fontWeight: 'bold',
                        textAlign: 'center'
                    }}>
                        {hashMatched ? "✅ Document Cryptographically Verified!" : "❌ HASH MISMATCH DETECTED! Potential Fraud."}
                    </div>
                 )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn-primary" 
                    onClick={() => rejectUser(selectedUser)} 
                    disabled={loading}
                    style={{ backgroundColor: 'transparent', border: '1px solid #e53e3e', color: '#e53e3e' }}
                  >
                    Reject Request
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={grantVerification} 
                    disabled={loading || !hashMatched}
                  >
                    {loading ? "Processing..." : "Grant Verification"}
                  </button>
                </div>
                {loading && (
                  <div className="processing-bar-container" style={{ width: '100%' }}>
                    <div className="processing-bar"></div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>

      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <h3 style={{ color: '#e53e3e' }}>Manual Revocation</h3>
        <p className="mb-4">Enter a user's wallet address to manually revoke their verified KYC status.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              className="input-field"
              id="revokeAddress"
              placeholder="User Wallet Address (0x...)" 
              style={{ flex: '1' }}
            />
            <button 
              className="btn-primary" 
              onClick={() => {
                  const val = (document.getElementById('revokeAddress') as HTMLInputElement).value;
                  revokeUser(val);
              }} 
              disabled={loading}
              style={{ backgroundColor: loading ? 'var(--bg-surface-hover)' : '#e53e3e', color: 'white' }}
            >
              {loading ? "Processing..." : "Revoke Identity"}
            </button>
          </div>
          {loading && (
            <div className="processing-bar-container" style={{ width: '100%' }}>
              <div className="processing-bar"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifierDashboard;