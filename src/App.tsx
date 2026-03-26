import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import MarketingLayout from "@/layouts/MarketingLayout";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import CoursesPage from "./pages/CoursesPage.tsx";
import CourseDetailPage from "./pages/CourseDetailPage.tsx";
import InstructorsListPage from "./pages/InstructorsListPage.tsx";
import InstructorPage from "./pages/InstructorPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import LearnPage from "./pages/LearnPage.tsx";
import ClassroomPage from "./pages/ClassroomPage.tsx";
import WishlistPage from "./pages/WishlistPage.tsx";
import LessonPlayerPage from "./pages/LessonPlayerPage.tsx";
import InstructorStudioPage from "./pages/InstructorStudioPage.tsx";
import AdminModerationPage from "./pages/AdminModerationPage.tsx";
import OnboardingPage from "./pages/OnboardingPage.tsx";
import PrivacyPage from "./pages/PrivacyPage.tsx";
import TermsPage from "./pages/TermsPage.tsx";
import CookiesPage from "./pages/CookiesPage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import JoinClassPage from "./pages/JoinClassPage.tsx";
import InstructorActivatePage from "./pages/InstructorActivatePage.tsx";
import InstructorClassReadyPage from "./pages/InstructorClassReadyPage.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 45_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<MarketingLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:slug" element={<CourseDetailPage />} />
              <Route path="/learn/:courseSlug/lesson/:lessonId" element={<LessonPlayerPage />} />
              <Route path="/learn/:courseSlug/classroom" element={<ClassroomPage />} />
              <Route path="/instructors" element={<InstructorsListPage />} />
              <Route path="/instructors/:id" element={<InstructorPage />} />
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/instructor/activate" element={<InstructorActivatePage />} />
              <Route path="/instructor/class-ready/:slug" element={<InstructorClassReadyPage />} />
              <Route path="/instructor/studio" element={<InstructorStudioPage />} />
              <Route path="/instructor" element={<InstructorAppLayout />}>
                <Route index element={<Navigate to="home" replace />} />
                <Route path="home" element={<InstructorHomePage />} />
                <Route path="classes" element={<InstructorClassesPage />} />
                <Route path="students" element={<InstructorStudentsPage />} />
                <Route path="more" element={<InstructorMorePage />} />
                <Route path="class/:slug" element={<InstructorClassWorkspacePage />} />
              </Route>
              <Route path="/admin/moderation" element={<AdminModerationPage />} />
              <Route path="/join/:code" element={<JoinClassPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
