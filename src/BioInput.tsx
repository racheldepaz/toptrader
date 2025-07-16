// BioInput.tsx - Standalone bio input for forms
'use client';

import { useState, useRef, useEffect } from 'react';

interface BioInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}

export default function BioInput({ 
  value, 
  onChange, 
  placeholder = "Tell others about yourself, your trading style, or what you're passionate about...",
  maxLength = 160,
  disabled = false,
  className = ""
}: BioInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  const remainingChars = maxLength - value.length;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[80px] bg-white disabled:bg-gray-50 disabled:text-gray-500"
          style={{ overflow: 'hidden' }}
        />
        
        {/* Character count */}
        <div className={`absolute bottom-2 right-2 text-xs ${
          remainingChars < 20 ? 'text-red-500' : 'text-gray-400'
        }`}>
          {remainingChars}
        </div>
      </div>
      
      {/* Helper text */}
      <p className="text-xs text-gray-500">
        Share what makes you unique as a trader or investor
      </p>
    </div>
  );
}