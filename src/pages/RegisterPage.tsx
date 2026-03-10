import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const register = useStore(s => s.register);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = register({ name, email, phone }, password);
    if (success) navigate('/');
    else setError('Email already registered');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-md py-16">
        <h1 className="text-2xl font-heading font-bold mb-6">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-lg p-6">
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} required className="bg-input" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-input" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="bg-input" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-input" minLength={6} />
          </div>
          <Button type="submit" variant="amber" className="w-full">Create Account</Button>
        </form>
      </main>
    </div>
  );
};

export default RegisterPage;
