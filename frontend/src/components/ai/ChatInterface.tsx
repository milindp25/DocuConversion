/**
 * Chat interface for conversational PDF interaction.
 * Renders a scrollable message list with user/assistant bubbles
 * and an input bar for sending questions about the uploaded PDF.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { Send, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/** A single message in the chat conversation */
export interface ChatMessage {
  /** Role of the message sender */
  role: "user" | "assistant";
  /** Message text content */
  content: string;
}

/** Props for the ChatInterface component */
export interface ChatInterfaceProps {
  /** Handler called when the user sends a message */
  onSendMessage: (question: string) => Promise<void>;
  /** List of messages in the conversation */
  messages: ChatMessage[];
  /** Whether the assistant is currently generating a response */
  isProcessing: boolean;
}

/**
 * ChatInterface provides a conversational UI for interacting with a PDF.
 * User messages are right-aligned with blue backgrounds; assistant messages
 * are left-aligned with gray backgrounds. Auto-scrolls on new messages.
 *
 * @example
 * ```tsx
 * <ChatInterface
 *   onSendMessage={handleSend}
 *   messages={messages}
 *   isProcessing={isLoading}
 * />
 * ```
 */
export function ChatInterface({
  onSendMessage,
  messages,
  isProcessing,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Auto-scroll to the bottom when messages change */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /** Focus the input after the assistant finishes responding */
  useEffect(() => {
    if (!isProcessing) {
      inputRef.current?.focus();
    }
  }, [isProcessing]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isProcessing) return;

      setInput("");
      await onSendMessage(trimmed);
    },
    [input, isProcessing, onSendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const trimmed = input.trim();
        if (trimmed && !isProcessing) {
          setInput("");
          onSendMessage(trimmed);
        }
      }
    },
    [input, isProcessing, onSendMessage]
  );

  return (
    <div
      className="flex flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      role="region"
      aria-label="Chat with PDF"
    >
      {/* Message list */}
      <div
        className="flex min-h-[320px] max-h-[480px] flex-col gap-3 overflow-y-auto p-4"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
            Ask a question about your PDF to get started.
          </p>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              )}
              role="article"
              aria-label={`${message.role === "user" ? "You" : "Assistant"}: ${message.content}`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your PDF..."
          disabled={isProcessing}
          aria-label="Type your question"
          className={cn(
            "flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors duration-200",
            "focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
            "dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-indigo-500",
            isProcessing && "cursor-not-allowed opacity-60"
          )}
        />

        <button
          type="submit"
          disabled={isProcessing || !input.trim()}
          aria-label="Send message"
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
            isProcessing || !input.trim()
              ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600"
              : "bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700"
          )}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
