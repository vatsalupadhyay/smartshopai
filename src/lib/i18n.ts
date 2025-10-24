import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Navigation
      "nav.features": "Features",
      "nav.dashboard": "Dashboard",
      "nav.assistant": "AI Assistant",
      "nav.login": "Login",
      "nav.logout": "Logout",
      
      // Hero Section
      "hero.title": "Smart Shopping with",
      "hero.subtitle": "AI-Powered Intelligence",
      "hero.description": "Make informed buying decisions with real-time price tracking, fake review detection, and intelligent product comparisons",
      "hero.cta": "Get Started Free",
      
      // Features
      "features.title": "Everything You Need for",
      "features.subtitle": "Smart Shopping",
      "features.price.title": "Price Tracking",
      "features.price.desc": "Track product prices and get notified when they drop",
      "features.review.title": "Fake Review Detection",
      "features.review.desc": "AI-powered analysis to identify suspicious reviews",
      "features.assistant.title": "AI Shopping Assistant",
      "features.assistant.desc": "Get personalized recommendations and compare products",
      
      // Chatbot
      "chatbot.title": "Chat with Your",
      "chatbot.subtitle": "Smart Assistant",
      "chatbot.description": "Get instant answers about products, prices, and reviews",
      "chatbot.placeholder": "Ask about products, prices, or reviews...",
      "chatbot.send": "Send",
  "chatbot.badge": "AI-Powered Shopping Assistant",
  "chatbot.cardTitle": "SmartShop AI Assistant",
  "chatbot.cardDescription": "Ask me anything about products, prices, or reviews",
      
      // Dashboard
      "dashboard.title": "Product",
      "dashboard.subtitle": "Dashboard",
      "dashboard.search": "Search products...",
      "dashboard.priceHistory": "Price History",
      "dashboard.reviews": "Review Analysis",
      "dashboard.fakeReviews": "Fake Reviews Detected",
      "dashboard.sentiment": "Sentiment Score",
      
      // Auth
      "auth.login": "Login",
      "auth.signup": "Sign Up",
      "auth.email": "Email",
      "auth.password": "Password",
      "auth.fullName": "Full Name",
      "auth.noAccount": "Don't have an account?",
      "auth.haveAccount": "Already have an account?",
      "auth.loginSuccess": "Logged in successfully",
      "auth.signupSuccess": "Account created successfully",
      "auth.error": "Authentication error",

  // Additional keys
  "auth.loginWithGoogle": "Continue with Google",
  "brand.name": "SmartShop AI",
  "footer.allRights": "All rights reserved.",
  "chatbot.initialMessage": "Hello! I'm your SmartShop AI assistant. I can help you compare products, analyze reviews, and find the best deals. What are you looking for today?",
  "hero.stats.fakeReviewDetection": "Fake Review Detection",
  "hero.stats.priceTracking": "Price Tracking",
  "hero.stats.languagesSupported": "Languages Supported",
      
      // Review Detection
      "reviewDetection.title": "Fake Review",
      "reviewDetection.subtitle": "Detection",
      "reviewDetection.description": "Analyze product reviews to detect fake reviews and sentiment",
      "reviewDetection.urlPlaceholder": "Enter product URL...",
      "reviewDetection.analyze": "Analyze Reviews",
      "reviewDetection.analyzing": "Analyzing...",
      "reviewDetection.results": "Analysis Results",
      "reviewDetection.realReviews": "Real Reviews",
      "reviewDetection.fakeReviews": "Fake Reviews",
      "reviewDetection.overallSentiment": "Overall Sentiment",
      "reviewDetection.summary": "Summary",
  "reviewDetection.distribution": "Distribution",
    }
  },
  hi: {
    translation: {
      // Navigation
      "nav.features": "सुविधाएँ",
      "nav.dashboard": "डैशबोर्ड",
      "nav.assistant": "एआई सहायक",
      "nav.login": "लॉगिन",
      "nav.logout": "लॉगआउट",
      
      // Hero Section
      "hero.title": "स्मार्ट शॉपिंग के साथ",
      "hero.subtitle": "एआई-संचालित बुद्धिमत्ता",
      "hero.description": "वास्तविक समय मूल्य ट्रैकिंग, नकली समीक्षा पहचान, और बुद्धिमान उत्पाद तुलना के साथ सूचित खरीद निर्णय लें",
      "hero.cta": "मुफ्त में शुरू करें",
      
      // Features
      "features.title": "आपको जो चाहिए वह सब",
      "features.subtitle": "स्मार्ट शॉपिंग",
      "features.price.title": "मूल्य ट्रैकिंग",
      "features.price.desc": "उत्पाद की कीमतों को ट्रैक करें और जब वे गिरें तो सूचना पाएं",
      "features.review.title": "नकली समीक्षा पहचान",
      "features.review.desc": "संदिग्ध समीक्षाओं की पहचान करने के लिए एआई-संचालित विश्लेषण",
      "features.assistant.title": "एआई शॉपिंग सहायक",
      "features.assistant.desc": "व्यक्तिगत सिफारिशें प्राप्त करें और उत्पादों की तुलना करें",
      
      // Chatbot
      "chatbot.title": "अपने साथ चैट करें",
      "chatbot.subtitle": "स्मार्ट सहायक",
      "chatbot.description": "उत्पादों, कीमतों और समीक्षाओं के बारे में तत्काल उत्तर प्राप्त करें",
      "chatbot.placeholder": "उत्पादों, कीमतों या समीक्षाओं के बारे में पूछें...",
      "chatbot.send": "भेजें",
  "chatbot.badge": "AI-Powered Shopping Assistant",
  "chatbot.cardTitle": "SmartShop AI Assistant",
  "chatbot.cardDescription": "Ask me anything about products, prices, or reviews",
      
      // Dashboard
      "dashboard.title": "उत्पाद",
      "dashboard.subtitle": "डैशबोर्ड",
      "dashboard.search": "उत्पादों को खोजें...",
      "dashboard.priceHistory": "मूल्य इतिहास",
      "dashboard.reviews": "समीक्षा विश्लेषण",
      "dashboard.fakeReviews": "नकली समीक्षाएं पाई गईं",
      "dashboard.sentiment": "भावना स्कोर",
      
      // Auth
      "auth.login": "लॉगिन",
      "auth.signup": "साइन अप करें",
      "auth.email": "ईमेल",
      "auth.password": "पासवर्ड",
      "auth.fullName": "पूरा नाम",
      "auth.noAccount": "खाता नहीं है?",
      "auth.haveAccount": "पहले से खाता है?",
      "auth.loginSuccess": "सफलतापूर्वक लॉगिन किया गया",
      "auth.signupSuccess": "खाता सफलतापूर्वक बनाया गया",
      "auth.error": "प्रमाणीकरण त्रुटि",

  // Additional keys
  "auth.loginWithGoogle": "Google के साथ जारी रखें",
  "brand.name": "SmartShop AI",
  "footer.allRights": "सभी अधिकार सुरक्षित हैं।",
  "chatbot.initialMessage": "Hello! I'm your SmartShop AI assistant. I can help you compare products, analyze reviews, and find the best deals. What are you looking for today?",
  "hero.stats.fakeReviewDetection": "नकली समीक्षा पहचान",
  "hero.stats.priceTracking": "मूल्य ट्रैकिंग",
  "hero.stats.languagesSupported": "50+ भाषाएँ समर्थन",
      
      // Review Detection
      "reviewDetection.title": "नकली समीक्षा",
      "reviewDetection.subtitle": "पहचान",
      "reviewDetection.description": "नकली समीक्षाओं और भावना का पता लगाने के लिए उत्पाद समीक्षाओं का विश्लेषण करें",
      "reviewDetection.urlPlaceholder": "उत्पाद URL दर्ज करें...",
      "reviewDetection.analyze": "समीक्षाओं का विश्लेषण करें",
      "reviewDetection.analyzing": "विश्लेषण हो रहा है...",
      "reviewDetection.results": "विश्लेषण परिणाम",
      "reviewDetection.realReviews": "वास्तविक समीक्षाएं",
      "reviewDetection.fakeReviews": "नकली समीक्षाएं",
      "reviewDetection.overallSentiment": "समग्र भावना",
      "reviewDetection.summary": "सारांश",
  "reviewDetection.distribution": "वितरण",
    }
  },
  ta: {
    translation: {
      // Navigation
      "nav.features": "அம்சங்கள்",
      "nav.dashboard": "டாஷ்போர்டு",
      "nav.assistant": "AI உதவியாளர்",
      "nav.login": "உள்நுழை",
      "nav.logout": "வெளியேறு",
      
      // Hero Section
      "hero.title": "ஸ்மார்ட் ஷாப்பிங் உடன்",
      "hero.subtitle": "AI-இயக்கப்படும் நுண்ணறிவு",
      "hero.description": "நேரடி விலை கண்காணிப்பு, போலி விமர்சனங்களைக் கண்டறிதல் மற்றும் அறிவார்ந்த தயாரிப்பு ஒப்பீடுகளுடன் தகவலறிந்த வாங்கும் முடிவுகளை எடுக்கவும்",
      "hero.cta": "இலவசமாக தொடங்குங்கள்",
      
      // Features
      "features.title": "உங்களுக்குத் தேவையான அனைத்தும்",
      "features.subtitle": "ஸ்மார்ட் ஷாப்பிங்",
      "features.price.title": "விலை கண்காணிப்பு",
      "features.price.desc": "தயாரிப்பு விலைகளைக் கண்காணித்து, அவை குறையும்போது அறிவிப்பைப் பெறுங்கள்",
      "features.review.title": "போலி விமர்சனங்களைக் கண்டறிதல்",
      "features.review.desc": "சந்தேகத்திற்குரிய விமர்சனங்களைக் கண்டறிய AI-இயக்கப்படும் பகுப்பாய்வு",
      "features.assistant.title": "AI ஷாப்பிங் உதவியாளர்",
      "features.assistant.desc": "தனிப்பயனாக்கப்பட்ட பரிந்துரைகளைப் பெறுங்கள் மற்றும் தயாரிப்புகளை ஒப்பிடுங்கள்",
      
      // Chatbot
      "chatbot.title": "உங்களுடன் அரட்டையடிக்கவும்",
      "chatbot.subtitle": "ஸ்மார்ட் உதவியாளர்",
      "chatbot.description": "தயாரிப்புகள், விலைகள் மற்றும் விமர்சனங்கள் குறித்து உடனடி பதில்களைப் பெறுங்கள்",
      "chatbot.placeholder": "தயாரிப்புகள், விலைகள் அல்லது விமர்சனங்கள் பற்றி கேளுங்கள்...",
      "chatbot.send": "அனுப்பு",
  "chatbot.badge": "AI-Powered Shopping Assistant",
  "chatbot.cardTitle": "SmartShop AI Assistant",
  "chatbot.cardDescription": "Ask me anything about products, prices, or reviews",
      
      // Dashboard
      "dashboard.title": "தயாரிப்பு",
      "dashboard.subtitle": "டாஷ்போர்டு",
      "dashboard.search": "தயாரிப்புகளைத் தேடுங்கள்...",
      "dashboard.priceHistory": "விலை வரலாறு",
      "dashboard.reviews": "விமர்சன பகுப்பாய்வு",
      "dashboard.fakeReviews": "போலி விமர்சனங்கள் கண்டறியப்பட்டன",
      "dashboard.sentiment": "உணர்வு மதிப்பெண்",
      
      // Auth
      "auth.login": "உள்நுழை",
      "auth.signup": "பதிவு செய்",
      "auth.email": "மின்னஞ்சல்",
      "auth.password": "கடவுச்சொல்",
      "auth.fullName": "முழு பெயர்",
      "auth.noAccount": "கணக்கு இல்லையா?",
      "auth.haveAccount": "ஏற்கனவே கணக்கு உள்ளதா?",
      "auth.loginSuccess": "வெற்றிகரமாக உள்நுழைந்தது",
      "auth.signupSuccess": "கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது",
      "auth.error": "அங்கீகார பிழை",

  // Additional keys
  "auth.loginWithGoogle": "Google உடன் தொடர்க",
  "brand.name": "SmartShop AI",
  "footer.allRights": "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
  "chatbot.initialMessage": "Hello! I'm your SmartShop AI assistant. I can help you compare products, analyze reviews, and find the best deals. What are you looking for today?",
  "hero.stats.fakeReviewDetection": "போலி விமர்சனங்கள் கண்டறிதல்",
  "hero.stats.priceTracking": "விலை கண்காணிப்பு",
  "hero.stats.languagesSupported": "மொழிகள் ஆதரவு",
      
      // Review Detection
      "reviewDetection.title": "போலி விமர்சனம்",
      "reviewDetection.subtitle": "கண்டறிதல்",
      "reviewDetection.description": "போலி விமர்சனங்கள் மற்றும் உணர்வைக் கண்டறிய தயாரிப்பு விமர்சனங்களை பகுப்பாய்வு செய்யுங்கள்",
      "reviewDetection.urlPlaceholder": "தயாரிப்பு URL ஐ உள்ளிடவும்...",
      "reviewDetection.analyze": "விமர்சனங்களை பகுப்பாய்வு செய்யுங்கள்",
      "reviewDetection.analyzing": "பகுப்பாய்வு செய்யப்படுகிறது...",
      "reviewDetection.results": "பகுப்பாய்வு முடிவுகள்",
      "reviewDetection.realReviews": "உண்மையான விமர்சனங்கள்",
      "reviewDetection.fakeReviews": "போலி விமர்சனங்கள்",
      "reviewDetection.overallSentiment": "ஒட்டுமொத்த உணர்வு",
      "reviewDetection.summary": "சுருக்கம்",
  "reviewDetection.distribution": "பிரிவான"
    }
  },
  es: {
    translation: {
      // Navigation
      "nav.features": "Características",
      "nav.dashboard": "Panel",
      "nav.assistant": "Asistente IA",
      "nav.login": "Iniciar sesión",
      "nav.logout": "Cerrar sesión",
      
      // Hero Section
      "hero.title": "Compras inteligentes con",
      "hero.subtitle": "Inteligencia impulsada por IA",
      "hero.description": "Tome decisiones de compra informadas con seguimiento de precios en tiempo real, detección de reseñas falsas y comparaciones inteligentes de productos",
      "hero.cta": "Comenzar gratis",
      
      // Features
      "features.title": "Todo lo que necesitas para",
      "features.subtitle": "Compras inteligentes",
      "features.price.title": "Seguimiento de precios",
      "features.price.desc": "Rastrea los precios de los productos y recibe notificaciones cuando bajen",
      "features.review.title": "Detección de reseñas falsas",
      "features.review.desc": "Análisis impulsado por IA para identificar reseñas sospechosas",
      "features.assistant.title": "Asistente de compras IA",
      "features.assistant.desc": "Obtén recomendaciones personalizadas y compara productos",
      
      // Chatbot
      "chatbot.title": "Chatea con tu",
      "chatbot.subtitle": "Asistente inteligente",
      "chatbot.description": "Obtén respuestas instantáneas sobre productos, precios y reseñas",
      "chatbot.placeholder": "Pregunta sobre productos, precios o reseñas...",
      "chatbot.send": "Enviar",
  "chatbot.badge": "AI-Powered Shopping Assistant",
  "chatbot.cardTitle": "SmartShop AI Assistant",
  "chatbot.cardDescription": "Ask me anything about products, prices, or reviews",
      
      // Dashboard
      "dashboard.title": "Panel de",
      "dashboard.subtitle": "Productos",
      "dashboard.search": "Buscar productos...",
      "dashboard.priceHistory": "Historial de precios",
      "dashboard.reviews": "Análisis de reseñas",
      "dashboard.fakeReviews": "Reseñas falsas detectadas",
      "dashboard.sentiment": "Puntuación de sentimiento",
      
      // Auth
      "auth.login": "Iniciar sesión",
      "auth.signup": "Registrarse",
      "auth.email": "Correo electrónico",
      "auth.password": "Contraseña",
      "auth.fullName": "Nombre completo",
      "auth.noAccount": "¿No tienes cuenta?",
      "auth.haveAccount": "¿Ya tienes cuenta?",
      "auth.loginSuccess": "Sesión iniciada con éxito",
      "auth.signupSuccess": "Cuenta creada con éxito",
      "auth.error": "Error de autenticación",

  // Additional keys
  "auth.loginWithGoogle": "Continuar con Google",
  "brand.name": "SmartShop AI",
  "footer.allRights": "Todos los derechos reservados.",
  "chatbot.initialMessage": "Hello! I'm your SmartShop AI assistant. I can help you compare products, analyze reviews, and find the best deals. What are you looking for today?",
  "hero.stats.fakeReviewDetection": "Detección de reseñas falsas",
  "hero.stats.priceTracking": "Seguimiento de precios",
  "hero.stats.languagesSupported": "Idiomas compatibles",
      
      // Review Detection
      "reviewDetection.title": "Detección de",
      "reviewDetection.subtitle": "Reseñas falsas",
      "reviewDetection.description": "Analiza las reseñas de productos para detectar reseñas falsas y sentimientos",
      "reviewDetection.urlPlaceholder": "Ingrese la URL del producto...",
      "reviewDetection.analyze": "Analizar reseñas",
      "reviewDetection.analyzing": "Analizando...",
      "reviewDetection.results": "Resultados del análisis",
      "reviewDetection.realReviews": "Reseñas reales",
      "reviewDetection.fakeReviews": "Reseñas falsas",
      "reviewDetection.overallSentiment": "Sentimiento general",
      "reviewDetection.summary": "Resumen",
  "reviewDetection.distribution": "Distribución",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
