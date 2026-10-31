import "dotenv/config";

// Point every client at the test database before any of them connects.
process.env.APP_DATABASE_URL = process.env.TEST_APP_DATABASE_URL;
process.env.PLATFORM_DATABASE_URL = process.env.TEST_PLATFORM_DATABASE_URL;
