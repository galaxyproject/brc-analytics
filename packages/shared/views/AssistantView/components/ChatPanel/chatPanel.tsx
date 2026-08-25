import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "@repo/shared/providers/authentication/provider";
import type { SuggestionChip } from "@repo/shared/services/api-client/types";
import { ChatMessage } from "@repo/shared/views/AssistantView/components/ChatMessage/chatMessage";
import { SuggestionChips } from "@repo/shared/views/AssistantView/components/SuggestionChips/suggestionChips";
import { ASSISTANT_INPUT_PLACEHOLDER } from "@repo/shared/views/AssistantView/constants";
import { type JSX, useEffect, useRef, useState } from "react";
import { ChatContainer, InputRow, MessagesContainer } from "./chatPanel.styles";

interface ChatMessageDisplay {
  content: string;
  role: "user" | "assistant";
}

interface ChatPanelProps {
  error: string | null;
  introText: string;
  isRestoring?: boolean;
  loading: boolean;
  messages: ChatMessageDisplay[];
  onRetry?: () => Promise<void>;
  onSend: (message: string) => void;
  suggestions: SuggestionChip[];
}

/**
 * The main chat interface with message list, input, and suggestion chips.
 * @param props - Component props
 * @param props.error - Error message to display
 * @param props.introText - Welcome/intro text shown before any messages
 * @param props.isRestoring - Whether a previous session is being restored
 * @param props.loading - Whether the assistant is processing
 * @param props.messages - Chat message history
 * @param props.onRetry - Callback to retry the last failed request
 * @param props.onSend - Callback to send a message
 * @param props.suggestions - Suggestion chips to display
 * @returns Chat panel element
 */
export const ChatPanel = ({
  error,
  introText,
  isRestoring,
  loading,
  messages,
  onRetry,
  onSend,
  suggestions,
}: ChatPanelProps): JSX.Element => {
  const { isAuthenticated, isConfigured, login } = useAuth();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (): void => {
    if (input.trim() && !loading) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey && !loading && input.trim()) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChipSelect = (message: string): void => {
    if (!loading) {
      onSend(message);
    }
  };

  const inputDisabled = loading || !!isRestoring;

  return (
    <ChatContainer>
      <MessagesContainer>
        {isRestoring && (
          <Box sx={{ alignItems: "center", display: "flex", gap: 1, p: 4 }}>
            <CircularProgress size={20} />
            <Typography color="text.secondary" variant="body2">
              Restoring conversation...
            </Typography>
          </Box>
        )}

        {!isRestoring && messages.length === 0 && (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary" variant="body1">
              {introText}
            </Typography>
          </Box>
        )}

        {messages.map((msg, i) => (
          <ChatMessage content={msg.content} key={i} role={msg.role} />
        ))}

        {loading && (
          <Box sx={{ display: "flex", gap: 1, p: 1 }}>
            <CircularProgress size={20} />
            <Typography color="text.secondary" variant="body2">
              Thinking...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert
            action={
              onRetry && (
                <Button onClick={onRetry} size="small">
                  Retry
                </Button>
              )
            }
            severity="error"
            sx={{ mx: 1 }}
          >
            {error}
          </Alert>
        )}

        <div ref={messagesEndRef} />
      </MessagesContainer>

      <SuggestionChips
        chips={suggestions}
        disabled={inputDisabled}
        onSelect={handleChipSelect}
      />

      <InputRow>
        {/* >= 2 matches the sign-in prompt below: a real turn (user message
        plus reply) has to complete before there is anything saved to point
        at, not just the user's own message. */}
        {isConfigured && isAuthenticated && messages.length >= 2 && (
          <Typography color="text.secondary" variant="caption">
            Saved to your account
          </Typography>
        )}
        {isConfigured && !isAuthenticated && messages.length >= 2 && (
          <Button onClick={login} size="small" variant="text">
            Sign in to keep this conversation
          </Button>
        )}
        <TextField
          disabled={inputDisabled}
          fullWidth
          maxRows={4}
          multiline
          onChange={(e): void => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={ASSISTANT_INPUT_PLACEHOLDER}
          size="small"
          value={input}
        />
        <Button
          disabled={inputDisabled || !input.trim()}
          onClick={handleSend}
          variant="contained"
        >
          Send
        </Button>
      </InputRow>
    </ChatContainer>
  );
};
