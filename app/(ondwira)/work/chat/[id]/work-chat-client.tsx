'use client';

import { useRouter } from 'next/navigation';
import ConversationPanel from '@/app/components/chat/ConversationPanel';

export default function WorkChatClient({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  return <div className="h-[calc(100dvh-4rem)] min-h-0 bg-[var(--bg-primary)]"><ConversationPanel conversationId={conversationId} context="work" title="Work group" subtitle="Organisation-managed conversation" onBack={() => router.push('/work')} /></div>;
}
