import { ethers } from "ethers";

export const DEMO_WALLET = {
  address: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  balance: "10000.0",
  chainId: 31337,
  network: "Hardhat Local",
};

export type WalletState = {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  connected: boolean;
  connecting: boolean;
  isDemoMode: boolean;
  network: string;
};

export async function connectMetaMask(): Promise<WalletState> {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask not found. Please install MetaMask or use Demo Mode.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const balance = ethers.formatEther(await provider.getBalance(address));
  const network = await provider.getNetwork();

  return {
    address,
    balance: parseFloat(balance).toFixed(4),
    chainId: Number(network.chainId),
    connected: true,
    connecting: false,
    isDemoMode: false,
    network: getNetworkName(Number(network.chainId)),
  };
}

export function connectDemoMode(): WalletState {
  return {
    address: DEMO_WALLET.address,
    balance: DEMO_WALLET.balance,
    chainId: DEMO_WALLET.chainId,
    connected: true,
    connecting: false,
    isDemoMode: true,
    network: DEMO_WALLET.network,
  };
}

export function getNetworkName(chainId: number): string {
  const networks: Record<number, string> = {
    1: "Ethereum Mainnet",
    11155111: "Sepolia Testnet",
    31337: "Hardhat Local",
    137: "Polygon Mainnet",
    80001: "Mumbai Testnet",
  };
  return networks[chainId] || `Chain ${chainId}`;
}

export function shortenAddress(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
