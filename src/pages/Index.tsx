import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchForm from '@/components/SearchForm';
import { Shield, Clock, CreditCard, MapPin, Star, Sparkles, TrendingUp } from 'lucide-react';
import manoLogo from '@/assets/mano-logo.png';

const features = [
  { icon: Shield, title: 'Secure Booking', desc: 'OTP verified payments with end-to-end security' },
  { icon: Clock, title: 'Real-time Seats', desc: 'Live seat availability updated instantly' },
  { icon: CreditCard, title: 'Easy Payments', desc: 'UPI, cards, and wallets — pay your way' },
  { icon: MapPin, title: '10+ Cities', desc: 'Routes across major Indian cities' },
];

const popularRoutes = [
  { from: 'Mumbai', to: 'Pune', price: '₹350', time: '3h 30m' },
  { from: 'Delhi', to: 'Jaipur', price: '₹500', time: '5h' },
  { from: 'Bangalore', to: 'Chennai', price: '₹600', time: '6h' },
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
            <span className="gradient-text">MANO</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Book bus tickets in seconds. Choose your seats, verify with OTP, pay securely, and download your ticket — all in one smooth flow.
          </p>

          {/* Logo illustration */}
          <div className="flex justify-center mb-12">
            <div className="relative">
              <img src={manoLogo} alt="MANO" width={100} height={100} className="animate-float" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-3 bg-primary/20 rounded-full blur-md" />
            </div>
          </div>

          <SearchForm />
        </section>

        {/* Features Grid */}
        <section className="py-16 border-t border-border">
          <h2 className="text-2xl font-heading font-bold text-center mb-10">
            Why choose <span className="gradient-text">MANO</span>?
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

        {/* Popular Routes */}
        <section className="py-16 border-t border-border">
          <div className="flex items-center justify-center gap-2 mb-10">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-heading font-bold">Popular Routes</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {popularRoutes.map((r, i) => (
              <div key={i} className="glass rounded-xl p-5 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-heading font-semibold">{r.from}</span>
                  <span className="text-primary">→</span>
                  <span className="font-heading font-semibold">{r.to}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Starting {r.price}</span>
                  <span>{r.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Offers */}
        <section className="py-16 border-t border-border">
          <div className="glass rounded-2xl p-8 sm:p-12 text-center gradient-primary relative overflow-hidden">
            <Sparkles className="h-8 w-8 text-primary-foreground mx-auto mb-4 animate-float" />
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-primary-foreground mb-2">First Ride Offer!</h2>
            <p className="text-primary-foreground/80 mb-4">Get 20% off on your first bus booking with MANO. Use code <span className="font-mono font-bold text-primary-foreground">MANO20</span></p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
