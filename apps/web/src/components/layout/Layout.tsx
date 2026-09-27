import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useWallet } from "../../hooks/useWallet";

export default function Layout() {
  const { wallet } = useWallet();
  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0f1a]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header wallet={wallet} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
