import "dotenv/config";

// Point every client at the test database before any of them connects.
process.env.APP_DATABASE_URL = process.env.TEST_APP_DATABASE_URL;
process.env.PLATFORM_DATABASE_URL = process.env.TEST_PLATFORM_DATABASE_URL;

// Sign-in codes are collected in memory (server/auth/senders.ts).
process.env.CODE_SENDER = "memory";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
