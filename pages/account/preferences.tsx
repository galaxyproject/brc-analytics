import { Breadcrumb } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { JSX, useEffect, useState } from "react";
import { SectionHero } from "../../app/components/Layout/components/AppLayout/components/Section/components/SectionHero/sectionHero";
import { useAuth } from "../../app/providers/authentication";
import { brcAPIClient } from "../../app/services/brc-api-client";

const BREADCRUMBS: Breadcrumb[] = [
  {
    path: "/",
    text: "Home",
  },
  {
    path: "/account/preferences",
    text: "Preferences",
  },
];

export default function PreferencesPage(): JSX.Element {
  const { isAuthenticated, isConfigured, isLoading, login } = useAuth();
  const [editorValue, setEditorValue] = useState("{}");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingPreferences(false);
      return;
    }

    let isMounted = true;
    setIsLoadingPreferences(true);

    brcAPIClient
      .getPreferences()
      .then((preferences) => {
        if (!isMounted) return;
        setEditorValue(JSON.stringify(preferences, null, 2));
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Failed to load preferences.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingPreferences(false);
      });

    return (): void => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  function renderContent(): JSX.Element {
    if (!isConfigured || isLoading || isLoadingPreferences) {
      return (
        <Stack alignItems="center" py={6}>
          <CircularProgress />
        </Stack>
      );
    }

    if (!isAuthenticated) {
      return (
        <Stack spacing={2}>
          <Typography variant="h5">Sign in required</Typography>
          <Typography variant="body1">
            Preferences are tied to your BRC Analytics account session.
          </Typography>
          <Box>
            <Button onClick={login} variant="contained">
              Sign In
            </Button>
          </Box>
        </Stack>
      );
    }

    return (
      <Stack spacing={3}>
        <Typography variant="body1">
          This page currently acts as a JSON-backed placeholder for account
          preferences. Saving `{}` is valid and confirms the persistent user
          settings path works end to end.
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {saveMessage && <Alert severity="success">{saveMessage}</Alert>}
        <TextField
          fullWidth
          minRows={14}
          multiline
          onChange={(event) => setEditorValue(event.target.value)}
          value={editorValue}
        />
        <Box>
          <Button disabled={isSaving} onClick={handleSave} variant="contained">
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </Box>
      </Stack>
    );
  }

  async function handleSave(): Promise<void> {
    let parsed: Record<string, unknown>;

    setError(null);
    setSaveMessage(null);

    try {
      parsed = JSON.parse(editorValue) as Record<string, unknown>;
    } catch {
      setError("Preferences must be valid JSON.");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await brcAPIClient.updatePreferences(parsed);
      setEditorValue(JSON.stringify(saved, null, 2));
      setSaveMessage("Preferences saved.");
    } catch {
      setError("Failed to save preferences.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <SectionHero
        breadcrumbs={BREADCRUMBS}
        head="Preferences"
        subHead="Persistent account-backed preferences are available here. V1 keeps the schema intentionally open so the API wire is in place before product-specific toggles are added."
      />
      <Box sx={{ maxWidth: 960, mx: "auto", px: 3, py: 6, width: "100%" }}>
        {renderContent()}
      </Box>
    </>
  );
}
