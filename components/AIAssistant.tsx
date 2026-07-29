
import React, { useState, useRef, useEffect } from 'react';
import { AppData } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AIAssistantProps {
  data: AppData;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ data }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am your A M Food Business Intelligence Assistant. I can analyze your sales trends, inventory health, and financial status. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const totalSales = data.sales.filter(s => !s.isMistake).reduce((sum, s) => sum + s.totalAmount, 0);
      const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
      const netProfit = totalSales - totalExpenses;
      const totalOutstanding = data.customers.reduce((sum, c) => sum + (c.pendingBalance || 0), 0);
      const lowStockCount = data.products.filter(p => p.currentStock !== undefined && p.minThreshold !== undefined && p.currentStock <= p.minThreshold).length;

      const contextData = {
        totalSales,
        totalExpenses,
        netProfit,
        totalOutstanding,
        lowStockCount,
        businessName: data.business?.name,
        customersLength: data.customers.length,
        productsLength: data.products.length,
        recentSales: data.sales.slice(0, 5).map(s => `${s.customerName} (₹${s.totalAmount})`).join(', '),
        recentExpenses: data.expenses.slice(0, 5).map(e => `${e.description} (₹${e.amount})`).join(', ')
      };

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, contextData })
      });

      if (!res.ok) {
        throw new Error('API Error');
      }

      const responseData = await res.json();
      const responseText = responseData.text || "I apologize, but I was unable to process that analysis. Please try a different question.";
      
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error: any) {
      console.error('AI Assistant Error:', error);
      let errorMsg = 'I encountered a technical interruption. Please check your internet connection.';
      setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  const smartPrompts = [
    "What is my current profit margin?",
    "Identify high-risk customers (high dues)",
    "Which products are performing best?",
    "Summarize my recent cash flow"
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-10rem)] flex flex-col bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-500">
      {/* Header */}
      <div className="bg-slate-900 p-8 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-500/10">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">Executive AI Analyst</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">A M Food Processing Intelligence Suite</p>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Gemini 3 Pro Active</span>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] p-6 rounded-[32px] shadow-sm border ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white border-indigo-700 rounded-tr-none' 
                : 'bg-white text-slate-800 border-slate-200 rounded-tl-none'
            }`}>
              <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white px-6 py-4 rounded-3xl border border-slate-200 flex items-center space-x-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI is thinking</span>
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Input */}
      <div className="p-8 bg-white border-t border-slate-100 space-y-6">
        <div className="flex flex-wrap gap-2">
          {smartPrompts.map((p, i) => (
            <button 
              key={i} 
              onClick={() => { setInput(p); }}
              className="px-4 py-2 bg-slate-50 hover:bg-indigo-600 text-slate-500 hover:text-white border border-slate-200 hover:border-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
            >
              {p}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSend} className="flex space-x-4">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Query enterprise data or request strategic advice..."
              className="w-full pl-6 pr-16 py-4 bg-slate-50 border-2 border-slate-100 rounded-[28px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-2 bottom-2 px-6 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </form>
        <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
          End-to-End Encrypted Data Analysis • A M Food Confidential
        </p>
      </div>
    </div>
  );
};

export default AIAssistant;
