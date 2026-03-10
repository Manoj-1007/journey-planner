import Header from '@/components/Header';
import SearchForm from '@/components/SearchForm';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-16 sm:py-24">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold mb-2">
            Where to?
          </h1>
          <p className="text-muted-foreground text-sm">Find and book your bus. No fuss.</p>
        </div>
        <SearchForm />
      </main>
    </div>
  );
};

export default Index;
