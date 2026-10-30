import { Outlet } from "react-router-dom";
import { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import { WalkthroughManager } from "../components/walthrough/WalkthroughManager.tsx";

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] transition-colors">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex flex-1 flex-col min-w-0">
        <Header 
          isSidebarOpen={isSidebarOpen} 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
        
        <main className={`flex-1 bg-[var(--md-sys-color-surface)] p-6 transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}>
          <Outlet />
        </main>
        
        <Footer companyName="Lab Survei Geodesi dan Geometri - UPN Veteran Yogyakarta" />
      </div>

      <WalkthroughManager />
    </div>
  );
}