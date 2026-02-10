import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-person.png";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary/20 to-primary/5" />
      
      {/* Floating glass orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-[15%] w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)" }}
        />
        <motion.div 
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 right-[10%] w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)" }}
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[60%] left-[40%] w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(24 95% 53% / 0.06) 0%, transparent 70%)" }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full liquid-glass text-primary text-sm font-semibold mb-10"
            >
              <Zap size={15} className="fill-primary" />
              <span>Plataforma #1 de Vendas Digitais em Angola</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-8 leading-[1.1] tracking-tight"
            >
              Vende seus{" "}
              <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                e-books
              </span>{" "}
              e factura mais
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Publique conteúdos digitais, receba pagamentos via Multicaixa Express 
              e PayPay África. Tudo numa plataforma.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-14"
            >
              <Link to="/registro">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-10 py-7 w-full sm:w-auto rounded-2xl font-bold shadow-xl shadow-primary/25 transition-all hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5">
                  Começar a Vender
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
              <Link to="/loja">
                <Button className="liquid-glass text-foreground hover:bg-white/60 text-lg px-10 py-7 w-full sm:w-auto rounded-2xl font-semibold border-0">
                  Ver Loja
                </Button>
              </Link>
            </motion.div>

            {/* Stats - Liquid Glass Cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              {[
                { value: "5K+", label: "Vendedores" },
                { value: "24/7", label: "Suporte" },
                { value: "2", label: "Países" },
                { value: "85%", label: "Lucro" },
              ].map((stat, index) => (
                <motion.div 
                  key={index} 
                  whileHover={{ scale: 1.03 }}
                  className="liquid-glass rounded-2xl p-4 text-center transition-all"
                >
                  <div className="text-2xl font-display font-extrabold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Content - Hero Image with Glass Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative max-w-lg mx-auto">
              {/* Glass frame behind image */}
              <div className="absolute inset-4 rounded-[2.5rem] liquid-glass" />
              
              <img 
                src={heroImage} 
                alt="PayVendas" 
                className="w-full relative z-10"
              />

              {/* Floating notification cards */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 -right-6 liquid-glass rounded-2xl p-4 z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
                    <TrendingUp className="text-success" size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">Nova Venda</p>
                    <p className="text-sm font-bold text-success">+5.350 AOA</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-1/3 -left-6 liquid-glass rounded-2xl p-4 z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Zap className="text-primary fill-primary" size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">PDF Vendido</p>
                    <p className="text-sm font-bold text-primary">E-book Marketing</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
