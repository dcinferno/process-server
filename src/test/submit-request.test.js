import { POST } from "../app/api/submit-request/route";

jest.mock("../lib/db", () => ({
  connectDB: jest.fn().mockResolvedValue(true),
}));

const mockSave = jest.fn().mockResolvedValue(true);

jest.mock("../lib/models/Request", () => {
  return jest.fn().mockImplementation(() => ({
    save: mockSave,
  }));
});

describe("submit-request API honeypot", () => {
  it("rejects requests with non-empty website field (bot)", async () => {
    const fakeReq = {
      json: async () => ({
        website: "test.com",
        clientName: "Real User",
        email: "user@example.com",
        phone: "123-456-7890",
        recipientName: "Recipient Name",
        recipientAddress: "123 Main St, City, State, ZIP",
        priority: "standard",
      }),
    };

    const response = await POST(fakeReq);

    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.success).toBe(false);
  });

  it.skip("accepts requests with empty website field (human)", async () => {
    const fakeReq = {
      json: async () => ({
        website: "",
        clientName: "Real User",
        email: "user@example.com",
        phone: "123-456-7890",
        recipientName: "Recipient Name",
        recipientAddress: "123 Main St, City, State, ZIP",
        priority: "standard",
      }),
    };

    const response = await POST(fakeReq);

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);

    // Optionally verify save was called:
    expect(mockSave).toHaveBeenCalled();
  });
});
afterEach(() => {
  jest.clearAllMocks();
});
