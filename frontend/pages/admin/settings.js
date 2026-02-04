import Layout from '../../components/Layout';

export default function AdminSettings() {
    return (
        <Layout>
            <div className="container-custom py-8">
                <h1 className="text-3xl font-bold font-display text-foreground">Global Settings</h1>
                <p className="mt-2 text-muted-foreground">Configure system environment and policies.</p>
                <div className="mt-8 p-12 border-2 border-dashed border-border rounded-lg text-center">
                    <p className="text-muted-foreground">Global settings interface coming soon.</p>
                </div>
            </div>
        </Layout>
    );
}
