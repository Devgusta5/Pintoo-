import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Paintbrush, Eraser, Type, Trash2, Save, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";

type Tool = "brush" | "eraser" | "text";

export default function Canvas() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#FA8CB1");
  const [brushSize, setBrushSize] = useState(3);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
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
        canvas.height = Math.min(600, window.innerHeight - 250);
        
        // Set white background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
    }
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

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
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
    if (!canvas || !user) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const fileName = `drawing_${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from("drawings")
          .upload(`${user.id}/${fileName}`, blob);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from("drawings").insert({
          user_id: user.id,
          file_path: `${user.id}/${fileName}`,
          title: `Desenho ${new Date().toLocaleDateString()}`,
        });

        if (dbError) throw dbError;

        toast.success("Salvo na nuvem! ☁️");
      });
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar");
    }
  };

  const colors = ["#FA8CB1", "#FDC5C9", "#CFB699", "#9E6D4E", "#000000"];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="mb-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Seu Canvas</h1>
        </div>

        {/* Tools */}
        <div className="mb-4 p-4 bg-card rounded-xl border space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={tool === "brush" ? "default" : "outline"}
              size="icon"
              onClick={() => setTool("brush")}
              className="hover-lift"
            >
              <Paintbrush className="h-5 w-5" />
            </Button>
            <Button
              variant={tool === "eraser" ? "default" : "outline"}
              size="icon"
              onClick={() => setTool("eraser")}
              className="hover-lift"
            >
              <Eraser className="h-5 w-5" />
            </Button>
            
            <div className="flex gap-2 ml-4">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 hover-lift ${
                    color === c ? "border-foreground scale-110" : "border-border"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={clearCanvas} className="hover-lift">
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar
              </Button>
              <Button onClick={saveCanvas} className="hover-lift">
                <Save className="h-4 w-4 mr-2" />
                Salvar
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
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-border">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            onMouseLeave={stopDrawing}
            className="cursor-crosshair w-full"
          />
        </div>
      </div>
    </div>
  );
}
