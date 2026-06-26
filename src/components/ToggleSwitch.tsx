// src/components/ToggleSwitch.tsx
// Theme-aware toggle switch used across all wizard forms.
// Styled via the .toggle-switch CSS component class in global.css.

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
}

export default function ToggleSwitch({ checked, onChange, label, id }: ToggleSwitchProps) {
  return (
    <label className="toggle-switch">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        id={id}
      />
      <div className="toggle-track" />
      <span className="text-sm text-fg">{label}</span>
    </label>
  );
}
