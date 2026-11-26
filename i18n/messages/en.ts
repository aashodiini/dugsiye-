// English messages. This file defines the shape every locale must match.

export const en = {
  app: {
    name: "Dugsiye",
  },
  language: {
    label: "Language",
    so: "Soomaali",
    en: "English",
  },
  signIn: {
    title: "Sign in",
    invitedOnly: "Only invited staff can sign in. Ask your school administrator for an invitation.",
    usePhone: "Phone number",
    useEmail: "Email",
    phoneLabel: "Phone number",
    phoneHint: "For example 061 234 5678",
    emailLabel: "Email address",
    sendCode: "Send code",
    codeSent: "If this number or address has an invitation, we've sent it a 6-digit code: {destination}",
    codeLabel: "Code",
    submit: "Sign in",
    startOver: "Use a different number or email",
    invalidPhone: "Enter a valid phone number.",
    invalidEmail: "Enter a valid email address.",
    wrongCode: "That code is wrong or has expired.",
    tooMany: "Too many attempts. Try again later.",
    failed: "Something went wrong. Try again.",
  },
  home: {
    signedInAs: "Signed in as {name}",
    yourSchools: "Your schools",
    noSchools: "You don't belong to any school yet.",
    signOut: "Sign out",
  },
  platform: {
    title: "Platform administration",
    signInTitle: "Platform sign-in",
    emailLabel: "Email address",
    passwordLabel: "Password",
    continue: "Continue",
    codeLabel: "Authenticator code",
    codePrompt: "Enter the 6-digit code from your authenticator app.",
    submit: "Sign in",
    wrongCredentials: "Email or password is wrong.",
    wrongCode: "That code is wrong. Try the newest code in your app.",
    failed: "Something went wrong. Try again.",
    setupTitle: "Set up your authenticator app",
    setupIntro:
      "Platform administrators must use an authenticator app such as Google Authenticator or Microsoft Authenticator. Confirm your password to start.",
    confirmPassword: "Confirm password",
    setupKeyLabel: "Setup key",
    setupKeyHelp: "In your authenticator app, add an account and type this key, or open the link on your phone.",
    openInApp: "Open in authenticator app",
    backupCodesLabel: "Backup codes",
    backupCodesHelp:
      "Each code works once if you lose your phone. Store them somewhere safe: they won't be shown again.",
    confirmCode: "Enter a code from the app to finish",
    finish: "Finish setup",
    schoolsCount: "Schools on the platform: {count}",
    comingNext: "Creating and managing Schools comes in the next step.",
  },
  roles: {
    SCHOOL_ADMIN: "School administrator",
    REGISTRAR: "Registrar",
    ACCOUNTANT: "Accountant",
    TEACHER: "Teacher",
  },
};

type Shape<T> = { [K in keyof T]: T[K] extends string ? string : Shape<T[K]> };
export type Messages = Shape<typeof en>;
