import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "./WalletContext.tsx";
import IdentityABI from "../abis/IdentityVerifier.json";

const IDENTITY_ADDR = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const STATUS_MAP = ["Not Registered", "Pending", "Verified", "Revoked", "Rejected"];

const IdentityRecordPanel = () => {
  const { signer } = useWallet();
  const [searchAddress, setSearchAddress] = useState("");
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchRecord = async () => {
    if (!signer || !searchAddress) return;
    try {
      setLoading(true);
      setHasSearched(true);
      const contract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, signer);
      const result = await contract.getIdentityRecord(searchAddress);
      
      setRecord({
        documentHash: result[0],
        status: Number(result[1]),
        verifiedBy: result[2],
        timestamp: Number(result[3])
      });
    } catch (err) {
      console.error("Error fetching identity record:", err);
      setRecord(null);
    } finally {
      setLoading(false);
    }
  };

  const dateStr = record && record.timestamp > 0 ? new Date(record.timestamp * 1000).toLocaleString() : "N/A";

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <header className="mb-8">
        <h2 style={{ margin: 0 }}>On-Chain Identity Record Lookup</h2>
        <p>Enter a wallet address to view its cryptographic identity footprint stored on the blockchain.</p>
      </header>

      <div className="glass-card mb-8">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              className="input-field"
              placeholder="Enter Wallet Address (0x...)" 
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)} 
            />
            <button 
              className="btn-primary" 
              onClick={fetchRecord}
              disabled={loading || !searchAddress}
              style={{ whiteSpace: 'nowrap' }}
            >
              {loading ? "Searching..." : "Lookup Record"}
            </button>
          </div>
          {loading && (
            <div className="processing-bar-container" style={{ width: '100%' }}>
              <div className="processing-bar"></div>
            </div>
          )}
        </div>
      </div>

      {hasSearched && !loading && (!record || record.documentHash === ethers.ZeroHash) && (
        <div className="glass-card">
          <p style={{ color: 'var(--text-muted)' }}>No identity record found for this address on the blockchain.</p>
        </div>
      )}

      {hasSearched && !loading && record && record.documentHash !== ethers.ZeroHash && (

      <div className="glass-card" style={{ border: '1px solid var(--accent-gold)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Status</p>
            <span className={`badge ${record.status === 2 ? 'badge-verified' : record.status === 4 || record.status === 3 ? 'badge-rejected' : 'badge-pending'}`} style={{ display: 'inline-block' }}>
              {STATUS_MAP[record.status] || "Unknown"}
            </span>
          </div>

          <div>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Document Hash (SHA-256 / Keccak256)</p>
            <p style={{ fontFamily: 'monospace', margin: 0, wordBreak: 'break-all', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px' }}>
              {record.documentHash}
            </p>
          </div>

          <div>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Verified By (Verifier Address)</p>
            <p style={{ fontFamily: 'monospace', margin: 0, wordBreak: 'break-all' }}>
              {record.verifiedBy !== ethers.ZeroAddress ? record.verifiedBy : "N/A"}
            </p>
          </div>

          <div>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Last Updated</p>
            <p style={{ margin: 0 }}>{dateStr}</p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default IdentityRecordPanel;
