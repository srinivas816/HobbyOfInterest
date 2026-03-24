import heroPottery from "@/assets/hero-pottery.jpg";
import heroPainting from "@/assets/hero-painting.jpg";
import heroFloristry from "@/assets/hero-floristry.jpg";
import categoryBaking from "@/assets/category-baking.jpg";
import categoryWoodworking from "@/assets/category-woodworking.jpg";
import categoryWatercolor from "@/assets/category-watercolor.jpg";
import categorySewing from "@/assets/category-sewing.jpg";
import categoryMusic from "@/assets/category-music.jpg";

const byKey: Record<string, string> = {
  "hero-pottery": heroPottery,
  "hero-painting": heroPainting,
  "hero-floristry": heroFloristry,
  "category-baking": categoryBaking,
  "category-woodworking": categoryWoodworking,
  "category-watercolor": categoryWatercolor,
  "category-sewing": categorySewing,
  "category-music": categoryMusic,
};

export function courseImageSrc(imageKey: string): string {
  return byKey[imageKey] ?? heroPottery;
}

/** Prefer a hosted cover URL (e.g. Cloudinary); otherwise local asset by `imageKey`. */
export function courseCoverSrc(imageKey: string, coverImageUrl?: string | null): string {
  const u = coverImageUrl?.trim();
  if (u && /^https?:\/\//i.test(u)) return u;
  return courseImageSrc(imageKey);
}
