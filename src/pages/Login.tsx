import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import payvendasLogo from "@/assets/payvendas-logo.png";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/trading");
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary/20 to-primary/5" />
      
      {/* Floating orbs */}
      <motion.div 
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)" }}
      />
      <motion.div 
        animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)" }}
      />

      {/* Left - Branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative">
        <div className="text-center max-w-md px-8">
          <motion.img 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            src={payvendasLogo} 
            alt="PayVendas" 
            className="h-20 mx-auto mb-10" 
          />
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-display font-extrabold text-foreground mb-5 tracking-tight"
          >
            Vende seus e-books e factura mais
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg leading-relaxed"
          >
            Aceda à sua conta e comece a vender seus conteúdos digitais.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-6 mt-14"
          >
            <div className="flex items-center gap-2 text-muted-foreground liquid-glass rounded-full px-4 py-2">
              <span>🔐</span>
              <span className="text-sm font-semibold">Seguro</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground liquid-glass rounded-full px-4 py-2">
              <span>🌍</span>
              <span className="text-sm font-semibold">Angola & Moçambique</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right - Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-10 text-center">
            <img src={payvendasLogo} alt="PayVendas" className="h-16 mx-auto" />
          </div>

          <div className="liquid-glass rounded-3xl p-8">
            <div className="text-center mb-8">
              <h1 className="font-display text-2xl font-extrabold text-foreground mb-2 tracking-tight">
                Iniciar Sessão
              </h1>
              <p className="text-muted-foreground text-sm">
                Aceda à sua conta PayVendas
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground text-sm font-semibold">
                  Email
                </Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">📧</span>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-13 bg-white/50 border-white/30 text-foreground placeholder:text-muted-foreground focus:border-primary rounded-xl backdrop-blur-sm"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground text-sm font-semibold">
                  Senha
                </Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">🔑</span>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-10 h-13 bg-white/50 border-white/30 text-foreground placeholder:text-muted-foreground focus:border-primary rounded-xl backdrop-blur-sm"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input 
                    type="checkbox" 
                    className="rounded border-border bg-white/50 w-4 h-4 text-primary focus:ring-primary" 
                  />
                  Lembrar-me
                </label>
                <Link to="/recuperar-senha" className="text-sm text-primary hover:underline font-semibold">
                  Esqueceu?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full h-13 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="ml-2" size={18} />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm">
                Não tem conta?{" "}
                <Link to="/registro" className="text-primary hover:underline font-bold">
                  Criar conta
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[11px] text-muted-foreground">
              Disponível apenas para Angola e Moçambique
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
