import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function Login() {
    const { loginWithGoogle, currentUser } = useAuth();
    const navigate = useNavigate();
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    useEffect(() => {
        if (currentUser) {
            navigate("/");
        }
    }, [currentUser, navigate]);

    const handleLogin = async () => {
        setIsAuthenticating(true);
        try {
            await loginWithGoogle();
            navigate("/");
        } catch (error) {
            console.error("Failed to log in", error);
            setIsAuthenticating(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark font-sans overflow-hidden p-4">
            {/* Background Pattern */}
            <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10" aria-hidden="true" />

            <div className="w-full max-w-md animate-slide-up relative z-10">
                <div className="flex justify-center mb-8">
                    <div className="flex items-center justify-center size-20 bg-primary/10 rounded-3xl shadow-soft dark:bg-primary/20">
                        <span className="material-symbols-outlined text-primary text-5xl">chat_bubble</span>
                    </div>
                </div>

                <Card className="p-8 backdrop-blur-sm bg-surface-light/80 dark:bg-surface-dark/80 border-primary/10 dark:border-primary/10">
                    <div className="mb-8 text-center space-y-2">
                        <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">Welcome back</h1>
                        <p className="text-text-secondary-light dark:text-text-secondary-dark text-balance">
                            Sign in to access your teams and conversations.
                        </p>
                    </div>

                    <Button
                        onClick={handleLogin}
                        disabled={isAuthenticating}
                        isLoading={isAuthenticating}
                        className="w-full h-12 text-base shadow-lg shadow-primary/20"
                    >
                        {!isAuthenticating && (
                            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#FFFFFF"></path>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#FFFFFF"></path>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FFFFFF"></path>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#FFFFFF"></path>
                            </svg>
                        )}
                        {isAuthenticating ? 'Signing in...' : 'Continue with Google'}
                    </Button>

                    <p className="mt-6 text-center text-xs text-text-muted-light dark:text-text-muted-dark">
                        By continuing, you agree to our{' '}
                        <a className="underline hover:text-primary transition-colors" href="#">Terms of Service</a> and{' '}
                        <a className="underline hover:text-primary transition-colors" href="#">Privacy Policy</a>.
                    </p>
                </Card>
            </div>
        </div>
    );
}
