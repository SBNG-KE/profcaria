import BillingPage from '@/app/employer/billing/page';

export default async function WorkBillingPage({ searchParams }: { searchParams: Promise<{ organizationId?: string }> }) {
  const { organizationId = '' } = await searchParams;
  return <BillingPage organizationId={organizationId} />;
}
