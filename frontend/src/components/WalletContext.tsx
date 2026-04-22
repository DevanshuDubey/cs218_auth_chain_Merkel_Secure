import { ethers } from "ethers";
import React, { createContext, useState, useEffect, useContext } from "react";
import IdentityABI from "../abis/IdentityVerifier.json";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const WalletContext = createContext<any>(null);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [role, setRole] = useState<"ADMIN" | "VERIFIER" | "USER" | null>(null);
  const [signer, setSigner] = useState<any>(null);

  const IDENTITY_ADDR = "YOUR_DEPLOYED_IDENTITY_CONTRACT_ADDRESS";

  const checkRoles = async (userAddr: string, currentSigner: any) => {
    // const contract = new ethers.Contract(IDENTITY_ADDR, IdentityABI.abi, currentSigner);
    
    // // Keccak256 hashes for roles (Match these with your Solidity constants)
    // const ADMIN_ROLE = ethers.id("DEFAULT_ADMIN_ROLE"); 
    // const VERIFIER_ROLE = ethers.id("VERIFIER_ROLE");

    // const isAdmin = await contract.hasRole(ADMIN_ROLE, userAddr);
    // const isVerifier = await contract.hasRole(VERIFIER_ROLE, userAddr);

    // if (isAdmin) setRole("ADMIN");
    // else if (isVerifier) setRole("VERIFIER");
    // else setRole("USER");
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const currentSigner = await provider.getSigner();
      
      setAccount(accounts[0]);
      setSigner(currentSigner);
      await checkRoles(accounts[0], currentSigner);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accs: string[]) => {
        if (accs.length > 0) {
          setAccount(accs[0]);
          // Re-run role check on account switch
          window.ethereum.request({ method: 'eth_accounts' }).then(async () => {
             const provider = new ethers.BrowserProvider(window.ethereum);
             const s = await provider.getSigner();
             checkRoles(accs[0], s);
          });
        } else {
          setAccount(null);
          setRole(null);
        }
      });
    }
  }, []);

  return (
    <WalletContext.Provider value={{ account, role, connectWallet, signer }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);