import { motion } from "framer-motion";
import { Lock, ShieldCheck } from "lucide-react";
import multicaixaLogo from "@/assets/multicaixa-logo.webp";
import pliqpagLogo from "@/assets/pliqpag-logo.png";

const paymentMethods = [
  {
    logo: multicaixaLogo,
    name: "Multicaixa Express",
    description: "Pagamento por referência com confirmação automática",
  },
  {
    logo: pliqpagLogo,
    name: "PlinqPay",
    description: "Entidade 01055 com geração de referência em tempo real",
  },
];

export const PaymentMethodsSection = () => {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-foreground mb-5 tracking-tight">
            Métodos de{" "}
            <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
              Pagamento
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Utilizamos os principais métodos de pagamento de Angola.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {paymentMethods.map((method, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12 }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className="liquid-glass rounded-3xl p-8 text-center group cursor-default"
            >
              <div className="w-20 h-20 rounded-2xl liquid-glass flex items-center justify-center mx-auto mb-5 p-3 group-hover:shadow-lg transition-shadow">
                <img src={method.logo} alt={method.name} className="w-full h-full object-contain" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {method.name}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {method.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-8 mt-14"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock size={16} className="text-primary" />
            <span className="text-sm font-semibold">Pagamentos 100% Seguros</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck size={16} className="text-primary" />
            <span className="text-sm font-semibold">Verificação KYC</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
