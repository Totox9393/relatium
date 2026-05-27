import { Heart, Star, Users, Skull, HeartCrack, UserMinus, Smile as Family, Coffee, Book, Gamepad2 } from 'lucide-react';
import { RelationType } from './types';

export const relationTypes: RelationType[] = [
  { type: 'couple', label: 'Couple', icon: Heart, color: '#FF0000' },
  { type: 'bestFriend', label: 'Meilleur ami', icon: Star, color: '#FFD700' },
  { type: 'friend', label: 'Ami', icon: Users, color: '#4CAF50' },
  { type: 'enemy', label: 'Ennemie', icon: Skull, color: '#FF4444' },
  { type: 'ex', label: 'Ex', icon: HeartCrack, color: '#FF69B4' },
  { type: 'exFriend', label: 'Ex-ami', icon: UserMinus, color: '#9E9E9E' },
  { type: 'crush', label: 'Crush', icon: Heart, color: '#FF9800' },
  { type: 'family', label: 'Famille', icon: Family, color: '#4CAF50' },
  { type: 'coffee', label: 'Café', icon: Coffee, color: '#8B4513' },
  { type: 'study', label: 'Études', icon: Book, color: '#4169E1' },
  { type: 'gaming', label: 'Jeux', icon: Gamepad2, color: '#9932CC' },
];