import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  RotateCcw,
  Terminal,
  Copy,
  Check,
  Lightbulb,
  Code2,
  BookOpen,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { assistantService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STORAGE_KEY = 'campus_bond_chatbot_history';

const getInitialGreeting = (name = 'there') => ({
  id: 'msg-welcome',
  sender: 'bot',
  text: `Hey ${name}!\n\nHow can I help you today? Ask me **any question** — whether it's coding, math, science, homework, writing, or general queries!`,
  timestamp: new Date().toISOString(),
});

const QUICK_SUGGESTIONS = [
  {
    icon: Code2,
    label: 'Explain React useEffect hook with example',
    prompt: 'Explain how the useEffect hook works in React with a clear code example.',
  },
  {
    icon: Lightbulb,
    label: 'How does binary search work?',
    prompt: 'Explain how binary search works with time complexity and an example.',
  },
  {
    icon: BookOpen,
    label: 'Write a sick leave application to college',
    prompt: 'Write a professional leave application letter to college due to illness.',
  },
  {
    icon: HelpCircle,
    label: 'Tips to prepare for technical interviews',
    prompt: 'What are the most effective tips to prepare for tech campus placement interviews?',
  },
];

/**
 * Clean Code Block Component with Copy button and language badge
 */
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-gray-700/80 bg-[#0d1117] text-gray-100 shadow-sm text-xs sm:text-sm">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-gray-800 text-[11px] text-gray-400 font-mono">
        <span className="flex items-center gap-1.5 uppercase font-semibold text-gray-300">
          <Terminal className="w-3 h-3 text-blue-400" />
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors cursor-pointer active:scale-95"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto font-mono text-[12px] sm:text-[13px] leading-relaxed text-gray-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Formats inline text (bold, italic, inline code)
 */
function renderInlineMarkdown(text = '') {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens.map((token, idx) => {
    if (!token) return null;

    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 text-[12px] sm:text-[13px] font-mono bg-gray-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded border border-gray-300 dark:border-slate-700"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={idx} className="font-bold text-gray-950 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return (
        <em key={idx} className="italic text-gray-800 dark:text-slate-200">
          {token.slice(1, -1)}
        </em>
      );
    }
    return token;
  });
}

/**
 * Renders lines including markdown tables, headings, lists, and paragraphs
 */
function renderLinesAndTables(lines, blockIndex) {
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    // Check if start of markdown table
    if (
      trimmed.startsWith('|') &&
      trimmed.endsWith('|') &&
      lines[i + 1]?.trim().match(/^\|[\s\-:|]+\|$/)
    ) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      const headers = tableLines[0].slice(1, -1).split('|').map((c) => c.trim());
      const rows = tableLines
        .slice(2)
        .map((rowLine) => rowLine.slice(1, -1).split('|').map((c) => c.trim()));

      elements.push(
        <div
          key={`tbl-${blockIndex}-${i}`}
          className="my-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xs"
        >
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 text-xs sm:text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/80">
              <tr>
                {headers.map((h, hIdx) => (
                  <th
                    key={hIdx}
                    className="px-3.5 py-2.5 text-left font-bold text-gray-900 dark:text-white"
                  >
                    {renderInlineMarkdown(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 bg-white dark:bg-[#131D31]">
              {rows.map((r, rIdx) => (
                <tr
                  key={rIdx}
                  className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {r.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2 text-gray-800 dark:text-slate-200">
                      {renderInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (!trimmed) {
      elements.push(<div key={`sp-${blockIndex}-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // Horizontal divider
    if (trimmed === '---' || trimmed === '***') {
      elements.push(
        <hr key={`hr-${blockIndex}-${i}`} className="my-3 border-gray-200 dark:border-slate-800" />
      );
      i++;
      continue;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3
          key={`h3-${blockIndex}-${i}`}
          className="font-bold text-base sm:text-lg text-gray-950 dark:text-white mt-3 mb-1"
        >
          {renderInlineMarkdown(trimmed.slice(4))}
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2
          key={`h2-${blockIndex}-${i}`}
          className="font-black text-lg sm:text-xl text-gray-950 dark:text-white mt-3.5 mb-1.5"
        >
          {renderInlineMarkdown(trimmed.slice(3))}
        </h2>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1
          key={`h1-${blockIndex}-${i}`}
          className="font-black text-xl sm:text-2xl text-gray-950 dark:text-white mt-4 mb-2"
        >
          {renderInlineMarkdown(trimmed.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    // Bullets
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
    if (isBullet) {
      const cleanContent = trimmed.replace(/^[•\-\*]\s*/, '');
      elements.push(
        <div key={`b-${blockIndex}-${i}`} className="flex items-start gap-2.5 my-1 pl-1">
          <span className="text-blue-600 dark:text-blue-400 font-bold text-sm mt-0.5">•</span>
          <div className="flex-1 leading-relaxed text-sm sm:text-base">
            {renderInlineMarkdown(cleanContent)}
          </div>
        </div>
      );
      i++;
      continue;
    }

    // Numbered List
    const matchNum = trimmed.match(/^(\d+)\.\s*(.*)/);
    if (matchNum) {
      elements.push(
        <div key={`n-${blockIndex}-${i}`} className="flex items-start gap-2.5 my-1.5 pl-1">
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5">
            {matchNum[1]}.
          </span>
          <div className="flex-1 leading-relaxed text-sm sm:text-base">
            {renderInlineMarkdown(matchNum[2])}
          </div>
        </div>
      );
      i++;
      continue;
    }

    elements.push(
      <p key={`p-${blockIndex}-${i}`} className="my-1.5 leading-relaxed text-sm sm:text-base">
        {renderInlineMarkdown(trimmed)}
      </p>
    );
    i++;
  }

  return elements;
}

/**
 * Full Markdown renderer supporting code blocks, tables, headers, lists, and inline formatting
 */
function renderFormattedMarkdown(rawText = '') {
  if (!rawText) return null;

  // Split by fenced code blocks
  const parts = rawText.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const match = part.match(/^```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```$/);
      const language = match ? match[1] : '';
      let code = match ? match[2] : part.slice(3, -3);

      // Clean up literal \n escapes if present
      code = code
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/^[\r\n]+|[\r\n]+$/g, '');

      return <CodeBlock key={index} code={code} language={language} />;
    }

    const lines = part.split('\n');
    return renderLinesAndTables(lines, index);
  });
}

export default function CampusAssistantPage() {
  const { user } = useAuth();
  const studentFirstName = user?.name ? user.name.split(' ')[0] : 'Vikash';

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [getInitialGreeting(studentFirstName)];
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectionToolbar, setSelectionToolbar] = useState(null);
  const [copiedSelection, setCopiedSelection] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const targetScrollIdRef = useRef(null);
  const chatAreaRef = useRef(null);

  // Save history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Scroll to the start of the message/output so user reads from the top
  useEffect(() => {
    if (targetScrollIdRef.current) {
      const el = document.getElementById(targetScrollIdRef.current);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        targetScrollIdRef.current = null;
        return;
      }
    }
  }, [messages, isTyping]);

  // Floating Text Selection Toolbar (ChatGPT-style)
  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
          setSelectionToolbar(null);
          return;
        }

        const text = selection.toString().trim();
        if (!text || text.length < 2) {
          setSelectionToolbar(null);
          return;
        }

        // Verify selection is within chat messages area
        if (!chatAreaRef.current || !chatAreaRef.current.contains(selection.anchorNode)) {
          setSelectionToolbar(null);
          return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Calculate screen-bounded coordinates
        const x = Math.max(130, Math.min(window.innerWidth - 130, rect.left + rect.width / 2));
        const isNearTop = rect.top < 80;
        const y = isNearTop ? rect.bottom + 10 : rect.top - 10;

        setSelectionToolbar({
          text,
          x,
          y,
          isNearTop,
        });
      }, 20);
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionToolbar(null);
      }
    };

    const handleScroll = () => {
      setSelectionToolbar(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('selectionchange', handleSelectionChange);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const handleAskAssistant = (text) => {
    setInputText(`Explain: "${text}"`);
    setSelectionToolbar(null);
    window.getSelection()?.removeAllRanges();
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleExplainSelection = (text) => {
    setSelectionToolbar(null);
    window.getSelection()?.removeAllRanges();
    handleSendMessage(`Can you please explain this in detail: "${text}"`);
  };

  const handleCopySelection = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSelection(true);
      setTimeout(() => {
        setCopiedSelection(false);
        setSelectionToolbar(null);
      }, 1000);
    } catch {
      // ignore
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || isTyping) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    };

    targetScrollIdRef.current = userMsgId;
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Multi-turn context
      const history = messages
        .filter((m) => m.id !== 'msg-welcome')
        .slice(-6)
        .map((m) => ({
          sender: m.sender,
          text: m.text,
        }));

      const res = await assistantService.ask(query, studentFirstName, history);
      const botMsgId = `bot-${Date.now()}`;
      const botMsg = {
        id: botMsgId,
        sender: 'bot',
        text: res.data?.answer || `I am ready to help you with any question.`,
        timestamp: new Date().toISOString(),
      };

      // Keep viewport at the start of the new question & answer so user reads from the top
      targetScrollIdRef.current = userMsgId;
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const botMsgId = `bot-${Date.now()}`;
      const botMsg = {
        id: botMsgId,
        sender: 'bot',
        text: `Sorry, I couldn't reach the server right now. Please make sure the backend server is running.`,
        timestamp: new Date().toISOString(),
      };
      targetScrollIdRef.current = userMsgId;
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleResetChat = () => {
    if (window.confirm('Clear all conversation history?')) {
      setMessages([getInitialGreeting(studentFirstName)]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const isOnlyGreeting = messages.length === 1 && messages[0].id === 'msg-welcome';

  return (
    <div className="space-y-6">
      {/* ─── Top Header Card ─── */}
      <div className="bg-white dark:bg-[#0E1626] border border-gray-300 dark:border-slate-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-gray-950 dark:text-white tracking-tight">
              Campus Assistant
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 shadow-2xs">
              Online 24/7
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 font-normal mt-1.5 max-w-xl">
            Hey <span className="font-semibold text-gray-900 dark:text-white">{studentFirstName}</span>, ask any query to get the direct step-by-step process.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleResetChat}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* ─── Full-Page Conversation Box ─── */}
      <div className="w-full bg-white dark:bg-[#0E1626] border border-gray-300 dark:border-slate-800/90 rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden flex flex-col h-[calc(100vh-14rem)] min-h-[500px]">
        {/* Messages Stream */}
        <div ref={chatAreaRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                id={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                {!isUser && (
                  <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-1.5 px-1 tracking-wide uppercase">
                    Campus Assistant
                  </span>
                )}

                <div className={`max-w-[88%] sm:max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 sm:p-5 rounded-2xl text-sm sm:text-base leading-relaxed ${
                      isUser
                        ? 'bg-[#0B1528] dark:bg-blue-600 text-white rounded-tr-xs shadow-xs font-normal'
                        : 'bg-gray-100/90 dark:bg-[#131D31] text-gray-900 dark:text-slate-100 border border-gray-200/80 dark:border-slate-800/90 rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      renderFormattedMarkdown(msg.text)
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10.5px] text-gray-400 dark:text-slate-500 mt-1.5 px-1 font-mono-code">
                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex flex-col items-start max-w-[85%]">
              <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 mb-1.5 px-1 tracking-wide uppercase">
                Campus Assistant
              </span>
              <div className="p-4 bg-gray-100/90 dark:bg-[#131D31] border border-gray-200/80 dark:border-slate-800/90 rounded-2xl rounded-tl-xs flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 bg-[#0B1528] dark:bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-[#0B1528] dark:bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-[#0B1528] dark:bg-blue-400 rounded-full animate-bounce" />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 ml-2 font-medium">
                  Thinking...
                </span>
              </div>
            </div>
          )}

          {/* Quick Suggestion Chips if conversation just started */}
          {isOnlyGreeting && !isTyping && (
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl">
              {QUICK_SUGGESTIONS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(item.prompt)}
                    className="text-left p-3.5 rounded-2xl bg-white dark:bg-[#131D31] border border-gray-200 dark:border-slate-800 hover:border-[#0B1528] dark:hover:border-blue-500 text-xs sm:text-sm text-gray-700 dark:text-slate-300 flex items-center gap-3 transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-800 dark:text-slate-200 group-hover:scale-105 transition-transform flex-shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="line-clamp-1 font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ─── Bottom Input Bar ─── */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 bg-gray-50/90 dark:bg-[#0B111E]/95 border-t border-gray-200 dark:border-slate-800 flex items-center gap-2 sm:gap-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Hey ${studentFirstName}, ask any query...`}
            disabled={isTyping}
            className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-[#131D31] border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-2xs"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="px-5 py-3 rounded-2xl bg-[#0B1528] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md font-bold text-sm flex items-center gap-2 cursor-pointer flex-shrink-0"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* ─── Floating Text Selection Action Toolbar (ChatGPT-style) ─── */}
      {selectionToolbar && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          style={{
            position: 'fixed',
            left: `${selectionToolbar.x}px`,
            top: `${selectionToolbar.y}px`,
            transform: selectionToolbar.isNearTop
              ? 'translate(-50%, 0)'
              : 'translate(-50%, -100%)',
            zIndex: 9999,
          }}
          className="flex items-center bg-[#18181b] dark:bg-[#131a26] text-white border border-gray-700/80 rounded-xl shadow-2xl py-1 px-1 text-xs font-medium backdrop-blur-md select-none transition-all"
        >
          {/* Ask Assistant */}
          <button
            type="button"
            onClick={() => handleAskAssistant(selectionToolbar.text)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition-all text-gray-200 hover:text-white cursor-pointer"
            title="Ask Assistant about this"
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
            <span>Ask Assistant</span>
          </button>

          <div className="w-px h-4 bg-gray-700 mx-0.5" />

          {/* Explain */}
          <button
            type="button"
            onClick={() => handleExplainSelection(selectionToolbar.text)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition-all text-gray-200 hover:text-white cursor-pointer"
            title="Explain this text in detail"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Explain</span>
          </button>

          <div className="w-px h-4 bg-gray-700 mx-0.5" />

          {/* Copy */}
          <button
            type="button"
            onClick={() => handleCopySelection(selectionToolbar.text)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition-all text-gray-200 hover:text-white cursor-pointer"
            title="Copy selected text"
          >
            {copiedSelection ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
