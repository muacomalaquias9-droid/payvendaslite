import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import payvendasLogo from "@/assets/payvendas-logo.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { href: "/loja", label: "Loja de PDFs" },
  { href: "/trading", label: "Trading" },
  { href: "/carteira", label: "Carteira" },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, profile, signOut, loading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 liquid-glass border-b-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={payvendasLogo} alt="PayVendas" className="h-10" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-foreground/70 hover:text-foreground hover:bg-white/40"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-8 bg-secondary rounded-xl animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link to="/trading">
                  <Button 
                    size="sm"
                    className="liquid-glass text-foreground hover:bg-white/50 rounded-xl font-semibold border-0"
                  >
                    👤 {profile?.full_name?.split(' ')[0] || 'Conta'}
                  </Button>
                </Link>
                <Button 
                  size="sm"
                  variant="ghost" 
                  className="text-muted-foreground hover:text-foreground rounded-xl"
                  onClick={() => signOut()}
                >
                  Sair
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button 
                    size="sm"
                    variant="ghost" 
                    className="text-foreground/70 hover:text-foreground rounded-xl font-semibold"
                  >
                    Entrar
                  </Button>
                </Link>
                <Link to="/registro">
                  <Button 
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl font-bold"
                  >
                    Criar Conta
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl liquid-glass text-foreground"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden liquid-glass border-t border-white/20"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/70 hover:bg-white/30"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="flex gap-2 mt-4 pt-4 border-t border-border/30">
                {user ? (
                  <>
                    <Link to="/trading" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full liquid-glass text-foreground hover:bg-white/40 border-0 rounded-xl">
                        Dashboard
                      </Button>
                    </Link>
                    <Button 
                      className="flex-1 bg-transparent border border-border/30 text-foreground rounded-xl"
                      onClick={() => { signOut(); setIsMenuOpen(false); }}
                    >
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full liquid-glass text-foreground hover:bg-white/40 border-0 rounded-xl">
                        Entrar
                      </Button>
                    </Link>
                    <Link to="/registro" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold">
                        Registar
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
