import { DivideIcon as LucideIcon } from 'lucide-react';

export interface Friend {
  id: string;
  name: string;
  avatar_url?: string;
  created_at?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface Relation {
  id: string;
  friend1_id: string;
  friend2_id: string;
  type: string;
  intensity?: number | null;
  note?: string | null;
  created_at?: string;
  source?: Friend;
  target?: Friend;
}

export interface FriendGroup {
  id: string;
  name: string;
  color: string;
  icon_name?: string;
  description?: string | null;
  created_at?: string;
}

export interface RelationType {
  type: string;
  label: string;
  icon: typeof LucideIcon;
  color: string;
}

export interface GroupMember {
  group_id: string;
  friend_id: string;
}

export interface RelationTypeDB {
  id: string;
  type: string;
  label: string;
  icon_name: string;
  color: string;
  description?: string | null;
  is_system?: boolean;
  created_at?: string;
}