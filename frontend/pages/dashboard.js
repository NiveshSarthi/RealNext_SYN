import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function DashboardRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/analytics');
    }, [router]);

    return (
        <div className="min-h-screen bg-[#0E1117] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
}
