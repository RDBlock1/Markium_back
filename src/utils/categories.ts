// src/config/categories.ts
import { 
  TrendingUp, 
  Zap, 
  Sparkles, 
  Bitcoin, 
  Landmark, 
  Trophy, 
  Cpu, 
  Palette, 
  DollarSign,
  Users,
  Vote,
  BarChart3,
  Globe
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  slug: string;
}

export const categories: Category[] = [
  { id: 'trending', name: 'Trending', icon: TrendingUp, slug: 'trending' },
//   { id: 'breaking', name: 'Breaking', icon: Zap, slug: 'breaking' },
//   { id: 'new', name: 'New', icon: Sparkles, slug: 'new' },
  { id: 'crypto', name: 'Crypto', icon: Bitcoin, slug: 'crypto' },
  { id: 'politics', name: 'Politics', icon: Landmark, slug: 'politics' },
  { id: 'sports', name: 'Sports', icon: Trophy, slug: 'sports' },
  { id: 'tech', name: 'Tech', icon: Cpu, slug: 'tech' },
  { id: 'culture', name: 'Culture', icon: Palette, slug: 'culture' },
  { id: 'economy', name: 'Economy', icon: DollarSign, slug: 'economy' },
  { id: 'mentions', name: 'Mentions', icon: Users, slug: 'mentions' },
  { id: 'elections', name: 'Elections', icon: Vote, slug: 'elections' },
  { id: 'finance', name: 'Finance', icon: BarChart3, slug: 'finance' },
  { id: 'geopolitics', name: 'Geopolitics', icon: Globe, slug: 'geopolitics' },
];

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export const tags: Tag[] = [
  { id: 'all', name: 'All', slug: 'all' },
  { id: 'trump', name: 'Trump', slug: 'trump' },
  { id: 'greenland', name: 'Greenland', slug: 'greenland' },
  { id: 'minnesota_unrest', name: 'Minnesota Unrest', slug: 'minnesota_unrest' },
  { id: 'fed', name: 'Fed', slug: 'fed' },
  { id: 'portugal_election', name: 'Portugal Election', slug: 'portugal_election' },
  { id: 'iran', name: 'Iran', slug: 'iran' },
  { id: 'epstein', name: 'Epstein', slug: 'epstein' },
  { id: 'venezuela', name: 'Venezuela', slug: 'venezuela' },
  { id: 'ukraine', name: 'Ukraine', slug: 'ukraine' },
  { id: 'weather', name: 'Weather', slug: 'weather' },
  { id: 'spacex', name: 'SpaceX', slug: 'spacex' },
  { id: 'china', name: 'China', slug: 'china' },
  { id: 'movies', name: 'Movies', slug: 'movies' },
  { id: 'gaza', name: 'Gaza', slug: 'gaza' },
  { id: 'israel', name: 'Israel', slug: 'israel' },
  { id: 'bitcoin', name: 'Bitcoin', slug: 'bitcoin' },
  { id: 'ethereum', name: 'Ethereum', slug: 'ethereum' },
  { id: 'solana', name: 'Solana', slug: 'solana' },
  { id: 'ai', name: 'AI', slug: 'ai' },
  { id: 'google', name: 'Google', slug: 'google' },
];

export interface SortOption {
  value: 'volume24hr' | 'totalVolume' | 'newest' | 'liquidity' | 'endingSoon' | 'competitive';
  label: string;
}

export const sortOptions: SortOption[] = [
  { value: 'volume24hr', label: 'Volume 24h' },
  { value: 'totalVolume', label: 'Total Volume' },
  { value: 'newest', label: 'Newest' },
  { value: 'liquidity', label: 'Liquidity' },
  { value: 'endingSoon', label: 'Ending Soon' },
  { value: 'competitive', label: 'Competitive' },
];