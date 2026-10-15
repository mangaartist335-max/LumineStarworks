import { MessageCircleMore } from "lucide-react";

export function ChatBubble() {
  return (
    <a
      href="https://www.nurseswecare.org/contact-5"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-sky px-5 py-3 font-display text-base text-white shadow-[0_8px_24px_-8px_rgba(47,147,207,0.7)] transition hover:bg-sky-deep"
    >
      <MessageCircleMore className="h-5 w-5" aria-hidden />
      Let&rsquo;s Chat!
    </a>
  );
}
