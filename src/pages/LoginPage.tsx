import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useStore(s => s.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(email, password);
    if (success) {
      const user = useStore.getState().currentUser;
      if (user?.role === 'operator') navigate('/operator');
      else if (user?.role === 'admin') navigate('/admin');
      else navigate('/');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-md py-16">
        <h1 className="text-2xl font-heading font-bold mb-6">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-lg p-6">
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-input" placeholder="user@test.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-input" placeholder="password" />
          </div>
          <Button type="submit" variant="amber" className="w-full">Login</Button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Demo: user@test.com / operator@test.com / admin@test.com — password: password
          </p>
        </form>
      </main>
    </div>
  );
};

export default LoginPage;
