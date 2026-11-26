import { emailOTPClient, phoneNumberClient, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Browser-side client for the sign-in endpoints in app/api/auth.
export const authClient = createAuthClient({
  plugins: [phoneNumberClient(), emailOTPClient(), twoFactorClient()],
});
