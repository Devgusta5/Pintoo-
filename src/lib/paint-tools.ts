export interface BrushPattern {
  id: string;
  name: string;
  pattern: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void;
}

export const BRUSH_PATTERNS: BrushPattern[] = [
  {
    id: "round",
    name: "Redondo",
    pattern: (ctx, x, y, size) => {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  },
  {
    id: "square",
    name: "Quadrado",
    pattern: (ctx, x, y, size) => {
      ctx.lineCap = "square";
      ctx.lineJoin = "miter";
    }
  },
  {
    id: "pixel",
    name: "Pixel",
    pattern: (ctx, x, y, size) => {
      ctx.fillRect(
        Math.floor(x / size) * size,
        Math.floor(y / size) * size,
        size,
        size
      );
    }
  },
  {
    id: "spray",
    name: "Spray",
    pattern: (ctx, x, y, size) => {
      // Reduz a densidade e usa um tamanho mínimo para os pontos
      const density = Math.min(size * 1.5, 30);
      const pointSize = Math.max(1, Math.floor(size / 10));
      
      for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * size;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;
        
        ctx.fillRect(
          Math.round(x + offsetX),
          Math.round(y + offsetY),
          pointSize,
          pointSize
        );
      }
    }
  },
  {
    id: "ribbon",
    name: "Fita",
    pattern: (ctx, x, y, size) => {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = size / 2;
      ctx.beginPath();
      ctx.moveTo(x - size/2, y);
      ctx.quadraticCurveTo(x, y + size/2, x + size/2, y);
      ctx.stroke();
    }
  },
  {
    id: "fur",
    name: "Granulado",
    pattern: (ctx, x, y, size) => {
      // Reduz o comprimento e número de linhas
      const length = Math.min(size * 1.5, 30);
      const lines = Math.min(3, Math.floor(size / 5));
      
      for (let i = 0; i < lines; i++) {
        const angle = Math.random() * Math.PI * 2;
        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;
        
        ctx.beginPath();
        ctx.moveTo(Math.round(x), Math.round(y));
        ctx.lineTo(Math.round(endX), Math.round(endY));
        ctx.stroke();
      }
    }
  }
];

export const PAINT_TOOLS = [
  {
    id: "brush",
    name: "Pincel",
    icon: "Paintbrush" as const,
  },
  {
    id: "bucket",
    name: "Balde",
    icon: "Droplet" as const,
  },
  {
    id: "eraser",
    name: "Borracha",
    icon: "Eraser" as const,
  },
  {
    id: "line",
    name: "Linha",
    icon: "Minus" as const,
  },
  {
    id: "rectangle",
    name: "Retângulo",
    icon: "Square" as const,
  },
  {
    id: "circle",
    name: "Círculo",
    icon: "Circle" as const,
  },
] as const;

export type IconName = typeof PAINT_TOOLS[number]["icon"];
export type PaintTool = typeof PAINT_TOOLS[number]["id"];