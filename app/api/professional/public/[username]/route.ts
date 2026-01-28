
import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/prisma"; // Uncomment if prisma exists

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ username: string }> }
) {
    const params = await props.params;
    const username = params.username;

    // In a real app, we would look up the user by slug/username in the DB.
    // For now, we will return a mock profile to ensure the frontend works,
    // or duplicate the logic from the protected profile route if possible.

    // Mock Data mimicking a real profile
    const profile = {
        id: "user_123",
        firstName: username.split('-')[0] || "Unknown",
        lastName: username.split('-')[1] || "User",
        profileImage: "https://avatar.vercel.sh/" + username,
        headline: "Professional at Profcaria",
        about: "This is a public profile view. Experienced professional active in the tech industry.",
        location: "San Francisco, CA",
        website: "https://profcaria.com",
        experience: [
            {
                title: "Senior Engineer",
                company: "Tech Corp",
                dateRange: "2020 - Present",
                description: "Leading frontend development teams."
            }
        ],
        createdAt: new Date().toISOString()
    };

    // Simulate delay
    await new Promise(r => setTimeout(r, 500));

    return NextResponse.json({ profile });
}
