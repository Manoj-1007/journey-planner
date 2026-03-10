import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useStore } from '@/store/useStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const currentUser = useStore(s => s.currentUser);
  const buses = useStore(s => s.buses);
  const bookings = useStore(s => s.bookings);
  const users = useStore(s => s.users);
  const navigate = useNavigate();

  if (!currentUser || currentUser.role !== 'admin') {
    navigate('/login');
    return null;
  }

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

  // Revenue by route
  const routeRevenue: Record<string, number> = {};
  confirmedBookings.forEach(b => {
    const route = `${b.from}-${b.to}`;
    routeRevenue[route] = (routeRevenue[route] || 0) + b.totalAmount;
  });
  const routeData = Object.entries(routeRevenue).map(([route, revenue]) => ({ route, revenue }));

  const statusData = [
    { name: 'Confirmed', value: confirmedBookings.length },
    { name: 'Cancelled', value: cancelledBookings.length },
  ];
  const COLORS = ['hsl(164, 100%, 39%)', 'hsl(0, 72%, 51%)'];

  const stats = [
    { label: 'Total Users', value: users.filter(u => u.role === 'user').length },
    { label: 'Total Buses', value: buses.length },
    { label: 'Total Bookings', value: bookings.length },
    { label: 'Revenue', value: `₹${totalRevenue.toLocaleString()}` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <h1 className="text-xl font-heading font-bold mb-6">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {stats.map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-heading font-bold text-primary">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
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
                  {statusData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 17%)', border: '1px solid hsl(0, 0%, 25%)', borderRadius: 6, color: 'hsl(0, 0%, 92%)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Bookings */}
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
                    <td className="py-2 pr-4 font-mono text-xs text-primary">{b.id}</td>
                    <td className="py-2 pr-4">{b.busName}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{b.from} → {b.to}</td>
                    <td className="py-2 pr-4 font-mono text-muted-foreground">{b.date}</td>
                    <td className="py-2 pr-4 font-heading font-semibold">₹{b.totalAmount}</td>
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
