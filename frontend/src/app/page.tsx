"use client";

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function LandingPage() {
    const handleLogin = async () => {
        // In a real app we redirect to actual Supabase OAuth.
        await supabase.auth.signInWithOAuth({ provider: 'google' });
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#0B0F19] relative overflow-hidden">
            {/* Neon Cyberpunk Background Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/10 blur-[120px]" />

            <div className="z-10 w-full max-w-5xl flex flex-col items-center text-center space-y-8">
                {/* Hero Section */}
                <div className="space-y-4">
                    <div className="inline-block px-3 py-1 mb-4 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-bold tracking-widest uppercase">
                        Beta v0.1.0 MVP
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-teal-100 to-teal-500 drop-shadow-[0_0_30px_rgba(20,184,166,0.5)]">
                        CIVIC<span className="text-fuchsia-500">GYM</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-400 font-light max-w-2xl mx-auto tracking-wide">
                        The gamified arena for critical thinking. Elevate your civic fitness through AI-driven debates and logic analysis.
                    </p>
                </div>

                {/* Action Button */}
                <div className="pt-6 pb-12 w-full max-w-sm mx-auto flex flex-col space-y-4">
                    <Button onClick={handleLogin} size="lg" className="w-full bg-white text-black hover:bg-slate-200 font-bold border-none shadow-[0_0_20px_rgba(255,255,255,0.3)] group relative overflow-hidden">
                        <span className="relative z-10 flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                            <span>Login with Google</span>
                        </span>
                    </Button>
                    <p className="text-xs text-slate-500 font-medium tracking-wide">Your data is secured with Supabase Auth.</p>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
                    <Link href="/sparring" className="group">
                        <Card className="h-full border-teal-500/20 bg-slate-900/50 hover:bg-slate-800/80 hover:border-teal-500/50 transition-all duration-300 transform group-hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(20,184,166,0.15)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all" />
                            <CardHeader>
                                <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-4 border border-teal-500/30">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <CardTitle className="text-teal-50">Module 1: Sparring Zone</CardTitle>
                                <CardDescription className="text-teal-100/60">Debate our AI. 5 turns to test your logic.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Engage in a rigorous 5-turn debate. The AI will challenge your assertions. Afterwards, receive a radar chart evaluation of your logic, emotion, and facts.
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/" className="group cursor-default">
                        <Card className="h-full border-fuchsia-500/20 bg-slate-900/50 relative overflow-hidden opacity-70">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center mb-4 border border-fuchsia-500/30">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <CardTitle className="text-fuchsia-50 flex justify-between items-center">
                                    <span>Module 2: Detective Zone</span>
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-sm bg-slate-800 text-slate-400">Current</span>
                                </CardTitle>
                                <CardDescription className="text-fuchsia-100/60">Fact-checking & fallacy detection via RAG.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Analyze political statements against a vector database of truth. Instantly highlights hate speech, opinions, and factual data.
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Card className="h-full border-slate-700/50 bg-slate-900/40 relative overflow-hidden opacity-50 grayscale">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center mb-4 border border-slate-700">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <CardTitle className="text-slate-300 flex justify-between">Module 3: Consensus <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-sm bg-slate-800 text-slate-500">Coming Soon</span></CardTitle>
                            <CardDescription className="text-slate-500">Find the middle ground.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Connect with users of opposing views. An AI mediator facilitates a session to find common ground.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
