import { redirect } from 'next/navigation';

export default async function ProfessionalLogin(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    const params = new URLSearchParams();

    // Pass through any existing parameters (like 'next' or 'ref')
    if (searchParams) {
        Object.entries(searchParams).forEach(([key, value]) => {
            if (typeof value === 'string') {
                params.append(key, value);
            } else if (Array.isArray(value)) {
                value.forEach(v => params.append(key, v));
            }
        });
    }

    const queryString = params.toString();
    const destination = queryString ? `/auth?${queryString}` : '/auth';

    redirect(destination);
}
