import styles from "./ActionButton.module.css";

type ActionButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export default function ActionButton({
  label,
  onClick,
  disabled = false,
}: ActionButtonProps) {
  return (
    <button
      className={styles.actionButton}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}