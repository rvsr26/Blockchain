import { useState, useCallback, useEffect } from "react";
import { connectMetaMask, connectDemoMode, WalletState } from "../services/wallet";
import { api } from "../services/api";

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
      setWallet(state);
      localStorage.setItem("wallet_state", JSON.stringify(state));
      // Login to backend
      await api.login({ walletAddress: state.address! });
      const token = (await api.login({ walletAddress: state.address! })) as any;
      if (token.token) localStorage.setItem("auth_token", token.token);
    } catch (err: any) {
      setWallet(INITIAL_STATE);
      throw err;
    }
  }, []);

  const connectDemo = useCallback(async () => {
    setWallet((w) => ({ ...w, connecting: true }));
    const state = connectDemoMode();
    setWallet(state);
    localStorage.setItem("wallet_state", JSON.stringify(state));
    try {
      const result = await api.login({ walletAddress: state.address!, displayName: "Demo User" }) as any;
      if (result.token) localStorage.setItem("auth_token", result.token);
    } catch {}
  }, []);

  const disconnect = useCallback(() => {
    setWallet(INITIAL_STATE);
    localStorage.removeItem("wallet_state");
    localStorage.removeItem("auth_token");
  }, []);

  return { wallet, connect, connectDemo, disconnect };
}
