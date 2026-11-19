import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { GuestRoute, ProtectedRoute } from './components/layout/RouteGuards';
import { AuthProvider } from './context/AuthContext';
import { JournalProvider } from './context/JournalContext';
import { ThemeProvider } from './context/ThemeContext';
import { Journal } from './pages/Journal';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

const Progress = lazy(() =>
  import('./pages/Progress').then((module) => ({ default: module.Progress })),
);

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <JournalProvider>
            <Routes>
              <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
              <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

              <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                <Route path="/journal" element={<Journal />} />
                <Route
                  path="/progress"
                  element={
                    <Suspense fallback={<div className="h-64" aria-label="Loading progress" />}>
                      <Progress />
                    </Suspense>
                  }
                />
              </Route>

              <Route path="*" element={<Navigate to="/journal" replace />} />
            </Routes>
          </JournalProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
