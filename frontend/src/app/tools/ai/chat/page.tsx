/**
 * Chat with PDF tool page.
 * Allows users to upload a PDF and then ask questions about it
 * in a conversational interface powered by AI.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MessageSquare } from "lucide-react";

import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { ChatInterface, type ChatMessage } from "@/components/ai/ChatInterface";
import { uploadFile } from "@/lib/api-client";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";

/** Response shape from the chat endpoint */
interface ChatResponse {
  answer: string;
  session_id: string;
}

/** Generates a UUID v4 for session identification */
function generateSessionId(): string {
  return crypto.randomUUID();
}

export default function ChatWithPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const sessionIdRef = useRef<string>(generateSessionId());

  /** Reset session ID on mount */
  useEffect(() => {
    sessionIdRef.current = generateSessionId();
  }, []);

  const handleFileSelect = useCallback((selected: File) => {
    setFile(selected);
    setMessages([]);
    sessionIdRef.current = generateSessionId();
  }, []);

  const handleFileRemove = useCallback(() => {
    setFile(null);
    setMessages([]);
    sessionIdRef.current = generateSessionId();
  }, []);

  const handleSendMessage = useCallback(
    async (question: string) => {
      if (!file) return;

      setMessages((prev) => [...prev, { role: "user", content: question }]);
      setIsProcessing(true);

      try {
        const response = await uploadFile<ChatResponse>("/ai/chat", file, {
          question,
          session_id: sessionIdRef.current,
        });

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.answer },
        ]);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to get a response. Please try again.";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${message}` },
        ]);
      } finally {
        setIsProcessing(false);
      }
    },
    [file]
  );

  return (
    <ToolPageLayout
      title="Chat with PDF"
      description="Ask questions about your PDF and get instant AI-powered answers."
      category="ai"
      icon={MessageSquare}
    >
      <FileUploader
        acceptedTypes={ACCEPTED_FILE_TYPES.PDF}
        maxFileSize={MAX_FILE_SIZE.ANONYMOUS}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        disabled={isProcessing}
      />

      {file && (
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
        />
      )}
    </ToolPageLayout>
  );
}
