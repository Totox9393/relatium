import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Friend } from '../types';

interface SearchableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: Friend[];
  placeholder: string;
  excludeId?: string;
}

function getNameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getNameColor(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(index);
    hash |= 0;
  }

  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsl(${hue} 78% 92%)`,
    text: `hsl(${hue} 58% 36%)`,
  };
}

function FriendBadge({ friend }: { friend: Friend }) {
  if (friend.avatar_url) {
    return <img src={friend.avatar_url} alt={friend.name} className="h-7 w-7 rounded-full object-cover" />;
  }

  const color = getNameColor(friend.name);

  return (
    <div
      className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold"
      style={{ backgroundColor: color.bg, color: color.text }}
      aria-hidden="true"
    >
      {getNameInitials(friend.name)}
    </div>
  );
}

export function SearchableCombobox({
  value,
  onChange, 
  options, 
  placeholder,
  excludeId,
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredOptions = useMemo(
    () =>
      options.filter(
        option => option.id !== excludeId && option.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      ),
    [excludeId, options, searchQuery],
  );

  const selectedFriend = options.find(f => f.id === value);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        className="group flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
        onClick={() => setIsOpen(previous => !previous)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedFriend ? (
          <>
            <FriendBadge friend={selectedFriend} />
            <span className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900">{selectedFriend.name}</span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-sm text-slate-400">{placeholder}</span>
        )}

        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-[0_18px_38px_rgba(15,23,42,0.14)]">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Rechercher une personne..."
              onKeyDown={event => {
                if (event.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div className="scrollbar-thin max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="rounded-lg px-3 py-4 text-center text-sm text-slate-500">Aucun resultat</div>
            ) : (
              filteredOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                    value === option.id ? 'bg-violet-50 text-violet-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                >
                  <FriendBadge friend={option} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{option.name}</span>
                  {value === option.id ? <Check className="h-4 w-4 shrink-0" /> : null}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}