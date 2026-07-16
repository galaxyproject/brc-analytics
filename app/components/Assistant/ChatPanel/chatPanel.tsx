import { useAuth } from "@/providers/authentication";
import { SuggestionChip } from "@brc-analytics/core/types/api";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { JSX, useEffect, useRef, useState } from "react";
import { ChatMessage } from "../ChatMessage/chatMessage";
import { SuggestionChips } from "../SuggestionChips/suggestionChips";
import { ChatContainer, InputRow, MessagesContainer } from "./chatPanel.styles";

interface ChatMessageDisplay {
  content: string;
  role: "user" | "assistant";
}

interface ChatPanelProps {
  error: string | null;
  isRestoring?: boolean;
  loading: boolean;
  messages: ChatMessageDisplay[];
  onRetry?: () => Promise<void>;
  onSave: () => void;
  onSend: (message: string) => void;
  saveLabel: string | null;
  saveLoading: boolean;
  suggestions: SuggestionChip[];
}

/**
 * The main chat interface with message list, input, and suggestion chips.
 * @param props - Component props
 * @param props.error - Error message to display
 * @param props.isRestoring - Whether a previous session is being restored
 * @param props.loading - Whether the assistant is processing
 * @param props.messages - Chat message history
 * @param props.onRetry - Callback to retry the last failed request
 * @param props.onSave - Callback to save the current chat
 * @param props.onSend - Callback to send a message
 * @param props.saveLabel - Save status message
 * @param props.saveLoading - Whether a save request is in flight
 * @param props.suggestions - Suggestion chips to display
 * @returns Chat panel element
 */
export const ChatPanel = ({
  error,
  isRestoring,
  loading,
  messages,
  onRetry,
  onSave,
  onSend,
  saveLabel,
  saveLoading,
  suggestions,
}: ChatPanelProps): JSX.Element => {
  const {
    isAuthenticated,
    isConfigured,
    isLoading: isAuthLoading,
    login,
  } = useAuth();
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

  const handleSave = (): void => {
    if (isConfigured && !isAuthLoading && !isAuthenticated) {
      login();
      return;
    }
    onSave();
  };

  let saveButtonLabel = "Save";
  if (saveLoading) {
    saveButtonLabel = "Saving...";
  } else if (isConfigured && !isAuthenticated) {
    saveButtonLabel = "Sign In to Save";
  }

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
              Welcome! I can help you explore the BRC catalog -- organisms,
              assemblies, and workflows -- and set up an analysis to run in
              Galaxy. Try naming an organism or an analysis type to get started.
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
        <Button
          disabled={
            loading || saveLoading || messages.length === 0 || isAuthLoading
          }
          onClick={handleSave}
          variant="outlined"
        >
          {saveButtonLabel}
        </Button>
        <TextField
          disabled={inputDisabled}
          fullWidth
          maxRows={4}
          multiline
          onChange={(e): void => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about organisms, analyses, or workflows..."
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
      {saveLabel && (
        <Box sx={{ pb: 2, px: 2 }}>
          <Typography color="text.secondary" variant="body2">
            {saveLabel}
          </Typography>
        </Box>
      )}
    </ChatContainer>
  );
};
