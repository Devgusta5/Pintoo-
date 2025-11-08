import { Layout } from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { Github, Mail, Paintbrush2, FileText, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Paintbrush2,
    title: "Desenho Digital",
    description: "Crie desenhos digitais de forma simples e intuitiva"
  },
  {
    icon: FileText,
    title: "Editor de Texto",
    description: "Escreva e formate seus textos com facilidade"
  },
  {
    icon: Brain,
    title: "Simplicidade",
    description: "Interface intuitiva e fácil de usar"
  }
];

export default function About() {
  return (
    <Layout>
      <div className="flex flex-1 min-h-[calc(100vh-64px)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background to-muted/50">
          {/* Hero Section */}
          <section className="relative overflow-hidden py-20">
            <div className="container mx-auto px-4 animate-fade-in">
              <div className="text-center">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 text-transparent bg-clip-text animate-slide-up">
                  Pintoo
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up-delayed">
                  Uma plataforma criativa para desenhar e escrever, projetada para ser simples e eficiente.
                </p>
              </div>
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 -z-10 overflow-hidden opacity-0 animate-fade-in">
              <div className="absolute inset-0 bg-grid-primary/20 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-slide-up">
                {features.map((feature, index) => (
                  <div
                    key={feature.title}
                    className="p-6 rounded-xl bg-card border transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    style={{ animationDelay: `${0.2 * index}s` }}
                  >
                    <feature.icon className="w-12 h-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Developer Section */}
          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center animate-slide-up">
                <h2 className="text-3xl font-bold mb-6">Sobre o Desenvolvedor</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Olá! Sou Gustavo, um desenvolvedor apaixonado por criar ferramentas que tornam a vida mais simples e criativa.
                  O Pintoo nasceu da ideia de ter um espaço digital simples para desenhar e escrever, sem complicações.
                </p>
                <div className="flex justify-center gap-4">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => window.open('https://github.com/Devgusta5')}
                    className="transition-all duration-300 hover:-translate-y-1"
                  >
                    <Github className="mr-2 h-5 w-5" />
                    GitHub
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => window.location.href = 'mailto:seu-email@exemplo.com'}
                    className="transition-all duration-300 hover:-translate-y-1"
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    Contato
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
}