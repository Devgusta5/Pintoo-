import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, ArrowLeft, Droplet, Image as ImageIcon, Palette, RotateCcw } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { DEFAULT_COLORS, EXTENDED_COLORS, PASTEL_COLORS, NEON_COLORS } from "@/lib/constants";
import { COLORING_DRAWINGS, type Drawing } from "@/lib/coloring-drawings";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Paletas de cores organizadas
const COLOR_PALETTES = [
  { name: "Cores Básicas", colors: DEFAULT_COLORS },
  { name: "Cores Extendidas", colors: EXTENDED_COLORS },
  { name: "Cores Pastel", colors: PASTEL_COLORS },
  { name: "Cores Neon", colors: NEON_COLORS },
];

export default function PaintPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<Drawing>(COLORING_DRAWINGS[0]);
  const [loading, setLoading] = useState(true);
  const [activePalette, setActivePalette] = useState(0);
  const [showColorPalettes, setShowColorPalettes] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loadDrawing = () => {
      setLoading(true);
      const container = canvas.parentElement;
      if (!container) return;

      canvas.width = container.clientWidth;
      canvas.height = Math.min(700, window.innerHeight - 200);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Criar imagem do SVG
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        );
        
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        
        ctx.drawImage(
          img,
          x, y,
          img.width * scale,
          img.height * scale
        );
        setLoading(false);
      };
      img.src = currentDrawing.imageUrl;
    };

    loadDrawing();
    
    // Debounce do resize para melhor performance
    let resizeTimeout: number;
    const handleResize = () => {
      if (resizeTimeout) {
        window.cancelAnimationFrame(resizeTimeout);
      }
      resizeTimeout = window.requestAnimationFrame(loadDrawing);
    };
    
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeout) {
        window.cancelAnimationFrame(resizeTimeout);
      }
    };
  }, [currentDrawing]);

  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const startPos = (startY * canvas.width + startX) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];
    const startA = pixels[startPos + 3];

    const fillR = parseInt(fillColor.slice(1, 3), 16);
    const fillG = parseInt(fillColor.slice(3, 5), 16);
    const fillB = parseInt(fillColor.slice(5, 7), 16);

    const matchStartColor = (pos: number) => {
      return pixels[pos] === startR &&
             pixels[pos + 1] === startG &&
             pixels[pos + 2] === startB &&
             pixels[pos + 3] === startA;
    };

    const colorPixel = (pos: number) => {
      pixels[pos] = fillR;
      pixels[pos + 1] = fillG;
      pixels[pos + 2] = fillB;
      pixels[pos + 3] = 255;
    };

    const stack = [[startX, startY]];
    
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const currentPos = (y * canvas.width + x) * 4;

      if (!matchStartColor(currentPos)) continue;

      colorPixel(currentPos);

      if (x > 0) stack.push([x - 1, y]);
      if (x < canvas.width - 1) stack.push([x + 1, y]);
      if (y > 0) stack.push([x, y - 1]);
      if (y < canvas.height - 1) stack.push([x, y + 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);

    floodFill(x, y, color);
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

          const fileName = `painting_${Date.now()}.png`;
          const path = `${user.id}/${fileName}`;
          const { error: uploadError } = await supabase.storage
            .from("drawings")
            .upload(path, blob);

          if (uploadError) throw uploadError;

          const { error: dbError } = await supabase.from("drawings").insert({
            user_id: user.id,
            file_path: path,
            title: `Pintura ${new Date().toLocaleDateString()}`,
          });

          if (dbError) throw dbError;

          toast.success("Salvo na nuvem! ☁️");
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

  const reloadDrawing = () => {
    setLoading(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      );
      
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      
      ctx.drawImage(
        img,
        x, y,
        img.width * scale,
        img.height * scale
      );
      setLoading(false);
    };
    img.src = currentDrawing.imageUrl;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#4A342A]">
      <Navbar />

      {/* Barra de Ferramentas Principal */}
      <div className="w-full py-3 px-4 bg-[#3A2820] border-b border-[#5A443A] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="bg-[#FFB5C2] hover:bg-[#FF9AAB] text-black rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Seletor de Desenhos */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="text-white hover:bg-[#4A342A] gap-2"
              >
                <ImageIcon className="h-5 w-5" />
                Escolher Desenho
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Desenhos para Colorir</SheetTitle>
                <SheetDescription>
                  Escolha um desenho para começar a pintar
                </SheetDescription>
              </SheetHeader>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 overflow-y-auto max-h-[calc(100vh-200px)]">
                {COLORING_DRAWINGS.map((drawing) => (
                  <button
                    key={drawing.id}
                    onClick={() => {
                      setCurrentDrawing(drawing);
                      setLoading(true);
                    }}
                    className={`relative rounded-lg overflow-hidden hover:ring-2 hover:ring-[#FFB5C2] transition-all ${
                      currentDrawing.id === drawing.id
                        ? "ring-2 ring-[#FFB5C2] shadow-lg"
                        : "ring-1 ring-border"
                    }`}
                  >
                    <img
                      src={drawing.thumbnail}
                      alt={drawing.title}
                      className="w-full aspect-square object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/80 backdrop-blur-sm">
                      <p className="text-xs font-medium truncate">
                        {drawing.title}
                      </p>
                      {drawing.artist && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          por {drawing.artist}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <div className="text-white border-l border-[#5A443A] pl-4 ml-4">
            <p className="text-sm font-medium">{currentDrawing.title}</p>
            {currentDrawing.artist && (
              <p className="text-xs text-gray-400">por {currentDrawing.artist}</p>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost"
            onClick={reloadDrawing}
            disabled={loading}
            className="text-white hover:bg-[#4A342A]"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
          <Button 
            onClick={saveCanvas} 
            className="bg-[#FFB5C2] hover:bg-[#FF9AAB] text-black" 
            disabled={saving || loading}
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Salvando...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Barra de Controles */}
      <div className="w-full py-3 px-4 bg-[#3A2820] border-b border-[#5A443A]">
        <div className="flex items-center gap-8">
          {/* Cores */}
          <div className="flex items-center gap-4">
            <span className="text-white">Cores:</span>
            <div className="flex gap-1">
              {COLOR_PALETTES[activePalette].colors.slice(0, 10).map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === c ? "border-white scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-[#FFB5C2] hover:bg-[#FF9AAB] text-black"
                onClick={() => setShowColorPalettes(!showColorPalettes)}
              >
                <Palette className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
        
      {/* Área do Canvas */}
      <div className="h-full flex-1 p-4">
        <div className="h-full bg-white rounded-xl overflow-hidden border-2 border-[#5A443A] relative">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="cursor-pointer w-full h-full"
            style={{ 
              backgroundImage: `linear-gradient(45deg, #f5f5f5 25%, transparent 25%), 
                              linear-gradient(-45deg, #f5f5f5 25%, transparent 25%), 
                              linear-gradient(45deg, transparent 75%, #f5f5f5 75%), 
                              linear-gradient(-45deg, transparent 75%, #f5f5f5 75%)`,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}
          />
          {(loading || saving) && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="flex flex-col items-center text-white">
                <div className="h-8 w-8 border-4 border-t-transparent border-white rounded-full animate-spin mb-2" />
                <span>{loading ? "Carregando..." : "Salvando..."}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seletor de Paletas */}
      {showColorPalettes && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowColorPalettes(false)}>
          <div className="bg-[#3A2820] p-6 rounded-xl shadow-xl max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Paletas de Cores</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {COLOR_PALETTES.map((palette, index) => (
                <div key={palette.name} className="space-y-3">
                  <h4 className="text-sm font-medium text-white">{palette.name}</h4>
                  <div className="grid grid-cols-8 gap-2">
                    {palette.colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setColor(c);
                          setActivePalette(index);
                          setShowColorPalettes(false);
                        }}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                          color === c ? "border-white scale-110" : "border-transparent"
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
      )}
    </div>
  );
}