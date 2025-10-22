const { TextEncoder, TextDecoder } = require("util");
const { Response, Request, Headers, fetch } = require("node-fetch");

global.Response = Response;
global.Request = Request;
global.Headers = Headers;
global.fetch = fetch;
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

let mongoServer;

beforeAll(async () => {
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI = uri;
  await require("mongoose").connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await require("mongoose").disconnect();
  await mongoServer.stop();
});
