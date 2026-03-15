"use client";

import { useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import SendIcon from "@mui/icons-material/Send";
import ChatMessage from "./ChatMessage";
import type { Application } from "@/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ApplicationChatProps {
  application: Application;
}

export default function ApplicationChat({ application }: ApplicationChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/application-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          context: {
            companyName: application.companyName,
            jobTitle: application.jobTitle,
            status: application.status,
            employmentType: application.employmentType,
            workplaceType: application.workplaceType,
            applicationMedium: application.applicationMedium,
            jobDescription: application.jobDescription,
            jobApplicationUrl: application.jobApplicationUrl,
            jobApplicationStatusUrl: application.jobApplicationStatusUrl,
            notes: application.notes,
            salaryAsked: application.salaryAsked,
            salaryMin: application.salaryMin,
            salaryMax: application.salaryMax,
            compensationType: application.compensationType,
            offersEquity: application.offersEquity,
            jobPostedAt: application.jobPostedAt,
            workLocationCity: application.workLocationCity,
            workLocationState: application.workLocationState,
            hiringManagerName: application.hiringManagerName,
            hiringManagerEmail: application.hiringManagerEmail,
            hiringManagerPhone: application.hiringManagerPhone,
            hiringManagerLinkedinUrl: application.hiringManagerLinkedinUrl,
            dateApplied: application.dateApplied,
          },
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get response");
      }
      if (!response.ok) throw new Error("Failed to get response");
      if (!response.body) throw new Error("No response body");

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          const chunk = decoder.decode(result.value);
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = {
              ...last,
              content: last.content + chunk,
            };
            return updated;
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: 500 }}>
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          mb: 2,
        }}
      >
        {messages.length === 0 && (
          <Typography
            color="text.secondary"
            sx={{ textAlign: "center", mt: 4 }}
          >
            Ask anything about this application. Paste an application question
            and get help crafting your answer.
          </Typography>
        )}
        {messages.map((message, index) => (
          <ChatMessage key={index} role={message.role} content={message.content} />
        ))}
        {loading && messages[messages.length - 1]?.role === "user" && (
          <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1.5 }}>
            <CircularProgress size={20} />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          size="small"
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!input.trim() || loading}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
