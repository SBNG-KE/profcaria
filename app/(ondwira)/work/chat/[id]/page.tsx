import WorkChatClient from './work-chat-client';
export default async function WorkChatPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <WorkChatClient conversationId={id} />; }
