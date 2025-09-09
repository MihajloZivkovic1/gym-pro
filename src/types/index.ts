// Dodajte ove tipove u postojeći fajl

export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  features?: string[];
  isActive: boolean;
  createdAt: Date;
  _count?: {
    memberships: number;
  };
}

export interface MembershipPlanFormData {
  name: string;
  price: number;
  durationMonths: number;
  features?: string[];
  isActive?: boolean;
}

export interface MembershipPlanWithStats extends MembershipPlan {
  memberCount: number;
  monthlyRevenue: number;
}