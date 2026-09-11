interface StatusMessageProps {
  message: string;
}

export function StatusMessage({ message }: StatusMessageProps) {
  if (!message) {
    return null;
  }

  return <div className="status-message">{message}</div>;
}
