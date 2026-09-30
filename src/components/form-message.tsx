export type Message = { kind: "ok" | "err"; text: string } | null;

export function FormMessage({ message }: { message: Message }) {
  return (
    <div aria-live="polite">
      {message && <p className={message.kind === "err" ? "msg-err" : "msg-ok"}>{message.text}</p>}
    </div>
  );
}
