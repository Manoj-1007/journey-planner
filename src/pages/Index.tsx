import Header from '@/components/Header';
import SearchForm from '@/components/SearchForm';
import { Bus, Shield, Clock, CreditCard, MapPin, Star } from 'lucide-react';

const features = [
  { icon: Shield, title: 'Secure Booking', desc: 'OTP verified payments with end-to-end security' },
  { icon: Clock, title: 'Real-time Seats', desc: 'Live seat availability updated instantly' },
  { icon: CreditCard, title: 'Easy Payments', desc: 'UPI, cards, and wallets — pay your way' },
  { icon: MapPin, title: '10+ Cities', desc: 'Routes across major Indian cities' },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/10 blur-[100px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }} />

      <Header />

      <main className="container relative z-10">
        {/* Hero Section */}
        <section className="py-20 sm:py-28 text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-muted-foreground mb-6">
            <Star className="h-4 w-4 text-primary" />
            Trusted by 10,000+ travelers
          </div>

          <h1 className="text-4xl sm:text-6xl font-heading font-bold mb-4 leading-tight">
            Travel Smarter with{' '}
            <span className="gradient-text">BusGo</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Book bus tickets in seconds. Choose your seats, verify with OTP, pay securely, and download your ticket — all in one smooth flow.
          </p>

          {/* Bus illustration */}
          <div className="flex justify-center mb-12">
            <div className="relative">
              <div className="text-7xl animate-float">🚌</div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-3 bg-primary/20 rounded-full blur-md" />
            </div>
          </div>

          <SearchForm />
        </section>

        {/* Features Grid */}
        <section className="py-16 border-t border-border">
          <h2 className="text-2xl font-heading font-bold text-center mb-10">
            Why choose <span className="gradient-text">BusGo</span>?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="glass rounded-xl p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 group animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-heading font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2026 BusGo. Built for seamless bus travel.</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
