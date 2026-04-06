'use client';

import { useState, useRef, useEffect } from 'react';
import { gemini } from '@/lib/api';
import { Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = { role: 'user' | 'assistant'; text: string };

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const res = await gemini.query(q);
      const answer = (res as { data?: { answer?: string } })?.data?.answer ?? 'No response.';
      setMessages((m) => [...m, { role: 'assistant', text: answer }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: err instanceof Error ? err.message : 'Request failed.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-8">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-[#2563EB]" />
        <h1 className="text-2xl font-bold neon-text">AI Assistant</h1>
      </div>
      <p className="mb-4 text-sm text-[#64748B]">Ask questions about your fleet in natural language.</p>
      <div className="bg-white border border-[#E2E8F0] shadow-card flex flex-1 flex-col overflow-hidden rounded-xl">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-center text-[#64748B]">e.g. &quot;Which vehicles have the highest risk?&quot; or &quot;Summarize fleet profitability&quot;</p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${msg.role === 'user' ? 'bg-[#2563EB] text-white' : 'bg-[#F8FAFC] border border-[#E2E8F0] shadow-sm text-[#0F172A]'}`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                ) : (
                  <article className="prose prose-sm md:prose-base prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-50">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </article>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-[#F1F5F9] px-4 py-2 text-[#64748B]">Thinking...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-[#E2E8F0]/50 p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about fleet..."
            className="flex-1 rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-[#0F172A] placeholder-zinc-500 focus:border-[#2563EB]/50 focus:outline-none"
            disabled={loading}
          />
          <button type="submit" disabled={loading} className="rounded-lg bg-[#2563EB]/20 px-4 py-2 text-[#2563EB] hover:bg-[#2563EB]/30 disabled:opacity-50">
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
