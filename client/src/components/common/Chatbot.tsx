import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, ChevronDown, X, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { API } from "@/lib/api"; // Import your API service
import { useTranslation } from "react-i18next";

type Message = {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
};

interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hi there! 👋 I'm your SalonSite assistant. How can I help you today?",
    sender: "bot",
    timestamp: new Date(),
  },
];

export function Chatbot() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: t('chat.welcome', 'Hi there! 👋 I\'m your SalonSite assistant. How can I help you today?'),
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized, messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessageContent = inputValue.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      content: userMessageContent,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const payload: ChatMessage[] = [
        {
          role: "user",
          parts: [{ text: userMessageContent }],
        },
      ];

      const response = await API.chat.sendMessage(payload, sessionId);
      const botResponseData = response.data;

      // Update session ID if returned
      if (botResponseData.session_id) {
        setSessionId(botResponseData.session_id);
      }

      let botMessageContent = "Sorry, I couldn't get a clear response.";

      if (
        botResponseData &&
        botResponseData.candidates?.[0]?.content?.parts?.[0]?.text
      ) {
        botMessageContent = botResponseData.candidates[0].content.parts[0].text;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botMessageContent,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error("Error sending message:", error);

      let errorMessage = "Sorry, something went wrong while fetching the response.";
      if (error.isAxiosError && error.response) {
        errorMessage = error.response.data?.error || `API Error: ${error.response.status}`;
      } else {
        errorMessage = `Error: ${error.message}`;
      }

      const errorMessageForUser: Message = {
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessageForUser]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
    setTimeout(() => {
      handleSendMessage();
    }, 0);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const expandChat = () => {
    setIsMinimized(false);
  };

  const commonQuestions = [
    t('chat.questions.createWebsite'),
    t('chat.questions.pricing'),
    t('chat.questions.trial'),
    t('chat.questions.customize'),
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Chatbot Toggle Button */}
      {!isOpen && (
        <Button
          onClick={toggleChat}
          className="rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 transition-all duration-300 border-0 flex items-center justify-center"
          aria-label="Open chat"
        >
          <MessageSquare className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl transition-all duration-300 overflow-hidden flex flex-col",
            isMinimized ? "w-72 h-16" : "w-80 sm:w-96 h-[32rem] max-h-[calc(100vh-6rem)]"
          )}
        >
          {/* Chat Header */}
          <div
            className="bg-gradient-to-r from-purple-600 to-blue-500 p-3 flex justify-between items-center cursor-pointer"
            onClick={isMinimized ? expandChat : undefined}
          >
            <div className="flex items-center text-white flex-grow">
              <Avatar className="h-8 w-8 mr-2 border-2 border-white/20">
                <AvatarFallback className="bg-white text-purple-600">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{t('chat.title')}</p>
                {!isMinimized && (
                  <p className="text-xs opacity-80">{t('chat.subtitle')}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {!isMinimized && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
                  onClick={minimizeChat}
                  aria-label="Minimize chat"
                >
                  <ChevronDown className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
                onClick={toggleChat}
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-gray-900">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.sender === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.sender === "bot" && (
                        <Avatar className="h-8 w-8 mr-2 flex-shrink-0 mt-1">
                          <AvatarFallback className="bg-purple-600 text-white">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-4 py-2",
                          message.sender === "user"
                            ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {message.sender === "user" && (
                        <Avatar className="h-8 w-8 ml-2 flex-shrink-0 mt-1">
                          <AvatarFallback className="bg-blue-500 text-white">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                        <AvatarFallback className="bg-purple-600 text-white">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                        <div className="flex space-x-1">
                          <span className="sr-only">Bot is typing...</span>
                          <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce"></div>
                          <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce delay-75"></div>
                          <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce delay-150"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Quick Questions */}
              {messages.length <= initialMessages.length && !isTyping && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {t('chat.commonQuestions')}
                  </p>
                  <div className="flex flex-col space-y-2">
                    {commonQuestions.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full text-sm justify-start bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => handleQuickQuestion(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center space-x-2"
                >
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={isTyping ? t('chat.typing') : t('chat.placeholder')}
                    className="flex-grow rounded-full"
                    disabled={isTyping}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 border-0 flex-shrink-0 rounded-full"
                    disabled={!inputValue.trim() || isTyping}
                  >
                    <Send className="h-4 w-4 text-white" />
                    <span className="sr-only">Send message</span>
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}