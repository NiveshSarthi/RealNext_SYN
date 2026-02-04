import Layout from '../../components/Layout';

export default function AdminAnalytics() {
    return (
        <Layout>
            <div className="container-custom py-8">
                <h1 className="text-3xl font-bold font-display text-foreground">System Analytics</h1>
                <p className="mt-2 text-muted-foreground">Deep dive into platform usage and performance.</p>
                <div className="mt-8 p-12 border-2 border-dashed border-border rounded-lg text-center">
                    <p className="text-muted-foreground">Analytics dashboard coming soon.</p>
                </div>
            </div>
        </Layout>
    );
}
