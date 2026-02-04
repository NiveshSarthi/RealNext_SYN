import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { lmsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import {
    AcademicCapIcon,
    PlayCircleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function LMS() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        } else if (user) {
            fetchCourses();
        }
    }, [user, authLoading]);

    const fetchCourses = async () => {
        try {
            // Using placeholder logic until backend route is fully confirmed/wired
            const res = await lmsAPI.getModules();
            setCourses(res.data.data || []);
        } catch (error) {
            console.error("LMS connection error", error);
            setCourses([
                { id: 1, title: 'Real Estate Fundamentals', progress: 45, total_modules: 10, completed_modules: 4, description: 'Master the basics of property law and market analysis.' },
                { id: 2, title: 'Advanced Negotiation', progress: 0, total_modules: 8, completed_modules: 0, description: 'Learn to close high-value deals with confidence.' },
                { id: 3, title: 'Digital Marketing Mastery', progress: 100, total_modules: 6, completed_modules: 6, description: 'Generate leads using Facebook and Google Ads.' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <Layout>
                <div className="flex justify-center h-64 items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-8 animate-fade-in container-custom py-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Learning management system</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Upskill your team with specialized real estate training modules.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <Card key={course.id} className="group hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-black transition-colors duration-300">
                                        <AcademicCapIcon className="h-6 w-6" />
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${course.progress === 100 ? 'border-green-500/30 text-green-500 bg-green-500/10' : 'border-border text-muted-foreground'}`}>
                                        {course.progress === 100 ? 'Completed' : 'In Progress'}
                                    </span>
                                </div>
                                <CardTitle className="mt-4">{course.title}</CardTitle>
                                <CardDescription className="line-clamp-2">{course.description || 'No description available.'}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Progress</span>
                                        <span>{course.progress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-500 ease-out"
                                            style={{ width: `${course.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant={course.progress === 100 ? 'outline' : 'primary'}
                                >
                                    {course.progress === 0 ? (
                                        <><PlayCircleIcon className="h-4 w-4 mr-2" /> Start Course</>
                                    ) : course.progress === 100 ? (
                                        <><CheckCircleIcon className="h-4 w-4 mr-2" /> Review</>
                                    ) : (
                                        <><PlayCircleIcon className="h-4 w-4 mr-2" /> Continue</>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
