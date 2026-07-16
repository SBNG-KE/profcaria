import VerificationClient from './verification-client';

export default async function VerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VerificationClient id={id} />;
}
