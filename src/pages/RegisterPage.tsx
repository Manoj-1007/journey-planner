import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { UserPlus, Loader2 } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const { error } = await signUp(email, password, name, phone, role);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Account created! Check your email to confirm, then login.');
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/8 blur-[100px] pointer-events-none" />
      <Header />
      <main className="container max-w-md py-12 relative z-10">
        <div className="glass rounded-2xl p-8 animate-slide-up">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full gradient-primary mx-auto flex items-center justify-center mb-4">
              <UserPlus className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-heading font-bold">Create Account</h1>
            <p className="text-sm text-muted-foreground mt-1">Join BusGo and start booking</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-destructive text-sm text-center bg-destructive/10 rounded-lg p-2">{error}</p>}
            {success && <p className="text-accent text-sm text-center bg-accent/10 rounded-lg p-2">{success}</p>}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required className="bg-input/50 h-12" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-input/50 h-12" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone</Label>
              <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="bg-input/50 h-12" placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-input/50 h-12" minLength={6} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Register as</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-input/50 h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Traveler</SelectItem>
                  <SelectItem value="operator">Bus Operator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" variant="amber" className="w-full" size="lg" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : 'Create Account'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Login</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
