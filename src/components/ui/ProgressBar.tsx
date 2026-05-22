type ProgressBarProps = {
  value: number;
  label?: string;
  className?: string;
};

export default function ProgressBar({ value, label, className = '' }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={className}>
      {label ? <div className="mb-2 flex justify-between text-xs font-semibold text-gray-400">{label}</div> : null}
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div className="progress-fill h-full rounded-full bg-brand-400" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
