import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { StatsCards } from "@/components/StatsCards";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { Plus, Image as ImageIcon, MoreVertical, Pencil, Trash2, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [drawings, setDrawings] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Allow anonymous access to the index page. If a user is logged in, load their content
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        Promise.all([
          loadDrawings(session.user.id),
          loadNotes(session.user.id)
        ]).then(() => setLoading(false));
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

  const loadNotes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar textos");
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from("notes")
        .update({ is_deleted: true })
        .eq("id", noteId);

      if (error) throw error;
      
      setNotes(notes.filter(note => note.id !== noteId));
      toast.success("Texto excluído com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao excluir texto");
    }
  };

  const downloadDrawing = async (drawing: any) => {
    try {
      // Se já temos a URL assinada, usamos ela diretamente
      if (drawing.signedUrl) {
        const response = await fetch(drawing.signedUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${drawing.title}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Imagem baixada com sucesso!");
      } else {
        toast.error("URL da imagem não disponível");
      }
    } catch (error) {
      toast.error("Erro ao baixar a imagem");
    }
  };

  const downloadNote = async (note: any) => {
    try {
      const blob = new Blob([note.content.text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Texto baixado com sucesso!");
    } catch (error) {
      toast.error("Erro ao baixar o texto");
    }
  };

  const deleteDrawing = async (drawingId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("drawings")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("drawings")
        .delete()
        .eq("id", drawingId);

      if (dbError) throw dbError;

      setDrawings(drawings.filter(drawing => drawing.id !== drawingId));
      toast.success("Desenho excluído com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao excluir desenho");
    }
  };

  const loadDrawings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("drawings")
        .select("*, is_painting:type")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const list = data || [];
      // Create signed URLs for each drawing (short lived)
      const withUrls = await Promise.all(
        list.map(async (d: any) => {
          try {
            const { data: urlData, error: urlError } = await supabase.storage
              .from("drawings")
              .createSignedUrl(d.file_path, 60 * 60); // 1 hour
            if (urlError) throw urlError;
            return { ...d, signedUrl: urlData?.signedUrl || "" };
          } catch (e) {
            return { ...d, signedUrl: "" };
          }
        })
      );

      setDrawings(withUrls);
    } catch (error: any) {
      toast.error("Erro ao carregar desenhos");
    } finally {
      setLoading(false);
    }
  };

  // Images are served via signed URLs generated when loading drawings.
  // Each drawing object includes `signedUrl`.

  return (
    <div className="min-h-screen">
      <Navbar />
      <Sidebar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Suas Criações ☁️</h1>
          <StatsCards 
            drawings={drawings.filter(d => !d.is_painting).length}
            paintings={drawings.filter(d => d.is_painting).length}
            notes={notes.length}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* New Drawing Card */}
          {/* Nova Criação */}
          <Card 
            className="hover-lift cursor-pointer border-dashed border-2 bg-muted/30"
            onClick={() => navigate("/draw")}
          >
            <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
              <Plus className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Novo Desenho</p>
            </CardContent>
          </Card>

          {/* Novo Texto */}
          <Card 
            className="hover-lift cursor-pointer border-dashed border-2 bg-muted/30"
            onClick={() => navigate("/text")}
          >
            <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
              <Plus className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Novo Texto</p>
            </CardContent>
          </Card>

          {/* Conteúdo */}
          {loading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : (
            <>
              {/* Desenhos */}
              {drawings.map((drawing) => (
                <Card key={drawing.id} className="hover-lift overflow-hidden">
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{drawing.title}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/draw/${drawing.id}`)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadDrawing(drawing)}>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar PNG
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                                <span className="text-destructive">Excluir</span>
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir desenho?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Essa ação não pode ser desfeita. Isso excluirá permanentemente seu desenho.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteDrawing(drawing.id, drawing.file_path)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div
                      className="h-64 bg-muted flex items-center justify-center cursor-pointer"
                      onClick={() => navigate(`/draw/${drawing.id}`)}
                    >
                      <img
                        src={drawing.signedUrl || ''}
                        alt={drawing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col items-start p-4 pt-2">
                    <p className="text-sm text-muted-foreground">
                      {new Date(drawing.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </CardFooter>
                </Card>
              ))}

              {/* Textos */}
              {notes.map((note) => (
                <Card key={note.id} className="hover-lift">
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{note.title}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/text/${note.id}`)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadNote(note)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Baixar TXT
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                                <span className="text-destructive">Excluir</span>
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir texto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Essa ação não pode ser desfeita. Isso excluirá permanentemente seu texto.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteNote(note.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent 
                    className="h-48 p-6 cursor-pointer"
                    onClick={() => navigate(`/text/${note.id}`)}
                  >
                    <p className="text-sm text-muted-foreground line-clamp-6">
                      {note.content.text}
                    </p>
                  </CardContent>
                  <CardFooter className="flex-col items-start p-4 pt-2">
                    <p className="text-sm text-muted-foreground">
                      {new Date(note.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </CardFooter>
                </Card>
              ))}
            </>
          )}
        </div>
        {!loading && drawings.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground mb-4">
              {user 
                ? 'Nenhuma criação ainda! Comece desenhando ou escrevendo algo novo.'
                : 'Você não está logado. Faça login para ver suas criações.'}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button onClick={() => navigate("/draw")}>
                Criar Desenho
              </Button>
              <Button onClick={() => navigate("/text")}>
                Criar Texto
              </Button>
              {!user && (
                <Button variant="outline" onClick={() => navigate("/auth")}>
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
