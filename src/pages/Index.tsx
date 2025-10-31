import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Plus, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [drawings, setDrawings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Allow anonymous access to the index page. If a user is logged in, load their drawings.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        loadDrawings(session.user.id);
      } else {
        // No session - nothing to load
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        loadDrawings(session.user.id);
      } else {
        setUser(null);
        setDrawings([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadDrawings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("drawings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDrawings(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar desenhos");
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from("drawings").getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Suas Criações ☁️</h1>
          <p className="text-muted-foreground">
            {drawings.length > 0 
              ? `${drawings.length} ${drawings.length === 1 ? 'desenho salvo' : 'desenhos salvos'}`
              : 'Comece criando sua primeira arte!'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* New Drawing Card */}
          <Card 
            className="hover-lift cursor-pointer border-dashed border-2 bg-muted/30"
            onClick={() => navigate("/canvas")}
          >
            <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
              <Plus className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Nova Criação</p>
            </CardContent>
          </Card>

          {/* Drawings */}
          {loading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : (
            // If user is not logged, drawings will be empty – nothing to map
            drawings.map((drawing) => (
              <Card key={drawing.id} className="hover-lift overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-64 bg-muted flex items-center justify-center">
                    <img
                      src={getImageUrl(drawing.file_path)}
                      alt={drawing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex-col items-start p-4">
                  <h3 className="font-medium">{drawing.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(drawing.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
        {!loading && drawings.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground mb-4">
              {user ? 'Nenhum desenho ainda' : 'Você não está logado. Faça login para ver seus desenhos salvos.'}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button onClick={() => navigate("/canvas") }>
                Criar Desenho
              </Button>
              {!user && (
                <Button variant="outline" onClick={() => navigate("/auth") }>
                  Entrar / Registrar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
