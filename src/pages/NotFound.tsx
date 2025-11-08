import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center p-8 rounded-lg border bg-card">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Oops! Página não encontrada</p>
        <p className="mb-8 text-sm text-muted-foreground">
          A página que você está procurando não existe.
        </p>
        <div className="flex gap-4 justify-center">
          <a 
            href="/" 
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Voltar ao Início
          </a>
          <a 
            href="/about" 
            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
          >
            Sobre o Pintoo
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
