// UserAvatar.tsx - Reusable clickable user avatar component
import React from 'react';
import { useRouter } from 'next/navigation';

interface UserAvatarProps {
  username: string;
  displayName?: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showUsername?: boolean;
  disabled?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  username,
  displayName,
  avatar,
  size = 'md',
  className = '',
  showUsername = false,
  disabled = false
}) => {
  const router = useRouter();

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && username) {
      router.push(`/user/${username}`);
    }
  };

  const avatarElement = (
    <div 
      className={`
        ${sizeClasses[size]} 
        bg-green-500 rounded-full flex items-center justify-center text-white font-bold
        ${!disabled ? 'cursor-pointer hover:bg-green-600 transition-colors' : ''}
        ${className}
      `}
      onClick={handleClick}
      title={`View ${displayName || username}'s profile`}
    >
      {avatar || displayName?.charAt(0) || username?.charAt(0) || 'U'}
    </div>
  );

  if (showUsername) {
    return (
      <div className="flex items-center space-x-2">
        {avatarElement}
        <span 
          className={`font-medium ${!disabled ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}`}
          onClick={handleClick}
          title={`View ${displayName || username}'s profile`}
        >
          {displayName || username}
        </span>
      </div>
    );
  }

  return avatarElement;
};

// ClickableUsername.tsx - Reusable clickable username component
interface ClickableUsernameProps {
  username: string;
  displayName?: string;
  className?: string;
  showAt?: boolean;
  disabled?: boolean;
}

export const ClickableUsername: React.FC<ClickableUsernameProps> = ({
  username,
  displayName,
  className = '',
  showAt = true,
  disabled = false
}) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && username) {
      router.push(`/user/${username}`);
    }
  };

  return (
    <span 
      className={`
        ${!disabled ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}
        ${className}
      `}
      onClick={handleClick}
      title={`View ${displayName || username}'s profile`}
    >
      {showAt ? '@' : ''}{displayName || username}
    </span>
  );
};

// CommentUserLink.tsx - For comment sections
interface CommentUserLinkProps {
  username: string;
  displayName?: string;
  avatar?: string;
  timeAgo?: string;
}

export const CommentUserLink: React.FC<CommentUserLinkProps> = ({
  username,
  displayName,
  avatar,
  timeAgo
}) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (username) {
      router.push(`/user/${username}`);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <UserAvatar 
        username={username}
        displayName={displayName}
        avatar={avatar}
        size="sm"
      />
      <div className="flex items-center space-x-2">
        <ClickableUsername 
          username={username}
          displayName={displayName}
          className="font-medium text-gray-900"
          showAt={false}
        />
        {timeAgo && (
          <span className="text-gray-500 text-xs">
            {timeAgo}
          </span>
        )}
      </div>
    </div>
  );
};