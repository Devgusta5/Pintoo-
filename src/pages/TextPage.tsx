import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save, ArrowLeft, Download, FileText, Clock, Bold, Italic, Underline, List, Type } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { Textarea } from "@/components/ui/textarea";
import { LinedPaper } from "@/components/ui/lined-paper";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TextDocumentContent {
  text: string;
  version: number;
}

interface TextDocument {
  id: string;
  title: string;
  content: TextDocumentContent;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_deleted: boolean;
}

// Estilos de fonte
const FONT_STYLES = {
  handwriting: {
    fontFamily: "'Dancing Script', cursive, 'Comic Sans MS', cursive",
    fontSize: "20px",
    lineHeight: "2.2",
    fontWeight: "400"
  },
  typewriter: {
    fontFamily: "'Courier New', monospace",
    fontSize: "18px",
    lineHeight: "2.0",
    fontWeight: "400"
  },
  formal: {
    fontFamily: "'Times New Roman', serif",
    fontSize: "18px",
    lineHeight: "2.1",
    fontWeight: "400"
  },
  modern: {
    fontFamily: "'Inter', 'Arial', sans-serif",
    fontSize: "16px",
    lineHeight: "1.8",
    fontWeight: "400"
  }
};

// Processar formatação markdown para HTML
const processTextFormatting = (text: string): string => {
  let formatted = text;
  // Processa os pares de marcadores mais externos primeiro
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, (_, inner) => {
    // Processa formatação aninhada dentro do negrito
    inner = inner.replace(/\*(.*?)\*/g, '<em>$1</em>')
                 .replace(/__(.*?)__/g, '<u>$1</u>');
    return `<strong>${inner}</strong>`;
  });
  
  // Processa itálico e sublinhado restantes
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/__(.*?)__/g, '<u>$1</u>');

  // Processa quebras de linha e listas
  formatted = formatted.split('\n').map(line => {
    if (line.trim().startsWith('•')) {
      return `<div class="flex"><span class="mr-2">•</span>${line.substring(1)}</div>`;
    }
    return line || ' ';
  }).join('<br>');
  
  return formatted;
};

export default function TextPage() {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [currentDocument, setCurrentDocument] = useState<TextDocument | null>(null);
  const [autoSave, setAutoSave] = useState(false);
  const [textStyle, setTextStyle] = useState<keyof typeof FONT_STYLES>("handwriting");

  // Calcular estatísticas do texto
  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const characters = content.length;
    
    setWordCount(words);
    setCharacterCount(characters);
  }, [content]);

  // Auto-save a cada 30 segundos quando habilitado
  useEffect(() => {
    if (!autoSave || !content.trim() || !user) return;

    const autoSaveInterval = setInterval(() => {
      if (content.trim()) {
        saveDocument(true);
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [autoSave, content, user]);

  const { id } = useParams();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        if (id) {
          // Se tiver ID, carrega o documento específico
          loadDocument(id);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        if (id) {
          // Se tiver ID, carrega o documento específico
          loadDocument(id);
        }
      } else {
        setUser(null);
        setCurrentDocument(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [id]);

  const loadDocument = async (documentId: string) => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', documentId)
      .eq('is_deleted', false)
      .single();

    if (error) {
      toast.error("Erro ao carregar o texto");
      navigate("/text");
      return;
    }

    if (data) {
      setCurrentDocument(data as unknown as TextDocument);
      const noteContent = data.content as unknown as TextDocumentContent;
      setContent(noteContent.text || '');
      setLastSaved(new Date(data.updated_at));
    }
  };

  // Funções de formatação
  const applyFormatting = useCallback((format: 'bold' | 'italic' | 'underline' | 'list') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    if (!selectedText && format !== 'list') {
      toast.error("Selecione um texto para formatar");
      return;
    }

    let newText = '';
    let newCursorPos = start;
    let newSelectionEnd = end;

    switch (format) {
      case 'bold':
        newText = content.substring(0, start) + `**${selectedText}**` + content.substring(end);
        newCursorPos = end + 4;
        newSelectionEnd = newCursorPos;
        break;
      case 'italic':
        newText = content.substring(0, start) + `*${selectedText}*` + content.substring(end);
        newCursorPos = end + 2;
        newSelectionEnd = newCursorPos;
        break;
      case 'underline':
        newText = content.substring(0, start) + `__${selectedText}__` + content.substring(end);
        newCursorPos = end + 4;
        newSelectionEnd = newCursorPos;
        break;
      case 'list':
        if (selectedText) {
          const lines = selectedText.split('\n');
          const formattedLines = lines.map(line => line.trim() ? `• ${line}` : line);
          newText = content.substring(0, start) + formattedLines.join('\n') + content.substring(end);
          newCursorPos = end + formattedLines.join('\n').length;
          newSelectionEnd = newCursorPos;
        } else {
          newText = content.substring(0, start) + '\n• ' + content.substring(end);
          newCursorPos = start + 3;
          newSelectionEnd = newCursorPos;
        }
        break;
    }

    setContent(newText);
    
    // Restaurar foco e seleção
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newSelectionEnd);
    }, 0);
  }, [content]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          applyFormatting('bold');
          break;
        case 'i':
          e.preventDefault();
          applyFormatting('italic');
          break;
        case 'u':
          e.preventDefault();
          applyFormatting('underline');
          break;
        case 'l':
          e.preventDefault();
          applyFormatting('list');
          break;
      }
    }
  }, [applyFormatting]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Ativar auto-save após o usuário começar a escrever
    if (newContent.trim() && !autoSave) {
      setAutoSave(true);
    }
  }, [autoSave]);

  const saveDocument = async (isAutoSave = false) => {
    console.log("[Save] Iniciando salvamento...", { isAutoSave });
    
    if (!user) {
      console.log("[Save] Usuário não autenticado");
      toast.error("Você precisa entrar para salvar. Redirecionando para login...");
      navigate("/auth");
      return;
    }

    if (!content.trim()) {
      console.log("[Save] Conteúdo vazio");
      if (!isAutoSave) {
        toast.error("Escreva algo para salvar");
      }
      return;
    }

    try {
      console.log("[Save] Preparando dados para salvar...");
      setSaving(true);
      
      const documentData = {
        user_id: user.id,
        title: `Texto ${new Date().toLocaleDateString('pt-BR')}`,
        content: {
          text: content,
          version: (currentDocument?.content as any)?.version ? (currentDocument.content as any).version + 1 : 1
        },
        is_deleted: false
      };
      
      console.log("[Save] Dados preparados:", documentData);

      let result;
      
      if (currentDocument?.id) {
        console.log("[Save] Atualizando documento existente:", currentDocument.id);
        // Atualizar documento existente
        const { data, error } = await supabase
          .from('notes')
          .update({
            ...documentData,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentDocument.id)
          .select()
          .single();

        if (error) {
          console.error("[Save] Erro ao atualizar:", error);
          throw error;
        }
        console.log("[Save] Documento atualizado com sucesso:", data);
        result = { data };
      } else {
        console.log("[Save] Criando novo documento");
        // Criar novo documento
        const { data, error } = await supabase
          .from('notes')
          .insert(documentData)
          .select()
          .single();

        if (error) {
          console.error("[Save] Erro ao criar:", error);
          throw error;
        }
        console.log("[Save] Novo documento criado com sucesso:", data);
        result = { data };
        
        if (data) {
          setCurrentDocument(data as unknown as TextDocument);
        }
      }

      setLastSaved(new Date());
      
      if (!isAutoSave) {
        toast.success("Texto salvo! 📝");
      }
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      if (!isAutoSave) {
        toast.error(error.message || "Erro ao salvar o texto");
      }
    } finally {
      setSaving(false);
    }
  };

  const exportText = () => {
    if (!content.trim()) {
      toast.error("Nenhum texto para exportar");
      return;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `texto-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Texto exportado com sucesso!");
  };

  const formatLastSaved = () => {
    if (!lastSaved) return "Nunca";
    
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Agora mesmo";
    if (minutes === 1) return "1 minuto atrás";
    if (minutes < 60) return `${minutes} minutos atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return "1 hora atrás";
    if (hours < 24) return `${hours} horas atrás`;
    
    return lastSaved.toLocaleDateString('pt-BR');
  };

  // Renderizar texto formatado sem asteriscos
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Padrão: **negrito**, *itálico*, __sublinhado__
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      const regex = /\*\*(.*?)\*\*|\*[^\*](.*?)[^\*]\*|__(.*?)__/g;
      let match;

      while ((match = regex.exec(line)) !== null) {
        // Texto antes da formatação
        if (match.index > lastIndex) {
          parts.push(
            <span key={`text-${lineIndex}-${lastIndex}`}>
              {line.substring(lastIndex, match.index)}
            </span>
          );
        }

        // Identifica o tipo de formatação
        if (match[1] !== undefined) {
          // **negrito**
          parts.push(
            <strong key={`bold-${lineIndex}-${match.index}`} className="font-bold">
              {match[1]}
            </strong>
          );
        } else if (match[2] !== undefined) {
          // *itálico*
          parts.push(
            <em key={`italic-${lineIndex}-${match.index}`} className="italic">
              {match[2]}
            </em>
          );
        } else if (match[3] !== undefined) {
          // __sublinhado__
          parts.push(
            <u key={`underline-${lineIndex}-${match.index}`} className="underline">
              {match[3]}
            </u>
          );
        }

        lastIndex = regex.lastIndex;
      }

      // Texto restante
      if (lastIndex < line.length) {
        parts.push(
          <span key={`text-${lineIndex}-${lastIndex}`}>
            {line.substring(lastIndex)}
          </span>
        );
      }

      return (
        <div key={`line-${lineIndex}`} style={{ minHeight: '2.2em', display: 'block' }}>
          {parts.length > 0 ? parts : ' '}
        </div>
      );
    });
  };

  return (
    <Layout>
      <div className="flex flex-1 h-[calc(100vh-64px)]">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-gradient-to-br from-background to-muted/50">
          <div className="max-w-6xl mx-auto flex flex-col h-full">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card/80 backdrop-blur-sm rounded-xl border shadow-sm">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate("/")} 
                  className="hidden sm:flex"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Type className="h-6 w-6 text-blue-600" />
                    Editor de Texto
                  </h1>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {lastSaved && `Salvo ${formatLastSaved()}`}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {wordCount} palavras
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {characterCount} caracteres
                    </Badge>
                    {autoSave && (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        Auto-save ativo
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        onClick={exportText}
                        disabled={!content.trim()}
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Baixar como arquivo .txt</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button 
                  onClick={() => saveDocument(false)} 
                  className="bg-blue-600 hover:bg-blue-700 text-white" 
                  disabled={saving}
                  size="lg"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </div>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Barra de Ferramentas */}
            <div className="mb-4 p-3 bg-card/80 backdrop-blur-sm rounded-lg border shadow-sm">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Estilo:</span>
                  <Select value={textStyle} onValueChange={(value: keyof typeof FONT_STYLES) => setTextStyle(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Escolha um estilo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="handwriting">Manuscrito</SelectItem>
                      <SelectItem value="typewriter">Máquina de Escrever</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="modern">Moderno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-700">Formatação:</span>
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Toggle
                        size="sm"
                        onClick={() => applyFormatting('bold')}
                        className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700"
                      >
                        <Bold className="h-4 w-4" />
                      </Toggle>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Negrito (Ctrl+B)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Toggle
                        size="sm"
                        onClick={() => applyFormatting('italic')}
                        className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700"
                      >
                        <Italic className="h-4 w-4" />
                      </Toggle>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Itálico (Ctrl+I)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Toggle
                        size="sm"
                        onClick={() => applyFormatting('underline')}
                        className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700"
                      >
                        <Underline className="h-4 w-4" />
                      </Toggle>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sublinhado (Ctrl+U)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Separator orientation="vertical" className="h-6 mx-2" />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Toggle
                        size="sm"
                        onClick={() => applyFormatting('list')}
                        className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700"
                      >
                        <List className="h-4 w-4" />
                      </Toggle>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Lista com tópicos</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Paper Container - Folha de Caderno Real */}
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-4xl">
                <div className="relative bg-card rounded-xl shadow-2xl overflow-hidden border border-border min-h-[600px] max-h-[80vh]">
                  {/* Margem esquerda */}
                  <div className="absolute left-0 top-0 w-8 h-full bg-muted border-r border-border z-10"></div>
                  
                  {/* Linhas do caderno */}
                  <div 
                    className="absolute inset-0 z-0 pointer-events-none"
                    style={{
                      backgroundImage: `
                        linear-gradient(to bottom, 
                          transparent 0%, 
                          transparent calc(2.2em - 1px), 
                          hsl(var(--muted-foreground) / 0.2) calc(2.2em - 1px), 
                          hsl(var(--muted-foreground) / 0.2) 2.2em
                        )
                      `,
                      backgroundSize: "100% 2.2em",
                      backgroundPosition: "0 0",
                      marginLeft: "2rem"
                    }}
                  />

                  {/* Container do textarea + texto renderizado */}
                  <div className="relative w-full h-full">
                    {/* Textarea INVISÍVEL (para input) */}
                    <Textarea
                      ref={textareaRef}
                      value={content}
                      onChange={handleContentChange}
                      onKeyDown={handleKeyDown}
                      placeholder={`Comece a escrever suas ideias... ✍️

Dica: Use as ferramentas acima para formatar seu texto ou os atalhos:
• Ctrl+B para Negrito
• Ctrl+I para Itálico  
• Ctrl+U para Sublinhado
• Ctrl+L para Lista`}
                      className="w-full h-full resize-none border-none shadow-none focus-visible:ring-0 absolute inset-0 z-20"
                      style={{
                        ...FONT_STYLES[textStyle],
                        outline: "none",
                        caretColor: "#3b82f6",
                        color: "transparent",
                        backgroundColor: "transparent",
                        padding: "2rem 3rem 2rem 4rem",
                        lineHeight: "2.2",
                        resize: "none",
                        paddingLeft: "4rem"
                      }}
                    />

                    {/* TEXTO FORMATADO VISÍVEL (sobreposição) */}
                    <div 
                      className="absolute inset-0 w-full h-full z-10 pointer-events-none select-none overflow-hidden text-foreground"
                      style={{
                        ...FONT_STYLES[textStyle],
                        padding: "2rem 3rem 2rem 4rem",
                        lineHeight: "2.2",
                        paddingLeft: "4rem",
                        whiteSpace: "pre-wrap",
                        wordWrap: "break-word"
                      }}
                    >
                      {renderFormattedText(content)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Action Button para mobile */}
            <div className="fixed bottom-6 right-6 sm:hidden">
              <Button 
                onClick={() => saveDocument(false)} 
                className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
                disabled={saving}
                size="icon"
              >
                {saving ? (
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="h-6 w-6" />
                )}
              </Button>
            </div>

            {/* Dicas rápidas */}
            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-primary">
                <span className="font-semibold">💡 Dicas:</span>
                <span>Use **negrito**, *itálico* e __sublinhado__ para formatar! A visualização aparece em tempo real.</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}