import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, CITIES_LIST } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SearchForm = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('2026-03-15');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to || !date) return;
    navigate(`/search?from=${from}&to=${to}&date=${date}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from" className="text-sm text-muted-foreground">From</Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger id="from" className="bg-input border-border">
                <SelectValue placeholder="Origin" />
              </SelectTrigger>
              <SelectContent>
                {CITIES_LIST.filter(c => c !== to).map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="to" className="text-sm text-muted-foreground">To</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger id="to" className="bg-input border-border">
                <SelectValue placeholder="Destination" />
              </SelectTrigger>
              <SelectContent>
                {CITIES_LIST.filter(c => c !== from).map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm text-muted-foreground">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-input border-border"
            />
          </div>
        </div>
        <Button type="submit" variant="amber" className="w-full" size="lg" disabled={!from || !to || !date}>
          Search Buses
        </Button>
      </div>
    </form>
  );
};

export default SearchForm;
