import { useCountUp } from '../../hooks/useCountUp';

type AnimatedNumberProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
};

/** Formatea con punto de millar (1400 -> "1.400"), sin depender de datos ICU del locale. */
function formatThousands(value: number) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export default function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1500, className }: AnimatedNumberProps) {
  const { value: animated, ref } = useCountUp<HTMLSpanElement>({ end: value, duration });
  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatThousands(animated)}
      {suffix}
    </span>
  );
}
