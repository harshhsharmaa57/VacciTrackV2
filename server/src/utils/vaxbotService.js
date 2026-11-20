/**
 * VaxBot Pediatric & Vaccine Knowledge Engine
 * Implements National Immunization Schedule (NIS 2025) clinical knowledge base
 * with full bilingual support (English & Hinglish) and automatic language detection.
 */

/// Helper to determine whether the user is asking in Pure Devanagari Hindi
export const isPureHindiQuery = (query = '', context = {}) => {
  if (context.lang === 'hindi' || context.lang === 'hi') return true;
  return /[\u0900-\u097F]/.test(query);
};

// Helper to determine whether the user is asking in Hinglish/Hindi or English
export const isHinglishQuery = (query = '', context = {}) => {
  if (context.lang === 'hinglish') return true;
  if (context.lang === 'english') return false;
  if (isPureHindiQuery(query, context)) return false;

  const hinglishKeywords = [
    'kya', 'karein', 'kare', 'kaise', 'hai', 'hain', 'nahi', 'na', 'bhi', 'toh',
    'baby ko', 'bache', 'bachhe', 'lagwana', 'padega', 'nehla', 'sakte', 'chhut',
    'miss ho', 'antar', 'sujan', 'dard', 'ilaj', 'fayda', 'kaun', 'bukhar',
    'doodh', 'dawa', 'nishan', 'boond', 'sui', 'chahiye', 'shuru', 'jankari',
    'gath', 'patti', 'garam', 'thanda', 'mahine', 'saal', 'hafey', 'din'
  ];

  const lower = (query || '').toLowerCase();
  return hinglishKeywords.some(kw => lower.includes(kw));
};

// Comprehensive clinical knowledge rules with English, Hinglish, and Pure Devanagari Hindi
const KNOWLEDGE_BASE = [
  {
    triggers: [
      'fever', 'bukhar', 'temperature', 'body hot', 'garam', 'tapman', 'feverish',
      'vaccine ke baad bukhar', 'halka bukhar', 'pyrexia', 'side effect',
      'बुखार', 'तापमान', 'गर्म', 'दवा', 'पैरासिटामोल', 'साइड इफेक्ट', 'घरेलू उपाय'
    ],
    title: 'Post-Vaccination Fever Management (AEFI Protocol)',
    replyEn: `🌡️ **Post-Vaccine Fever is Normal & Common:**
Mild fever (99°F - 101°F) within 24–48 hours is a healthy sign that your baby's immune system is building protective antibodies, especially after **Pentavalent** or **DPT** doses.

**Recommended Care:**
1. **Comfortable Clothing:** Dress baby in light, breathable cotton clothes. Keep the room well-ventilated.
2. **Hydration / Breastfeeding:** Continue frequent breastfeeding or offer plenty of fluids.
3. **Cold Sponge:** If needed, use a clean cloth dampened with lukewarm (NOT ice cold) water on the forehead.
4. **Medication:** Only administer infant Paracetamol drops (PCM) if prescribed by your pediatrician, adhering strictly to dose-by-weight. Never give Aspirin.

⚠️ **Consult Doctor Immediately If:**
- Fever exceeds 102°F (39°C) or lasts beyond 48 hours.
- Baby is unusually drowsy, lethargic, or has persistent inconsolable crying (>3 hours).`,
    replyHi: `🌡️ **Vaccine ke baad halka bukhar aana normal aur aam baat hai:**
Pentavalent ya DPT ke baad 24–48 ghante me halka bukhar (99°F - 101°F) aana is baat ka saboot hai ki baby ka immune system bimariyon se ladne ke antibodies bana raha hai.

**Gharelu Dekhbhal ke Upay:**
1. **Halke Kapde:** Baby ko halka sooti (cotton) kapda pehnayein aur kamre me hawa aane dein.
2. **Dhoodh / Stanpan:** Baby ko thode-thode samay me dhoodh (breastfeeding) pilate rahein taaki dehydration na ho.
3. **Gungune Paani ki Patti:** Zarurat padne par mathe par gungune (lukewarm, thanda nahi) paani ki patti rakhein.
4. **Paracetamol:** Sirf pediatrician ke bataye wajan ke anusaar Paracetamol drops dein. Aspirin bilkul na dein.

⚠️ **Doctor ko turant kab dikhayein:**
- Agar bukhar 102°F se zyada ho ya 48 ghante se zyada chale.
- Baby bohot zyada sust (drowsy) ho ya lagatar 3 ghante se ro raha ho.`,
    replyPureHi: `🌡️ **टीकाकरण के बाद हल्का बुखार आना पूरी तरह सामान्य व सुरक्षित है:**
पेंटावेलेंट (Pentavalent) या डीपीटी (DPT) के टीके के बाद 24 से 48 घंटों में हल्का बुखार (99°F - 101°F) आना इस बात का स्वस्थ संकेत है कि आपके बच्चे का इम्यून सिस्टम रोगों से लड़ने के लिए सुरक्षात्मक एंटीबॉडीज बना रहा है।

**घरेलू देखभाल और प्राथमिक उपचार:**
1. **हल्के सूती कपड़े:** बच्चे को ढीले व हल्के सूती कपड़े पहनाएं। कमरे का वातावरण हवादार रखें।
2. **स्तनपान व तरल आहार:** बच्चे को बार-बार स्तनपान (Breastfeeding) या ओआरएस/तरल पदार्थ पिलाते रहें ताकि डिहाइड्रेशन न हो।
3. **गुनगुने पानी की पट्टी:** आवश्यकता पड़ने पर माथे पर गुनगुने (सामान्य नल के पानी, बहुत ठंडे या बर्फ वाले नहीं) पानी की साफ पट्टी रखें।
4. **पैरासिटामोल ड्रॉप्स:** केवल अपने बाल रोग विशेषज्ञ (Pediatrician) द्वारा वजन के अनुसार सुझाई गई खुराक दें। एस्पिरिन बिल्कुल न दें।

⚠️ **बाल रोग विशेषज्ञ से तुरंत संपर्क करें यदि:**
- बुखार 102°F (39°C) से अधिक हो या 48 घंटे से अधिक समय तक लगातार बना रहे।
- बच्चा अत्यधिक सुस्त हो, दूध न पी रहा हो, या लगातार 3 घंटे से अधिक समय से रो रहा हो।`,
    suggestionsEn: ['What about swelling at injection site?', 'Can I give bath after vaccine?', 'DPT vs Pentavalent differences'],
    suggestionsHi: ['Injection wali jagah par sujan aur dard?', 'Vaccine ke baad nehla sakte hain kya?', 'Pentavalent 5 bimariyon se kaise bachati hai?'],
    suggestionsPureHi: ['टीके वाली जगह पर सूजन और दर्द?', 'क्या टीके के बाद बच्चे को नहला सकते हैं?', 'पेंटावेलेंट 5 बीमारियों से कैसे बचाता है?']
  },
  {
    triggers: [
      'bcg scar', 'scar nahi bana', 'no scar', 'bcg mark', 'bcg papule', 'nishan nahi bana',
      'bcg pustule', 'bcg vaccine', 'tuberculosis', 'निशान', 'बीसीजी', 'दाग', 'फुंसी', 'छाला', 'टीबी', 'निशान नहीं बना'
    ],
    title: 'BCG Scar Formation NIS Guidelines',
    replyEn: `💉 **BCG Scar Timeline & Guidelines:**
Under NIS 2025 guidelines, a BCG scar typically takes **6 to 12 weeks** to develop:

1. **Week 2–3:** A small red nodule/papule appears at the left upper arm.
2. **Week 5–6:** It turns into a small blister or pustule that may discharge watery fluid (do NOT squeeze or apply ointments).
3. **Week 8–12:** It heals naturally leaving a permanent round scar.

**What if NO scar forms after 12 weeks?**
- Government of India & WHO guidelines state: **Do NOT re-vaccinate with BCG** if immunization was officially recorded at birth. Up to 10% of children develop cellular immunity without a visible scar!`,
    replyHi: `💉 **BCG Nishan (Scar) Banne Ki Timeline aur Niyam:**
NIS 2025 guidelines ke hisab se BCG ka permanent nishan banne me **6 se 12 hafte** lagte hain:

1. **2–3 hafte baad:** Baayein kandhe par ek chhota lal dana ubharta hai.
2. **5–6 hafte baad:** Ek chhota chhaala ya finsi banti hai jisme se halka paani nikal sakta hai (ise bilkul na dabayein aur koi marham na lagayein).
3. **8–12 hafte baad:** Ye apne aap sookh kar ek pakka gol nishan chhod deta hai.

**Agar 12 hafte baad bhi nishan na bane toh kya karein?**
- Bharat Sarkar aur WHO ke mutabiq: **Dubara BCG vaccine lagwane ki bilkul zaroorat nahi hai!** Lagbhag 10% bacho me nishan bina bane bhi andar se complete immunity ban jati hai.`,
    replyPureHi: `💉 **बीसीजी (BCG) का निशान बनने की समयसीमा और दिशानिर्देश:**
राष्ट्रीय टीकाकरण कार्यक्रम (NIS 2025) के अनुसार, बीसीजी का पक्का गोल निशान बनने में **6 से 12 सप्ताह** का समय लगता है:

1. **2 से 3 सप्ताह बाद:** बाएं कंधे पर एक छोटा लाल दाना (Papule) उभरता है।
2. **5 से 6 सप्ताह बाद:** यह एक छोटी फुंसी या छाले का रूप ले लेता है जिसमें से हल्का पानी निकल सकता है (इसे दबाएं या फोड़ें नहीं, न ही कोई मलहम या पाउडर लगाएं)।
3. **8 से 12 सप्ताह बाद:** यह अपने आप सूखकर एक स्थायी गोल निशान (Scar) छोड़ देता है।

**यदि 12 सप्ताह बाद भी निशान न बने तो क्या करें?**
- भारत सरकार और डब्ल्यूएचओ (WHO) के स्पष्ट निर्देश हैं: **दोबारा बीसीजी का टीका लगवाने की बिल्कुल आवश्यकता नहीं है!** यदि जन्म के समय टीका लगने का आधिकारिक रिकॉर्ड है, तो लगभग 10% बच्चों में बिना दिखाई देने वाले निशान के भी आंतरिक रोग प्रतिरोधक क्षमता (Immunity) पूरी तरह विकसित हो जाती है।`,
    suggestionsEn: ['Fever after vaccination?', 'Next vaccine due date?', 'What is OPV zero dose?'],
    suggestionsHi: ['Vaccine ke baad bukhar ka ilaj?', 'Agli vaccine ki date kab hai?', 'OPV do boond kyu zaroori hai?'],
    suggestionsPureHi: ['टीकाकरण के बाद बुखार का उपचार?', 'अगले टीके की तारीख कब है?', 'पोलियो की दो बूंद क्यों जरूरी है?']
  },
  {
    triggers: [
      'miss', 'late', 'delayed', 'chhut gayi', 'der ho gayi', 'catch up', 'schedule missed',
      'gap', 'interval', 'minimum interval', 'छूट गया', 'देरी', 'तारीख निकल गई', 'कैच अप', 'अंतराल', 'अंतर'
    ],
    title: 'Missed / Delayed Vaccine Guidelines (Catch-up Schedule)',
    replyEn: `📅 **Catch-Up Immunization Rules (NIS 2025):**
If you missed a scheduled vaccination date, **do NOT restart the entire series from dose 1!** Simply resume from the next due dose as soon as possible.

**Key NIS Rules:**
- **Minimum Interval Rule:** Multi-dose series (e.g., OPV 1-2-3, Pentavalent 1-2-3, Rotavirus 1-2-3) requires at least **4 weeks (28 days)** between consecutive doses.
- **BCG:** Can be given up to 1 year of age.
- **Pentavalent & Rotavirus:** Given up to 1 year of age. If older than 1 year, DPT is given instead.
- **Measles-Rubella (MR):** First dose at 9 months; catch-up available up to 5 years.

👉 *Log in to your VacciTrack Parent Dashboard to see your child's auto-adjusted schedule with grace periods!*`,
    replyHi: `📅 **Missed Dose Catch-Up Niyam (NIS 2025):**
Agar aapke bache ki koi vaccine date chhoot gayi hai ya late ho gaya hai, toh **shuru se dose 1 restart karne ki bilkul zaroorat nahi hai!** Jahan se ruki hai, wahin se continue karein.

**Khas Niyam:**
- **Minimum Gap:** Lagatar do doses (jaise Penta 1 aur Penta 2) ke beech kam se kam **4 hafte (28 din)** ka antar hona zaroori hai.
- **BCG:** 1 saal ki umar tak di ja sakti hai.
- **Pentavalent & Rotavirus:** 1 saal tak lagti hai. Agar bacha 1 saal se bada hai toh DPT di jati hai.
- **Measles-Rubella (MR):** 9 mahine par pehli dose lagti hai aur 5 saal tak lagwayi ja sakti hai.

👉 *Aapke VacciTrack Parent Dashboard me auto-adjusted dates aur grace period schedule automatically updated hain!*`,
    replyPureHi: `📅 **छूटी हुई खुराक के लिए कैच-अप टीकाकरण नियम (NIS 2025):**
यदि आपके बच्चे के किसी टीके की तारीख निकल गई है या देरी हो गई है, तो **पहली खुराक से दोबारा टीकाकरण शुरू करने की बिल्कुल आवश्यकता नहीं है!** जहां से क्रम रुका था, वहीं से अगली खुराक लगवाएं।

**प्रमुख नियम:**
- **न्यूनतम अंतराल नियम:** एक ही टीके की लगातार दो खुराकों (जैसे पेंटावेलेंट 1 और 2) के बीच कम से कम **4 सप्ताह (28 दिन)** का अंतर होना अनिवार्य है।
- **बीसीजी (BCG):** 1 वर्ष की आयु तक कभी भी लगाया जा सकता है।
- **पेंटावेलेंट व रोटावायरस:** 1 वर्ष की आयु तक दिया जाता है। 1 वर्ष से अधिक होने पर डीपीटी (DPT) दिया जाता है।
- **एमआर (खसरा-रूबेला):** 9 महीने पर पहली खुराक और 5 वर्ष की आयु तक कैच-अप उपलब्ध है।

👉 *आपके VacciTrack पैरेंट डैशबोर्ड में सभी संशोधित तारीखें और ग्रेस पीरियड स्वतः अपडेटेड हैं!*`,
    suggestionsEn: ['How to download certificate?', 'What is minimum gap?', 'Is it safe to give late?'],
    suggestionsHi: ['Official QR Certificate kaise download karein?', 'Do vaccines ke beech kitna gap chahiye?', 'Late vaccine lagwane me koi nuksan hai kya?'],
    suggestionsPureHi: ['आधिकारिक क्यूआर प्रमाणपत्र कैसे डाउनलोड करें?', 'दो टीकों के बीच कितना अंतराल चाहिए?', 'देर से टीका लगवाने का कोई नुकसान?']
  },
  {
    triggers: [
      'swelling', 'sujan', 'redness', 'pain', 'dard', 'lump', 'gath', 'injection site',
      'hard spot', 'leg pain', 'rona', 'सूजन', 'दर्द', 'गांठ', 'लाली', 'सिकाई', 'मालिश', 'बर्फ'
    ],
    title: 'Injection Site Pain & Swelling Care',
    replyEn: `🩹 **Injection Site Care:**
Mild redness, tenderness, and a small lump at the thigh/arm are typical after intramuscular injections (like Pentavalent or PCV).

**What to do:**
- Apply a **cool, clean damp cloth** gently over the area for 5-10 minutes.
- Do NOT massage or vigorously rub the injection site.
- Avoid applying ice directly, hot compresses, or unauthorized ointments.
- The small firm nodule usually resolves on its own within 2 to 4 weeks.`,
    replyHi: `🩹 **Injection Wali Jagah Par Sujan aur Dard Ka Ilaj:**
Pentavalent ya PCV ke injection ke baad jaangh par halki laali, sujan aur ek chhota sa hard spot (gath) aana bilkul normal hai.

**Kya Karein:**
- Ek saaf kapde ko **thande/gungune paani** me bhigo kar 5–10 minute ke liye halka sek karein.
- Injection wali jagah par **maalish bilkul na karein** aur na hi zor se ragdein.
- Direct baraf (ice), garam paani, ya koi bina poochhi marham na lagayein.
- Chhota hard spot 2 se 4 hafte me apne aap ghul kar theek ho jata hai.`,
    replyPureHi: `🩹 **टीका लगने वाली जगह पर सूजन और दर्द की देखभाल:**
पेंटावेलेंट या पीसीवी जैसे मांसपेशियों में लगने वाले टीकों के बाद जांघ पर हल्की लाली, सूजन और छोटी कड़ी गांठ बनना पूरी तरह सामान्य शारीरिक प्रतिक्रिया है।

**सुरक्षित देखभाल के निर्देश:**
- एक साफ मुलायम कपड़े को **साधारण या हल्के ठंडे पानी** में भिगोकर 5 से 10 मिनट के लिए हल्के हाथ से रखें।
- टीके वाली जगह पर **मालिश बिल्कुल न करें** और जोर से न रगड़ें।
- सीधे बर्फ (Ice), गर्म पानी की सिकाई, या कोई बिना डॉक्टर की सलाह वाली क्रीम न लगाएं।
- यह छोटी कड़ी गांठ 2 से 4 सप्ताह में अपने आप पूरी तरह घुल जाती है।`,
    suggestionsEn: ['Fever after vaccine?', 'Bath after vaccine?', 'Doctor consultation'],
    suggestionsHi: ['Vaccine ke baad bukhar aa gaya?', 'Vaccine ke baad baby ko nehla sakte hain?', 'Doctor se contact kaise karein?'],
    suggestionsPureHi: ['टीके के बाद बुखार आ गया?', 'क्या टीके के बाद बच्चे को नहला सकते हैं?', 'डॉक्टर से संपर्क कैसे करें?']
  },
  {
    triggers: [
      'schedule', 'nis', 'nis 2025', 'table', 'all vaccines', 'phases', 'birth',
      'national immunization schedule', 'list of vaccines', 'अनुसूची', 'शेड्यूल', 'शेडयूल', 'टीकों की सूची', 'चरण', 'जन्म', 'राष्ट्रीय टीकाकरण'
    ],
    title: 'NIS 2025 Universal Immunization Schedule',
    replyEn: `🇮🇳 **India National Immunization Schedule (NIS 2025) Overview:**
VacciTrack tracks 25 vaccines across 4 key phases:

1. **Phase 1 — At Birth (0–15 days):**
   - BCG (Tuberculosis)
   - OPV-0 (Oral Polio Zero Dose)
   - Hepatitis B Birth Dose (Within 24 hours)

2. **Phase 2 — Primary Series (6, 10, 14 Weeks):**
   - OPV (Doses 1, 2, 3)
   - Pentavalent (Doses 1, 2, 3: Diphtheria, Pertussis, Tetanus, Hep-B, Hib)
   - Rotavirus (Doses 1, 2, 3: Severe Diarrhea)
   - fIPV (Fractional IPV: Doses 1 & 2)
   - PCV (Pneumococcal: Doses 1 & 2)

3. **Phase 3 — Boosters (9–16 Months):**
   - MR 1 & 2 (Measles-Rubella)
   - JE 1 & 2 (Japanese Encephalitis - endemic districts)
   - PCV Booster & DPT Booster 1

4. **Phase 4 — School Age (5–16 Years):**
   - DPT Booster 2 (5-6 yrs), Td-10 (10 yrs), Td-16 (16 yrs).`,
    replyHi: `🇮🇳 **India National Immunization Schedule (NIS 2025) ki Puri List:**
VacciTrack aapke bache ke 25 essential vaccines ko 4 phases me track karta hai:

1. **Phase 1 — Janam ke Samay (0–15 Din):**
   - BCG (TB bimari se bachav)
   - OPV-0 (Polio drop birth dose)
   - Hepatitis B (Pehle 24 ghante ke andar)

2. **Phase 2 — Primary Series (6, 10, 14 Hafte):**
   - OPV (1, 2, 3 khuraak)
   - Pentavalent (5 bimariyon se bachav: Galghontu, Kaali Khansi, Dhanustambha, Hep-B, Hib)
   - Rotavirus (Bache ko dast aur ulti se bachav)
   - fIPV (Polio injection) aur PCV (Pneumonia injection)

3. **Phase 3 — Boosters (9–16 Mahine):**
   - MR 1 aur 2 (Khasra aur Rubella)
   - DPT Booster 1 aur PCV Booster

4. **Phase 4 — School Age (5–16 Saal):**
   - DPT Booster 2 (5-6 saal), Td-10 (10 saal), Td-16 (16 saal).`,
    replyPureHi: `🇮🇳 **भारत सरकार का राष्ट्रीय टीकाकरण कार्यक्रम (NIS 2025):**
VacciTrack आपके बच्चे के 25 आवश्यक टीकों को 4 मुख्य चरणों में ट्रैक करता है:

1. **चरण 1 — जन्म के समय (0–15 दिन):**
   - बीसीजी (BCG - टीबी की रोकथाम)
   - ओपीवी-0 (OPV Zero Dose - पोलियो की खुराक)
   - हेपेटाइटिस बी (Hepatitis B - जन्म के 24 घंटे के भीतर)

2. **चरण 2 — प्राथमिक खुराक (6, 10 और 14 सप्ताह):**
   - ओपीवी (OPV 1, 2, 3 - पोलियो ड्रॉप्स)
   - पेंटावेलेंट (Pentavalent 1, 2, 3 - 5 जानलेवा बीमारियों से सुरक्षा)
   - रोटावायरस (Rotavirus 1, 2, 3 - गंभीर दस्त व उल्टी से बचाव)
   - एफआईपीवी (fIPV 1 व 2 - पोलियो सुई का टीका)
   - पीसीवी (PCV 1 व 2 - न्यूमोकोकल निमोनिया से बचाव)

3. **चरण 3 — बूस्टर खुराक (9–16 महीने):**
   - एमआर 1 व 2 (Measles-Rubella - खसरा व रूबेला)
   - डीपीटी बूस्टर 1 (DPT Booster 1) व पीसीवी बूस्टर
   - विटामिन 'ए' पहली खुराक

4. **चरण 4 — स्कूल आयु (5–16 वर्ष):**
   - डीपीटी बूस्टर 2 (5-6 वर्ष), टीडी-10 (10 वर्ष), टीडी-16 (16 वर्ष)।`,
    suggestionsEn: ['How to download certificate?', 'What is Pentavalent?', 'Check next dose'],
    suggestionsHi: ['Official QR Certificate kaise download karein?', 'Pentavalent vaccine kya hoti hai?', 'Agli dose ki due date?'],
    suggestionsPureHi: ['आधिकारिक क्यूआर प्रमाणपत्र कैसे डाउनलोड करें?', 'पेंटावेलेंट टीका क्या होता है?', 'अगले टीके की देय तारीख कब है?']
  },
  {
    triggers: [
      'pentavalent', 'penta', '5 in 1', 'dpt', 'five in one',
      'पेंटावेलेंट', 'पांच बीमारियां', 'गलघोंटू', 'काली खांसी', 'धनुस्तंभ'
    ],
    title: 'Pentavalent Vaccine Information',
    replyEn: `🛡️ **Pentavalent Vaccine (5-in-1 Protection):**
Pentavalent is a single combination vaccine that shields against **5 life-threatening childhood diseases**:

1. **Diphtheria** (Throat infection & airway obstruction)
2. **Pertussis** (Whooping cough)
3. **Tetanus** (Lockjaw)
4. **Hepatitis B** (Liver infection)
5. **Haemophilus Influenzae type b (Hib)** (Severe pneumonia & meningitis)

**Schedule:** 3 doses given at **6 weeks, 10 weeks, and 14 weeks** of age into the middle anterolateral thigh.`,
    replyHi: `🛡️ **Pentavalent Vaccine (5-in-1 Bemariyon Se Suraksha):**
Pentavalent ek single injection me bache ko **5 jaanleva bimariyon** se mukti dilata hai:

1. **Diphtheria (गलघोंटू):** Gale ka gambhir sankraman jisme saans lene me dikkat hoti hai.
2. **Pertussis (काली खांसी):** Bacche ko lagatar aane wali bhayankar khansi.
3. **Tetanus (धनुस्तंभ):** Manspeshiyo ka jakadna aur lockjaw.
4. **Hepatitis B:** Liver ka khatarnak virus.
5. **Hib (Haemophilus influenzae type b):** Bacchon me pneumonia aur dimagi bukhar (meningitis).

**Schedule:** Iski 3 doses **6 hafte, 10 hafte aur 14 hafte** par jaangh me di jaati hain.`,
    replyPureHi: `🛡️ **पेंटावेलेंट टीका (5-इन-1 सुरक्षा):**
पेंटावेलेंट एक ही सुई में बच्चे को **5 घातक व जानलेवा बीमारियों** से पूर्ण सुरक्षा प्रदान करता है:

1. **गलघोंटू (Diphtheria):** गले का गंभीर संक्रमण जो सांस नली को अवरुद्ध कर देता है।
2. **काली खांसी (Pertussis / Whooping Cough):** फेफड़ों का गंभीर संक्रमण और दम घोंटने वाली खांसी।
3. **धनुस्तंभ (Tetanus):** मांसपेशियों का भीषण जकड़ना और लॉकजॉ (Lockjaw)।
4. **हेपेटाइटिस बी (Hepatitis B):** लिवर को नुकसान पहुंचाने वाला संक्रामक वायरस।
5. **हिब (Hib - Haemophilus influenzae type b):** बच्चों में निमोनिया और जानलेवा दिमागी बुखार (Meningitis)।

**समय:** यह टीका **6 सप्ताह, 10 सप्ताह और 14 सप्ताह** की आयु पर जांघ के मध्य बाहरी हिस्से में लगाया जाता है।`,
    suggestionsEn: ['Fever after Pentavalent?', 'What is Rotavirus?', 'Can I give bath?'],
    suggestionsHi: ['Pentavalent ke baad bukhar aa gaya?', 'Vaccine ke baad bache ko nehla sakte hain?', 'Rotavirus vaccine kyu zaroori hai?'],
    suggestionsPureHi: ['पेंटावेलेंट के बाद बुखार आ गया?', 'टीका लगने के बाद बच्चे को नहला सकते हैं?', 'रोटावायरस टीका क्यों जरूरी है?']
  },
  {
    triggers: [
      'certificate', 'cowin', 'download', 'pdf', 'qr code', 'verify', 'school admission', 'praman patra',
      'प्रमाणपत्र', 'सर्टिफिकेट', 'डाउनलोड', 'क्यूआर', 'सत्यापन', 'पीडीएफ', 'स्कूल'
    ],
    title: 'Vaccine Certificate & QR Verification',
    replyEn: `📜 **Official Digital Immunization Certificate:**
You can generate a government-grade verifiable PDF certificate directly in VacciTrack!

**How to Download:**
1. Go to your **Parent Dashboard**.
2. Click on your child's card.
3. Click the **"Download Certificate"** button at the top.
4. You will see a digital certificate preview with a **live QR Code**.
5. Click **"Download Official PDF"** to save your CoWIN-style document.

**Verification:**
Anyone (school, hospital, or authority) can scan the QR code on the certificate using their phone camera to instantly verify all administered doses on the VacciTrack registry!`,
    replyHi: `📜 **Official Digital Vaccine Certificate Download Kaise Karein:**
Aap VacciTrack me se CoWIN-style verifiable PDF certificate live QR code ke sath download kar sakte hain!

**Download Karne Ke Aasan Steps:**
1. Apne **Parent Dashboard** par jayein.
2. Apne bache ke profile card par click karein.
3. Upar diye gaye **"Download Certificate"** button par click karein.
4. Aapko certificate ka digital preview aur **Live QR Code** dikhega.
5. **"Download Official PDF"** par click karein aur aapki PDF phone/laptop me save ho jayegi.

**Online Verification:**
Koi bhi school, doctor ya authority certificate par bane QR code ko apne phone ke camera se scan karke bache ke vaccine records instantly verify kar sakte hain!`,
    replyPureHi: `📜 **आधिकारिक डिजिटल टीकाकरण प्रमाणपत्र डाउनलोड करने की विधि:**
आप VacciTrack में CoWIN जैसा आधिकारिक, क्यूआर-सत्यापित पीडीएफ प्रमाणपत्र तुरंत डाउनलोड कर सकते हैं!

**डाउनलोड करने के आसान चरण:**
1. अपने **पैरेंट डैशबोर्ड (Parent Dashboard)** पर जाएं।
2. अपने बच्चे के नाम वाले कार्ड पर क्लिक करें।
3. ऊपर दिए गए **"प्रमाणपत्र डाउनलोड करें" (Download Certificate)** बटन पर क्लिक करें।
4. स्क्रीन पर डिजिटल प्रमाणपत्र और **लाइव क्यूआर कोड (Live QR Code)** प्रदर्शित होगा।
5. **"Download Official PDF"** पर क्लिक करें और पीडीएफ आपके फोन या कंप्यूटर में सुरक्षित हो जाएगी।

**ऑनलाइन सत्यापन (Instant QR Verification):**
कोई भी स्कूल, डॉक्टर या सरकारी अधिकारी प्रमाणपत्र पर बने क्यूआर कोड को अपने फोन कैमरे से स्कैन करके बच्चे के रिकॉर्ड की तुरंत आधिकारिक पुष्टि कर सकते हैं!`,
    suggestionsEn: ['How to add another child?', 'Check missed doses', 'Doctor reminder'],
    suggestionsHi: ['Dusre bache ko kaise add karein?', 'Chhooti hui vaccine kaise dekhein?', 'Doctor ko reminder kaise bhejein?'],
    suggestionsPureHi: ['दूसरे बच्चे को कैसे जोड़ें?', 'छूटे हुए टीके कैसे देखें?', 'जीमेल पर रिमाइंडर कैसे भेजें?']
  },
  {
    triggers: [
      'bath', 'nahana', 'snan', 'shower', 'water', 'pani',
      'नहलाना', 'नहाना', 'स्नान', 'पानी', 'नहला सकते हैं'
    ],
    title: 'Bathing After Vaccination',
    replyEn: `🚿 **Can you bathe your baby after vaccination?**
**Yes!** A gentle lukewarm bath is completely safe after vaccination. 

**Tips:**
- Keep water lukewarm, not hot or chilly.
- Avoid scrubbing or applying harsh soap directly on the needle puncture site for 24 hours.
- Pat the skin dry with a soft towel gently.
- If baby has high fever or is fussy, you can opt for a quick sponge bath instead.`,
    replyHi: `🚿 **Vaccine Lagne Ke Baad Baby Ko Nehla Sakte Hain Kya?**
**Haan, bilkul!** Vaccine lagne ke baad baby ko gungune paani se nehlaana 100% safe hai.

**Zaroori Savdhaniyan:**
- Paani halka gunguna (lukewarm) hona chahiye, zyada garam ya thanda nahi.
- Jahan injection laga hai, us jagah par 24 ghante tak sabun lagakar ragdein bilkul nahi.
- Nahlane ke baad mulayam sooti toliye se thap-thapa kar sukhein.
- Agar bache ko bukhar hai ya chidchida ho raha hai, toh poora nahlane ke bajay gungune paani se sponge bath de dein.`,
    replyPureHi: `🚿 **क्या टीका लगने के बाद बच्चे को नहला सकते हैं?**
**हाँ, बिल्कुल सुरक्षित है!** टीकाकरण के बाद बच्चे को हल्के गुनगुने पानी से नहलाना 100% सुरक्षित है।

**जरूरी सावधानियां:**
- पानी हल्का गुनगुना (Lukewarm) रखें, बहुत गर्म या ठंडा पानी न हो।
- जिस स्थान पर सुई लगी है, वहां 24 घंटों तक साबुन लगाकर जोर से रगड़ें नहीं।
- नहाने के बाद मुलायम सूती तौलिए से हल्के हाथों से थपथपाकर सुखाएं।
- यदि बच्चे को तेज बुखार है या वह चिड़चिड़ा हो रहा है, तो पूरे स्नान की जगह गुनगुने पानी से स्पंज बाथ (Sponge bath) दे सकते हैं।`,
    suggestionsEn: ['Fever management', 'Swelling at injection site', 'Next due date'],
    suggestionsHi: ['Bukhar aane par kya karein?', 'Injection wali jagah par sujan ka ilaj?', 'Agli vaccine ki date kab hai?'],
    suggestionsPureHi: ['बुखार आने पर क्या करें?', 'टीके वाली जगह पर सूजन का इलाज?', 'अगले टीके की तारीख कब है?']
  },
  {
    triggers: [
      'opv', 'ipv', 'fipv', 'polio', 'drops', 'oral polio', 'inactivated polio', 'two drops',
      'पोलियो', 'दो बूंद', 'ड्रॉप', 'सुई', 'फर्क', 'अंतर'
    ],
    title: 'OPV vs IPV (Polio Vaccines Explained)',
    replyEn: `🛡️ **OPV vs IPV (Why Both are Given in NIS 2025):**
India uses **BOTH** oral drops and injectable polio vaccines together for maximum protection:

1. **OPV (Oral Polio Vaccine - Drops):**
   - Given at Birth (Zero dose), 6, 10, and 14 weeks, plus booster at 16–24 months.
   - Builds **mucosal immunity** in the gut to prevent the polio virus from shedding or spreading to others.

2. **fIPV (Fractional Inactivated Polio Vaccine - Injection):**
   - Given intradermally into the right upper arm at **6 weeks and 14 weeks**.
   - Builds deep **humoral (blood) antibody immunity**, preventing paralysis even if exposed.

👉 *Together, they provide complete, lifelong immunity against all poliovirus strains!*`,
    replyHi: `🛡️ **OPV (Do Boond) aur IPV (Sui) Me Kya Antar Hai?**
Bharat Sarkar ke NIS 2025 schedule me polio ki do boond aur injection dono sath me kyu diye jate hain:

1. **OPV (Oral Polio Vaccine - Do Boond):**
   - Janam par (Zero dose), 6, 10, 14 hafte aur 16-24 mahine par di jaati hai.
   - Ye pet aur aanto (gut) ke andar immunity banati hai taaki polio ka virus bache ke sharir me ghus na sake.

2. **fIPV (Fractional Inactivated Polio - Injection):**
   - 6 hafte aur 14 hafte par daayein kandhe par lagti hai.
   - Ye khoon ke andar mazboot antibodies banati hai jo bache ko paralysis hone se 100% bachati hai.

👉 *Dono milkar aapke bache ko polio ke sabhi strains se poori suraksha dete hain!*`,
    replyPureHi: `🛡️ **ओपीवी (दो बूंद) और एफआईपीवी (सुई का टीका) में अंतर:**
भारत सरकार के NIS 2025 कार्यक्रम में मुंह की दो बूंद और सुई वाला टीका दोनों एक साथ दिए जाते हैं ताकि बच्चे को 100% संपूर्ण सुरक्षा मिले:

1. **ओपीवी (OPV - ओरल पोलियो ड्रॉप्स):**
   - जन्म पर (Zero Dose), 6, 10, 14 सप्ताह और 16-24 महीने पर पिलाई जाती है।
   - यह बच्चे की आंतों (Gut) के अंदर म्यूकोसल इम्युनिटी बनाती है, जिससे पोलियो का वायरस शरीर में प्रवेश नहीं कर पाता।

2. **एफआईपीवी (fIPV - फ्रैक्शनल इनएक्टिवेटेड पोलियो वैक्सीन):**
   - 6 सप्ताह और 14 सप्ताह पर दाएं कंधे पर त्वचा के भीतर (Intradermal) दी जाती है।
   - यह रक्त में मजबूत एंटीबॉडी इम्युनिटी तैयार करती है, जो बच्चे को कभी भी पोलियो का लकवा (Paralysis) होने से बचाती है।

👉 *ये दोनों मिलकर आपके बच्चे को पोलियो के सभी वायरस स्ट्रेन से आजीवन सुरक्षा प्रदान करते हैं!*`,
    suggestionsEn: ['Fever after vaccination?', 'NIS 2025 schedule', 'What is Pentavalent?'],
    suggestionsHi: ['Vaccine ke baad bukhar ka ilaj?', 'India ka vaccine schedule?', 'Pentavalent vaccine kyu lagti hai?'],
    suggestionsPureHi: ['टीकाकरण के बाद बुखार का इलाज?', 'भारत का संपूर्ण टीका शेड्यूल?', 'पेंटावेलेंट टीका क्यों लगता है?']
  },
  {
    triggers: [
      'abha', 'abha id', 'ayushman', 'health id', '14 digit', 'digital health', 'card',
      'आभा', 'आयुष्मान', 'हेल्थ कार्ड', '14 अंक', 'आईडी', 'कार्ड'
    ],
    title: 'ABHA ID (Ayushman Bharat Health Account)',
    replyEn: `🆔 **What is an ABHA ID and Why is it Needed?**
An **ABHA ID** (Ayushman Bharat Health Account) is a 14-digit digital health identity created under India's **Ayushman Bharat Digital Mission (ABDM)**.

**Key Benefits for Your Child in VacciTrack:**
1. **Paperless Immunization Card:** Never lose your child's vaccination history again.
2. **Nationwide Interoperability:** Accepted across all Government PHCs, AIIMS, and private pediatric hospitals in India.
3. **School & Travel Ready:** Enables instant QR code authentication for admissions and passports.
4. **100% Secure & Private:** Accessed only via two-factor OTP verification by registered healthcare professionals.`,
    replyHi: `🆔 **Bache Ka ABHA ID Kya Hota Hai aur Iska Kya Fayda Hai?**
**ABHA ID** (Ayushman Bharat Health Account) ek 14-digit ka digital health identification number hai jo Government of India ke ABDM mission ke tahat banta hai.

**VacciTrack Me Iske Fayde:**
1. **Paperless Digital Record:** Purana kagazi vaccine card khone ka koi dar nahi rehta.
2. **Poore Desh Me Manyata:** Desh ke sabhi Sarkari PHC, AIIMS aur private hospitals me chalta hai.
3. **School Admission Me Kaam Aata Hai:** Admission ke waqt instant digital verification ho jata hai.
4. **100% Surakshit:** Parent ke OTP permission ke bina koi bhi record nahi dekh sakta.`,
    replyPureHi: `🆔 **बच्चे का आभा (ABHA) कार्ड क्या है और इसके क्या लाभ हैं?**
**आभा आईडी (ABHA ID)** भारत सरकार के आयुष्मान भारत डिजिटल मिशन (ABDM) के अंतर्गत जारी 14-अंकों का आधिकारिक डिजिटल स्वास्थ्य पहचान पत्र है।

**VacciTrack में इसके प्रमुख लाभ:**
1. **पेपरलेस डिजिटल रिकॉर्ड:** कागजी टीकाकरण कार्ड खोने या फटने का कोई डर नहीं रहता।
2. **देशभर में मान्यता:** भारत के सभी सरकारी प्राथमिक स्वास्थ्य केंद्रों (PHC), एम्स (AIIMS) और निजी बाल चिकित्सालयों में मान्य।
3. **स्कूल दाखिले में सुगमता:** स्कूल और कॉलेज में दाखिले के समय क्यूआर कोड से त्वरित सत्यापन।
4. **100% सुरक्षित व गोपनीय:** माता-पिता के रजिस्टर्ड मोबाइल नंबर पर आने वाले ओटीपी (OTP) के बिना कोई भी रिकॉर्ड नहीं देख सकता।`,
    suggestionsEn: ['How to download certificate?', 'NIS 2025 schedule', 'Doctor reminder'],
    suggestionsHi: ['Official QR Certificate kaise download karein?', 'NIS 2025 ka poora schedule?', 'Doctor ko reminder kaise bhejein?'],
    suggestionsPureHi: ['आधिकारिक क्यूआर प्रमाणपत्र कैसे डाउनलोड करें?', 'NIS 2025 का पूरा शेड्यूल?', 'डॉक्टर को रिमाइंडर कैसे भेजें?']
  }
];

/**
 * Match user query against the clinical knowledge engine
 */
export const queryVaxbot = async (userMessage, context = {}) => {
  const isPureHi = isPureHindiQuery(userMessage, context);
  const cleanQuery = (userMessage || '').toLowerCase().trim();
  const isHinglish = !isPureHi && isHinglishQuery(cleanQuery, context);

  // If n8n RAG Webhook is configured, route query to n8n RAG pipeline first
  const n8nWebhook = process.env.N8N_RAG_WEBHOOK_URL;
  if (n8nWebhook && userMessage) {
    try {
      const response = await fetch(n8nWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage, 
          query: userMessage, 
          context: { ...context, lang: isPureHi ? 'hindi' : isHinglish ? 'hinglish' : 'english' } 
        }),
      });
      if (response.ok) {
        const n8nData = await response.json();
        const replyText = n8nData.reply || n8nData.output || n8nData.text;
        if (replyText) {
          return {
            reply: replyText,
            suggestions: n8nData.suggestions || (
              isPureHi 
                ? ['टीकाकरण के बाद बुखार?', 'NIS 2025 शेड्यूल', 'प्रमाणपत्र डाउनलोड करें']
                : ['Fever after vaccination?', 'NIS 2025 schedule', 'Download Certificate']
            ),
            rag_verified: true,
            source: 'n8n RAG Workflow',
          };
        }
      }
    } catch (n8nErr) {
      console.warn('n8n RAG Webhook unavailable, using built-in NIS 2025 knowledge engine:', n8nErr.message);
    }
  }

  if (!cleanQuery) {
    if (isPureHi) {
      return {
        reply: 'नमस्ते! 🙏 मैं **VaxBot** हूँ, आपका बाल रोग व राष्ट्रीय टीकाकरण कार्यक्रम (NIS 2025) एआई सहायक। आप मुझसे बुखार की देखभाल, टीकों के प्रभाव, छूटी हुई खुराक, या प्रमाणपत्र के बारे में शुद्ध हिंदी में पूछ सकते हैं।',
        suggestions: ['टीकाकरण के बाद बुखार आ गया?', 'NIS 2025 का पूरा शेड्यूल?', 'बीसीजी का निशान नहीं बना?', 'प्रमाणपत्र कैसे डाउनलोड करें?']
      };
    }
    if (isHinglish) {
      return {
        reply: 'Namaste! Main VaxBot hoon, aapka AI Pediatric & Vaccine Assistant. Aap mujhse NIS 2025 schedule, bukhar, side-effects, ya vaccine certificate ke bare me Hindi ya Hinglish me puch sakte hain.',
        suggestions: ['Vaccine ke baad bukhar aa gaya?', 'NIS 2025 ka schedule?', 'BCG nishan nahi bana toh?', 'Certificate kaise download karein?']
      };
    }
    return {
      reply: 'Hello! I am VaxBot, your AI Pediatric & Vaccine Assistant. You can ask me about NIS 2025 schedule, fever care, side-effects, or immunization certificates.',
      suggestions: ['Fever after vaccination?', 'NIS 2025 schedule overview', 'BCG scar guidelines', 'Download certificate']
    };
  }

  // 1. Direct Greetings
  if (/^(hi|hello|hey|namaste|pranam|halo|hola|help|नमस्ते|प्रणाम|मदद|हेलो)$/i.test(cleanQuery)) {
    if (isPureHi) {
      const greeting = context?.userName ? `नमस्ते ${context.userName}! 🙏` : `नमस्ते! 🙏`;
      return {
        reply: `${greeting} मैं **VaxBot** हूँ — VacciTrack का बाल रोग व टीकाकरण एआई सहायक।
        
मैं आपकी इन प्रमुख विषयों में सहायता कर सकता हूँ:
- 🌡️ **टीकाकरण के बाद बुखार या दर्द:** सुरक्षित घरेलू उपचार व सावधानियां
- 📅 **छूटी हुई खुराक (Missed Dose):** कैच-अप टीकाकरण के सरकारी नियम
- 💉 **NIS 2025 के सभी आवश्यक टीके:** बीसीजी, पेंटावेलेंट, पोलियो, एमआर, आदि
- 📜 **आधिकारिक डिजिटल प्रमाणपत्र:** क्यूआर कोड वाला CoWIN-ग्रेड पीडीएफ

आप निसंकोच अपना सवाल पूछें!`,
        suggestions: ['टीकाकरण के बाद बुखार आ गया?', 'बीसीजी का निशान नहीं बना?', 'डिजिटल प्रमाणपत्र डाउनलोड?', 'NIS 2025 पूरा शेड्यूल']
      };
    } else if (isHinglish) {
      const greeting = context?.userName ? `Namaste ${context.userName}! 👋` : `Namaste! 👋`;
      return {
        reply: `${greeting} Main **VaxBot** hoon — VacciTrack ka AI Pediatric & Vaccine Guide.
        
Main aapki madad kar sakta hoon:
- 🌡️ Vaccine ke baad bukhar ya dard ka gharelu ilaj
- 📅 Missed dose / Catch-up schedule niyam
- 💉 NIS 2025 vaccines (BCG, Pentavalent, Polio, MR, etc.)
- 📜 Verifiable PDF Certificate download karne me

Aapka sawal kya hai?`,
        suggestions: ['Vaccine ke baad bukhar aa gaya?', 'BCG scar nahi bana toh?', 'Official QR Certificate download?', 'NIS 2025 schedule']
      };
    } else {
      const greeting = context?.userName ? `Hello ${context.userName}! 👋` : `Hello! 👋`;
      return {
        reply: `${greeting} I am **VaxBot** — VacciTrack's AI Pediatric & Vaccine Guide.
        
I can assist you with:
- 🌡️ Post-vaccination fever & pain management
- 📅 Missed doses & catch-up schedule rules
- 💉 NIS 2025 vaccines (BCG, Pentavalent, Polio, MR, etc.)
- 📜 Verifiable QR-coded PDF Certificate generation

How can I help you today?`,
        suggestions: ['Fever after vaccine?', 'NIS 2025 schedule', 'No BCG scar formed?', 'Download Certificate']
      };
    }
  }

  // 2. Scan clinical knowledge base
  let bestMatch = null;
  let highestScore = 0;

  for (const item of KNOWLEDGE_BASE) {
    let score = 0;
    for (const trigger of item.triggers) {
      const lowerTrigger = trigger.toLowerCase();
      if (cleanQuery.includes(lowerTrigger)) {
        score += lowerTrigger.split(' ').length * 2;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore > 0) {
    if (isPureHi) {
      return {
        reply: bestMatch.replyPureHi || bestMatch.replyHi,
        suggestions: bestMatch.suggestionsPureHi || ['कोई अन्य सवाल पूछें', 'प्रमाणपत्र डाउनलोड करें', 'पूरी अनुसूची देखें']
      };
    }
    if (isHinglish) {
      return {
        reply: bestMatch.replyHi,
        suggestions: bestMatch.suggestionsHi || ['Koi aur sawal puchein', 'Certificate download karein', 'Poora schedule dekhein']
      };
    }
    return {
      reply: bestMatch.replyEn,
      suggestions: bestMatch.suggestionsEn || ['Ask another question', 'Download Certificate', 'View Full Schedule']
    };
  }

  // 3. Fallback with helpful NIS orientation
  if (isPureHi) {
    return {
      reply: `आपके प्रश्न के अनुसार: भारत सरकार के **राष्ट्रीय टीकाकरण कार्यक्रम (NIS 2025)** के दिशा-निर्देशों के तहत सभी आवश्यक टीके बच्चे की संपूर्ण सुरक्षा के लिए अनिवार्य हैं। 

यदि बच्चे को **हल्का बुखार या टीके वाली जगह पर सूजन** है, तो साफ गुनगुने पानी की पट्टी रखें और नियमित स्तनपान कराएं। यदि कोई खुराक छूट गई है, तो पहली खुराक से दोबारा शुरू करने की जरूरत नहीं है, सीधे अगली देय खुराक लगवाएं।

आप विशिष्ट सवाल पूछ सकते हैं जैसे:
- *"टीकाकरण के बाद बच्चे को बुखार आ गया, क्या घरेलू उपाय करें?"*
- *"पेंटावेलेंट टीका बच्चे को किन 5 जानलेवा बीमारियों से बचाता है?"*
- *"आधिकारिक क्यूआर कोड वाला टीकाकरण प्रमाणपत्र कैसे डाउनलोड करें?"*`,
      suggestions: ['टीकाकरण के बाद बुखार?', 'NIS 2025 शेड्यूल', 'बीसीजी निशान के नियम', 'प्रमाणपत्र डाउनलोड करें']
    };
  }

  if (isHinglish) {
    return {
      reply: `Aapke sawal ke mutabiq: India ke **National Immunization Schedule (NIS 2025)** ke hisab se sabhi vaccines bache ki suraksha ke liye zaroori hain. 

Agar bache ko **bukhar ya halki sujan** hai, toh lukewarm pani ki patti rakhein aur dhoodh pilate rahein. Agar koi dose chhoot gayi hai, toh dobara shuru karne ki zaroorat nahi hai, bas agla visit jaldi schedule karein.

Aap specific sawal puch sakte hain jaise:
- *"Vaccine ke baad bukhar aa gaya, kya karein?"*
- *"Pentavalent vaccine 5 bimariyon se kaise bachati hai?"*
- *"Official QR wala Certificate kaise download karein?"*`,
      suggestions: ['Vaccine ke baad bukhar?', 'NIS 2025 schedule', 'BCG nishan nahi bana?', 'Download Certificate']
    };
  }

  return {
    reply: `According to India's **National Immunization Schedule (NIS 2025)** guidelines, all childhood vaccines are essential for full protection against life-threatening diseases.

If your baby has mild fever or swelling, apply a cool damp cloth and continue regular breastfeeding. If a dose was delayed, do not restart from dose 1 — simply resume from the next due dose.

You can ask specific questions like:
- *"What to do if baby gets fever after vaccine?"*
- *"What is Pentavalent vaccine and why is it given?"*
- *"How to download official QR-verified certificate?"*`,
    suggestions: ['Fever after vaccine?', 'NIS 2025 Schedule', 'BCG scar guidelines', 'Download Certificate']
  };
};

