import { ROUTES } from "@brc/routes/constants";
import { getAssistantUrl } from "@brc/views/HomeView/components/SectionHero/components/AssistantPrompt/hooks/UseAssistantPrompt/utils";

describe("getAssistantUrl", () => {
  test("carries the question to the assistant route", () => {
    expect(
      getAssistantUrl("Which assemblies exist for P. falciparum?")
    ).toEqual({
      pathname: ROUTES.ASSISTANT,
      query: { q: "Which assemblies exist for P. falciparum?" },
    });
  });

  test("leaves encoding to the router rather than escaping twice", () => {
    // A pre-encoded value would reach the assistant as literal "%26" text.
    expect(getAssistantUrl("variants & coverage?").query).toEqual({
      q: "variants & coverage?",
    });
  });
});
