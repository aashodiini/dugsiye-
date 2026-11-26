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
  roles: {
    SCHOOL_ADMIN: "School administrator",
    REGISTRAR: "Registrar",
    ACCOUNTANT: "Accountant",
    TEACHER: "Teacher",
  },
};

type Shape<T> = { [K in keyof T]: T[K] extends string ? string : Shape<T[K]> };
export type Messages = Shape<typeof en>;
