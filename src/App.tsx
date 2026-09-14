import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { CrmTourProvider } from "./context/CrmTourContext";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { LandingPage } from "./pages/LandingPage";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { RenewSubscriptionPage } from "./pages/RenewSubscriptionPage";
import { AppRoutes } from "./routes/AppRoutes";
import { PublicRoute } from "./routes/PublicRoute";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CrmTourProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/renew-subscription" element={<RenewSubscriptionPage />} />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/register/:slug"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route path="/*" element={<AppRoutes />} />
          </Routes>
          <Toaster richColors position="top-right" />
        </CrmTourProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
