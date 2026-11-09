import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "@repo/shared/providers/authentication/provider";
import { ChatMessage } from "@repo/shared/views/AssistantView/components/ChatMessage/chatMessage";
import { SuggestionChips } from "@repo/shared/views/AssistantView/components/SuggestionChips/suggestionChips";
import { ASSISTANT_INPUT_PLACEHOLDER } from "@repo/shared/views/AssistantView/constants";
import { type JSX, useEffect, useRef, useState } from "react";
import { ChatContainer, InputRow, MessagesContainer } from "./chatPanel.styles";
import type { ChatPanelProps } from "./types";

/**
 * The main chat interface with message list, input, and suggestion chips.
 * @param props - Component props
 * @param props.actions - Chat actions: sending a message and retrying a failed request
 * @param props.introText - Welcome/intro text shown before any messages
 * @param props.state - The conversation on screen: its messages, suggestions, any error, whether it is saved, and whether it is busy
 * @returns Chat panel element
 */
export const ChatPanel = ({
  actions,
  introText,
  state,
}: ChatPanelProps): JSX.Element => {
  const { onRetry, onSendMessage: onSend } = actions;
  const { error, isRestoring, isSaved, loading, messages, suggestions } = state;
  const {
    isAuthenticated,
    isConfigured,
    isLoading: isAuthLoading,
    login,
  } = useAuth();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages. Not before there are any: on mount
  // there is nothing to reveal, and scrollIntoView would scroll the page too.
  // That matters behind the assistant-ui flag, which reads as off on the
  // hydration pass, so this panel mounts briefly before the new layout
  // replaces it, and the page would keep scrolling after it has gone.
  useEffect(() => {
    if (messages.length === 0) return;
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

  const inputDisabled = loading || isRestoring;

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
        {/* Driven by the backend telling us it wrote the row, not by being
        signed in with messages on screen. Signing in does not itself save
        anything, so inferring it here told users their conversation was kept
        moments before its session expired. */}
        {isSaved && (
          <Typography color="text.secondary" variant="caption">
            Saved to your account
          </Typography>
        )}
        {/* Not while auth is still resolving: AuthProvider starts signed-out,
        and the restore call can beat /auth/me, which would offer to save a
        conversation that is already being saved. */}
        {isConfigured &&
          !isAuthLoading &&
          !isAuthenticated &&
          messages.length >= 2 && (
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
