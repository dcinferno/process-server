import { POST } from "../app/api/login/route"; // Adjust to your actual route import

jest.mock("../lib/db", () => ({
  connectDB: jest.fn().mockResolvedValue(true),
}));

jest.mock("../lib/models/User", () => {
  return {
    findOne: jest.fn(),
  };
});

describe("login API honeypot", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("rejects login when honeypot field is filled (bot detected)", async () => {
    const fakeReq = {
      json: async () => ({
        email: "user@example.com",
        password: "password123",
        address: "I am a bot", // honeypot field filled
      }),
    };

    const response = await POST(fakeReq);

    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toBe("Login failed");
  });

  it.skip("accepts login when honeypot field is empty", async () => {
    const fakeReq = {
      json: async () => ({
        email: "user@example.com",
        password: "password123",
        address: "",
      }),
    };

    // Optionally mock User.findOne or other auth logic here...

    const response = await POST(fakeReq);

    expect(response.status).not.toBe(400);

    // Further assertions depending on your actual login response
  });
});
