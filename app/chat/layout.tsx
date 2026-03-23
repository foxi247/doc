import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat — MedNavigator AI",
  description: "AI-powered medical navigation assistant. Describe your symptoms and get guided to the right specialist.",
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {children}
    </div>
  );
}
