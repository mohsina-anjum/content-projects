interface Props {
  open: boolean;
  className?: string;
}

export default function Chevron({ open, className }: Props) {
  return (
    <svg
      className={`chevron-icon${open ? ' chevron-icon-open' : ''}${className ? ` ${className}` : ''}`}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 2L8.5 6L4 10"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
