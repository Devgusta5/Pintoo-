import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Paintbrush2, FileText, Palette } from "lucide-react";
import { useDevice } from "@/hooks/use-mobile";

interface StatsCardsProps {
  drawings: number;
  paintings: number;
  notes: number;
}

export function StatsCards({ drawings, paintings, notes }: StatsCardsProps) {
  const { isMobile } = useDevice();

  const stats = [
    {
      name: "Desenhos",
      value: drawings,
      icon: Paintbrush2,
      description: "desenhos livres",
      className: "bg-blue-500/10 text-blue-500"
    },
    {
      name: "Pinturas",
      value: paintings,
      icon: Palette,
      description: "pinturas salvas",
      className: "bg-purple-500/10 text-purple-500"
    },
    {
      name: "Textos",
      value: notes,
      icon: FileText,
      description: "textos salvos",
      className: "bg-green-500/10 text-green-500"
    }
  ];

  return (
    <div className={cn(
      "grid gap-4",
      isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
    )}>
      {stats.map((stat) => (
        <Card key={stat.name} className="hover-lift">
          <CardContent className="flex items-center p-6">
            <div className={cn(
              "p-2 rounded-full mr-4",
              stat.className
            )}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}