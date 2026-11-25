import type * as AssistantApiClientModule from "@repo/shared/services/assistant-api-client";

// The client is imported fresh in each test: it holds the page's one /info
// request at module level.
const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock("ky", () => ({
  __esModule: true,
  default: { create: (): unknown => ({ get: mockGet, post: mockPost }) },
}));

type Client = typeof AssistantApiClientModule.assistantAPIClient;

/**
 * Import the client with no /info request made yet.
 * @returns The assistant API client.
 */
function freshClient(): Client {
  let client: Client | undefined;
  jest.isolateModules(() => {
    client = jest.requireActual<typeof AssistantApiClientModule>(
      "@repo/shared/services/assistant-api-client"
    ).assistantAPIClient;
  });
  return client as Client;
}

/**
 * A ky response whose JSON resolves (or rejects) when the test says so.
 * @returns The response and controls for it.
 */
function deferredResponse(): {
  reject: (error: Error) => void;
  resolve: (value: unknown) => void;
  response: { json: () => Promise<unknown> };
} {
  let resolve: (value: unknown) => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<unknown>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { reject, resolve, response: { json: () => promise } };
}

const INFO = { available: true, model: "m", provider: "p" };

describe("assistant client and the browser id cookie", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPost.mockReturnValue({ json: () => Promise.resolve({}) });
  });

  test("a chat waits for /info before it is sent", async () => {
    const info = deferredResponse();
    mockGet.mockReturnValue(info.response);
    const client = freshClient();

    const chat = client.assistantChat({ message: "hi" });
    await Promise.resolve();
    expect(mockPost).not.toHaveBeenCalled();

    info.resolve(INFO);
    await chat;
    expect(mockPost).toHaveBeenCalledWith("assistant/chat", expect.anything());
  });

  test("a Logan session waits for /info before it is created", async () => {
    const info = deferredResponse();
    mockGet.mockReturnValue(info.response);
    const client = freshClient();

    const created = client.assistantCreateSession({ logan_job_id: "j1" });
    await Promise.resolve();
    expect(mockPost).not.toHaveBeenCalled();

    info.resolve(INFO);
    await created;
    expect(mockPost).toHaveBeenCalledWith(
      "assistant/session",
      expect.anything()
    );
  });

  test("the page's /info is fetched once and shared", async () => {
    mockGet.mockReturnValue({ json: () => Promise.resolve(INFO) });
    const client = freshClient();

    await Promise.all([
      client.assistantInfo(),
      client.assistantChat({ message: "hi" }),
      client.assistantChat({ message: "again" }),
    ]);

    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  test("a failed /info lets the chat through and is fetched again next time", async () => {
    mockGet.mockReturnValueOnce({
      json: () => Promise.reject(new Error("offline")),
    });
    mockGet.mockReturnValue({ json: () => Promise.resolve(INFO) });
    const client = freshClient();

    await client.assistantChat({ message: "hi" });
    expect(mockPost).toHaveBeenCalledTimes(1);

    await expect(client.assistantInfo()).resolves.toEqual(INFO);
    expect(mockGet).toHaveBeenCalledTimes(2);
  });
});
