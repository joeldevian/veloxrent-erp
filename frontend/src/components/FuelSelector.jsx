const LEVELS = [
  { value: 'vacio', label: 'Vacío', fill: 0 },
  { value: '1/4', label: '1/4', fill: 25 },
  { value: '1/2', label: '1/2', fill: 50 },
  { value: '3/4', label: '3/4', fill: 75 },
  { value: 'lleno', label: 'Lleno', fill: 100 },
];

export default function FuelSelector({ value, onChange, label }) {
  return (
    <div>
      {label && <label className="form-label">{label}</label>}
      <div className="fuel-selector">
        {LEVELS.map(level => (
          <button
            key={level.value}
            type="button"
            className={`fuel-level ${value === level.value ? 'selected' : ''}`}
            onClick={() => onChange(level.value)}
            style={{
              position: 'relative',
              overflow: 'hidden',
              minWidth: 56,
            }}
          >
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${level.fill}%`,
              background: value === level.value ? 'rgba(0,200,83,0.2)' : 'rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease',
            }} />
            <span style={{ position: 'relative', zIndex: 1 }}>{level.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
