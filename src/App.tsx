import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DrawPage from "./pages/DrawPage";
import PaintPage from "./pages/PaintPage";
import TextPage from "./pages/TextPage";
import Settings from "./pages/Settings";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  // Sempre redireciona /canvas para /draw (retrocompatibilidade)
  useEffect(() => {
    if (window.location.pathname === '/canvas') {
      window.location.replace('/draw' + window.location.search);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/draw" element={<DrawPage />} />
            <Route path="/draw/:id" element={<DrawPage />} />
            <Route path="/paint" element={<PaintPage />} />
            <Route path="/paint/:id" element={<PaintPage />} />
            <Route path="/text" element={<TextPage />} />
            <Route path="/text/:id" element={<TextPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
            <Route path="/help" element={<Navigate to="/about" replace />} />
            <Route path="/canvas" element={<Navigate to="/draw" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
