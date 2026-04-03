import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User, Bus, BarChart3, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import manoLogo from '@/assets/mano-logo.png';

const Header = () => {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('mano-theme');
    if (saved === 'light') {
      setIsDark(false);
      document.documentElement.classList.add('light');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.remove('light');
        localStorage.setItem('mano-theme', 'dark');
      } else {
        document.documentElement.classList.add('light');
        localStorage.setItem('mano-theme', 'light');
      }
      return next;
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="glass-strong sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={manoLogo} alt="MANO" width={36} height={36} className="rounded-lg" />
          <span className="font-heading text-xl font-bold gradient-text">MANO</span>
        </Link>
        <nav className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            Home
          </Button>
          {user ? (
            <>
              {role === 'user' && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')} className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">My Bookings</span>
                </Button>
              )}
              {role === 'operator' && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/operator')} className="gap-2">
                  <Bus className="h-4 w-4" />
                  <span className="hidden sm:inline">Operator</span>
                </Button>
              )}
              {role === 'admin' && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              )}
              <span className="text-sm text-muted-foreground hidden sm:inline">{profile?.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
              <Button variant="amber" size="sm" onClick={() => navigate('/register')}>Register</Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
