import { Navbar } from "@/components/Navbar";
import { Sidebar } from "../components/Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 relative">
        <Sidebar />
        <div className="h-full px-4 sm:px-6 lg:px-8 pb-20">
          {children}
        </div>
      </div>
    </div>
  );
}