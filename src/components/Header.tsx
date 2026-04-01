import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User, Bus, BarChart3 } from 'lucide-react';

const Header = () => {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="glass-strong sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="font-heading text-xl font-bold gradient-text">
          🚌 BusGo
        </Link>
        <nav className="flex items-center gap-2">
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
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button variant="amber" size="sm" onClick={() => navigate('/register')}>
                Register
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
