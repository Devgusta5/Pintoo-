import { Paintbrush, Type, Droplet, Home, Settings, HelpCircle, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useDevice } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const tools = [
  {
    name: "Desenho Livre",
    icon: Paintbrush,
    description: "Desenhe livremente",
    route: "/draw",
  },
  {
    name: "Pintura",
    icon: Droplet,
    description: "Pinte desenhos",
    route: "/paint",
  },
  {
    name: "Texto",
    icon: Type,
    description: "Crie anotações com estilo",
    route: "/text",
  },
];

const additionalItems = [
  {
    name: "Início",
    icon: Home,
    route: "/",
  },
  {
    name: "Configurações",
    icon: Settings,
    route: "/settings",
  },
  {
    name: "Sobre",
    icon: HelpCircle,
    route: "/help",
  },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, isTablet } = useDevice();
  
  const isActiveRoute = (route: string) => {
    return location.pathname === route;
  };

  const renderToolButton = (tool: typeof tools[0] | typeof additionalItems[0], showLabels = false) => (
    <Button
      variant={isActiveRoute(tool.route) ? "secondary" : "ghost"}
      size={showLabels ? "default" : "icon"}
      className={cn(
        showLabels ? "w-full justify-start" : "h-10 w-10 rounded-full",
        "transition-all duration-200",
        !showLabels && "hover:bg-accent/50 hover:scale-105 active:scale-95",
        isActiveRoute(tool.route) && !showLabels && "bg-accent border border-accent-foreground/10"
      )}
      onClick={() => navigate(tool.route)}
    >
      <tool.icon className={cn(
        "h-5 w-5 transition-transform duration-200",
        isActiveRoute(tool.route) && "text-primary",
        !showLabels && isActiveRoute(tool.route) && "scale-110",
        showLabels && "mr-2"
      )} />
      {showLabels && (
        <span className="flex-1 text-left">
          {tool.name}
          {'description' in tool && (
            <span className="block text-xs text-muted-foreground">
              {tool.description}
            </span>
          )}
        </span>
      )}
    </Button>
  );

  // Mobile view (drawer)
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed right-4 bottom-4 h-12 w-12 rounded-full shadow-lg z-50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh] pt-8">
          <div className="grid gap-4">
            <div className="grid gap-2">
              {tools.map((tool) => (
                <div key={tool.name}>
                  {renderToolButton(tool, true)}
                </div>
              ))}
            </div>
            <div className="h-[1px] bg-border" />
            <div className="grid gap-2">
              {additionalItems.map((item) => (
                <div key={item.name}>
                  {renderToolButton(item, true)}
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Tablet/Desktop view (bottom bar)
  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        "fixed left-1/2 -translate-x-1/2 bottom-4 flex items-center gap-2 p-2",
        "bg-background/80 backdrop-blur-sm border rounded-full shadow-lg z-50"
      )}>
        {/* Ferramentas Principais */}
        {tools.map((tool) => (
          <Tooltip key={tool.name}>
            <TooltipTrigger asChild>
              {renderToolButton(tool)}
            </TooltipTrigger>
            <TooltipContent side="top" className="font-medium">
              <p>{tool.name}</p>
              <p className="text-xs text-muted-foreground">{tool.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        <div className="w-[1px] h-8 bg-border mx-1" />

        {/* Itens Adicionais */}
        {additionalItems.map((item) => (
          <Tooltip key={item.name}>
            <TooltipTrigger asChild>
              {renderToolButton(item)}
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{item.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}