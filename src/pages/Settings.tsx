import { Layout } from "@/components/Layout";
import { Sidebar } from "@/components/Sidebar";
import { Settings2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  return (
    <Layout>
      <div className="flex flex-1 h-[calc(100vh-64px)]">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-gradient-to-br from-background to-muted/50">
          <div className="max-w-6xl mx-auto flex flex-col items-center justify-center h-full">
            <motion.div 
              className="flex flex-col items-center gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="text-primary/20"
                >
                  <Settings2 className="w-48 h-48" />
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 text-primary/40"
                >
                  <Settings2 className="w-48 h-48" />
                </motion.div>
              </div>

              <motion.h1 
                className="text-4xl font-bold text-foreground/80"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Em Breve
              </motion.h1>

              <motion.p 
                className="text-lg text-muted-foreground text-center max-w-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                Estamos trabalhando para trazer as melhores configurações e personalizações para sua experiência.
              </motion.p>
            </motion.div>
          </div>
        </main>
      </div>
    </Layout>
  );
}