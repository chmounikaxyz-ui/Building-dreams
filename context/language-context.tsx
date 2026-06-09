"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export type Language = "english" | "hindi" | "telugu" | "tamil"

export const translations = {
  english: {
    // Nav
    home: "Home", explore: "Explore", messages: "Messages", materials: "Materials",
    emergency: "Emergency", tools: "Tools", profile: "Profile", settings: "Settings",
    // Feed
    addStory: "Add Story", follow: "Follow", following: "Following",
    likes: "likes", viewComments: "View all", comments: "comments",
    addComment: "Add a comment...", post: "Post",
    // Settings
    settingsTitle: "Settings", manageAccount: "Manage your account and preferences",
    account: "Account", accountDesc: "Personal information and account settings",
    notifications: "Notifications", notificationsDesc: "Manage your notification preferences",
    privacy: "Privacy & Security", privacyDesc: "Password and security settings",
    location: "Location", locationDesc: "Manage your location settings",
    appearance: "Appearance", appearanceDesc: "Theme and display settings",
    help: "Help & Support", helpDesc: "Get help and contact support",
    logout: "Log Out", logoutDesc: "Sign out of your account",
    language: "Language", theme: "Theme",
    saveChanges: "Save Changes", saved: "✓ Saved!",
    back: "← Back",
    // Explore
    exploreProfessionals: "Explore Professionals",
    findWorkers: "Find skilled workers for your construction needs",
    // Materials
    constructionMaterials: "Construction Materials",
    deliveredToSite: "Quality materials delivered to your site",
    // Emergency
    emergencyResponse: "Emergency response",
    rapidRepair: "Rapid repair teams ready now",
    // Messages
    noMessages: "No messages yet",
    typeMessage: "Type a message...",
    send: "Send",
    // Profile
    editProfile: "Edit Profile",
    viewProfile: "View Profile",
    posts: "Posts",
    saved2: "Saved",
    addPost: "Add Post",
  },
  hindi: {
    home: "होम", explore: "खोजें", messages: "संदेश", materials: "सामग्री",
    emergency: "आपातकाल", tools: "उपकरण", profile: "प्रोफ़ाइल", settings: "सेटिंग्स",
    addStory: "स्टोरी जोड़ें", follow: "फ़ॉलो करें", following: "फ़ॉलो हो रहा है",
    likes: "लाइक्स", viewComments: "सभी देखें", comments: "टिप्पणियाँ",
    addComment: "टिप्पणी जोड़ें...", post: "पोस्ट",
    settingsTitle: "सेटिंग्स", manageAccount: "अपना खाता और प्राथमिकताएं प्रबंधित करें",
    account: "खाता", accountDesc: "व्यक्तिगत जानकारी और खाता सेटिंग्स",
    notifications: "सूचनाएं", notificationsDesc: "अपनी सूचना प्राथमिकताएं प्रबंधित करें",
    privacy: "गोपनीयता और सुरक्षा", privacyDesc: "पासवर्ड और सुरक्षा सेटिंग्स",
    location: "स्थान", locationDesc: "अपनी स्थान सेटिंग्स प्रबंधित करें",
    appearance: "दिखावट", appearanceDesc: "थीम और डिस्प्ले सेटिंग्स",
    help: "सहायता", helpDesc: "हमारी टीम से मदद लें",
    logout: "लॉग आउट", logoutDesc: "अपने खाते से साइन आउट करें",
    language: "भाषा", theme: "थीम",
    saveChanges: "परिवर्तन सहेजें", saved: "✓ सहेजा गया!",
    back: "← वापस",
    exploreProfessionals: "पेशेवरों को खोजें",
    findWorkers: "अपनी निर्माण जरूरतों के लिए कुशल कामगार खोजें",
    constructionMaterials: "निर्माण सामग्री",
    deliveredToSite: "गुणवत्तापूर्ण सामग्री आपकी साइट पर पहुंचाई जाती है",
    emergencyResponse: "आपातकालीन प्रतिक्रिया",
    rapidRepair: "तत्काल मरम्मत टीमें तैयार हैं",
    noMessages: "अभी तक कोई संदेश नहीं",
    typeMessage: "संदेश लिखें...",
    send: "भेजें",
    editProfile: "प्रोफ़ाइल संपादित करें",
    viewProfile: "प्रोफ़ाइल देखें",
    posts: "पोस्ट", saved2: "सहेजा गया", addPost: "पोस्ट जोड़ें",
  },
  telugu: {
    home: "హోమ్", explore: "అన్వేషించు", messages: "సందేశాలు", materials: "సామగ్రి",
    emergency: "అత్యవసరం", tools: "పనిముట్లు", profile: "ప్రొఫైల్", settings: "సెట్టింగులు",
    addStory: "స్టోరీ జోడించు", follow: "అనుసరించు", following: "అనుసరిస్తున్నారు",
    likes: "లైక్‌లు", viewComments: "అన్నీ చూడు", comments: "వ్యాఖ్యలు",
    addComment: "వ్యాఖ్య జోడించు...", post: "పోస్ట్",
    settingsTitle: "సెట్టింగులు", manageAccount: "మీ ఖాతా మరియు ప్రాధాన్యతలను నిర్వహించండి",
    account: "ఖాతా", accountDesc: "వ్యక్తిగత సమాచారం మరియు ఖాతా సెట్టింగులు",
    notifications: "నోటిఫికేషన్లు", notificationsDesc: "మీ నోటిఫికేషన్ ప్రాధాన్యతలను నిర్వహించండి",
    privacy: "గోప్యత & భద్రత", privacyDesc: "పాస్‌వర్డ్ మరియు భద్రతా సెట్టింగులు",
    location: "స్థానం", locationDesc: "మీ స్థాన సెట్టింగులను నిర్వహించండి",
    appearance: "రూపం", appearanceDesc: "థీమ్ మరియు డిస్‌ప్లే సెట్టింగులు",
    help: "సహాయం", helpDesc: "మా బృందం నుండి సహాయం పొందండి",
    logout: "లాగ్ అవుట్", logoutDesc: "మీ ఖాతా నుండి సైన్ అవుట్ చేయండి",
    language: "భాష", theme: "థీమ్",
    saveChanges: "మార్పులు సేవ్ చేయి", saved: "✓ సేవ్ అయింది!",
    back: "← వెనుకకు",
    exploreProfessionals: "నిపుణులను అన్వేషించండి",
    findWorkers: "మీ నిర్మాణ అవసరాలకు నిపుణులను కనుగొనండి",
    constructionMaterials: "నిర్మాణ సామగ్రి",
    deliveredToSite: "మీ సైట్‌కు నాణ్యమైన సామగ్రి డెలివరీ",
    emergencyResponse: "అత్యవసర స్పందన",
    rapidRepair: "తక్షణ మరమ్మత్తు బృందాలు సిద్ధంగా ఉన్నాయి",
    noMessages: "ఇంకా సందేశాలు లేవు",
    typeMessage: "సందేశం టైప్ చేయండి...",
    send: "పంపు",
    editProfile: "ప్రొఫైల్ సవరించు",
    viewProfile: "ప్రొఫైల్ చూడు",
    posts: "పోస్ట్‌లు", saved2: "సేవ్ చేసినవి", addPost: "పోస్ట్ జోడించు",
  },
  tamil: {
    home: "முகப்பு", explore: "ஆராயுங்கள்", messages: "செய்திகள்", materials: "பொருட்கள்",
    emergency: "அவசரநிலை", tools: "கருவிகள்", profile: "சுயவிவரம்", settings: "அமைப்புகள்",
    addStory: "கதை சேர்", follow: "பின்தொடர்", following: "பின்தொடர்கிறீர்கள்",
    likes: "விருப்பங்கள்", viewComments: "அனைத்தும் காண்க", comments: "கருத்துகள்",
    addComment: "கருத்து சேர்க்கவும்...", post: "இடுகை",
    settingsTitle: "அமைப்புகள்", manageAccount: "உங்கள் கணக்கு மற்றும் விருப்பங்களை நிர்வகிக்கவும்",
    account: "கணக்கு", accountDesc: "தனிப்பட்ட தகவல் மற்றும் கணக்கு அமைப்புகள்",
    notifications: "அறிவிப்புகள்", notificationsDesc: "உங்கள் அறிவிப்பு விருப்பங்களை நிர்வகிக்கவும்",
    privacy: "தனியுரிமை & பாதுகாப்பு", privacyDesc: "கடவுச்சொல் மற்றும் பாதுகாப்பு அமைப்புகள்",
    location: "இடம்", locationDesc: "உங்கள் இட அமைப்புகளை நிர்வகிக்கவும்",
    appearance: "தோற்றம்", appearanceDesc: "தீம் மற்றும் காட்சி அமைப்புகள்",
    help: "உதவி", helpDesc: "எங்கள் குழுவிடம் உதவி பெறுங்கள்",
    logout: "வெளியேறு", logoutDesc: "உங்கள் கணக்கிலிருந்து வெளியேறுங்கள்",
    language: "மொழி", theme: "தீம்",
    saveChanges: "மாற்றங்களை சேமி", saved: "✓ சேமிக்கப்பட்டது!",
    back: "← பின்னால்",
    exploreProfessionals: "நிபுணர்களை ஆராயுங்கள்",
    findWorkers: "உங்கள் கட்டுமான தேவைகளுக்கு திறமையான தொழிலாளர்களை கண்டறியுங்கள்",
    constructionMaterials: "கட்டுமான பொருட்கள்",
    deliveredToSite: "உங்கள் தளத்திற்கு தரமான பொருட்கள் வழங்கப்படும்",
    emergencyResponse: "அவசர நடவடிக்கை",
    rapidRepair: "உடனடி பழுதுபார்ப்பு குழுக்கள் தயாராக உள்ளன",
    noMessages: "இன்னும் செய்திகள் இல்லை",
    typeMessage: "செய்தி தட்டச்சு செய்யுங்கள்...",
    send: "அனுப்பு",
    editProfile: "சுயவிவரம் திருத்து",
    viewProfile: "சுயவிவரம் காண்க",
    posts: "இடுகைகள்", saved2: "சேமிக்கப்பட்டவை", addPost: "இடுகை சேர்",
  },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations.english
}

const LanguageContext = createContext<LanguageContextType>({
  language: "english",
  setLanguage: () => {},
  t: translations.english,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("english")
  const t = translations[language]
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}
