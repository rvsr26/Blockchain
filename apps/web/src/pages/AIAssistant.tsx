import { useState, useRef, useEffect } from "react";
import { api } from "../services/api";
import { useQuery } from "@tanstack/react-query";
import { Bot, Send, User, AlertTriangle } from "lucide-react";

interface Message { role: "user" | "ai"; content: string; timestamp: Date; }

const SUGGESTED_QUESTIONS = [
  "How does the commit-reveal bid system work?",
  "What is the difference between transparency and vote secrecy?",
  "Explain how blockchain enforces voting rules",
  "What are the limitations of this prototype?",
  "How does AI assist in tender evaluation?",
  "What happens if quorum is not reached in an election?",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! I am the ChainGov AI assistant. I can help you understand elections, proposals, tenders, and blockchain concepts. Ask me anything about the platform.\n\n⚠️ I am an advisory assistant only. I cannot cast votes, approve proposals, or award tenders.", timestamp: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { data: analytics } = useQuery({ queryKey: ["analytics"], queryFn: api.getAnalytics });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (message?: string) => {
    const text = message || input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text, timestamp: new Date() }]);
    setLoading(true);
    try {
      const context = analytics ? `Platform data: ${JSON.stringify({ overview: analytics.overview, electionStats: analytics.electionStats })}` : "No platform data available.";
      const result = await api.chat({ message: text, context });
      setMessages((prev) => [...prev, { role: "ai", content: result.response, timestamp: new Date() }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", content: "I encountered an error. Please try again.", timestamp: new Date() }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">AI Assistant</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Advisory analysis and governance information assistant</p>
      </div>

      <div className="glass-card p-3 mb-4 border-amber-500/20 flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-amber-400/80 text-xs">AI responses are advisory only. The AI cannot cast votes, modify blockchain state, or make binding decisions. Always verify important information independently.</p>
      </div>

      {/* Suggestions */}
      <div className="flex gap-2 flex-wrap mb-4">
        {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
          <button key={q} onClick={() => send(q)} disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs border border-[#252a3d] text-[#94a3b8] hover:border-[#4f6ef7]/40 hover:text-white transition-all truncate max-w-xs">
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 glass-card overflow-y-auto p-4 space-y-4 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "user" ? "bg-[#4f6ef7]" : "bg-purple-500/20"}`}>
              {m.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-purple-400" />}
            </div>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 ${m.role === "user" ? "bg-[#4f6ef7]/20 border border-[#4f6ef7]/30 text-white" : "bg-[#171b2d] border border-[#252a3d] text-[#e2e8f0]"}`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
              <p className="text-xs text-[#475569] mt-1">{m.timestamp.toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center"><Bot className="w-4 h-4 text-purple-400" /></div>
            <div className="bg-[#171b2d] border border-[#252a3d] rounded-xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => <div key={i} className="w-2 h-2 rounded-full bg-[#475569] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          className="input-field flex-1" placeholder="Ask about elections, proposals, tenders, or blockchain concepts..." disabled={loading} />
        <button onClick={() => send()} disabled={!input.trim() || loading} className="btn-primary px-4">
          {loading ? <span className="loading-spinner" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
