import { Bus, Shield, MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => (
  <footer className="border-t border-border mt-16">
    <div className="container py-12">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <h3 className="font-heading font-bold text-lg gradient-text mb-3">MANO</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            India's smartest bus booking platform. Travel comfortably with real-time seat selection and secure payments.
          </p>
        </div>
        <div>
          <h4 className="font-heading font-semibold text-sm mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer"><Bus className="h-3.5 w-3.5" /> Search Buses</li>
            <li className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer"><Shield className="h-3.5 w-3.5" /> My Bookings</li>
            <li className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer"><MapPin className="h-3.5 w-3.5" /> Popular Routes</li>
          </ul>
        </div>
        <div>
          <h4 className="font-heading font-semibold text-sm mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> support@manobus.in</li>
            <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> 1800-123-MANO</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MANO. All rights reserved. Built for seamless bus travel.
      </div>
    </div>
  </footer>
);

export default Footer;
