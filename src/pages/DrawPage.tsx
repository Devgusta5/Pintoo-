import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Paintbrush, 
  Eraser, 
  Save, 
  ArrowLeft, 
  Droplet, 
  Square, 
  Circle, 
  Minus,
  LucideIcon,
  Palette,
  Zap,
  X,
  MessageCircle,
  Send
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { DEFAULT_COLORS, EXTENDED_COLORS, NEON_COLORS, PASTEL_COLORS } from "@/lib/constants";
import { BRUSH_PATTERNS, PAINT_TOOLS, type PaintTool } from "@/lib/paint-tools";
import { floodFill, hexToRgba, drawLine, drawRect, drawCircle } from "@/lib/canvas-utils";

const TOOL_ICONS: Record<string, LucideIcon> = {
  Paintbrush,
  Eraser,
  Droplet,
  Square,
  Circle,
  Minus,
};

// Paletas de cores organizadas
const COLOR_PALETTES = [
  { name: "Cores Básicas", colors: DEFAULT_COLORS },
  { name: "Cores Extendidas", colors: EXTENDED_COLORS },
  { name: "Cores Pastel", colors: PASTEL_COLORS },
  { name: "Cores Neon", colors: NEON_COLORS },
];

export default function DrawPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<PaintTool>("brush");
  const [brushPattern, setBrushPattern] = useState(BRUSH_PATTERNS[0]);
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [brushSize, setBrushSize] = useState(3);
  const [fill, setFill] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [activePalette, setActivePalette] = useState(0);
  const [showColorPalettes, setShowColorPalettes] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ from: "user" | "bot"; text: string }>>([]);
  const [aiInput, setAiInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { id } = useParams();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        if (id) {
          loadDrawing(id);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        if (id) {
          loadDrawing(id);
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false }) as CanvasRenderingContext2D;
    if (!ctx) return;

    let resizeTimeout: number;
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const newWidth = container.clientWidth;
      const newHeight = Math.min(800, window.innerHeight - 200);

      // Só redimensiona se o tamanho realmente mudou
      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        // Salva o conteúdo atual
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx?.drawImage(canvas, 0, 0);

        // Redimensiona
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Restaura o conteúdo sempre com fundo branco
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0);
      }
    };

    const debouncedResize = () => {
      if (resizeTimeout) {
        window.cancelAnimationFrame(resizeTimeout);
      }
      resizeTimeout = window.requestAnimationFrame(resizeCanvas);
    };

    resizeCanvas();
    window.addEventListener("resize", debouncedResize);

    return () => {
      window.removeEventListener("resize", debouncedResize);
      if (resizeTimeout) {
        window.cancelAnimationFrame(resizeTimeout);
      }
    };
  }, []);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    if (!point) return;

    setIsDrawing(true);
    setStartPos(point);

    if (tool === "bucket") {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      floodFill(imageData, Math.floor(point.x), Math.floor(point.y), hexToRgba(color));
      ctx.putImageData(imageData, 0, 0);
    } else if (tool === "brush" || tool === "eraser") {
      draw(e);
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !startPos) return;

    const endPos = getCanvasPoint(e);
    if (!endPos) return;

    if (tool === "line") {
      drawLine(ctx, startPos.x, startPos.y, endPos.x, endPos.y);
    } else if (tool === "rectangle") {
      drawRect(ctx, startPos.x, startPos.y, endPos.x, endPos.y, fill);
    } else if (tool === "circle") {
      drawCircle(ctx, startPos.x, startPos.y, endPos.x, endPos.y, fill);
    }

    setIsDrawing(false);
    setStartPos(null);
    ctx.beginPath();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== "mousedown") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    // Use requestAnimationFrame para garantir que o desenho ocorra no próximo frame
    requestAnimationFrame(() => {
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      ctx.lineWidth = brushSize;
      
      if (tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      } else if (tool === "brush") {
        ctx.globalCompositeOperation = "source-over";
        if (brushPattern.id === "pixel" || brushPattern.id === "spray") {
          ctx.fillStyle = color;
          brushPattern.pattern(ctx, point.x, point.y, brushSize);
        } else {
          ctx.strokeStyle = color;
          brushPattern.pattern(ctx, point.x, point.y, brushSize);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
        }
      }

      if ((tool === "brush" && !["pixel", "spray"].includes(brushPattern.id)) || tool === "eraser") {
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
      }
    });
  };

  const loadDrawing = async (drawingId: string) => {
    try {
      const { data: drawing, error } = await supabase
        .from('drawings')
        .select('*')
        .eq('id', drawingId)
        .single();

      if (error) throw error;

      if (drawing) {
        const { data: urlData, error: urlError } = await supabase.storage
          .from("drawings")
          .createSignedUrl(drawing.file_path, 60 * 60);

        if (urlError) throw urlError;

        // Carregar a imagem no canvas
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = urlData.signedUrl;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
      }
    } catch (error: any) {
      toast.error("Erro ao carregar o desenho");
      navigate("/draw");
    }
  };

  const saveCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!user) {
      toast.error("Você precisa entrar para salvar. Redirecionando para login...");
      navigate("/auth");
      return;
    }

    try {
      setSaving(true);
      canvas.toBlob(async (blob) => {
        try {
          if (!blob) throw new Error("Erro ao gerar arquivo do canvas");

          const fileName = `drawing_${Date.now()}.png`;
          const path = `${user.id}/${fileName}`;
          
          // Se estiver editando, atualiza o desenho existente
          if (id) {
            const { data: existingDrawing } = await supabase
              .from("drawings")
              .select("file_path")
              .eq("id", id)
              .single();

            if (existingDrawing) {
              // Remove o arquivo antigo
              await supabase.storage
                .from("drawings")
                .remove([existingDrawing.file_path]);

              // Upload do novo arquivo
              const { error: uploadError } = await supabase.storage
                .from("drawings")
                .upload(path, blob);

              if (uploadError) throw uploadError;

              // Atualiza o registro no banco
              const { error: dbError } = await supabase
                .from("drawings")
                .update({
                  file_path: path,
                  updated_at: new Date().toISOString()
                })
                .eq("id", id);

              if (dbError) throw dbError;
            }
          } else {
            // Cria um novo desenho
            const { error: uploadError } = await supabase.storage
              .from("drawings")
              .upload(path, blob);

            if (uploadError) throw uploadError;

            const { error: dbError } = await supabase.from("drawings").insert({
              user_id: user.id,
              file_path: path,
              title: `Desenho Livre ${new Date().toLocaleDateString()}`,
            });

            if (dbError) throw dbError;
          }

          toast.success("Salvo na nuvem! ☁️");
          navigate("/"); // Retorna à página inicial após salvar
        } catch (err: any) {
          toast.error(err?.message || "Erro ao salvar");
        } finally {
          setSaving(false);
        }
      });
    } catch (error: any) {
      setSaving(false);
      toast.error(error.message || "Erro ao salvar");
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Sempre usa branco para o canvas
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    toast.success("Canvas limpo!");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiMessages]);

  const sendAIMessage = () => {
    if (!aiInput.trim()) return;

    const userMsg = { from: "user" as const, text: aiInput.trim() };
    setAiMessages(m => [...m, userMsg]);
    setAiInput("");

    // Simula resposta da IA após 800ms
    setTimeout(() => {
      const responses = [
        "Que legal! Parece que você está criando algo incrível! 🎨",
        "Legal! Você já experimentou usar diferentes pintool's para isso?",
        "Interessante! Que tipo de desenho você está fazendo?",
        "Adorei! Quer dica de cores que combinam bem?",
        "Bacana! Você já pensou em aumentar um pouco a espessura do pintoo?",
        "Muito criativo! Continue assim, ficará ótimo! ✨"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setAiMessages(m => [...m, { from: "bot", text: randomResponse }]);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Barra de Ferramentas Principal */}
      <div className="w-full py-2 px-4 bg-card border-b border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="shrink-0 bg-primary/10 hover:bg-primary/20 text-primary rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* Ferramentas de Pintura */}
            <div className="flex items-center gap-1 sm:gap-2">
              {PAINT_TOOLS.map((paintTool) => {
                const Icon = TOOL_ICONS[paintTool.icon];
                return (
                  <Button
                    key={paintTool.id}
                    variant={tool === paintTool.id ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setTool(paintTool.id)}
                    className={`shrink-0 ${
                      tool === paintTool.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    title={paintTool.name}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                );
              })}
            </div>

            {/* Estilos de Pincel */}
            {tool === "brush" && (
              <div className="flex items-center gap-1 sm:gap-2 border-l border-border pl-2 sm:pl-4 overflow-x-auto">
                {BRUSH_PATTERNS.map((pattern) => (
                  <Button
                    key={pattern.id}
                    variant="ghost"
                    size="sm"
                    className={`shrink-0 ${
                      brushPattern.id === pattern.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setBrushPattern(pattern)}
                  >
                    {pattern.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              className="shrink-0"
            >
              Limpar
            </Button>
            <Button
              onClick={saveCanvas}
              size="sm"
              className="shrink-0"
              disabled={saving}
            >
              {saving ? (
                'Salvando...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de Controles */}
      <div className="w-full py-2 px-4 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
          {/* Espessura */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Label className="w-20 sm:w-auto">Espessura:</Label>
            <div className="flex-1 sm:w-48">
              <Slider
                value={[brushSize]}
                onValueChange={(v) => setBrushSize(v[0])}
                min={1}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
            <span className="text-sm min-w-[3ch] text-muted-foreground">{brushSize}px</span>
          </div>

          {/* Cores */}
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Label className="shrink-0">Cores:</Label>
            <div className="flex gap-1 items-center">
              {COLOR_PALETTES[activePalette].colors.slice(0, 6).map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === c ? "border-primary" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <Button
                variant="secondary"
                size="icon"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0 bg-primary/10 hover:bg-primary/20"
                onClick={() => setShowColorPalettes(!showColorPalettes)}
              >
                <Palette className="h-4 w-4 text-primary" />
              </Button>
            </div>
          </div>

          {/* Opções de Preenchimento */}
          {(tool === "rectangle" || tool === "circle") && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label className="w-20 sm:w-auto">Preenchimento:</Label>
              <div className="flex gap-2">
                <Button
                  variant={fill ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFill(true)}
                  className={fill ? "bg-primary text-primary-foreground" : ""}
                >
                  Preenchido
                </Button>
                <Button
                  variant={!fill ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFill(false)}
                  className={!fill ? "bg-primary text-primary-foreground" : ""}
                >
                  Contorno
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Área do Canvas */}
      <div className="flex-1 p-4">
        <div className="h-full bg-white rounded-lg overflow-hidden border border-border shadow-sm relative">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            onMouseLeave={stopDrawing}
            className="cursor-crosshair w-full h-full touch-none bg-white"
          />
          {saving && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 border-4 border-t-transparent border-primary rounded-full animate-spin mb-2" />
                <span className="text-foreground">Salvando...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seletor de Paletas */}
      {showColorPalettes && (
        <>
          {/* Overlay de fundo */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" 
            onClick={() => setShowColorPalettes(false)}
          />
          
          {/* Modal */}
          <div 
            className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-popover m-0 sm:m-4 rounded-t-xl sm:rounded-xl border shadow-lg">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="text-lg font-semibold text-foreground">Escolher Cor</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setShowColorPalettes(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Conteúdo */}
              <div className="p-4 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  {COLOR_PALETTES.map((palette, index) => (
                    <div key={palette.name} className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">{palette.name}</h4>
                      <div className="grid grid-cols-6 sm:grid-cols-8 gap-3">
                        {palette.colors.map((c) => (
                          <button
                            key={c}
                            onClick={() => {
                              setColor(c);
                              setActivePalette(index);
                              setShowColorPalettes(false);
                            }}
                            className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${
                              color === c ? "border-primary shadow-lg" : "border-border"
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Chat IA Flutuante - Canto Inferior Direito */}
      <div className="fixed bottom-6 right-6 z-40">
        {!showAIChat ? (
          <Button
            onClick={() => setShowAIChat(true)}
            className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
            title="Chat com IA"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        ) : (
          <div className="bg-popover border border-border rounded-xl shadow-2xl w-80 max-h-96 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Assistente IA
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowAIChat(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/50">
              {aiMessages.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Oi! 👋 Como posso ajudar com seu desenho?
                </div>
              )}
              {aiMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.from === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted text-foreground rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-3 flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendAIMessage();
                }}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button
                size="icon"
                className="h-10 w-10 rounded-lg shrink-0"
                onClick={sendAIMessage}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}