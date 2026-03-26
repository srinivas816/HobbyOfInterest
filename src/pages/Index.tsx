import PostAuthBanner from "@/components/PostAuthBanner";
import HeroSection from "@/components/HeroSection";
import { mvpInstructorFocus } from "@/lib/productFocus";
import TrustedBySection from "@/components/TrustedBySection";
import StatsBar from "@/components/StatsBar";
import HowItWorksSection from "@/components/HowItWorksSection";
import CategoriesSection from "@/components/CategoriesSection";
import LearningPlannerSection from "@/components/LearningPlannerSection";
import SkillsSection from "@/components/SkillsSection";
import InstructorsSection from "@/components/InstructorsSection";
import VideoSection from "@/components/VideoSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import AppDownloadSection from "@/components/AppDownloadSection";
import NewsletterSection from "@/components/NewsletterSection";
import CTASection from "@/components/CTASection";
import DiscoverHomePage from "@/pages/DiscoverHomePage";

const Index = () => {
  const mvp = mvpInstructorFocus();
  if (mvp) {
    return <DiscoverHomePage />;
  }
  return (
    <>
      <PostAuthBanner />
      <HeroSection />
      <TrustedBySection />
      <StatsBar />
      <HowItWorksSection />
      <CategoriesSection />
      <LearningPlannerSection />
      <SkillsSection />
      <InstructorsSection />
      <VideoSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <AppDownloadSection />
      <NewsletterSection />
      <CTASection />
    </>
  );
};

export default Index;
