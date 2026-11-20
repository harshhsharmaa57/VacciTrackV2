import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  X, 
  Send, 
  ShieldCheck, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  FileText, 
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { chatAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  suggestions?: string[];
  actionType?: 'certificate' | 'schedule';
}

export type PromptLanguage = 'hindi' | 'english';

export const HINDI_QUESTIONS = [
  "टीकाकरण के बाद बच्चे को बुखार आ गया, क्या घरेलू उपाय करें?",
  "12 सप्ताह बाद भी बीसीजी का निशान नहीं बना, क्या दोबारा टीका लगेगा?",
  "टीका लगने के तुरंत बाद बच्चे को नहलाना सुरक्षित है क्या?",
  "अगर निर्धारित खुराक की तारीख निकल गई या टीका छूट गया तो क्या करें?",
  "पेंटावेलेंट टीका बच्चे को किन 5 जानलेवा बीमारियों से बचाता है?",
  "आधिकारिक क्यूआर कोड वाला टीकाकरण प्रमाणपत्र कैसे डाउनलोड करें?",
  "पोलियो की दो बूंद (OPV) और सुई वाले टीके (fIPV) में क्या अंतर है?",
  "टीका लगने वाली जगह पर सूजन और दर्द का सुरक्षित इलाज क्या है?",
  "बच्चे का आभा (ABHA) कार्ड क्या होता है और इसके क्या फायदे हैं?",
  "भारत सरकार के राष्ट्रीय टीकाकरण कार्यक्रम (NIS 2025) की पूरी जानकारी",
];

export const ENGLISH_QUESTIONS = [
  "What to do if baby gets fever after vaccine?",
  "What if no BCG scar has formed after 12 weeks?",
  "Can I bathe my baby immediately after vaccination?",
  "What if we missed a scheduled vaccine dose?",
  "What is Pentavalent vaccine and why is it given?",
  "How to download official QR-verified certificate?",
  "What is the difference between OPV and IPV polio vaccines?",
  "How to relieve injection site swelling and pain?",
  "What is ABHA ID and why is it needed?",
  "Overview of India's NIS 2025 vaccine schedule",
];

const VaxBotChat: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activePromptTab, setActivePromptTab] = useState<PromptLanguage>(language === 'hi' ? 'hindi' : 'english');
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Sync active prompt tab with global app language
  useEffect(() => {
    setActivePromptTab(language === 'hi' ? 'hindi' : 'english');
  }, [language]);

  const getWelcomeText = (name?: string, lang: PromptLanguage = 'hindi') => {
    if (lang === 'hindi') {
      return name
        ? `नमस्ते ${name}! 🙏 मैं **VaxBot** हूँ — आपका बाल रोग व राष्ट्रीय टीकाकरण कार्यक्रम (NIS 2025) एआई मार्गदर्शक।\n\nअपने बच्चे के टीके, बुखार की देखभाल, छूटी हुई खुराक, या डिजिटल प्रमाणपत्र से जुड़े किसी भी सवाल के लिए बेझिझक पूछें!`
        : `नमस्ते! 🙏 मैं **VaxBot** हूँ — आपका बाल रोग व राष्ट्रीय टीकाकरण कार्यक्रम (NIS 2025) एआई मार्गदर्शक।\n\nआप मुझसे टीकों के साइड इफेक्ट्स, बुखार की देखभाल, छूटी हुई खुराक, या संपूर्ण टीकाकरण अनुसूची के बारे में शुद्ध हिंदी में पूछ सकते हैं!`;
    }
    return name
      ? `Hello ${name}! 👋 I am **VaxBot** — your AI Pediatric & NIS 2025 Vaccine Guide.\n\nFeel free to ask about your child's vaccination updates, fever care, missed doses, or digital certificates!`
      : `Hello! 👋 I am **VaxBot** — your AI Pediatric & NIS 2025 Vaccine Guide.\n\nYou can ask me about vaccine side effects, fever management, missed doses, or the national immunization schedule!`;
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: getWelcomeText(user?.name, language === 'hi' ? 'hindi' : 'english'),
      timestamp: new Date(),
    },
  ]);

  // Synchronize welcome message when user authentication or activePromptTab changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [
          {
            id: 'welcome',
            sender: 'bot',
            text: getWelcomeText(user?.name, activePromptTab),
            timestamp: prev[0].timestamp,
          },
        ];
      }
      return prev;
    });
  }, [user?.name, activePromptTab]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setSpeakingMsgId(null);
      }
    }
  }, [isOpen, messages, isTyping]);

  // Pre-load synthesis voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const handleSpeak = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`•\-]/g, '');
    const isHindi = /[\u0900-\u097F]/.test(cleanText) || activePromptTab === 'hindi';
    const utterance = new SpeechSynthesisUtterance(cleanText);

    const voices = window.speechSynthesis.getVoices();

    if (isHindi) {
      utterance.lang = 'hi-IN';
      const hindiVoice =
        voices.find(v => v.lang.toLowerCase() === 'hi-in' || v.lang.toLowerCase().startsWith('hi')) ||
        voices.find(v => v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('hemant') || v.name.toLowerCase().includes('india')) ||
        voices.find(v => v.lang.toLowerCase() === 'en-in');

      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
    } else {
      utterance.lang = 'en-IN';
      const englishVoice =
        voices.find(v => v.lang.toLowerCase() === 'en-in') ||
        voices.find(v => v.name.toLowerCase().includes('india')) ||
        voices.find(v => v.lang.toLowerCase().startsWith('en'));

      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      utterance.rate = 0.95;
    }

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleResetChat = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: getWelcomeText(user?.name, activePromptTab),
        timestamp: new Date(),
      },
    ]);
  };

  const detectAction = (text: string): 'certificate' | 'schedule' | undefined => {
    const lower = text.toLowerCase();
    if (
      lower.includes('certificate') ||
      lower.includes('pdf') ||
      lower.includes('praman patra') ||
      text.includes('प्रमाणपत्र') ||
      text.includes('सर्टिफिकेट')
    ) {
      return 'certificate';
    }
    if (
      lower.includes('schedule') ||
      lower.includes('dates') ||
      lower.includes('due date') ||
      text.includes('अनुसूची') ||
      text.includes('शेड्यूल')
    ) {
      return 'schedule';
    }
    return undefined;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsgId = Date.now().toString();
    const newUserMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    try {
      const res = await chatAPI.ask(text, {
        userName: user?.name,
        userRole: user?.role,
        lang: activePromptTab,
      });
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.reply,
        timestamp: new Date(),
        suggestions: res.suggestions && res.suggestions.length > 0 ? res.suggestions : undefined,
        actionType: detectAction(res.reply),
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (err: any) {
      console.error(err);
      const fallbackResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text:
          activePromptTab === 'hindi'
            ? 'माफ़ कीजिए, सर्वर से जुड़ने में समस्या आ रही है। टीकाकरण के बाद हल्का बुखार आना पूरी तरह सामान्य है। बच्चे को आरामदायक सूती कपड़े पहनाएं और माथे पर गुनगुने पानी की पट्टी रखें।'
            : 'Sorry, having trouble connecting to the server. Mild fever after vaccination is completely normal. Keep baby in comfortable cotton clothing and apply a lukewarm damp cloth to forehead.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className={cn('min-h-[1.25rem]', idx > 0 && 'mt-1')}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-foreground">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  const currentQuestions = activePromptTab === 'hindi' ? HINDI_QUESTIONS : ENGLISH_QUESTIONS;

  return (
    <>
      {/* Floating Trigger Button - Ultra Sleek with Glowing Orb */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.div
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.94 }}
          className="relative group"
        >
          {/* Ambient Glow */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 opacity-70 blur-md group-hover:opacity-100 transition-opacity animate-pulse pointer-events-none" />

          <button
            onClick={() => setIsOpen(prev => !prev)}
            className="relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-2xl border border-white/25 transition-all duration-300"
            aria-label="Open VaxBot AI Assistant"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-white animate-bounce" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-300 rounded-full border border-teal-700" />
            </div>
            <span className="font-display font-bold text-sm tracking-tight hidden sm:inline-block">
              {isOpen
                ? activePromptTab === 'hindi'
                  ? 'VaxBot बंद करें'
                  : 'Close VaxBot'
                : activePromptTab === 'hindi'
                ? 'VaxBot एआई से पूछें'
                : 'Ask VaxBot AI'}
            </span>
          </button>
        </motion.div>
      </div>

      {/* Chat Window Dialog - Redesigned with Rich Aesthetics */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.94 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[460px] h-[640px] max-h-[86vh] bg-card/95 backdrop-blur-2xl border border-emerald-500/25 shadow-[0_20px_60px_-15px_rgba(13,148,136,0.35)] rounded-[32px] z-50 flex flex-col overflow-hidden"
          >
            {/* Top Luxury Gradient Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-cyan-800 text-white p-4 sm:p-4.5 flex items-center justify-between shadow-md relative overflow-hidden flex-shrink-0">
              {/* Subtle Ambient Light Orb inside Header */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-emerald-200 shadow-inner">
                  <Bot className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold font-display text-base text-white tracking-tight">VaxBot</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-100 border border-emerald-300/30 flex items-center gap-1 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      {activePromptTab === 'hindi' ? 'एआई ऑनलाइन' : 'AI Online'}
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-100/90 font-medium">
                    {activePromptTab === 'hindi'
                      ? 'NIS 2025 बाल रोग व टीकाकरण मार्गदर्शक'
                      : 'NIS 2025 Pediatric Immunization Guide'}
                  </p>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-1.5 relative z-10">
                <button
                  onClick={handleResetChat}
                  className="p-2 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition-all active:scale-90"
                  title={activePromptTab === 'hindi' ? 'बातचीत रीसेट करें' : 'Reset Conversation'}
                  aria-label="Reset conversation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition-all active:scale-90"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Language Pill Switcher & Quick Questions Bar (2 Clean Options: Hindi & English) */}
            <div className="p-3 bg-muted/30 border-b border-border/60 flex-shrink-0 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2 px-0.5">
                <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  {activePromptTab === 'hindi' ? 'अक्सर पूछे जाने वाले सवाल (10)' : 'Popular Questions (10)'}
                </span>

                {/* Sleek Segmented Control: 🇮🇳 हिंदी vs 🌐 English (No Hinglish) */}
                <div className="flex p-0.5 rounded-xl bg-background/90 border border-border/80 shadow-2xs">
                  <button
                    onClick={() => setActivePromptTab('hindi')}
                    className={cn(
                      'px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1',
                      activePromptTab === 'hindi'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>🇮🇳</span>
                    <span>हिंदी</span>
                  </button>
                  <button
                    onClick={() => setActivePromptTab('english')}
                    className={cn(
                      'px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1',
                      activePromptTab === 'english'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>🌐</span>
                    <span>English</span>
                  </button>
                </div>
              </div>

              {/* Horizontal Scroll Questions Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {currentQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap font-medium bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all text-left flex-shrink-0 active:scale-95 shadow-2xs hover:border-emerald-500/40"
                  >
                    <span className="font-bold opacity-60 mr-1">{idx + 1}.</span> {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex flex-col',
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div className="flex items-start gap-2.5 max-w-[88%]">
                    {msg.sender === 'bot' && (
                      <div className="w-8 h-8 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/30 shadow-xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={cn(
                        'p-4 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-sm relative group',
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-tr-xs shadow-emerald-500/10'
                          : 'bg-muted/80 text-foreground border border-border/80 rounded-tl-xs backdrop-blur-md'
                      )}
                    >
                      {renderFormattedText(msg.text)}

                      {/* Quick Action Shortcuts for Certificate or Schedule */}
                      {msg.sender === 'bot' && msg.actionType === 'certificate' && (
                        <div className="mt-3 pt-2.5 border-t border-border/60">
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              navigate('/parent');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-xs active:scale-95"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {activePromptTab === 'hindi'
                              ? 'प्रमाणपत्र डैशबोर्ड खोलें'
                              : 'Open Certificate Dashboard'}
                          </button>
                        </div>
                      )}

                      {msg.sender === 'bot' && msg.actionType === 'schedule' && (
                        <div className="mt-3 pt-2.5 border-t border-border/60">
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              navigate('/parent');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all shadow-xs active:scale-95"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            {activePromptTab === 'hindi'
                              ? 'टीकाकरण अनुसूची देखें'
                              : 'View Immunization Schedule'}
                          </button>
                        </div>
                      )}

                      {/* Welcome message quick shortcuts */}
                      {msg.sender === 'bot' && msg.id === 'welcome' && (
                        <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              navigate('/parent');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all shadow-2xs active:scale-95"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {activePromptTab === 'hindi'
                              ? 'प्रमाणपत्र डाउनलोड करें'
                              : 'Download Certificate'}
                          </button>
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              navigate('/parent');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-semibold hover:bg-teal-600 hover:text-white transition-all shadow-2xs active:scale-95"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            {activePromptTab === 'hindi' ? 'पूरा शेड्यूल देखें' : 'Full Schedule'}
                          </button>
                        </div>
                      )}

                      {/* Audio Voice Speak Button on ALL Bot messages */}
                      {msg.sender === 'bot' && (
                        <div className="mt-3 flex items-center justify-between">
                          <button
                            onClick={() => handleSpeak(msg.text, msg.id)}
                            className={cn(
                              'text-[11px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all active:scale-95',
                              speakingMsgId === msg.id
                                ? 'bg-rose-500/15 border-rose-500/30 text-rose-500 font-bold'
                                : 'bg-background/80 hover:bg-background border-border/80 text-muted-foreground hover:text-foreground font-medium'
                            )}
                            title={activePromptTab === 'hindi' ? 'उत्तर सुनें' : 'Listen to this response'}
                          >
                            {speakingMsgId === msg.id ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                                <span>{activePromptTab === 'hindi' ? 'आवाज़ रोकें' : 'Stop Audio'}</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{activePromptTab === 'hindi' ? 'सुनिए (ऑडियो)' : 'Listen (Audio)'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Suggestion Chips */}
                  {msg.sender === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pl-10">
                      {msg.suggestions.map((suggestion, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSendMessage(suggestion)}
                          className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all text-left shadow-2xs active:scale-95 flex items-center gap-1"
                        >
                          <span>{suggestion}</span>
                          <ArrowRight className="w-3 h-3 opacity-60" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2.5 text-muted-foreground text-xs pl-2">
                  <div className="w-8 h-8 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center border border-emerald-500/30">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="flex items-center gap-1.5 bg-muted p-2.5 rounded-2xl border border-border/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar - Redesigned Capsule Container */}
            <div className="p-3.5 border-t border-border/70 bg-card/90 backdrop-blur-xl flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    activePromptTab === 'hindi'
                      ? 'यहाँ अपना सवाल शुद्ध हिंदी में पूछें...'
                      : 'Ask anything about vaccines, fever, schedule...'
                  }
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-border bg-background/80 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-muted-foreground/60 shadow-inner"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isTyping}
                  size="sm"
                  className="rounded-2xl px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-10 w-10 p-0 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/25 active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-[10px] text-center text-muted-foreground/80 mt-2 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {activePromptTab === 'hindi'
                    ? 'NIS 2025 क्लिनिकल एआई गाइड • आपातकाल में तुरंत बाल रोग विशेषज्ञ से परामर्श करें'
                    : 'NIS 2025 Clinical AI Guide • In emergency consult pediatrician'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VaxBotChat;
