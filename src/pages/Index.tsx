import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TrustedBySection from "@/components/TrustedBySection";
import StatsBar from "@/components/StatsBar";
import HowItWorksSection from "@/components/HowItWorksSection";
import CategoriesSection from "@/components/CategoriesSection";
import SkillsSection from "@/components/SkillsSection";
import VideoSection from "@/components/VideoSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import NewsletterSection from "@/components/NewsletterSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import LearningPlannerSection from "@/components/LearningPlannerSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <Navbar />
      <HeroSection />
      <TrustedBySection />
      <StatsBar />
      <HowItWorksSection />
      <CategoriesSection />
      <LearningPlannerSection />
      <SkillsSection />
      <VideoSection />
      <TestimonialsSection />
      <PricingSection />
      <NewsletterSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
