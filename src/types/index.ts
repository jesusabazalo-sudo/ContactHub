export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  shortDescription: string;
  contactsCount: number;
  sortOrder?: number | null;
  tags: string[];
  whatYouCanFind?: string[];
  isPremiumOfficial?: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isTop: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PricingPlan = {
  id: string;
  name: string;
  price: number;
  folderLimit: number | 'total';
  description: string;
  cta: string;
  badge?: string;
  isRecommended?: boolean;
  isPremium?: boolean;
};

export type PreviewContact = {
  id: string;
  name: string;
  description: string;
  phoneMasked: string;
  tags: string[];
};
