"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';

export default function ChatInterface() {
    const { messages, addMessage, isProcessing, turnCount, maxTurns, incrementTurn, resetChat, submitSession } = useChatStore();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isProcessing || turnCount >= maxTurns) return;

        const userText = inputValue;
        setInputValue('');

        // 1. Add User Message
        addMessage({ role: 'user', content: userText });

        // 2. Mock "system" analyzing message
        addMessage({ role: 'system', content: 'Analyzing statement against database...' });

        try {
            // 3. Hit the backend FastAPI proxy
            const response = await fetch('/api/module2/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statement: userText })
            });

            if (!response.ok) throw new Error('Failed to analyze');
            const data = await response.json();

            // 4. Parse the results
            let formattedResponse = '';
            if (data.results && Array.isArray(data.results)) {
                formattedResponse = data.results.map((item: any) => {
                    const badgeColor = item.type === 'fact' ? 'bg-green-500/20 text-green-300 border-green-500/50'
                        : item.type === 'hate_speech' ? 'bg-red-500/20 text-red-300 border-red-500/50'
                            : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';

                    return `<div class="mb-5 bg-slate-800/60 p-4 rounded-xl shadow-sm border border-slate-700/50">
            <span class="px-2.5 py-1 rounded inline-block text-xs font-bold ${badgeColor} uppercase tracking-wider mb-2 border">${item.type.replace('_', ' ')}</span> 
            <span class="text-slate-100 block italic text-lg leading-snug">"${item.text}"</span>
            <p class="text-sm mt-3 text-slate-400 font-medium">${item.reason}</p>
          </div>`;
                }).join('');
            } else {
                formattedResponse = "No specific logical highlights found.";
            }

            // Add the assistant message (it acts as the instructor response)
            addMessage({ role: 'assistant', content: formattedResponse });
            incrementTurn();

        } catch (err) {
            console.error(err);
            addMessage({ role: 'assistant', content: 'There was an error connecting to the fact-checker API. Ensure your FastAPI server is running.' });
        }
    };

    const handleComplete = () => {
        // Submit the session using the store
        submitSession("mock-user-123", "detective_zone");
        alert("Session data sent to Supabase (check console)!");
    };

    return (
        <div className="glass-panel w-full h-[700px] flex flex-col overflow-hidden relative shadow-2xl transition-all duration-300 ring-1 ring-white/10">

            {/* Header */}
            <div className="px-6 py-5 flex justify-between items-center border-b border-slate-700/60 bg-slate-900/50 pb-5">
                <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.6)] animate-pulse"></div>
                    <span className="font-semibold text-slate-100 tracking-wide text-lg">AI Instructor</span>
                </div>
                <div className="text-sm font-bold rounded-full bg-slate-800/80 px-4 py-2 text-slate-300 border border-slate-600/50 shadow-inner">
                    Turn <span className="text-teal-400">{turnCount}</span> / {maxTurns}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col justify-center items-center text-slate-400 space-y-5">
                        <div className="p-4 rounded-full bg-slate-800/50 border border-slate-700/50 shadow-xl">
                            <svg className="w-10 h-10 text-teal-500/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                        </div>
                        <p className="font-medium text-center px-8 text-lg">Drop your statement below to start the analysis.</p>
                    </div>
                )}

                {messages.map((m) => (
                    <div key={m.id} className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'self-end items-end ml-auto' : 'self-start items-start'}`}>
                        <span className={`text-xs mb-1.5 font-bold tracking-widest uppercase opacity-70 ${m.role === 'user' ? 'text-blue-300 mr-2' : m.role === 'system' ? 'text-amber-400 ml-2' : 'text-teal-300 ml-2'}`}>
                            {m.role === 'user' ? 'You' : m.role === 'system' ? 'System' : 'Instructor'}
                        </span>
                        <div
                            className={`rounded-2xl px-5 py-4 shadow-lg backdrop-blur-md ${m.role === 'user'
                                    ? 'bg-blue-600/90 text-white rounded-tr-sm border border-blue-400/50'
                                    : m.role === 'system'
                                        ? 'bg-amber-900/40 text-amber-200 italic text-sm rounded-tl-sm border border-amber-500/30 font-medium'
                                        : 'bg-slate-700/50 text-slate-100 rounded-tl-sm border border-slate-500/40'
                                }`}
                        >
                            <div
                                className="leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: m.role === 'assistant' ? m.content : m.content.replace(/\n/g, '<br/>') }}
                            />
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-5 bg-slate-900/60 border-t border-slate-700/60 backdrop-blur-xl">
                {turnCount >= maxTurns ? (
                    <div className="flex flex-col items-center justify-center py-3 space-y-4">
                        <p className="text-teal-400 text-sm tracking-widest uppercase font-bold">Session Complete</p>
                        <div className="flex space-x-4">
                            <button onClick={resetChat} className="px-6 py-2.5 rounded-full cursor-pointer bg-slate-700/80 hover:bg-slate-600 text-white transition-all text-sm font-semibold border border-slate-500/50 shadow-md">Reset</button>
                            <button onClick={handleComplete} className="px-6 py-2.5 rounded-full cursor-pointer bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all text-sm font-bold border border-teal-400/50">Submit Evaluation</button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex space-x-3 items-end">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                            placeholder={isProcessing ? "AI is analyzing your statement..." : "Type your statement here... (Press Enter to send)"}
                            disabled={isProcessing}
                            className="flex-1 bg-slate-800/80 border border-slate-600 rounded-xl px-5 py-3.5 text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/70 focus:border-transparent transition-all shadow-inner resize-none overflow-hidden h-[54px] min-h-[54px] max-h-32"
                            rows={1}
                        />
                        <button
                            type="submit"
                            disabled={isProcessing || !inputValue.trim()}
                            className="h-[54px] px-8 rounded-xl cursor-pointer bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 disabled:opacity-50 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center min-w-[120px] border border-teal-400/30"
                        >
                            {isProcessing ? (
                                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : 'Analyze'}
                        </button>
                    </form>
                )}
            </div>

        </div>
    );
}
