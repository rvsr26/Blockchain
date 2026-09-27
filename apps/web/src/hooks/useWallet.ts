import { useState, useCallback, useEffect } from "react";
import { connectMetaMask, connectDemoMode, WalletState } from "../services/wallet";
import { api } from "../services/api";
import { ethers } from "ethers";

const INITIAL_STATE: WalletState = {
  address: null, balance: null, chainId: null,
  connected: false, connecting: false, isDemoMode: false, network: "",
};

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>(INITIAL_STATE);

  useEffect(() => {
    const saved = localStorage.getItem("wallet_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.connected) setWallet(parsed);
      } catch {}
    }
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) disconnect();
        else setWallet((w) => ({ ...w, address: accounts[0] }));
      });
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  const connect = useCallback(async () => {
    setWallet((w) => ({ ...w, connecting: true }));
    try {
      const state = await connectMetaMask();
      
      // Get nonce
      const { nonce } = await api.getNonce({ walletAddress: state.address! });
      
      // Sign message
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(nonce);
      
      // Login
      const token = await api.login({ walletAddress: state.address!, signature }) as any;
      
      setWallet(state);
      localStorage.setItem("wallet_state", JSON.stringify(state));
      if (token.token) localStorage.setItem("auth_token", token.token);
    } catch (err: any) {
      setWallet(INITIAL_STATE);
      throw err;
    }
  }, []);

  const connectDemo = useCallback(async () => {
    setWallet((w) => ({ ...w, connecting: true }));
    const state = connectDemoMode();
    
    try {
      // Get nonce
      const { nonce } = await api.getNonce({ walletAddress: state.address! });
      
      // Use fake signature for demo
      const signature = "0x" + "0".repeat(130); // 65-byte dummy signature
      
      // Login
      const result = await api.login({ walletAddress: state.address!, signature, displayName: "Demo User" }) as any;
      
      setWallet(state);
      localStorage.setItem("wallet_state", JSON.stringify(state));
      if (result.token) localStorage.setItem("auth_token", result.token);
    } catch {}
  }, []);

  const disconnect = useCallback(() => {
    setWallet(INITIAL_STATE);
    localStorage.removeItem("wallet_state");
    localStorage.removeItem("auth_token");
  }, []);

  const switchNetwork = useCallback(async () => {
    if (typeof window.ethereum === "undefined") return;
    const targetChainId = import.meta.env.VITE_CHAIN_ID || "31337";
    const hexChainId = `0x${Number(targetChainId).toString(16)}`;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      console.error(switchError);
    }
  }, []);

  return { wallet, connect, connectDemo, disconnect, switchNetwork };
}
