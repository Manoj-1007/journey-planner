import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import SearchResultsPage from "./pages/SearchResultsPage.tsx";
import PassengerDetailsPage from "./pages/PassengerDetailsPage.tsx";
import OtpVerificationPage from "./pages/OtpVerificationPage.tsx";
import PaymentPage from "./pages/PaymentPage.tsx";
import ConfirmationPage from "./pages/ConfirmationPage.tsx";
import BookingHistoryPage from "./pages/BookingHistoryPage.tsx";
import OperatorDashboard from "./pages/OperatorDashboard.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/passenger-details" element={<PassengerDetailsPage />} />
            <Route path="/otp-verify" element={<OtpVerificationPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/confirmation/:bookingId" element={<ConfirmationPage />} />
            <Route path="/bookings" element={<BookingHistoryPage />} />
            <Route path="/operator" element={<OperatorDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
