import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const { data: buses = [] } = useQuery({
    queryKey: ['admin-buses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('buses').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user && role === 'admin',
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bookings').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user && role === 'admin',
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user && role === 'admin',
  });

  if (!user || role !== 'admin') { navigate('/login'); return null; }

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.total_amount, 0);

  const routeRevenue: Record<string, number> = {};
  confirmedBookings.forEach(b => {
    const route = `${b.route_from}-${b.route_to}`;
    routeRevenue[route] = (routeRevenue[route] || 0) + b.total_amount;
  });
  const routeData = Object.entries(routeRevenue).map(([route, revenue]) => ({ route, revenue }));

  const statusData = [
    { name: 'Confirmed', value: confirmedBookings.length },
    { name: 'Cancelled', value: cancelledBookings.length },
  ];
  const COLORS = ['hsl(164, 100%, 39%)', 'hsl(0, 72%, 51%)'];

  const stats = [
    { label: 'Total Users', value: profiles.length },
    { label: 'Total Buses', value: buses.length },
    { label: 'Total Bookings', value: bookings.length },
    { label: 'Revenue', value: `₹${totalRevenue.toLocaleString()}` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <h1 className="text-xl font-heading font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {stats.map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-heading font-bold text-primary">{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="font-heading font-semibold text-sm mb-4">Revenue by Route</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={routeData}>
                <XAxis dataKey="route" tick={{ fill: 'hsl(0, 0%, 60%)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(0, 0%, 60%)', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 17%)', border: '1px solid hsl(0, 0%, 25%)', borderRadius: 6, color: 'hsl(0, 0%, 92%)' }} />
                <Bar dataKey="revenue" fill="hsl(43, 100%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="font-heading font-semibold text-sm mb-4">Booking Status</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, idx) => <Cell key={idx} fill={COLORS[idx]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 17%)', border: '1px solid hsl(0, 0%, 25%)', borderRadius: 6, color: 'hsl(0, 0%, 92%)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="font-heading font-semibold text-sm mb-4">All Bookings</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="pb-2 pr-4 font-medium">ID</th>
                  <th className="pb-2 pr-4 font-medium">Bus</th>
                  <th className="pb-2 pr-4 font-medium">Route</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono text-xs text-primary">{b.id.slice(0, 8)}</td>
                    <td className="py-2 pr-4">{b.bus_name}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{b.route_from} → {b.route_to}</td>
                    <td className="py-2 pr-4 font-mono text-muted-foreground">{b.date}</td>
                    <td className="py-2 pr-4 font-heading font-semibold">₹{b.total_amount}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        b.status === 'confirmed' ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'
                      }`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
