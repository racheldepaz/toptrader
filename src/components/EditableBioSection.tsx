// EditableBioSection.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Edit3, Check, X, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface EditableBioSectionProps {
  bio: string | null;
  isOwnProfile: boolean;
  onBioUpdate?: (newBio: string) => void;
  maxLength?: number;
}

export default function EditableBioSection({ 
  bio, 
  isOwnProfile, 
  onBioUpdate,
  maxLength = 360 
}: EditableBioSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState(bio || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editedBio, isEditing]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditedBio(bio || '');
    setIsEditing(true);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditedBio(bio || '');
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!isOwnProfile) return;

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({ bio: editedBio.trim() || null })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      // Update parent component
      onBioUpdate?.(editedBio.trim());
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating bio:', err);
      setError('Failed to save bio. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const remainingChars = maxLength - editedBio.length;

  if (isEditing) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={editedBio}
            onChange={(e) => setEditedBio(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell others about yourself or your trading style..."
            maxLength={maxLength}
            className="w-full p-2.5 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[60px] bg-white text-sm"
            style={{ overflow: 'hidden' }}
          />
          
          {/* Character count */}
          <div className={`absolute bottom-1.5 right-1.5 text-xs ${
            remainingChars < 40 ? 'text-red-500' : 'text-gray-400'
          }`}>
            {remainingChars}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            ⌘+Enter to save, Esc to cancel
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleCancelEdit}
              disabled={saving}
              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={saving || editedBio.length > maxLength}
              className="px-2.5 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="group">
      <div className={`relative ${isOwnProfile ? 'hover:bg-gray-50' : ''} rounded-md px-2 py-1 transition-colors`}>
        {bio ? (
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap m-0">
            {bio}
          </p>
        ) : isOwnProfile ? (
          <button
            onClick={handleStartEdit}
            className="text-gray-400 text-sm italic hover:text-gray-600 transition-colors text-left w-full p-0"
          >
            Add a bio...
          </button>
        ) : null}

        {/* Edit button for own profile */}
        {isOwnProfile && bio && (
          <button
            onClick={handleStartEdit}
            className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-600 hover:bg-white rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm border border-gray-200"
            title="Edit bio"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}