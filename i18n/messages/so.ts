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
  platform: {
    title: "Maamulka madasha",
    signInTitle: "Gelitaanka madasha",
    emailLabel: "Ciwaanka iimaylka",
    passwordLabel: "Furaha sirta ah",
    continue: "Sii wad",
    codeLabel: "Koodhka xaqiijinta",
    codePrompt: "Geli koodhka 6 god ah ee ka muuqda barnaamijka xaqiijinta.",
    submit: "Gal",
    wrongCredentials: "Iimaylka ama furaha sirta ah waa khalad.",
    wrongCode: "Koodhkaas waa khalad. Isku day koodhka ugu cusub ee barnaamijka.",
    failed: "Wax baa khaldamay. Isku day mar kale.",
    setupTitle: "Diyaari barnaamijka xaqiijinta",
    setupIntro:
      "Maamulayaasha madashu waa inay isticmaalaan barnaamij xaqiijin sida Google Authenticator ama Microsoft Authenticator. Xaqiiji furahaaga sirta ah si aad u bilowdo.",
    confirmPassword: "Xaqiiji furaha sirta ah",
    setupKeyLabel: "Furaha diyaarinta",
    setupKeyHelp: "Barnaamijka xaqiijinta ku dar akoon cusub oo ku qor furahan, ama taleefankaaga ka fur xiriirka.",
    openInApp: "Ku fur barnaamijka xaqiijinta",
    backupCodesLabel: "Koodhadhka kaydka",
    backupCodesHelp:
      "Koodh kastaa hal mar ayuu shaqeeyaa haddii taleefankaagu kaa lumo. Meel ammaan ah ku kaydi: mar dambe lama tusi doono.",
    confirmCode: "Geli koodh ka mid ah barnaamijka si aad u dhammaystirto",
    finish: "Dhammaystir diyaarinta",
    schoolsCount: "Dugsiyada madasha ku jira: {count}",
    comingNext: "Abuurista iyo maamulka dugsiyada waxay imanayaan tallaabada xigta.",
  },
  roles: {
    SCHOOL_ADMIN: "Maamulaha dugsiga",
    REGISTRAR: "Diiwaangeliyaha",
    ACCOUNTANT: "Xisaabiyaha",
    TEACHER: "Macallin",
  },
} satisfies Messages;
