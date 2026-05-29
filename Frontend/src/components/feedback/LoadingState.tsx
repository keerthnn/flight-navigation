interface LoadingStateProps {
  label: string;
}

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div className="centered-state" aria-live="polite">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}
