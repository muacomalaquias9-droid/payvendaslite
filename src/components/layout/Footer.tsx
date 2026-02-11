import { Link } from "react-router-dom";
import { AlertTriangle, Lock, ShieldCheck } from "lucide-react";
import payvendasLogo from "@/assets/payvendas-logo.png";

export const Footer = () => {
  return (
    <footer className="border-t border-border/30 bg-background">
      {/* Risk Warning */}
      <div className="bg-destructive/5 border-b border-destructive/10 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-start gap-3 text-sm">
            <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              <span className="text-destructive font-bold">Aviso de Risco:</span>{" "}
              O mercado financeiro envolve riscos significativos. A PayVendas não garante lucros. 
              Todo conteúdo é educativo e não constitui aconselhamento financeiro.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={payvendasLogo} alt="PayVendas" className="h-10" />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Vende seus e-books e factura mais. Plataforma líder de vendas digitais em Angola e Moçambique.
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold text-foreground mb-4">Plataforma</h4>
            <ul className="space-y-2.5">
              {[
                { to: "/loja", label: "Loja de PDFs" },
                { to: "/trading", label: "Trading" },
                { to: "/carteira", label: "Carteira Digital" },
                { to: "/chat", label: "Chat da Comunidade" },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {[
                { to: "/termos", label: "Termos de Uso" },
                { to: "/privacidade", label: "Política de Privacidade" },
                { to: "/kyc", label: "Verificação KYC" },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-foreground mb-4">Suporte</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:suporte@payvendas.ao" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                  suporte@payvendas.ao
                </a>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/30 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 PayVendas. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <Lock size={14} className="text-primary" />
              <span>Seguro</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <ShieldCheck size={14} className="text-primary" />
              <span>KYC Obrigatório</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
