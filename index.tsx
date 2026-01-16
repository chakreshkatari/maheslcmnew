import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { 
  Send, 
  Menu, 
  Plus, 
  MessageSquare, 
  Image as ImageIcon, 
  Mic, 
  Sparkles,
  User,
  Bot,
  Settings,
  History
} from "lucide-react";

// --- Types ---
interface Message {
  role: "user" | "model";
  text: string;
  isStreaming?: boolean;
}

// --- API Helper ---
// Using a ref to keep the chat session alive would be ideal, but for simplicity
// we will just re-instantiate or use a singleton-like pattern inside the component.
const initGenAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const App = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = initGenAI();
      const model = "gemini-3-flash-preview"; 
      
      // We'll use chat mode to maintain context
      // Re-constructing chat history for the API
      // Note: In a real app, you'd persist the `chat` object or history.
      // Here we just send the history + new message for simplicity in this demo structure
      // or effectively use generateContent if we don't keep the chat object.
      // Better: Use `chats.create` and feed history.
      
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const chat = ai.chats.create({
        model: model,
        history: history,
        config: {
          systemInstruction: "You are a helpful, clever, and concise AI assistant using Google's Gemini models.",
        }
      });

      // Add placeholder for model response
      setMessages(prev => [...prev, { role: "model", text: "", isStreaming: true }]);

      const result = await chat.sendMessageStream({ message: userMessage });
      
      let fullText = "";
      
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullText += c.text;
          setMessages(prev => {
            const newArr = [...prev];
            const lastMsg = newArr[newArr.length - 1];
            if (lastMsg.role === "model") {
              lastMsg.text = fullText;
            }
            return newArr;
          });
        }
      }
      
      // Finalize
      setMessages(prev => {
        const newArr = [...prev];
        const lastMsg = newArr[newArr.length - 1];
        if (lastMsg.role === "model") {
            lastMsg.isStreaming = false;
        }
        return newArr;
      });

    } catch (error) {
      console.error("Error generating content:", error);
      setMessages(prev => [...prev, { role: "model", text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to format text with simple markdown-like features
  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#131314] text-[#E3E3E3]">
      
      {/* Sidebar */}
      <div 
        className={`${
          isSidebarOpen ? "w-[280px]" : "w-0"
        } bg-[#1E1F20] transition-all duration-300 flex flex-col border-r border-[#444746] overflow-hidden shrink-0`}
      >
        <div className="p-4">
          <button 
            onClick={() => setMessages([])}
            className="w-full flex items-center gap-3 bg-[#2D2E30] hover:bg-[#37393B] text-[#E3E3E3] py-3 px-4 rounded-full transition-colors"
          >
            <Plus size={20} className="text-[#A8C7FA]" />
            <span className="font-medium text-sm">New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          <div className="px-4 py-2 text-xs font-medium text-[#8E918F] uppercase tracking-wider">Recent</div>
          <div className="space-y-1">
             <div className="flex items-center gap-3 px-4 py-2 text-sm text-[#E3E3E3] hover:bg-[#2D2E30] rounded-r-full cursor-pointer">
               <MessageSquare size={16} />
               <span className="truncate">Previous conversation...</span>
             </div>
             {/* Mock Items */}
             <div className="flex items-center gap-3 px-4 py-2 text-sm text-[#E3E3E3] hover:bg-[#2D2E30] rounded-r-full cursor-pointer">
               <MessageSquare size={16} />
               <span className="truncate">React Native Setup</span>
             </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#444746]">
          <div className="flex items-center gap-3 px-2 py-2 text-sm hover:bg-[#2D2E30] rounded-lg cursor-pointer">
            <Settings size={18} />
            <span>Settings</span>
          </div>
          <div className="flex items-center gap-3 px-2 py-2 text-sm hover:bg-[#2D2E30] rounded-lg cursor-pointer mt-1">
            <History size={18} />
            <span>Activity</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-2 mt-4 text-xs text-[#8E918F]">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            Shanghai, China
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 hover:bg-[#2D2E30] rounded-full text-[#E3E3E3]"
            >
              <Menu size={20} />
            </button>
            <span className="text-xl font-medium text-[#E3E3E3] opacity-90">Gemini</span>
            <span className="text-xs bg-[#2D2E30] px-2 py-1 rounded text-[#A8C7FA]">3.0 Flash</span>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            U
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 scrollbar-hide">
          <div className="max-w-3xl mx-auto py-8 min-h-full flex flex-col">
            
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-0 animate-fadeIn" style={{animationFillMode: 'forwards', animationDuration: '0.5s'}}>
                <div className="mb-8">
                  <h1 className="text-5xl font-medium bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#D96570] text-transparent bg-clip-text pb-2">
                    Hello, User
                  </h1>
                  <p className="text-2xl text-[#8E918F]">How can I help you today?</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                   {["Explain quantum computing", "Write a Python script", "Plan a healthy meal", "Tips for public speaking"].map((txt, i) => (
                     <button 
                       key={i}
                       onClick={() => {
                         setInput(txt);
                         // Optional: auto-send
                       }}
                       className="bg-[#1E1F20] hover:bg-[#2D2E30] p-4 rounded-xl text-left border border-transparent hover:border-[#444746] transition-all h-32 flex flex-col justify-between group"
                     >
                       <span className="text-[#E3E3E3] font-medium">{txt}</span>
                       <div className="self-end bg-[#131314] p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                         <Sparkles size={16} />
                       </div>
                     </button>
                   ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      msg.role === 'model' 
                        ? 'bg-gradient-to-tr from-[#4285F4] to-[#9B72CB]' 
                        : 'bg-[#444746]'
                    }`}>
                      {msg.role === 'model' ? <Sparkles size={16} className="text-white" /> : <User size={16} className="text-white" />}
                    </div>
                    
                    <div className={`max-w-[80%] pt-1 prose ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                       {msg.role === 'user' ? (
                          <div className="bg-[#2D2E30] px-4 py-2.5 rounded-2xl rounded-tr-none text-[#E3E3E3] inline-block">
                             {msg.text}
                          </div>
                       ) : (
                          <div className="text-[#E3E3E3] leading-relaxed">
                             {/* Simple rendering, in reality use markdown parser */}
                             {formatText(msg.text)}
                             {msg.isStreaming && <span className="typing-cursor ml-1"></span>}
                          </div>
                       )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#131314]">
          <div className="max-w-3xl mx-auto bg-[#1E1F20] rounded-3xl p-2 border border-[#444746] focus-within:border-[#A8C7FA] transition-colors relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a prompt here"
              className="w-full bg-transparent text-[#E3E3E3] placeholder-[#8E918F] p-3 resize-none outline-none max-h-48 overflow-y-auto scrollbar-hide"
              rows={1}
              style={{ minHeight: '52px' }}
            />
            
            <div className="flex justify-between items-center px-2 pb-1">
              <div className="flex gap-2 text-[#E3E3E3]">
                <button className="p-2 hover:bg-[#2D2E30] rounded-full transition-colors" title="Upload Image">
                   <ImageIcon size={20} />
                </button>
                <button className="p-2 hover:bg-[#2D2E30] rounded-full transition-colors" title="Use Microphone">
                   <Mic size={20} />
                </button>
              </div>
              
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`p-2 rounded-full transition-all ${
                  input.trim() 
                    ? "bg-[#E3E3E3] text-[#131314] hover:bg-white" 
                    : "bg-[#2D2E30] text-[#8E918F] cursor-not-allowed"
                }`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          <div className="text-center text-xs text-[#8E918F] mt-3">
             Gemini may display inaccurate info, including about people, so double-check its responses.
          </div>
        </div>

      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
