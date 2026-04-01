import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ShieldCheck, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

const OtpVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const busId = searchParams.get('busId') || '';
  const seats = searchParams.get('seats') || '';
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [failed, setFailed] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const generateOtp = useCallback(() => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setSent(true);
    setCooldown(30);
    setFailed(false);
    toast.success(`OTP sent! (Demo: ${code})`, { duration: 8000 });
  }, []);

  useEffect(() => {
    if (!sent) generateOtp();
  }, [sent, generateOtp]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleVerify = () => {
    if (!otp.trim()) {
      toast.error('Please enter the OTP');
      return;
    }
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      toast.error('OTP must be a 6-digit number');
      return;
    }
    setVerifying(true);
    setTimeout(() => {
      if (otp === generatedOtp) {
        setVerified(true);
        setFailed(false);
        toast.success('OTP verified successfully!');
        sessionStorage.setItem('otpVerified', 'true');
        setTimeout(() => navigate(`/payment?busId=${busId}&seats=${seats}`), 800);
      } else {
        setFailed(true);
        toast.error('Incorrect OTP. Please try again.');
      }
      setVerifying(false);
    }, 600);
  };

  const handleResend = () => {
    setOtp('');
    generateOtp();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center text-muted-foreground">Loading...</main>
      </div>
    );
  }

  const contactInfo = profile?.phone || user.email || '';

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
      <Header />
      <main className="container max-w-sm py-16 relative z-10">
        <div className="glass rounded-2xl p-8 space-y-6 text-center animate-slide-up">
          {verified ? (
            <CheckCircle2 className="h-16 w-16 text-accent mx-auto animate-fade-in" />
          ) : failed ? (
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
          ) : (
            <ShieldCheck className="h-16 w-16 text-primary mx-auto animate-float" />
          )}
          <div>
            <h1 className="text-xl font-heading font-bold mb-1">
              {verified ? 'Verified!' : 'OTP Verification'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {verified
                ? 'Redirecting to payment...'
                : <>A 6-digit code has been sent to <span className="text-foreground font-medium">{contactInfo}</span></>
              }
            </p>
          </div>

          {!verified && (
            <div className="space-y-3">
              <Input
                className={`text-center text-lg tracking-[0.5em] font-mono bg-input/50 h-14 rounded-xl ${failed ? 'border-destructive' : ''}`}
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setFailed(false); }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
              />

              {failed && (
                <p className="text-xs text-destructive font-medium">Incorrect OTP. Please try again.</p>
              )}

              <Button variant="amber" className="w-full" size="lg" onClick={handleVerify} disabled={verifying}>
                {verifying ? 'Verifying...' : 'Verify & Proceed'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={handleResend}
                disabled={cooldown > 0}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OtpVerificationPage;
