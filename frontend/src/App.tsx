import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/AuthContext';
import { ElectionProvider } from '@/context/ElectionContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Layout from '@/components/layout/Layout';
import { Skeleton } from '@/components/ui/skeleton';

const HomePage = lazy(() => import('@/pages/HomePage'));
const CandidatesPage = lazy(() => import('@/pages/CandidatesPage'));
const VotePage = lazy(() => import('@/pages/VotePage'));
const ResultsPage = lazy(() => import('@/pages/ResultsPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));

function PageLoader() {
  return (
    <div className="space-y-6 py-8" role="status" aria-label="Loading page">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <BrowserRouter>
        <AuthProvider>
          <ElectionProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route
                  index
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <HomePage />
                    </Suspense>
                  }
                />
                <Route
                  path="candidates"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <CandidatesPage />
                    </Suspense>
                  }
                />
                <Route
                  path="vote"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <VotePage />
                    </Suspense>
                  }
                />
                <Route
                  path="results"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <ResultsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="admin"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <AdminPage />
                    </Suspense>
                  }
                />
                <Route
                  path="login"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <LoginPage />
                    </Suspense>
                  }
                />
              </Route>
            </Routes>
            <Toaster richColors position="bottom-right" />
          </ElectionProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
