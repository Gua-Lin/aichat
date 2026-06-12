'use client';

import type { ChatMode } from '../types/chatTypes';
import { ALL_MODES } from '../types/chatTypes';

interface Props {
  currentMode: ChatMode | null;
  onModeChange: (mode: ChatMode | null) => void;
}

export default function ModeSelector({ currentMode, onModeChange }: Props) {
  return (
    <div className="mode-selector">
      {ALL_MODES.map((mode) => {
        const isActive = currentMode === mode.key;
        return (
          <button
            key={mode.key}
            className={`mode-selector-btn ${isActive ? 'active' : ''}`}
            onClick={() => onModeChange(isActive ? null : mode.key)}
            title={mode.subtitle}
          >
            <span className="mode-selector-icon">{mode.icon}</span>
            <span className="mode-selector-label">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
