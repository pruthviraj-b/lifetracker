import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden font-['Cinzel'] selection:bg-primary/30 selection:text-foreground">

            {/* Hero Section */}
            <main className="flex-grow flex flex-col items-center justify-center px-4 relative z-10 pb-20">
                <div className="max-w-3xl mx-auto text-center space-y-8">
                    <div className="space-y-4 relative">
                        <motion.h1
                            className="text-4xl md:text-7xl font-bold tracking-tight leading-[1.1] font-['Cinzel_Decorative']"
                            style={{ filter: 'url(#water-4d)' }}
                            animate={{ opacity: [0.9, 1, 0.9] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            Build Your Life,<br />
                            <span className="text-primary/80">Like Building a Home</span>
                        </motion.h1>

                        {/* 4D Water Drop Subtitle */}
                        <div className="relative">
                            {/* Hidden SVG Filter Definition */}
                            <svg className="absolute w-0 h-0">
                                <defs>
                                    <filter id="water-4d">
                                        <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="2" result="warp">
                                            <animate attributeName="baseFrequency" values="0.01 0.01;0.02 0.04;0.01 0.01" dur="8s" repeatCount="indefinite" />
                                        </feTurbulence>
                                        <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="4" in="SourceGraphic" in2="warp" />
                                    </filter>
                                </defs>
                            </svg>

                            <motion.p
                                className="text-lg md:text-2xl text-muted-foreground font-light max-w-xl mx-auto leading-relaxed"
                                style={{ filter: 'url(#water-4d)' }}
                                animate={{ opacity: [0.8, 1, 0.8] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                One habit, one brick at a time.
                            </motion.p>
                        </div>
                    </div>

                    <div className="pt-8">
                        <button
                            onClick={() => navigate('/signup')}
                            className="bg-primary text-primary-foreground px-8 md:px-12 py-4 md:py-5 rounded-full font-bold text-lg md:text-xl shadow-lg hover:shadow-xl hover:-translate-y-[1px] transition-all duration-300 ease-out font-['Cinzel']"
                        >
                            Start Your Journey
                        </button>
                    </div>
                </div>
            </main>

            {/* Footer Minimal - Static Black */}
            <footer className="relative z-10 py-8 text-center">
                <p
                    className="text-[10px] uppercase tracking-[0.2em] font-medium cursor-default inline-block text-foreground"
                    style={{ fontFamily: '"Times New Roman", Times, serif' }}
                >
                    developed by 1984bcworks
                </p>
            </footer>
        </div>
    );
}
