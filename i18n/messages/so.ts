import type { Messages } from "./en";

// Somali messages. Must have exactly the same keys as en.ts.
// Needs review by a native Somali speaker before launch.

export const so = {
  app: {
    name: "Dugsiye",
  },
  language: {
    label: "Luqadda",
    so: "Soomaali",
    en: "English",
  },
  signIn: {
    title: "Gal",
    invitedOnly: "Shaqaalaha la casuumay oo keliya ayaa geli kara. Maamulaha dugsigaaga ka codso casuumaad.",
    usePhone: "Lambarka taleefanka",
    useEmail: "Iimayl",
    phoneLabel: "Lambarka taleefanka",
    phoneHint: "Tusaale ahaan 061 234 5678",
    emailLabel: "Ciwaanka iimaylka",
    sendCode: "Dir koodhka",
    codeSent: "Haddii lambarkan ama ciwaankan uu leeyahay casuumaad, waxaan u dirnay koodh 6 god ah: {destination}",
    codeLabel: "Koodhka",
    submit: "Gal",
    startOver: "Isticmaal lambar ama iimayl kale",
    invalidPhone: "Geli lambar taleefan oo sax ah.",
    invalidEmail: "Geli ciwaan iimayl oo sax ah.",
    wrongCode: "Koodhkaas waa khalad ama wakhtigiisii wuu dhacay.",
    tooMany: "Isku day badan. Mar dambe isku day.",
    failed: "Wax baa khaldamay. Isku day mar kale.",
  },
  home: {
    signedInAs: "Waxaad u gashay sida {name}",
    yourSchools: "Dugsiyadaada",
    noSchools: "Weli kama tirsanid dugsi.",
    signOut: "Ka bax",
  },
  roles: {
    SCHOOL_ADMIN: "Maamulaha dugsiga",
    REGISTRAR: "Diiwaangeliyaha",
    ACCOUNTANT: "Xisaabiyaha",
    TEACHER: "Macallin",
  },
} satisfies Messages;
