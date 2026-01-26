import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardSidebar from '@/components/DashboardSidebar';

export default async function DashboardLayout({ children }) {
    const user = await getUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
            <DashboardSidebar user={user} />

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                {children}
            </main>
        </div>
    );
}
