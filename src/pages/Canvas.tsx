import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Paintbrush, Eraser, Type, Trash2, Save, ArrowLeft, Image, Shapes, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { DEFAULT_COLORS } from "@/lib/constants";
import { DRAWING_TEMPLATES } from "@/lib/templates";

import { Paintbrush2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const STICKERS = {
  EMOJI: [
    { id: "smile", emoji: "😊" },
    { id: "heart", emoji: "❤️" },
    { id: "star", emoji: "⭐" },
    { id: "thumbsup", emoji: "👍" }
  ],
  SHAPES: [
    { id: "rectangle", label: "Retângulo" },
    { id: "circle", label: "Círculo" },
    { id: "line", label: "Linha" },
    { id: "triangle", label: "Triângulo" }
  ]
};

type Tool = "brush" | "eraser" | "text" | "paint" | "shapes" | "stickers" | "template";

type Shape = "rectangle" | "circle" | "line" | "triangle";

interface Sticker {
  id: string;
  x: number;
  y: number;
  type: string;
  scale: number;
}

interface TextElement {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

export default function Canvas() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#FA8CB1");
  const [brushSize, setBrushSize] = useState(3);
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  
  // Novas ferramentas
  const [shape, setShape] = useState<Shape>("rectangle");
  const [fillShape, setFillShape] = useState(false);
  const [texts, setTexts] = useState<TextElement[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [activeSticker, setActiveSticker] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [fontSize, setFontSize] = useState(24);
  const location = useLocation();

  useEffect(() => {
    // Do not force login on page load. Allow anonymous usage of the canvas.
    // If a session exists, set the user so saving/loading works.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        // Aumenta significativamente a altura máxima para 2000px e reduz as margens ao mínimo necessário
        canvas.height = Math.min(2000, window.innerHeight - 100);
        
        // Set white background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Load a saved drawing into the canvas when `?file=` query param is provided
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filePath = params.get("file");
    if (!filePath) return;

    const loadImage = async () => {
      try {
        const { data: urlData, error: urlError } = await supabase.storage
          .from("drawings")
          .createSignedUrl(filePath, 60 * 60); // 1 hour

        if (urlError) throw urlError;
        const img = document.createElement('img');
        img.crossOrigin = "anonymous";
        img.src = urlData.signedUrl;
        img.onload = () => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (!canvas || !ctx) return;

          // Ensure white background then draw the image scaled to canvas
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          toast.success("Desenho carregado para edição");
        };
        img.onerror = () => {
          toast.error("Não foi possível carregar a imagem");
        };
      } catch (e) {
        toast.error("Erro ao buscar imagem");
      }
    };

    loadImage();
  }, [location.search]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartPos({ x, y });

    if (tool === "text") {
      const text = window.prompt("Digite seu texto:");
      if (text) {
        const newText: TextElement = {
          id: Date.now().toString(),
          x,
          y,
          text,
          color,
          fontSize,
        };
        setTexts([...texts, newText]);
        drawText(newText);
      }
      return;
    }

    if (tool === "stickers" && activeSticker) {
      const newSticker: Sticker = {
        id: Date.now().toString(),
        x,
        y,
        type: activeSticker,
        scale: 1,
      };
      setStickers([...stickers, newSticker]);
      drawSticker(newSticker);
      return;
    }

    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (tool === "shapes") {
      // Finalizar o desenho da forma
      const rect = canvas.getBoundingClientRect();
      const x = startPos.x;
      const y = startPos.y;
      
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      
      switch (shape) {
        case "rectangle":
          ctx.rect(x, y, startPos.x - x, startPos.y - y);
          break;
        case "circle":
          const radius = Math.sqrt(Math.pow(startPos.x - x, 2) + Math.pow(startPos.y - y, 2));
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          break;
        case "line":
          ctx.moveTo(x, y);
          ctx.lineTo(startPos.x, startPos.y);
          break;
        case "triangle":
          ctx.moveTo(x, y);
          ctx.lineTo(startPos.x, y);
          ctx.lineTo((x + startPos.x) / 2, startPos.y);
          ctx.closePath();
          break;
      }
      
      if (fillShape) {
        ctx.fill();
      }
      ctx.stroke();
    }

    ctx.beginPath();
  };

  const drawText = (textElement: TextElement) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.font = `${textElement.fontSize}px Arial`;
    ctx.fillStyle = textElement.color;
    ctx.fillText(textElement.text, textElement.x, textElement.y);
  };

  const drawSticker = (sticker: Sticker) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const emoji = STICKERS.EMOJI.find(e => e.id === sticker.type)?.emoji;
    if (!emoji) return;

    ctx.font = `${48 * sticker.scale}px Arial`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(emoji, sticker.x, sticker.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== "mousedown") return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (tool) {
      case "eraser":
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over"; // Restaura o modo normal após usar a borracha
        break;

      case "brush":
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = color;
        ctx.lineTo(x, y);
        ctx.stroke();
        break;

      case "paint":
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const startColor = getPixelColor(imageData, Math.floor(x), Math.floor(y));
        floodFill(imageData, Math.floor(x), Math.floor(y), startColor, hexToRgb(color));
        ctx.putImageData(imageData, 0, 0);
        setIsDrawing(false);
        break;

      case "shapes":
        // Desenho temporário para preview
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;

        // Copiar canvas atual
        tempCtx.drawImage(canvas, 0, 0);
        
        // Desenhar shape
        tempCtx.beginPath();
        tempCtx.strokeStyle = color;
        tempCtx.fillStyle = color;
        
        const startX = startPos.x;
        const startY = startPos.y;
        
        switch (shape) {
          case "rectangle":
            tempCtx.rect(startX, startY, x - startX, y - startY);
            break;
          case "circle":
            const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
            tempCtx.arc(startX, startY, radius, 0, 2 * Math.PI);
            break;
          case "line":
            tempCtx.moveTo(startX, startY);
            tempCtx.lineTo(x, y);
            break;
          case "triangle":
            tempCtx.moveTo(startX, startY);
            tempCtx.lineTo(x, startY);
            tempCtx.lineTo((startX + x) / 2, y);
            tempCtx.closePath();
            break;
        }
        
        if (fillShape) {
          tempCtx.fill();
        }
        tempCtx.stroke();
        
        // Limpar canvas original e desenhar preview
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0);
        break;
    }

    if (tool !== "shapes") {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const getPixelColor = (imageData: ImageData, x: number, y: number) => {
    const index = (y * imageData.width + x) * 4;
    return {
      r: imageData.data[index],
      g: imageData.data[index + 1],
      b: imageData.data[index + 2],
      a: imageData.data[index + 3],
    };
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: 255,
    } : { r: 0, g: 0, b: 0, a: 255 };
  };

  const floodFill = (
    imageData: ImageData,
    x: number,
    y: number,
    startColor: { r: number; g: number; b: number; a: number },
    fillColor: { r: number; g: number; b: number; a: number }
  ) => {
    const pixelsToCheck = [{x, y}];
    const width = imageData.width;
    const height = imageData.height;
    const pixels = imageData.data;

    while (pixelsToCheck.length > 0) {
      const current = pixelsToCheck.pop()!;
      const index = (current.y * width + current.x) * 4;

      if (
        pixels[index] === startColor.r &&
        pixels[index + 1] === startColor.g &&
        pixels[index + 2] === startColor.b &&
        pixels[index + 3] === startColor.a
      ) {
        pixels[index] = fillColor.r;
        pixels[index + 1] = fillColor.g;
        pixels[index + 2] = fillColor.b;
        pixels[index + 3] = fillColor.a;

        if (current.x > 0) pixelsToCheck.push({x: current.x - 1, y: current.y});
        if (current.x < width - 1) pixelsToCheck.push({x: current.x + 1, y: current.y});
        if (current.y > 0) pixelsToCheck.push({x: current.x, y: current.y - 1});
        if (current.y < height - 1) pixelsToCheck.push({x: current.x, y: current.y + 1});
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    toast.success("Canvas limpo!");
  };

  const saveCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Require login only when saving
    if (!user) {
      toast.error("Você precisa entrar para salvar. Redirecionando para login...");
      navigate("/auth");
      return;
    }

    try {
      // Compress / resize before upload to reduce file size
      setSaving(true);
      try {
        const MAX_DIM = 1600; // max width/height in px

        const ratio = Math.min(1, MAX_DIM / Math.max(canvas.width, canvas.height));
        const w = Math.max(1, Math.round(canvas.width * ratio));
        const h = Math.max(1, Math.round(canvas.height * ratio));

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tctx = tempCanvas.getContext("2d");
        if (!tctx) throw new Error("Contexto inválido no canvas temporário");
        // white background
        tctx.fillStyle = "#FFFFFF";
        tctx.fillRect(0, 0, w, h);
        tctx.drawImage(canvas, 0, 0, w, h);

        // Export as PNG (lossless) after resizing
        tempCanvas.toBlob(async (blob) => {
          try {
            if (!blob) throw new Error("Erro ao gerar arquivo do canvas");

            const fileName = `drawing_${Date.now()}.png`;
            const path = `${user.id}/${fileName}`;
            const { error: uploadError } = await supabase.storage
              .from("drawings")
              .upload(path, blob);

            if (uploadError) throw uploadError;

            const { error: dbError } = await supabase.from("drawings").insert({
              user_id: user.id,
              file_path: path,
              title: `Desenho ${new Date().toLocaleDateString()}`,
            });

            if (dbError) throw dbError;

            toast.success("Salvo na nuvem! ☁️");
          } catch (err: any) {
            toast.error(err?.message || "Erro ao salvar");
          } finally {
            setSaving(false);
          }
        }, "image/jpeg", 0.9);
      } catch (err: any) {
        setSaving(false);
        toast.error(err?.message || "Erro ao preparar imagem");
      }
    } catch (error: any) {
      setSaving(false);
      toast.error(error.message || "Erro ao salvar");
    }
  };

  // Using DEFAULT_COLORS from constants

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Sidebar />
      
      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="mb-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Seu Canvas</h1>
        </div>

        {/* Templates */}
        <div className="mb-4 p-4 bg-card rounded-xl border">
          <h3 className="text-sm font-medium mb-2">Templates</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {DRAWING_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  const canvas = canvasRef.current;
                  const ctx = canvas?.getContext("2d");
                  if (!canvas || !ctx) return;

                  const img = document.createElement('img');
                  img.src = template.url;
                  img.onload = () => {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  };
                }}
                className="flex flex-col items-center p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-16 h-16 object-contain rounded border"
                />
                <span className="text-xs mt-1">{template.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="mb-4 p-4 bg-card rounded-xl border space-y-4">
          <div className="flex flex-wrap gap-2">
            {/* Ferramentas Principais */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={tool === "brush" ? "default" : "outline"}
                size="icon"
                onClick={() => setTool("brush")}
                className="hover-lift"
                title="Pincel"
              >
                <Paintbrush className="h-5 w-5" />
              </Button>
              
              <Button
                variant={tool === "paint" ? "default" : "outline"}
                size="icon"
                onClick={() => setTool("paint")}
                className="hover-lift"
                title="Balde de Tinta"
              >
                <Paintbrush className="h-5 w-5" />
              </Button>

              <Button
                variant={tool === "shapes" ? "default" : "outline"}
                size="icon"
                onClick={() => setTool("shapes")}
                className="hover-lift"
                title="Formas"
              >
                <Shapes className="h-5 w-5" />
              </Button>

              <Button
                variant={tool === "text" ? "default" : "outline"}
                size="icon"
                onClick={() => setTool("text")}
                className="hover-lift"
                title="Texto"
              >
                <Type className="h-5 w-5" />
              </Button>

              <Button
                variant={tool === "stickers" ? "default" : "outline"}
                size="icon"
                onClick={() => setTool("stickers")}
                className="hover-lift"
                title="Stickers"
              >
                <Image className="h-5 w-5" />
              </Button>

              <Button
                variant={tool === "eraser" ? "default" : "outline"}
                size="icon"
                onClick={() => setTool("eraser")}
                className="hover-lift"
                title="Borracha"
              >
                <Eraser className="h-5 w-5" />
              </Button>
            </div>

            {/* Cores */}
            <div className="flex items-center gap-2 ml-4">
              {DEFAULT_COLORS.slice(0, 8).map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 hover-lift ${
                    color === c ? "border-foreground scale-110" : "border-border"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full hover-lift"
                    title="Mais Cores"
                  >
                    <Paintbrush2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="p-2">
                    <div className="mb-2">
                      <h4 className="font-medium mb-1.5">Cores Rápidas</h4>
                      <div className="grid grid-cols-8 gap-1">
                        {DEFAULT_COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-6 h-6 rounded-full border hover-lift transition-transform ${
                              color === c ? "border-foreground scale-110" : "border-border"
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1.5">Circulo Cromático</h4>
                      <div className="relative w-full aspect-square rounded-full p-2 border">
                        <input 
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="absolute inset-0 w-full h-full cursor-pointer rounded-full opacity-0"
                        />
                        <div 
                          className="w-full h-full rounded-full border-2"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Opções específicas baseadas na ferramenta */}
            {tool === "shapes" && (
              <div className="flex gap-2 ml-4">
                <select
                  value={shape}
                  onChange={(e) => setShape(e.target.value as Shape)}
                  className="p-2 rounded border"
                >
                  {STICKERS.SHAPES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant={fillShape ? "default" : "outline"}
                  onClick={() => setFillShape(!fillShape)}
                  className="whitespace-nowrap"
                >
                  Preenchido
                </Button>
              </div>
            )}

            {tool === "stickers" && (
              <div className="flex gap-2 ml-4 flex-wrap">
                {STICKERS.EMOJI.map((sticker) => (
                  <Button
                    key={sticker.id}
                    variant={activeSticker === sticker.id ? "default" : "outline"}
                    onClick={() => setActiveSticker(sticker.id)}
                    className="text-xl"
                  >
                    {sticker.emoji}
                  </Button>
                ))}
              </div>
            )}

            {tool === "text" && (
              <div className="flex gap-2 ml-4 items-center">
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-20 p-2 rounded border"
                  min="12"
                  max="72"
                />
                <span className="text-sm text-muted-foreground">px</span>
              </div>
            )}

            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={clearCanvas} className="hover-lift">
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar
              </Button>
              <Button onClick={saveCanvas} className="hover-lift" disabled={saving}>
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

          <div className="flex items-center gap-4">
            <Label className="whitespace-nowrap">Espessura:</Label>
            <Slider
              value={[brushSize]}
              onValueChange={(v) => setBrushSize(v[0])}
              min={1}
              max={20}
              step={1}
              className="w-48"
            />
            <span className="text-sm text-muted-foreground">{brushSize}px</span>
          </div>
        </div>

        {/* Canvas */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-border relative">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            onMouseLeave={stopDrawing}
            className="cursor-crosshair w-full"
          />
          {saving && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="flex flex-col items-center text-white">
                <Loader2 className="animate-spin h-8 w-8 mb-2" />
                <span>Salvando...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
