import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { emailOTP, phoneNumber, twoFactor } from "better-auth/plugins";
import { platformDb } from "@/server/platform/db";
import { acceptPendingInvitations, hasPendingInvitation } from "@/server/platform/invitations";
import { sendSignInCode } from "./codes";
import { isE164, normalizeEmail, phoneFromPlaceholderEmail, placeholderEmail } from "./identity";

// Sign-in (ADR 0007).
// - School staff sign in with a one-time code sent to their phone (default) or
//   email. There is no self sign-up: an identity can only be created for a
//   contact with a pending invitation.
// - Platform Super Administrators sign in with email, password, and an
//   authenticator app (two-factor). Their accounts are created by a platform
//   script, never through these endpoints.
// Auth tables are platform tables, so the adapter uses the platform client.

export const auth = betterAuth({
  appName: "Dugsiye",
  database: prismaAdapter(platformDb(), { provider: "postgresql" }),

  emailAndPassword: { enabled: true, disableSignUp: true },

  user: {
    additionalFields: {
      preferredLocale: { type: "string", required: false, defaultValue: "so", input: false },
    },
  },

  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/phone-number/send-otp": { window: 60, max: 3 },
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/phone-number/verify": { window: 60, max: 10 },
    },
  },

  databaseHooks: {
    user: {
      create: {
        // Invitation-only: refuse any identity whose contact isn't invited.
        before: async (user) => {
          const phone = phoneFromPlaceholderEmail(user.email);
          const invited = phone
            ? await hasPendingInvitation({ phoneNumber: phone })
            : await hasPendingInvitation({ email: normalizeEmail(user.email) });
          if (!invited) return false;
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          await acceptPendingInvitations(session.userId);
        },
      },
    },
  },

  plugins: [
    phoneNumber({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      phoneNumberValidator: (phone) => isE164(phone),
      sendOTP: ({ phoneNumber, code }) => sendSignInCode({ phoneNumber }, code),
      signUpOnVerification: {
        getTempEmail: (phone) => placeholderEmail(phone),
        getTempName: (phone) => phone,
      },
    }),
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type === "sign-in") await sendSignInCode({ email: normalizeEmail(email) }, otp);
      },
    }),
    twoFactor({ issuer: "Dugsiye" }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
