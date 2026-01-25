import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  loading?: boolean;
  onChange: () => void;
}

export default function ToggleSwitch({
  enabled,
  loading,
  onChange,
}: ToggleSwitchProps) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      className={`toggle-switch ${enabled ? 'toggle-switch-on' : 'toggle-switch-off'} ${
        loading ? 'opacity-50' : ''
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`toggle-switch-knob ${
          enabled ? 'toggle-switch-knob-on' : 'toggle-switch-knob-off'
        } ${loading ? 'animate-pulse' : ''}`}
      />
    </button>
  );
}
