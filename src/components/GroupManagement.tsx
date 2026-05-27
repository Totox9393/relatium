import { useState, useEffect } from 'react';
import { FriendGroup, Friend } from '../types';
import { Users } from 'lucide-react';
import { availableIcons } from './RelationTypeManagement';
import { supabase } from '../lib/supabaseClient';

interface GroupManagementProps {
  friend: Friend;
  onClose: () => void;
}

export function GroupManagement({ friend }: GroupManagementProps) {
  const [groups, setGroups] = useState<FriendGroup[]>([]);
  const [memberGroups, setMemberGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchMemberGroups();
  }, [friend.id]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('relatium_groups_list')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setGroups(data);
    } catch (err) {
      console.error('Erreur lors du chargement des groupes:', err);
      setError('Erreur lors du chargement des groupes');
    }
  };

  const fetchMemberGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('relatium_groups_link')
        .select('group_id')
        .eq('friend_id', friend.id);

      if (error) throw error;
      if (data) setMemberGroups(data.map(m => m.group_id));
    } catch (err) {
      console.error('Erreur lors du chargement des appartenances:', err);
      setError('Erreur lors du chargement des appartenances aux groupes');
    }
  };

  const handleAddToGroup = async () => {
    if (!selectedGroup) return;
    setError('');

    try {
      const { error: supabaseError } = await supabase
        .from('relatium_groups_link')
        .insert([{ group_id: selectedGroup, friend_id: friend.id }]);

      if (supabaseError) throw supabaseError;

      setMemberGroups(prev => [...prev, selectedGroup]);
      setSelectedGroup('');
      await fetchMemberGroups(); // <-- Ajout du rafraîchissement
    } catch (err) {
      console.error('Erreur lors de l\'ajout au groupe:', err);
      setError('Erreur lors de l\'ajout au groupe');
      await fetchMemberGroups();
    }
  };

  const handleRemoveFromGroup = async (groupId: string) => {
    if (isDeleting) return;
    setIsDeleting(true);
    setError('');

    try {
      const { error: supabaseError } = await supabase
        .from('relatium_groups_link')
        .delete()
        .eq('group_id', groupId)
        .eq('friend_id', friend.id);

      if (supabaseError) throw supabaseError;

      setMemberGroups(prev => prev.filter(id => id !== groupId));
    } catch (err) {
      console.error('Erreur lors de la suppression du groupe:', err);
      setError('Erreur lors de la suppression du groupe');
      await fetchMemberGroups(); // Refresh data in case of error
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700">Groupes</h4>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <div className="space-y-2">
        {groups
          .filter(group => memberGroups.includes(group.id))
          .map(group => (
            <div key={group.id} className="flex items-center gap-2">
              {(() => {
                const GroupIcon =
                  availableIcons[(group.icon_name || 'Users') as keyof typeof availableIcons] || Users;
                return <GroupIcon size={14} style={{ color: group.color }} />;
              })()}
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
              <span>{group.name}</span>
              <button
                onClick={() => handleRemoveFromGroup(group.id)}
                className="text-red-500 text-xs ml-2"
                disabled={isDeleting}
              >
                Retirer
              </button>
            </div>
          ))}
      </div>
      <div className="flex gap-2">
        <select
          value={selectedGroup}
          onChange={e => setSelectedGroup(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
        >
          <option value="">Sélectionner un groupe</option>
          {groups
            .filter(group => !memberGroups.includes(group.id))
            .map(group => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
        </select>
        <button
          onClick={handleAddToGroup}
          className="bg-purple-500 text-white px-3 py-1 rounded"
          disabled={!selectedGroup}
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}
