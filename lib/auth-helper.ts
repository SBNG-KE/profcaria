import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;

    if (!token) return null;

    try {
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);

        return {
            id: payload.uid as string,
            schema: payload.schema as string,
            email: payload.email as string
        };
    } catch (e) {
        return null;
    }
}
