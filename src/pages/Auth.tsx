import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Cloud } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Bem-vindo de volta! ☁️");
        navigate("/");
      } else {
        // Tenta criar conta
        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              email_confirmed: true // tenta forçar confirmação
            }
          }
        });
        
        if (signUpError) throw signUpError;
        
        // Tenta fazer login imediatamente após criar conta
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (!signInError) {
          toast.success("Conta criada com sucesso! ☁️");
          navigate("/");
        } else {
          throw signInError;
        }
      }
    } catch (error: any) {
      console.error("[Auth Error]:", error); // Para debug
      const errorMessage = error.message?.toLowerCase() || "";
      
      if (errorMessage.includes("invalid login credentials")) {
        toast.error("Email ou senha incorretos");
      } else if (errorMessage.includes("email not confirmed")) {
        // Se o email não foi confirmado, vamos tentar fazer login mesmo assim
        try {
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!loginError) {
            toast.success("Bem-vindo! ☁️");
            navigate("/");
            return;
          }
        } catch {}
        toast.error("Não foi possível fazer login. Tente novamente.");
      } else if (errorMessage.includes("password")) {
        toast.error("A senha deve ter pelo menos 6 caracteres");
      } else if (errorMessage.includes("email")) {
        toast.error("Por favor, use um email válido");
      } else {
        toast.error("Erro ao autenticar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md smooth-transition hover-lift">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Cloud className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl">Pintoo ☁️</CardTitle>
          <CardDescription>
            {isLogin ? "Entre na sua conta" : "Crie sua conta gratuita"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground smooth-transition"
              disabled={loading}
            >
              {isLogin ? "Não tem conta? Criar uma" : "Já tem conta? Entrar"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
