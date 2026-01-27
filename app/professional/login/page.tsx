import { redirect } from 'next/navigation';

export default async function ProfessionalLoginRedirect() {
    redirect('/?auth=login&role=professional');
}
