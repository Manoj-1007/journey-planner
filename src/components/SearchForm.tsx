import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowRight } from 'lucide-react';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Lucknow'];

const SearchForm = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('2026-04-01');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to || !date) return;
    navigate(`/search?from=${from}&to=${to}&date=${date}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div className="glass-strong rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Search className="h-5 w-5 text-primary" />
          <span className="font-heading font-semibold text-foreground">Find your bus</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from" className="text-xs text-muted-foreground uppercase tracking-wider">From</Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger id="from" className="bg-input/50 border-border h-12 rounded-lg">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.filter(c => c !== to).map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="to" className="text-xs text-muted-foreground uppercase tracking-wider">To</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger id="to" className="bg-input/50 border-border h-12 rounded-lg">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.filter(c => c !== from).map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-xs text-muted-foreground uppercase tracking-wider">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-input/50 border-border h-12 rounded-lg"
            />
          </div>
        </div>
        <Button type="submit" variant="amber" className="w-full" size="lg" disabled={!from || !to || !date}>
          Search Buses <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </form>
  );
};

export default SearchForm;
