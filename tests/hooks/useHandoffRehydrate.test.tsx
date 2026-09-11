import { type SetHandoffPayload } from "@repo/shared/providers/workflowHandoff/actions/setHandoff/types";
import {
  ENTITY_KEYS,
  SEQUENCING_SOURCE,
} from "@repo/shared/providers/workflowHandoff/constants";
import { useHandoffDispatch } from "@repo/shared/providers/workflowHandoff/hooks/UseHandoffDispatch/hook";
import { useHandoffInputs } from "@repo/shared/providers/workflowHandoff/hooks/UseHandoffInputs/hook";
import { WorkflowHandoffProvider } from "@repo/shared/providers/workflowHandoff/provider";
import { useHandoffRehydrate } from "@repo/shared/views/WorkflowInputsView/hooks/UseHandoffRehydrate/useHandoffRehydrate";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, renderHook, waitFor } from "@testing-library/react";
import { type JSX, type ReactNode, useEffect } from "react";

// The hook reaches the client through the "@repo/shared" alias, which resolves
// to a different module id than a jest.mock() of the same specifier from here
// -- so mocking the client module never intercepts. Stub ky and drive the real
// client, which also exercises its URL.
const mockGet = jest.fn();
jest.mock("ky", () => ({
  __esModule: true,
  default: {
    // Delegate at call time: create() runs while this module is still
    // initialising, so naming the jest.fn() directly would hit the TDZ.
    create: (): unknown => ({
      delete: jest.fn(),
      get: (...args: unknown[]): unknown => mockGet(...args),
      post: jest.fn(),
    }),
  },
}));

const PATH = "/data/assemblies/GCF_000002765_6/analyze/workflows";
let mockQuery: Record<string, string> = {};
let mockAsPath = PATH;
jest.mock("next/router", () => ({
  useRouter: (): { asPath: string; query: Record<string, string> } => ({
    asPath: mockAsPath,
    query: mockQuery,
  }),
}));

/**
 * A ky response stub: the client ends in `.json()`.
 * @param body - Value the request resolves to.
 * @returns An object shaped like ky's response promise.
 */
function resolves(body: unknown): { json: () => Promise<unknown> } {
  return { json: () => Promise.resolve(body) };
}

/**
 * A ky response stub that rejects, standing in for a 403/404.
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

/**
 * Build a session payload whose data_source carries the given detail.
 * @param detail - Structured `data_source.detail` string.
 * @param value - Human-readable `data_source.value`.
 * @returns A session-restore-shaped object.
 */
function session(detail: string | null, value: string | null = null): unknown {
  const empty = { detail: null, status: "empty", value: null };
  return {
    handoff_url: null,
    is_complete: true,
    messages: [],
    schema_state: {
      analysis_type: empty,
      assembly: empty,
      data_characteristics: empty,
      data_source: { detail, status: "filled", value },
      gene_annotation: empty,
      organism: empty,
      workflow: empty,
    },
    session_id: "sess-1",
    suggestions: [],
  };
}

const ENA_DETAIL = '{"source":"ena","accessions":["ERR662077","SRR7590703"]}';

/**
 * Render the hook under both providers it needs.
 * @returns A renderHook wrapper component.
 */
function makeClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

/**
 * A wrapper holding one QueryClient for as long as it is mounted.
 *
 * A factory rather than a component, because a component that calls
 * makeClient() in its body builds a new client on every render -- so any
 * rerender silently swaps the provider's client and empties the React Query
 * cache underneath the hook. React Query's own guidance is that the client
 * be stable for the provider's lifetime, and a cache that resets when React
 * happens to re-render is a flaky test waiting for a slow machine.
 * @returns A renderHook wrapper component with its own client.
 */
function makeWrapper(): ({ children }: { children: ReactNode }) => JSX.Element {
  const client = makeClient();
  return function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return (
      <QueryClientProvider client={client}>
        <WorkflowHandoffProvider>{children}</WorkflowHandoffProvider>
      </QueryClientProvider>
    );
  };
}

/**
 * Drive the hook and expose what the stepper would read back.
 * @returns The restored inputs plus a clear dispatcher.
 */
function useSubject(): {
  accessions: string[];
  clear: () => void;
  sequencingSource: string | null;
} {
  useHandoffRehydrate(ENTITY_KEYS.ASSEMBLIES);
  const { accessions, sequencingSource } = useHandoffInputs(
    ENTITY_KEYS.ASSEMBLIES,
    PATH
  );
  const { onClearHandoff } = useHandoffDispatch();
  return {
    accessions,
    clear: () => onClearHandoff({ entity: ENTITY_KEYS.ASSEMBLIES, path: PATH }),
    sequencingSource,
  };
}

describe("useHandoffRehydrate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsPath = `${PATH}?trsId=wf&assistantSessionId=sess-1`;
    mockQuery = { assistantSessionId: "sess-1", trsId: "wf" };
  });

  it("restores accessions from the session id in the URL", async () => {
    mockGet.mockReturnValue(resolves(session(ENA_DETAIL)));
    const { result } = renderHook(useSubject, { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.accessions.length).toBe(2));
    expect(mockGet).toHaveBeenCalledWith(
      "assistant/session/sess-1",
      expect.anything()
    );
    expect(result.current.accessions).toEqual(["ERR662077", "SRR7590703"]);
    expect(result.current.sequencingSource).toBe("ena");
  });

  it("does not fetch without a session id in the URL", async () => {
    mockQuery = { trsId: "wf" };
    mockAsPath = `${PATH}?trsId=wf`;
    const { result } = renderHook(useSubject, { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.accessions).toEqual([]));
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("does not fetch when the in-app handoff already populated the cell", async () => {
    // The SPA path dispatches before Router.push, so the cell is already full
    // on the stepper's first render. Reproduce that ordering with a two-phase
    // render rather than dispatching after mount, which would race the fetch
    // this is meant to prevent.
    mockGet.mockReturnValue(resolves(session(ENA_DETAIL)));
    const seen: string[][] = [];
    let dispatch: ((payload: SetHandoffPayload) => void) | null = null;

    function Seeder(): null {
      const { onSetHandoff } = useHandoffDispatch();
      // In an effect, not during render -- the dispatcher is reached for from
      // outside the tree, which is a side effect.
      useEffect(() => {
        dispatch = onSetHandoff;
      }, [onSetHandoff]);
      return null;
    }

    function Subject(): null {
      useHandoffRehydrate(ENTITY_KEYS.ASSEMBLIES);
      seen.push([...useHandoffInputs(ENTITY_KEYS.ASSEMBLIES, PATH).accessions]);
      return null;
    }

    const client = makeClient();
    /**
     * The provider tree, with the hook under test mounted only on demand.
     * @param props - Props.
     * @param props.withSubject - Whether to mount the hook under test.
     * @returns The provider tree.
     */
    const tree = ({ withSubject }: { withSubject: boolean }): JSX.Element => (
      <QueryClientProvider client={client}>
        <WorkflowHandoffProvider>
          <Seeder />
          {withSubject ? <Subject /> : null}
        </WorkflowHandoffProvider>
      </QueryClientProvider>
    );

    const { rerender } = render(tree({ withSubject: false }));
    act(() =>
      dispatch?.({
        entity: ENTITY_KEYS.ASSEMBLIES,
        inputs: {
          accessions: ["ERR999999"],
          sequencingSource: SEQUENCING_SOURCE.ENA,
        },
        path: PATH,
      })
    );
    rerender(tree({ withSubject: true }));

    await waitFor(() => expect(seen.length).toBeGreaterThan(0));
    expect(seen[0]).toEqual(["ERR999999"]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("ignores an upload handoff -- the files were never ours", async () => {
    mockGet.mockReturnValue(resolves(session('{"source":"upload"}')));
    const { result } = renderHook(useSubject, { wrapper: makeWrapper() });

    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(result.current.accessions).toEqual([]);
    expect(result.current.sequencingSource).toBeNull();
  });

  it("survives a 403 from someone else's session cookie", async () => {
    mockGet.mockReturnValue(rejects(403));
    const { result } = renderHook(useSubject, { wrapper: makeWrapper() });

    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(result.current.accessions).toEqual([]);
  });

  it("does not restore again after the sync consumed the cell", async () => {
    // useHandoffSync clears once applied; an empty cell then looks identical
    // to "never had one", which without the guard restores in a loop.
    mockGet.mockReturnValue(resolves(session(ENA_DETAIL)));
    const { result } = renderHook(useSubject, { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.accessions.length).toBe(2));
    act(() => result.current.clear());

    await waitFor(() => expect(result.current.accessions).toEqual([]));
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it("falls back to accessions in the value for a pre-#1296 session", async () => {
    mockGet.mockReturnValue(resolves(session(null, "ENA/SRA: ERR16655350")));
    const { result } = renderHook(useSubject, { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.accessions.length).toBe(1));
    expect(result.current.accessions).toEqual(["ERR16655350"]);
  });
});
