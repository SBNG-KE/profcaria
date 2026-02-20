import Link from 'next/link';
import { ArrowRight, Book, Shield, Code, Users } from 'lucide-react';

export default function DocumentationHome() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="p-4 rounded-full bg-neutral-900 border border-neutral-800">
                <Book size={32} className="text-neutral-600" />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">
                Documentation Update
            </h1>
            <p className="text-lg text-neutral-500 max-w-md mx-auto">
                We are currently updating our platform documentation to reflect the latest features. Please check back soon.
            </p>
            <Link href="/" className="text-xs font-bold uppercase tracking-widest text-white hover:underline">
                Back to Home
            </Link>
        </div>
    );
}
