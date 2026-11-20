export type PlanId = "essential" | "signature" | "atelier";

export type Item = {
  id: string;
  name: string;
  category: string;
  color?: string;
  image: string;
  clean: boolean;
  createdAt: number;
  notes?: string; // AI-detected pattern / material cues
};

export type Outfit = {
  id: string;
  number: number;
  name: string;
  styles: string[];
  itemIds: string[];
  cover: string;
  createdAt: number;
  notes?: string[]; // why this combination works
  recipe?: string[]; // layer order
  occasion?: string;
};

export type Store = {
  items: Item[];
  outfits: Outfit[];
  usedQuota: number;
  plan: PlanId;
  styles: string[];
  onboarded: boolean;
};
