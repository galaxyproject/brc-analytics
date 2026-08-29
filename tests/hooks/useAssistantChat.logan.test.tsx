import { useAssistantChat } from "@repo/shared/views/AssistantView/hooks/UseAssistantChat/hook";
import { act, renderHook, waitFor } from "@testing-library/react";

// The hook imports the API clients through the "@repo/shared" alias, which
// resolves to a different module id than a jest.mock() of the same specifier
// from here -- so mocking the client module never intercepts. Stub ky instead
// and drive the real client; that also exercises its URL and body.
const mockPost = jest.fn();
const mockGet = jest.fn();
const mockDelete = jest.fn().mockResolvedValue(undefined);
jest.mock("ky", () => ({
  __esModule: true,
  default: {
    // Delegate at call time: create() runs while this module is still
    // initialising, so naming the jest.fn()s directly would hit the TDZ.
    create: (): unknown => ({
      delete: (...args: unknown[]): unknown => mockDelete(...args),
      get: (...args: unknown[]): unknown => mockGet(...args),
      post: (...args: unknown[]): unknown => mockPost(...args),
    }),
  },
}));
const mockReplace = jest.fn().mockResolvedValue(true);
let mockQuery: Record<string, string> = {};
jest.mock("next/router", () => ({
  useRouter: (): {
    pathname: string;
    query: Record<string, string>;
    replace: jest.Mock;
  } => ({
    pathname: "/assistant",
    query: mockQuery,
    replace: mockReplace,
  }),
}));

/**
 * A ky response stub: the clients all end in `.json()`.
 * @param body - Value the request resolves to.
 * @returns An object shaped like ky's response promise.
 */
function resolves(body: unknown): { json: () => Promise<unknown> } {
  return { json: () => Promise.resolve(body) };
}

/**
 * A ky response stub that rejects with an HTTP status the hook reads.
 * @param status - HTTP status to attach.
 * @returns An object shaped like ky's response promise.
 */
function rejects(status: number): { json: () => Promise<never> } {
  return {
    json: () =>
      Promise.reject(
        Object.assign(new Error(`${status}`), { response: { status } })
      ),
  };
}

const JOB_ID = "fe6f66a714dcbec8";
const SESSION_KEY = "brc-assistant-session-id";

const SESSION = {
  handoff_url: null,
  is_complete: false,
  logan: {
    in_mirror: 17629,
    job_id: JOB_ID,
    results_url: `/logan-search?job=${JOB_ID}`,
    top_organism: "Plasmodium falciparum",
    top_organism_share: 0.821,
    total_matches: 17629,
  },
  messages: [{ content: "This Logan search ...", role: "assistant" as const }],
  schema_state: {
    analysis_type: { detail: null, status: "empty" as const, value: null },
    assembly: { detail: null, status: "empty" as const, value: null },
    data_characteristics: {
      detail: null,
      status: "empty" as const,
      value: null,
    },
    data_source: { detail: null, status: "empty" as const, value: null },
    gene_annotation: { detail: null, status: "empty" as const, value: null },
    organism: {
      detail: "5833",
      status: "filled" as const,
      value: "Plasmodium falciparum",
    },
    workflow: { detail: null, status: "empty" as const, value: null },
  },
  session_id: "sess-logan",
  suggestions: [
    { label: "What is this cohort?", message: "What is this cohort?" },
  ],
};

describe("useAssistantChat with initialLoganJobId", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockQuery = { loganJob: JOB_ID };
  });

  it("creates a session, adopts it, and drops the URL param", async () => {
    mockPost.mockReturnValue(resolves(SESSION));
    const { result } = renderHook(() =>
      useAssistantChat({
        initialLoganJobId: JOB_ID,
        initialSessionId: "stale-url-session",
        sessionKey: SESSION_KEY,
      })
    );

    await waitFor(() => expect(result.current.isRestoring).toBe(false));

    expect(mockPost).toHaveBeenCalledWith(
      "assistant/session",
      expect.objectContaining({ json: { logan_job_id: JOB_ID } })
    );
    // The Logan job outranks a URL session id: no restore is attempted.
    expect(mockGet).not.toHaveBeenCalled();
    expect(localStorage.getItem(SESSION_KEY)).toBe("sess-logan");
    expect(result.current.messages[0].role).toBe("assistant");
    expect(result.current.schema?.organism.value).toBe("Plasmodium falciparum");
    expect(result.current.logan?.job_id).toBe(JOB_ID);
    expect(mockReplace).toHaveBeenCalledWith(
      { pathname: "/assistant", query: {} },
      undefined,
      { shallow: true }
    );
  });

  it("maps an expired job to a message that names the results page", async () => {
    mockPost.mockReturnValue(rejects(404));
    const { result } = renderHook(() =>
      useAssistantChat({ initialLoganJobId: JOB_ID, sessionKey: SESSION_KEY })
    );
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toContain("expired");
    expect(result.current.error).toContain(`/logan-search?job=${JOB_ID}`);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("maps a running job", async () => {
    mockPost.mockReturnValue(rejects(409));
    const { result } = renderHook(() =>
      useAssistantChat({ initialLoganJobId: JOB_ID, sessionKey: SESSION_KEY })
    );
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toContain("still running");
  });

  it("maps a failed job", async () => {
    mockPost.mockReturnValue(rejects(422));
    const { result } = renderHook(() =>
      useAssistantChat({ initialLoganJobId: JOB_ID, sessionKey: SESSION_KEY })
    );
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toContain("failed");
  });

  it("falls back to the generic message for anything else", async () => {
    mockPost.mockReturnValue(rejects(503));
    const { result } = renderHook(() =>
      useAssistantChat({ initialLoganJobId: JOB_ID, sessionKey: SESSION_KEY })
    );
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toContain("unavailable");
  });

  it("resetSession clears logan", async () => {
    mockPost.mockReturnValue(resolves(SESSION));
    const { result } = renderHook(() =>
      useAssistantChat({ initialLoganJobId: JOB_ID, sessionKey: SESSION_KEY })
    );
    await waitFor(() => expect(result.current.logan).not.toBeNull());
    act(() => result.current.resetSession());
    expect(result.current.logan).toBeNull();
  });

  it("does not restore over the session it just opened", async () => {
    // Dropping ?loganJob= re-renders the page with initialLoganJobId gone,
    // which would otherwise re-arm the restore effect against the id this
    // mount just wrote to localStorage.
    mockPost.mockReturnValue(resolves(SESSION));
    const { rerender, result } = renderHook(
      (props: { jobId?: string }) =>
        useAssistantChat({
          initialLoganJobId: props.jobId,
          sessionKey: SESSION_KEY,
        }),
      { initialProps: { jobId: JOB_ID } as { jobId?: string } }
    );
    await waitFor(() => expect(result.current.logan).not.toBeNull());

    rerender({ jobId: undefined });
    await waitFor(() => expect(result.current.isRestoring).toBe(false));
    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.logan?.job_id).toBe(JOB_ID);
  });

  it("without a job id the hook restores as before", async () => {
    mockQuery = {};
    localStorage.setItem(SESSION_KEY, "stored-session");
    mockGet.mockReturnValue(
      resolves({ ...SESSION, logan: null, session_id: "stored-session" })
    );
    const { result } = renderHook(() =>
      useAssistantChat({ sessionKey: SESSION_KEY })
    );
    await waitFor(() => expect(result.current.isRestoring).toBe(false));
    expect(mockPost).not.toHaveBeenCalled();
    expect(mockGet).toHaveBeenCalledWith(
      "assistant/session/stored-session",
      expect.anything()
    );
    expect(result.current.logan).toBeNull();
  });
});
