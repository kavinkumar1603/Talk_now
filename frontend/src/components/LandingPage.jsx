import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-900 p-4 font-sans selection:bg-sky-100 selection:text-sky-900">

            {/* Main Content Container */}
            <main className="text-center max-w-2xl mx-auto space-y-8 animate-fade-in-up">

                {/* App Name */}
                <h1 className="text-6xl md:text-8xl font-black tracking-tight text-blue-600">
                    TalkNow
                </h1>

                {/* Tagline */}
                <p className="text-xl md:text-2xl text-slate-500 font-medium">
                    Real-time, secure, fast messaging.
                </p>

                {/* Call to Action */}
                <div className="pt-4">
                    <button
                        onClick={() => navigate('/signup')}
                        className="px-10 py-4 bg-blue-600 text-white text-lg font-bold rounded-full hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 hover:-translate-y-1"
                    >
                        Start Chatting
                    </button>
                </div>

            </main>

            {/* Footer / Copyright */}
            <footer className="absolute bottom-6 text-slate-400 text-sm">
                &copy; {new Date().getFullYear()} TalkNow. All rights reserved.
            </footer>

        </div>
    );
};

export default LandingPage;
