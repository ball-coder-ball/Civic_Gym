"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

interface EvaluationScores {
    logic: number;
    evidence: number;
    persuasion: number;
    openness: number;
    clarity: number;
    feedback: string;
}

export default function SparringPage() {
    const { messages, addMessage, isProcessing, turnCount, maxTurns, incrementTurn } = useChatStore();
    const [inputValue, setInputValue] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [scores, setScores] = useState<EvaluationScores | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Dynamic radar chart data from real evaluation
    const evaluationData = scores ? [
        { subject: 'ตรรกะ', A: scores.logic, fullMark: 100 },
        { subject: 'หลักฐาน', A: scores.evidence, fullMark: 100 },
        { subject: 'โน้มน้าว', A: scores.persuasion, fullMark: 100 },
        { subject: 'เปิดรับ', A: scores.openness, fullMark: 100 },
        { subject: 'ชัดเจน', A: scores.clarity, fullMark: 100 },
    ] : [];

    // Calculate XP from scores
    const totalXP = scores
        ? Math.round((scores.logic + scores.evidence + scores.persuasion + scores.openness + scores.clarity) / 5 * 5)
        : 0;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Trigger evaluation after turn 5
    useEffect(() => {
        if (turnCount >= maxTurns && !showResults && !isEvaluating && messages.length > 0) {
            evaluateDebate();
        }
    }, [turnCount]);

    const evaluateDebate = async () => {
        setIsEvaluating(true);
        try {
            const response = await fetch('/api/module1/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.map(m => ({ role: m.role, content: m.content }))
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setScores(data.scores);
            } else {
                // Fallback if API fails
                setScores({
                    logic: 0, evidence: 0, persuasion: 0,
                    openness: 0, clarity: 0,
                    feedback: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
                });
            }
        } catch {
            setScores({
                logic: 0, evidence: 0, persuasion: 0,
                openness: 0, clarity: 0,
                feedback: 'เกิดข้อผิดพลาดในการประเมิน'
            });
        } finally {
            setIsEvaluating(false);
            setTimeout(() => setShowResults(true), 500);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isThinking || turnCount >= maxTurns) return;

        const userMsg = inputValue.trim();
        addMessage({ role: 'user', content: userMsg });
        setInputValue('');
        setIsThinking(true);

        try {
            // Call the real DeepSeek-powered debate endpoint
            const response = await fetch('/api/module1/debate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.map(m => ({ role: m.role, content: m.content })),
                    userMessage: userMsg
                }),
            });

            if (response.ok) {
                const data = await response.json();
                addMessage({ role: 'assistant', content: data.response });
            } else {
                addMessage({ role: 'assistant', content: 'ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง' });
            }
        } catch {
            addMessage({ role: 'assistant', content: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ' });
        } finally {
            incrementTurn();
            setIsThinking(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-4 bg-[#0B0F19] text-slate-50 relative overflow-hidden">

            {/* Background styling */}
            <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] rounded-full bg-teal-500/5 blur-[150px] pointer-events-none" />

            {/* Top Nav */}
            <div className="w-full max-w-5xl flex justify-between items-center py-6 mb-4 z-10 border-b border-white/5">
                <Link href="/" className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    <span className="font-semibold tracking-wide">หน้าหลัก</span>
                </Link>
                <div className="bg-slate-800/80 px-4 py-1.5 rounded-full border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
                    <span className="text-xs font-bold tracking-widest uppercase text-teal-400">ตา {turnCount} <span className="text-slate-500">จาก</span> {maxTurns}</span>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 w-full max-w-4xl flex flex-col z-10">

                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-teal-500/30 scrollbar-track-transparent">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70">
                            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-[0_0_30px_rgba(20,184,166,0.2)]">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <p className="text-lg font-light text-slate-300">สนามซ้อมโต้วาที</p>
                            <p className="text-sm text-slate-500 max-w-md">เริ่มต้นด้วยข้อโต้แย้งของคุณ AI จะท้าทายตรรกะของคุณใน 5 ตา</p>
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <div key={i} className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'self-end items-end ml-auto' : 'self-start items-start'}`}>
                            <span className={`text-[10px] mb-1 font-bold tracking-widest uppercase opacity-70 ${m.role === 'user' ? 'text-teal-400 mr-2' : 'text-fuchsia-400 ml-2'}`}>
                                {m.role === 'user' ? 'คุณ' : 'AI ผู้ท้าชิง'}
                            </span>
                            <div
                                className={`px-5 py-4 shadow-xl backdrop-blur-md text-[15px] leading-relaxed ${m.role === 'user'
                                    ? 'bg-teal-600/20 text-teal-50 rounded-2xl rounded-tr-sm border border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.1)]'
                                    : 'bg-slate-800/80 text-slate-200 rounded-2xl rounded-tl-sm border border-slate-700'
                                    }`}
                            >
                                {m.content}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="self-start px-5 py-4 bg-slate-800/50 rounded-2xl rounded-tl-sm border border-slate-700/50 animate-pulse text-slate-400 text-sm">
                            กำลังคิดข้อโต้แย้ง...
                        </div>
                    )}
                    {isEvaluating && (
                        <div className="self-center px-6 py-4 bg-teal-500/10 rounded-2xl border border-teal-500/20 animate-pulse text-teal-300 text-sm text-center">
                            🏆 AI กำลังประเมินผลการโต้วาทีของคุณ...
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className="p-4 bg-[#0B0F19]/90 border-t border-white/5 backdrop-blur-xl mt-4 shrink-0 rounded-t-3xl">
                    <form onSubmit={handleSubmit} className="flex space-x-3">
                        <Input
                            value={inputValue}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                            disabled={isThinking || turnCount >= maxTurns}
                            placeholder={turnCount >= maxTurns ? "การโต้วาทีจบลงแล้ว" : "พิมพ์ข้อโต้แย้งของคุณ..."}
                            className="flex-1 bg-slate-900 border-slate-700 text-base py-6 px-4 rounded-full shadow-inner focus-visible:ring-teal-500/50"
                        />
                        <Button
                            type="submit"
                            disabled={isThinking || !inputValue.trim() || turnCount >= maxTurns}
                            className="rounded-full px-8 h-12 bg-teal-500 hover:bg-teal-400 text-slate-900 font-black tracking-wide"
                        >
                            โต้แย้ง
                        </Button>
                    </form>
                </div>
            </div>

            {/* Results Modal */}
            {showResults && scores && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0F19]/80 backdrop-blur-md">
                    <Card className="w-full max-w-lg border-teal-500/40 bg-slate-900 shadow-[0_0_50px_rgba(20,184,166,0.2)]">
                        <CardHeader className="text-center pb-2">
                            <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-4 border border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.4)]">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                            </div>
                            <CardTitle className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-teal-500">การซ้อมเสร็จสิ้น!</CardTitle>
                            <CardDescription className="text-slate-400">นี่คือผลประเมินความฟิตทางพลเมืองของคุณ</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={evaluationData}>
                                        <PolarGrid stroke="#334155" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar name="You" dataKey="A" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.4} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* AI Feedback */}
                            {scores.feedback && (
                                <div className="mt-4 px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700 text-sm text-slate-300 leading-relaxed">
                                    <span className="font-bold text-teal-400">💬 ข้อเสนอแนะ: </span>{scores.feedback}
                                </div>
                            )}

                            <div className="mt-4 flex flex-col space-y-3">
                                <div className="flex justify-between items-center px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <span className="text-sm text-slate-400 font-semibold uppercase tracking-wider">XP ที่ได้รับ</span>
                                    <span className="text-2xl font-black text-teal-400">+{totalXP} XP</span>
                                </div>
                                <Button onClick={() => window.location.href = '/'} className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 h-12">กลับหน้าหลัก</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

        </main>
    );
}
