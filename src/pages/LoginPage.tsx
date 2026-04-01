import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, role } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setTimeout(() => {
        const r = role;
        if (r === 'operator') navigate('/operator');
        else if (r === 'admin') navigate('/admin');
        else navigate('/');
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
      <Header />
      <main className="container max-w-md py-16 relative z-10">
        <div className="glass rounded-2xl p-8 animate-slide-up">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full gradient-primary mx-auto flex items-center justify-center mb-4">
              <LogIn className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-heading font-bold">Welcome Back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-destructive text-sm text-center bg-destructive/10 rounded-lg p-2">{error}</p>}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-input/50 h-12" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-input/50 h-12" placeholder="••••••••" />
            </div>
            <Button type="submit" variant="amber" className="w-full" size="lg" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : 'Login'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">Register</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
