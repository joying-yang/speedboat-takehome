import styles from "./WarningNotice.module.css";

type WarningNoticeProps = {
  title: string;
  messages: string[];
};

export function WarningNotice({ title, messages }: WarningNoticeProps) {
  return (
    <div className={`inline-notice ${styles.notice}`} role="status">
      <strong>{title}</strong>
      <div className={styles.messages}>
        {messages.map((message) => <p key={message}>{message}</p>)}
      </div>
    </div>
  );
}
