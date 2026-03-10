import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { LogOut, User, Bus, BarChart3 } from 'lucide-react';

const Header = () => {
  const { currentUser, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="font-heading text-lg font-bold text-primary">
          Vagabond
        </Link>
        <nav className="flex items-center gap-3">
          {currentUser ? (
            <>
              {currentUser.role === 'user' && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')} className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">My Bookings</span>
                </Button>
              )}
              {currentUser.role === 'operator' && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/operator')} className="gap-2">
                  <Bus className="h-4 w-4" />
                  <span className="hidden sm:inline">Operator Dashboard</span>
                </Button>
              )}
              {currentUser.role === 'admin' && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin Dashboard</span>
                </Button>
              )}
              <span className="text-sm text-muted-foreground hidden sm:inline">{currentUser.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
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
