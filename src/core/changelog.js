// CHANGELOG — split out of constants.js for code-splitting.
// Dynamically imported from showHelp() so this ~69KB raw / ~30KB gzipped
// doesn't load in the critical path. Was ~23% of the main bundle gzipped
// weight; now lazy-loaded on first help-overlay open.
//
// IMPORTANT: drift guards (tests/changelogDrift.test.js) read this file
// directly, so the 'export const CHANGELOG={' marker must stay literal.

export const CHANGELOG={
  '1.25.1': [
    '🛡️ חיזוק קריאות שאלת החידון — צבע הטקסט של גוף השאלה ושל התשובות קיבל ערך-גיבוי מפורש, כך שגם אם משתנה-עיצוב (CSS token) לא נטען בתרחיש קצה, הטקסט יוצג כהה על רקע בהיר ולעולם לא בלתי-נראה. בנוסף הורחב גשר מצב-כהה לכסות גם [data-theme=dark].'
  ],
  '1.25.0': [
    '➕ נוספו 30 שאלות נוספות (סה"כ 1121) במגוון רמות קושי, בדגש על נושאים דלילים (אי-ספיקת לב, ראומטולוגיה, נוירולוגיה/דמנציה, גסטרו, בריאות הגבר ועוד).',
    '🎓 ההסברים בשאלות החדשות מנוסחים מפורשות — כל הסבר פותח ב"התשובה הנכונה היא ... משום ש..." ומסביר מדוע התשובה הנכונה נכונה, ולא רק מציג עובדה.',
    '📚 כל שאלה נושאת מקור מאומת מגורול 8e (קישור-עומק + ציטוט עברי). ללא ייחוס מומצא.'
  ],
  '1.24.1': [
    '🧹 ניקוי פנימי — קבצי הנתונים של התרופות והכרטיסיות (שכבר אינם בשימוש לאחר הסרת הלשוניות) הוסרו מרשימת ה-precache ומטעינת הנתונים, לחיסכון ברוחב פס בכל טעינה. ללא שינוי גלוי למשתמש.'
  ],
  '1.24.0': [
    '➕ נוספו 30 שאלות חדשות (סה"כ 1091) במגוון רמות קושי — 10 קלות, 12 בינוניות, 8 קשות — בדגש על נושאים עם כיסוי דליל (התמכרויות, בריאות הגבר, אלרגיה, כאב ופליאציה, בלוטת התריס, דרמטולוגיה ועוד).',
    '📚 כל שאלה חדשה נושאת מקור מאומת מגורול 8e (מספר פרק שאומת מול אינדקס הפרקים) — גם כקישור-עומק בלשונית "מקור" וגם כציטוט עברי בתוך ההסבר. ללא ייחוס מומצא.',
    '🎓 ההסברים נכתבו באופן חינוכי — מסבירים את העיקרון הקליני, לא רק מציינים את התשובה הנכונה.'
  ],
  '1.23.0': [
    '🗑️ הוסרו לשוניות שלא היו בשימוש כדי לפנות מקום ולפשט את הממשק — כרטיסים (Cards), תרופות (Drugs) ומחשבונים (Calc) הוסרו מהספרייה ומלשונית "עוד".',
    '🗑️ הוסרו גם צ׳אט ה-AI ומסך המשוב — הצ׳אט נכפל מול שימוש ישיר ב-Claude, וטופס המשוב מיותר באפליקציה אישית.',
    '🧹 הממשק המשני התרכז: "ספרייה" = מקורות + סיכומים; "עוד" = חיפוש + הערות. החיפוש הכללי כבר אינו מחפש בתרופות.'
  ],
  '1.22.4': [
    '🇮🇱 תפריטי המשנה תורגמו לעברית — סרגלי הניווט המשניים בלשוניות "ספרייה" ו"עוד" הוצגו באנגלית (Read / Cards / Notes / Drugs, Calc / Search / Notes / Chat / Feedback) בתוך ממשק עברי לחלוטין. כעת בעברית: מקורות / כרטיסים / סיכומים / תרופות ו-מחשבונים / חיפוש / הערות / צ׳אט / משוב.',
    '🏷️ הוסר בלבול בין שתי לשוניות "Notes" — לשונית הסיכומים בספרייה (חומר לימוד) נקראת כעת "סיכומים", ולשונית ההערות האישיות ב"עוד" נקראת "הערות". קודם שתיהן נקראו "Notes" עם אותו אייקון.',
    '🇮🇱 כותרות וטקסטים גלויים במסכי חיפוש וצ׳אט תורגמו לעברית. שינוי טקסט בלבד; אין שינוי בלוגיקה, בשאלות או במפתחות התשובה.'
  ],
  '1.22.3': [
    '🇮🇱 עקביות שפה בכרטיס השאלה — חיווי התשובה לאחר מענה (נכון / לא נכון) וכפתורי ההסבר של ה-AI (שאל את קלוד / נסה שוב) מוצגים כעת בעברית. קודם הופיעו באנגלית בלבד (Correct / Not quite / Ask Claude) בתוך ממשק עברי לחלוטין — חוסר עקביות חזותית. שינוי טקסט בלבד; אין שינוי בלוגיקה, בשאלות או במפתחות התשובה.'
  ],
  '1.22.2': [
    'fix(content): corrected 3 explanations (2020 exam) that defended the WRONG option while the official key was right — found via an explanation-vs-option detection pass, repaired from Goroll 8e (verbatim). idx 61 deep hand burn: key stays ד (analgesia + refer) — hand burns are a referral criterion (Goroll Ch 196), not office wound care. idx 111 dizziness: key stays א (diplopia = brainstem/central sign); the old text wrongly called unidirectional horizontal nystagmus central — it is peripheral (Goroll Ch 166). idx 118 diabetic vomiting: key stays ב (gastroscopy first to exclude obstruction); gastric-emptying scan only after anatomic causes are ruled out (Goroll Ch 59/102).',
    'No answer keys changed. Detection also confirmed the explanation corpus is otherwise clean: zero letter-contradictions, zero garbled explanations.'
  ],
  '1.22.1': [
    'fix(content): repaired Q64 of the 2020 family-medicine exam (suicide-risk) — the single question left quarantined in v1.22.0 because the 2020 source paper was not yet in the source set. Using the official 2020 IMA paper (verified against the rasterized source page, since the RTL-digit quirk makes text extraction unreliable), restored the garbled correct option to \u201cכ-50% מניסיונות ההתאבדות קורים אצל חולים במחלות גופניות\u201d and aligned option ב to the source wording (\u201cפי 3-4\u201d). The answer (ג) already matched the official key.',
    'Rewrote the explanation, which was wrong: it described mood disorders, but the keyed-correct option is about physical illness. Quarantine lifted — the bank now has 0 quarantined questions.'
  ],
  '1.22.0': [
    'fix(content): repaired 455 questions corrupted by bad OCR/transcription, using the official IMA family-medicine exam papers and answer keys (2021-Jun through 2025-Jun) as the authoritative source.',
    'Stems and options were replaced with verified source text and correct answers set from the official key — 449 via an automated parser+matcher with a content-plus-position dual cross-check, 6 hand-extracted from merged-OCR regions. 7 of 8 previously-quarantined questions restored; the 2020 paper was not in the source set so one question stays quarantined. 2 answers that disagreed with the official key were corrected.',
    'Note: explanations were left unchanged and still need a separate verification pass.'
  ],
  '1.21.48': [
    'fix(quiz): quarantined 8 questions whose CORRECT answer is unreadable transcription garble (you would memorize nonsense) via the broken flag, and extended the pool filters (render guard, sudden-death, jumpToQuestion) to exclude broken in addition to dup. The bank has a broader systemic transcription-quality problem (~120 questions with garbled stems or options across all exam batches) that needs the source exams to repair faithfully — not auto-fixed here, to avoid hiding clean questions (legitimate drug-name transliterations score the same) or fabricating exam content.'
  ],
  '1.21.47': [
    'fix(quiz): show the attach-photo / image UI only on questions that actually reference an image (q.imgPending — the 2020 and Jun-2023 image-album exams). Previously the photo button rendered on every text question, which was pointless clutter and confusing (a photo prompt on questions that never had one). Pure-text questions now render nothing in the image slot.'
  ],
  '1.21.46': [
    'fix(quiz): exclude soft-retired duplicate questions from the Sudden Death pool. Sudden Death builds its own G.sdPool separately from the main G.pool, so the v1.21.45 render-time dedup guard did not cover it; G.sdPool is now filtered at build the same way. Completes the dedup pool coverage flagged in review.'
  ],
  '1.21.45': [
    'fix(data): content-integrity dedup — soft-retired 5 duplicate question copies (idx 162, 482, 742, 788, 792) and added a render-time guard that keeps any retired copy out of every multi-question pool before display, so all pool builders are covered (not only buildPool callers). Four were VARIANT near-dups where the cleaner copy was kept (retinal detachment, BRCA position-paper, diabetic retinopathy, pregnancy-termination committee criteria); one (acne, idx 14 vs 162) was an answer-conflict where the Duac first-line-topical version was kept. BUILD_HASH synced. Indices and progress preserved; no questions deleted.'
  ],
  '1.21.44': [
    '🧹 ניקוי לשונית מעקב — הוסרו שלושה כרטיסים כפולים (נתונים, מפתח API, וכותרת גרסה עם כפתור עדכון וקישור לאפליקציות) שכבר קיימים בלשונית ההגדרות. ניהול הנתונים, המפתח והגרסה מרוכזים כעת במקום אחד.',
    '📅 שורת הסינון נוקתה — שבע גלולות שנות המבחן מתקפלות מאחורי כפתור לפי שנה, שנפתח אוטומטית כשיש שנים פעילות ומציג מונה. בחירה מרובה נשמרה.',
    '📷 תיקון תמונות במצב מוות פתאומי — צירוף או הסרת תמונה לשאלה נשמר עכשיו לשאלה המוצגת ולא לשאלה אחרת. אותו תיקון חל גם על סימון ודגלים במצב זה.',
  ],
  '1.21.43': [
    '\ud83d\udc1b\u05ea\u05d5\u05e7\u05df \u05d1\u05d0\u05d2 \u05e7\u05e8\u05d9\u05d8\u05d9: \u05db\u05e4\u05ea\u05d5\u05e8 \u05d1\u05d3\u05d5\u05e7 \u05d5\u05d7\u05d9\u05e9\u05d5\u05d1\u05d9 \u05d4\u05d7\u05d6\u05e8\u05d4 (FSRS) \u05e7\u05e8\u05e1\u05d5 \u05e2\u05dd \u05e9\u05d2\u05d9\u05d0\u05ea is not a function. \u05d4\u05e1\u05d9\u05d1\u05d4: \u05e1\u05e4\u05e8\u05d9\u05d9\u05ea \u05d4\u05d7\u05d6\u05e8\u05d4 \u05d4\u05de\u05e9\u05d5\u05ea\u05e4\u05ea \u05e0\u05d8\u05e2\u05e0\u05d4 \u05d1\u05e2\u05d9\u05db\u05d5\u05d1 \u05d5\u05e8\u05e6\u05d4 \u05d0\u05d7\u05e8\u05d9 \u05e7\u05d5\u05d3 \u05d4\u05d0\u05e4\u05dc\u05d9\u05e7\u05e6\u05d9\u05d4 \u05d1\u05de\u05e7\u05d5\u05dd \u05dc\u05e4\u05e0\u05d9\u05d5, \u05db\u05da \u05e9\u05e4\u05d5\u05e0\u05e7\u05e6\u05d9\u05d5\u05ea \u05de\u05e0\u05d5\u05e2 \u05d4\u05d7\u05d6\u05e8\u05d4 \u05dc\u05d0 \u05d4\u05d9\u05d5 \u05d6\u05de\u05d9\u05e0\u05d5\u05ea. \u05db\u05e2\u05ea \u05d4\u05d9\u05d0 \u05e0\u05d8\u05e2\u05e0\u05ea \u05dc\u05e4\u05e0\u05d9 \u05d4\u05d0\u05e4\u05dc\u05d9\u05e7\u05e6\u05d9\u05d4. \u05d6\u05d4 \u05de\u05ea\u05e7\u05df \u05d2\u05dd \u05d0\u05ea \u05d4\u05ea\u05dc\u05d5\u05e0\u05d4 \u05d4\u05de\u05e7\u05d5\u05e8\u05d9\u05ea \u05e9\u05db\u05e4\u05ea\u05d5\u05e8 \u05d1\u05d3\u05d5\u05e7 \u05dc\u05d0 \u05e2\u05d5\u05e9\u05d4 \u05db\u05dc\u05d5\u05dd.',
  ],
  '1.21.42': [
    '🎨 צבעי כפתורי ניהול הנתונים (מסך מעקב) סודרו. כפתור Reset שמוחק את כל ההתקדמות היה אפור בהיר ונראה כמו פעולה משנית לא חשובה — עכשיו אדום (אזהרה) שמסמן פעולה הרסנית, בהתאם למוסכמה הקיימת באפליקציה. בנוסף כפתורי הענן (גיבוי ושחזור) אוחדו לאותו גוון תכלת כדי שייראו כזוג, במקום תכלת וירוק נפרדים. שינוי צבעים בלבד, ללא שינוי פריסה.',
  ],
  '1.21.41': [
    '🧭 סדר הטאבים התחתונים שונה ל-חידון ← מעקב ← ספרייה ← עוד (היה חידון ← ספרייה ← מעקב ← עוד). אחרי פתרון שאלות בודקים התקדמות (מעקב) הרבה יותר מקריאת פרק (ספרייה), אז ההתקדמות עכשיו לפני החומר העיוני. טאב הבית נשאר חידון.',
  ],
  '1.21.40': [
    '🏷️ תיקון היסחפות BUILD_HASH — הוא נתקע על v1.21.27 בעוד הגרסה התקדמה ל-1.21.39, כך ש-scripts/verify-deploy.sh (שמחפש את הסיומת q-vX.Y.Z בבאנדל החי) נכשל בשקט בכל פריסה. עכשיו BUILD_HASH עוקב אחרי הגרסה (1061q-v1.21.40) ועד הפריסה שוב אמין.',
  ],
  '1.21.39': [
    '🎨 צבע ה-chrome של הדפדפן תוקן — meta theme-color היה כתום (d97706) בעוד שכותרת האפליקציה היא נייבי כהה (0f172a), כך שהפס העליון של הדפדפן התנגש עם הכותרת בכל מסך. עכשיו שניהם נייבי — המעבר מהדפדפן לאפליקציה חלק ואחיד.',
  ],
  '1.21.38': [
    '🔄 עדכון אוטומטי שקט — תוקן השורש לבעיה החוזרת של גרסה תקועה (כפתור בדוק מת, צבעים ישנים). ה-service worker הגיש HTML מהרשת (לכן מספר הגרסה התעדכן) אבל JS ו-CSS מהמטמון (לכן הקוד נשאר ישן). מעכשיו: כשמגיעה גרסה חדשה היא מופעלת מיד ברקע (skipWaiting) והדף נטען מחדש פעם אחת אוטומטית אל הקבצים החדשים. שני מנגנוני הגנה: לא טוענים מחדש בהתקנה ראשונה (no-first-install-reload) ולא נכנסים ללולאת רענון. הבאנר הידני נשאר רק כגיבוב. עדכון ידני אחד אחרון נדרש כדי להגיע לגרסה הזו, ומכאן זה אוטומטי.',
  ],
  '1.21.37': [
    '🖼️ תמונות מבחן — 2020 (14 שאלות) — המבחן האחרון הושלם. חולץ מחוברת הבחינה המקורית (58 עמודים עם תמונות מוטמעות בתוך השאלות), כי אלבום התמונות שהיה במאגר היה שגוי (של רפואה פנימית, עם ECG ומשטחי דם). כל 14 התמונות הותאמו לשאלות לפי תוכן קליני: 19 גזזת תינוק, 26 גנגליון שורש כף יד, 28 כתמים Leser-Trelat, 39 אוטוסקופיה, 45 פריחת בית שחי, 57 ROC, 60 תפרחת מגרדת, 68 ועוד 108 ECG, 69 לחמית אלרגית, 85 אי ספיקה ורידית מעל ה-malleolus, 89 אטופי תינוק, 90 אימפטיגו, 115 אודיוגרמה. שתי תמונות (כף רגל, אודיוגרמה) שויכו לשאלה הנכונה ולא לטקסט שבאותו עמוד. הוסרו 7 התראות imgPending. כל 7 המבחנים הושלמו, 97 תמונות בסך הכל.',
  ],
  '1.21.36': [
    '🖼️ תמונות מבחן — יוני 2023 (13 שאלות, חלק א) — מתוך חוברת הבחינה המקורית שהועלתה: 13 שאלות עם תמונה משובצת חולצו ואומתו חזותית מול מספר השאלה בחוברת (idx=450+(שאלה-1)): 14 (אוטיטיס), 17 (forest plot), 48 (עין אדומה), 51 (ECG), 80 (kerion), 89 (רטינופתיה סוכרתית), 90 (תפרחת הרפטית פנים), 100 (פסוריאזיס), 115 (טחורים), 121 (אודיוגרמה), 126 (RA ידיים), 130 (ויטיליגו), 141 (Raynaud). ~10 תמונות נוספות קיימות רק באלבום (ECG/CT/CXR/משטח/היסטולוגיה) וטרם מופו — החוברת אינה ממספרת אותן. הוסרה הערת imgPending מ-13 אלו.',
  ],
  '1.21.35': [
    '🐛 תיקון 3 התראות-תמונה שגויות — שאלות [1] גלאוקומה, [97] DVT, [112] אינסולינומה נוסחו \"איזה מהממצאים הבאים\" (= חלופות התשובה), לא הפניה לתמונה. הוסרה מהן הערת imgPending. נותרו 10 שאלות 2020/2023 עם הפניה אמיתית לתמונה.',
  ],
  '1.21.34': [
    '📷 הערת \"תמונה טרם נוספה\" — 13 שאלות במבחני 2020 + יוני-2023 שמתייחסות במפורש לתמונה (\"ראה תמונה\", \"הממצא הבא\") אך התמונה טרם מופתה. אלבומי התמונה של שני המבחנים ממוספרים לפי תמונה (לא לפי שאלה) וסדרם אינו תואם את סדר השאלות, כך שלא ניתן למפותם אוטומטית בבטחה (8 ECG + 5 משטחי דם כמעט זהים). במקום תמונה שגויה — הערה כתומה כנה שהתמונה תיווסף, וההסבר עשוי להיות חלקי. שאר 5 המבחנים (70 תמונות) מופו ואומתו במלואם.',
  ],
  '1.21.33': [
    '🖼️ תמונות מבחן — ספטמבר 2024 (9 שאלות) — idx=700+(שאלה-1), אימות חזותי מלא: 36 (גנוגרם — שמות תואמים), 40 (התקרחות מפושטת), 54 (ECG), 58 (פיסורה אנאלית), 66 (alopecia areata), 74 (אצבע+זרוע משולב), 79 (Dupuytren כף יד), 83 (forest plot DAPT), 95 (פדיגרי גנטי). מבחן 5 מתוך 7. נותרו 2020 ו-יוני 2023 (ממוספרים לפי תמונה, דורשים התאמת תוכן).',
  ],
  '1.21.32': [
    '🖼️ תמונות מבחן — מאי 2024 (13 שאלות) — idx=600+(שאלה-1), אימות חזותי מלא: 22 (פטריגיום), 36 (ECG), 39 (נומוגרמת בילירובין), 41 (גינגיבוסטומטיטיס הרפטי), 45 (פצע לחץ סקראלי), 48 (צילום ע\"ש), 49 (אבצס פילונידלי), 52 (Scheuermann), 78 (DEXA — שתי הטבלאות אוחו לתמונה אחת), 83 (גנו ורום/ולגום), 84 (גנגליון), 91 (אקנה), 93 (פנים קשישה). מבחן 4 מתוך 7.',
  ],
  '1.21.31': [
    '🖼️ תמונות מבחן — יוני 2022 (19 שאלות) — מופו לפי מספר שאלה מקורי (idx=300+(שאלה-1)) עם אימות חזותי לפי תוכן: 5 (אוטוסקופיה), 14 (kerion קרקפת), 16 (אטופי), 24 (אורטיקריה), 28 (פיגמנטציה מצח), 33 (ידיים), 35 (אגרופים/clubbing), 42+150 (ECG), 47 (alopecia areata), 63 (roseola), 79 (HSP), 81 (אודיוגרמה — Meniere), 83 (לופוס עורי דיסקואידי), 91 (סרקואיד — erythema nodosum + צילום חזה, תמונה משולבת), 99 (אננתמה), 111 (פי הטבעת), 119 (בצקת פנים), 123 (אריתמה פלמרית). מבחן 3 מתוך 7.',
  ],
  '1.21.30': [
    '🖼️ תמונות מבחן — יוני 2025 (16 שאלות) — לוחות חולצו מ-2025_jun_images.pdf, נחתכו פר-שאלה ומופו לפי מספר שאלה מקורי (idx=800+(שאלה-1)), עם אימות חזותי של כל ההתאמות לפי תוכן: 8+25+46 (ECG), 16 (tinea pedis), 28 (לופוס עורי), 40 (אקזמה פופליטאלית), 50 (נגע אצבע), 51 (פטכיות יילוד), 61 (HFMD כף יד), 65 (פטמה לאחר לידה), 76+137 (תפרחת ידיים), 79 (מלנומה — חקלאי), 83 (HSP פורפורה), 130 (יבלות מצח), 139 (בלט עין). imgDep:true על כולן. מבחן 2 מתוך 7.',
  ],
  '1.21.29': [
    '🖼️ תמונות מבחן — מבחן יוני 2021 (13 שאלות תלויות-תמונה) — לוחות התמונה של המבחן חולצו מ-exams/2021_jun_images.pdf, נחתכו פר-שאלה, ומופו לשאלות לפי מספר השאלה המקורי (תוויות "שאלה N" על כל לוח) עם אימות חזותי של כל 13 ההתאמות לפי תוכן קליני. כל שאלה מסומנת imgDep:true → מציגה תג "⚠️ אמת" כי ההסבר נכתב לפני שהתמונה הייתה זמינה. שאלות: 10 (ECG פריקרדיטיס), 30 (תפרחת כפות ידיים/רגליים — עגבת משנית), 59 (erythema migrans — ליים), 81 (אודיוגרמה), 87 (כתמי קופליק), 90 (תפרחת אמה), 96 (צילום אגן), 99 (PR), 124+144 (אוטוסקופיה), 131 (גניטלי), 135 (עיני תינוק), 137 (כף רגל). זהו הראשון מבין 7 מבחנים; היתר בהמשך.',
  ],
  '1.21.28': [
    '🌐 תרגום מלא לעברית של לשונית החידון — הניווט התחתון (חידון/ספרייה/מעקב/עוד), תוויות המצב (מצב/סינון/נושא/תרגול), כפתורי המצבים (סימולציה/מוות פתאומי/תורנות/פומודורו), גלולות הסינון (קשות/איטיות/חלשות/לחזרה/השלב הבא/מלכודות/חילוץ/סקור טעויות), כפתורי הפעולה (בדוק/לא יודע/הקודמת/הבאה/סיים), החוזה היומי, פאנל החשיפה שאחרי תשובה (סיבת טעות/דרגת קושי/למד-בחזרה), ומודל תוצאות הסימולציה. נשמרו באנגלית: קודי שנים, Hard-G/Hard-AFP, AI. (#86/#87/#88)',
    '🔘 תיקון קריטי — כפתורי הפעולה לא נראו ככפתורים. בנייה מחדש של v1.15.0 העבירה את כל הכפתורים למחלקות BEM (.btn--primary/--secondary/--ghost) אך הסגנונות מעולם לא הוגדרו — רק .btn הבסיסי קיים. 26 כפתורים (כולל "בדוק") הוצגו כטקסט מודגש ללא רקע, ונראו לא-לחיצים. הוגדרו שלושת המודיפיירים ב-quiz-view.css עם מצבי hover/active/disabled/focus ויעדי מגע 44px. תוקן גם הניגודיות במצב לילה (--color-accent-fg כהה על הספיה #c48a3a, ~7.3:1).',
    '📌 כותרת דביקה + safe-area — ה-.hdr נשא inline `position:relative` ש-override את ה-`position:sticky` שב-CSS, כך שהכותרת נגללה החוצה והתוכן נדחף מתחת לשורת המצב של הטלפון. שונה ל-sticky + `padding-top:max(10px, env(safe-area-inset-top))`. כפתורי הסרגל נשארים מעוגנים (sticky מספק containing block).',
    '🔢 מונה השאלות "2 / 1139" התהפך ל-"1139 / 2" בהקשר RTL — נוסף `dir="ltr"`.',
    '🔄 SW cache bump 1.21.27 → 1.21.28 כדי לדחוף את כל התיקונים ל-PWA מותקנות.',
  ],
  '1.21.27': [
    '♿ Header toolbar dark-on-dark fix — 4 of 5 `.dm-btn` toolbar buttons (🌓 🕯️ ⚙️ ❓) were rendering at default browser ButtonText color (typically `rgb(0,0,0)`) on the .hdr dark slate gradient (#0f172a→#1e293b). Contrast ~1:1 → invisible buttons. Only the 👤 account button had explicit `color:#fff` inline. Browser-tested 2026-05-10 at 390×844 via Playwright. Fix: added `color:#fff; background:rgba(255,255,255,0.12); border-radius:50%; width:32px; height:32px;` to the .dm-btn rule + a `:hover` opacity bump. Sibling-aligned with Geri v10.64.90 (which had the same bug class — slate-800 text on slate-800 gradient end-stop) and IM v10.4.24 (PR forthcoming, identical fix in src/styles/layout.css line 6). Trinity bumped 1.21.26 → 1.21.27.',
  ],
  '1.21.26': [
    '♿ Mobile out-of-bounds fix — `.skip-link` no longer uses `left:-9999px`. Browser-tested 2026-05-10 at 390×844 viewport via Playwright: legacy off-screen-positioning inflated `documentElement.scrollWidth` to 10385px (= 9999 abs(x) + 386 body width, exact). Body had `overflow-x:hidden` so users did not see lateral scroll, but `<html>` had `overflow-x:visible` so the phantom width still affected Lighthouse audits, pinch-zoom math, and any JS reading scrollWidth. Switched `src/styles/utilities.css` to the WCAG canonical visually-hidden clip pattern (`width:1px; height:1px; clip:rect(0,0,0,0); overflow:hidden; white-space:nowrap`); `:focus` restores `width:auto; height:auto; clip:auto`. Sibling-aligned with Geri v10.64.89 + IM v10.4.23. 3 new regression guards in tests/a11yContrast2026-05-10.test.js asserting (1) no `left:-\\d{3,}` literal in `.skip-link` rule, (2) `clip:rect(0,0,0,0)` present, (3) `:focus` restores width/height/clip.',
  ],
  '1.21.25': [
    '📚 Citation backfill batch 4 — 18 ti=18 (Mental Health) explanations gain a verified Goroll 8e Section XV (Psychiatric and Behavioral Problems) source citation. Each Q\'s chapter mapping was anchor-verified against locally extracted Goroll 8e PDF text BEFORE the citation was appended (per release-invariant §4); ≥2 distinct anchor hits required, all 18 cleared the threshold cleanly. Chapter distribution: 10 cite פרק 227 (Approach to the Patient with Depression, pp 5397-5459) — covers PHQ-9/PHQ-2 screening, suicide prevention + safety planning, lithium monitoring (renal + thyroid + thiazide/NSAID interactions), bipolar pharmacotherapy, SSRI cardiovascular profile + sexual dysfunction, duloxetine for depression+neuropathy, adjustment disorder with depressed mood; 3 cite פרק 226 (Approach to the Patient with Anxiety, pp 5354-5396) — adjustment disorder with anxiety/situational, panic disorder, PTSD; 2 cite פרק 233 (Approach to Eating Disorders, pp 5602-5635) — anorexia workup + hospitalization criteria; 2 cite פרק 232 (Approach to the Patient with Insomnia, pp 5565-5601) — delayed sleep phase + CBT-I stimulus control; 1 cites פרק 230 (Approach to the Patient with Somatic Symptom Disorder, pp 5536-5554) — factitious disorder (insulin self-injection). Format follows the existing v1.21.x Goroll citation form (`מקור: Goroll 8e פרק N.`). Append-only on q.e — no q.c, q.o, or pre-existing q.e content modified. Scope notes: 32 ti=18 uncited Qs total. 14 deferred — 1 dropped (pos=54 chronic fatigue syndrome — outside Section XV), 1 dropped post-advisor review (pos=339 LGBT-suicide-risk: Ch 227\'s 322 raw "suicide"+"depression" anchor hits were chapter-wide saturation, not actual sexual-minority content; deferred to Lerner/AFP), 7 Israeli psychiatric-law specific (involuntary admission per חוק טיפול בחולי נפש, ועדת בדיקה כפויה — Goroll doesn\'t cover Israeli law), 5 FM-Core IPV/abuse Qs that rely on Israeli child-protection + elder-abuse mandatory reporting (חוק הזקן, חוק הנוער 368ד). tests/citationCoveragePilot.test.js extended with MENTAL_HEALTH_BATCH (per-pos pin) + cumulative floor bumped 75 → 93. Methodology lesson for batch 5+: ≥2-anchor rule is too loose when anchors are common chapter-wide terms — future batches should use discriminating anchors (e.g. for LGBT-suicide use "minority stress", not "suicide"). Cumulative campaign progress: 16 (HTN/Lipid v1.21.22) + 27 (DM v1.21.23) + 32 (ti=26 EBM/law/family v1.21.24) + 18 (ti=18 Mental Health v1.21.25) = 93 of ~957 uncited Qs verified-cited (9.7% of remaining gap).',
  ],
  '1.21.24': [
    '📚 Citation backfill batch 3 — 32 ti=26 (EBM, Communication & Family Systems) explanations gain a verified Lerner 2025 source citation. First non-Goroll batch of the campaign — Goroll 8e doesn\'t cover ti=26 (no EBM/legal/family-systems chapters per pilot doc), so this batch pivots to the locally-staged Israeli FM textbook (ד"ר נטלי לרנר, 2025, 860pp, 329 chapters; index in lerner_chapters.json). 8 Lerner chapters carry ti=26 natively (filter chapters.ti===26): chap 247 תקשורת חברתית, 306 חוק ואתיקה, 316 הערכת תקפות מחקרים, 317 ניתוח בדיקות אבחנתיות, 318 ניסויים קליניים, 320 משפחה והיבטים פסיכוסוציאליים, 326 BATHE, 327 NURSE. Subagent-driven anchor-matching (proposal at .audit_logs/legal_policy_2026-05-10/lerner_ti26_proposal.json) classified each Q\'s sub-topic and required ≥3 distinctive Hebrew/English anchors AND sub-topic-correct chapter pick for HIGH confidence; only HIGH proposals shipped here. Chapter distribution: 24 Qs cite חוק ואתיקה (involuntary commitment, informed consent, confidentiality, ועדת אתיקה, מיופה כח, mandatory reporting), 6 cite ניתוח בדיקות אבחנתיות (PPV/NPV/sens/spec), 4 cite ניסויים קליניים (RCT design, ITT), 3 cite משפחה ופסיכוסוציאלי, plus singletons in הערכת תקפות מחקרים (RR/HR/CI). Format: `מקור: לרנר 2025 — "<chapter title>".` (parallels existing Goroll citation form). Append-only on q.e — no q.c, q.o, or pre-existing q.e content modified. 32 MEDIUM-confidence proposals NOT shipped (sampling found ~10% chapter-pick mismatches like pos=28 smoking-rate-bias mis-routed to law/ethics) — those need per-Q hand review. 9 LOW-confidence proposals correctly skipped (pos=22 Hebrew-transliterated stats not in Lerner, pos=824 mistagged HCM Q, etc). Cumulative campaign progress: 16 (HTN/Lipid v1.21.22) + 27 (DM v1.21.23) + 32 (ti=26 EBM/law/family v1.21.24) = 75 of ~957 uncited Qs verified-cited (7.8% of remaining gap).',
  ],
  '1.21.23': [
    '📚 Citation backfill batch 2 — 27 Diabetes (ti=6) explanations gain a verified Goroll 8e source citation. 21 Qs cite פרק 102 (Approach to the Patient with Diabetes Mellitus, pp 2893-2992) for management/complications topics; 6 Qs cite פרק 93 (Screening for Type 2 Diabetes Mellitus, pp 2742-2769) for diagnostic-criteria/screening/prevention topics. Each chapter mapping was anchor-verified against locally extracted Goroll 8e PDF text BEFORE the citation was appended (per release-invariant §4). 4 of 31 ti=6 uncited Qs intentionally SKIPPED — no anchor found in Goroll DM section: idx=112 (insulinoma — Goroll Ch 99 hypoglycemia territory), idx=485 (Fournier-gangrene SGLT2i side effect — FDA warning post-Goroll-8e), idx=505 (HIV+DM screening — Goroll has no HIV cross-ref in Ch 93), idx=886 (CGM Time-in-Range targets — modern ADA target not in Goroll body or refs). Format follows the existing pilot pattern ("מקור: Goroll 8e פרק N."). Append-only on q.e — no q.c, q.o, or pre-existing q.e content modified. tests/citationCoveragePilot.test.js extended with batch-2 pinning (DM_BATCH_CITATIONS) so the 27 specific cites cannot silently regress. Cumulative campaign progress: 16 (HTN/Lipid v1.21.22) + 27 (DM v1.21.23) = 43 of ~957 uncited Qs verified-cited (4.5% of remaining gap).',
  ],
  '1.21.22': [
    '📚 Citation backfill pilot — 16 HTN/Lipid (ti=2) explanations gain a verified Goroll 8e source citation. 12 Qs cite פרק 26 (Management of Hypertension), 4 cite פרק 19 (Evaluation of Hypertension). Each chapter mapping was anchor-verified against the locally extracted Goroll 8e PDF text (chapter pp 469-497 + pp 676-735) before the cite was appended — anchors include thiazide/glucose, hypertensive urgency, non-dipper / nocturnal BP, white-coat / masked HTN, DASH / lifestyle / aerobic exercise, sexual dysfunction by class, resistant HTN + OSA, beta-blocker in elderly. Format follows the existing v1.21.x pattern ("מקור: Goroll 8e פרק N."). No q.c, q.o, or pre-existing q.e content modified — append-only single sentence at the tail. New regression test (tests/citationCoveragePilot.test.js) pins the 16 specific Goroll citations + the v1.21.21 baseline so future content edits can\'t silently regress them. This is the first batch of a planned multi-session campaign — see .audit_logs/fm_citation_backfill_pilot_2026-05-10.md for the per-Q anchor evidence and the structural ceiling on remaining clusters (peds ti=23/24/25 ~158 Qs and EBM ti=26 ~73 Qs cannot be cited from Goroll because the textbook is adult-internal; Nelson + AFP indices needed for those).',
  ],
  '1.21.21': [
    '♿ Accessibility — v1.21.20 follow-up clearing 3 residual contrast violations surfaced by improved playwright re-audit (gradient-detection upgraded to extract first stop color, exposing real residuals masked by the prior fallback-to-white). Three minimum-code edits: (1) `.hdr p { color: #64748b }` → `#cbd5e1` — the header clock/subtitle (#hdr-sub) was rendering slate-500 on the .hdr dark gradient at 3.75:1; slate-300 fixes to ~12:1 AAA. (2) `.tabs button:not(.on) { color: #94a3b8 }` → `#64748b` — inactive bottom-tab icons + labels (📖 Library, 🩺 Track, etc.) were slate-400 on white at 2.69:1; slate-500 hits 4.65:1 AA. (3) `.quiz-meta__counter` `var(--color-fg-subtle)` → `var(--color-fg-muted)` — same pattern as v1.21.20 quiz-controls__label fix; the counter ("1 / 1139") was at 3.27:1, now 6.49:1 AAA. Trinity bumped 1.21.20 → 1.21.21. Closes the FM a11y campaign at 0 actionable contrast violations on the home screen.',
  ],
  '1.21.20': [
    '♿ Accessibility — port of Geri v10.64.82-87 a11y campaign patterns to FM. Live playwright re-audit on v1.21.19 found 5 actionable contrast violations (gradient-blindspot false positives on h1+dm-btns excluded). Six minimum-code edits: (1) <html dir="rtl"> added (was lang="he" without dir — same fix as Geri v10.64.82). (2) Skip-link bg #3b82f6 → #2563eb (3.68:1 → 4.78:1, WCAG AA pass). (3) Header "Family Medicine" subtitle inline color #d97706 → #92400e (3.07:1 amber-600 on yellow-50 → 7.14:1 amber-800 AAA). (4) #headerVer date span color #64748b → #cbd5e1 (slate-500 was 2.99:1 on the .hdr dark slate gradient → slate-300 6.13:1 strong AA). (5) Mishpacha-skin scoped override `html[data-skin="mishpacha"] .tabs button.on { color: #92400e }` — the geri-skin amber-700 pattern adapted for FM\'s mishpacha skin where --app-primary is amber-600 (#d97706) at 3.13:1 on white tabs. Dark-mode preserved via body.dark[data-skin="mishpacha"] override falling back to --app-primary. (6) .quiz-controls__label var(--color-fg-subtle) → var(--color-fg-muted) (3.27:1 → 6.49:1 AAA) — the subtle token (#8d8b80) is now reserved for decorative text only. Trinity bumped 1.21.19 → 1.21.20. Sibling-fork heads-up: same patterns may apply to Pnimit (also amber-themed in some surfaces) — separate audit needed before porting.',
  ],
  '1.21.19': [
    '🧹 questions.json mechanical formatting cleanup — 3 character-level fixes flagged by comprehensive quality audit: idx 829 trailing space on q stripped, idx 100 ("FEV1/FVC% >0.7  FEV1") and idx 353 ("של  סרטן") collapsed internal double-space to single. Strict autofix scope only — no q.c flips, no q.e fabrication, no q.o[] semantic edits. See IMPROVEMENTS.md for the full audit findings: schema completeness clean across 1061 Qs, per-tag distribution matches CLAUDE.md spec, no per-topic underflow, source-citation coverage 17% by broad pattern (textbook/society/MoH/guideline) — the bulk of unsourced explanations are pedagogically substantive but uncited, not missing.',
  ],
  '1.21.18': [
    '🪟 window.submitLeaderboardScore exposed alongside existing window.showLeaderboard — enables programmatic submit (chaos-bot leaderboard hook) without going through the open-modal-then-submit path that returns early when #leaderboard-box DOM is not mounted.',
  ],
  '1.21.17': [
    '🏆 Leaderboard write goes through SECURITY DEFINER RPC (mishpacha_leaderboard_upsert). Old direct-POST path silently failed — root cause was ts column type mismatch (bigint epoch ms vs ISO string sent by client), not the sb_publishable_* RLS issue the v3 chaos cleanup commit guessed at. RPC accepts ts as ISO string, casts server-side to bigint epoch. accuracy still computed server-side (real-typed in this app, not generated). 0 historical rows in mishpacha_leaderboard means no migration concern. Sibling-aligned with pnimit/shlav RPCs.',
  ],
  '1.21.16': [
    '🔑 שגיאות auth מציגות כעת קוד + הודעה במקום `שגיאה` ריק — port מ-ward-helper PR #100 (AccountSection.tsx ChangePasswordForm). _formatAuthError helper חדש ב-src/features/auth.js נקרא משלושת הזרימות (login / register / change-password) עם per-call contextMap לקודים מוכרים (invalid_credentials → "שם משתמש או סיסמה שגויים", invalid_password → "סיסמה ישנה שגויה", weak_password → "סיסמה חדשה חלשה — לפחות 6 תווים, לא רק ספרות.", network/http_5xx → "בעיית רשת. בדוק חיבור ונסה שוב."), נופל אחורה ל-`שגיאה (${code}): ${message}` עבור הכול. גם תיקן את ה-toast ב-_handleChangePassword מ-tone="info" ל-"error" (היה צובע כשלי סיסמה כחול-אינפו במקום אדום).',
    '🍞 Diagnostic breadcrumbs — הוספת console.info(`<flow>.start`/`.ok`) ו-console.warn(`<flow>.err`, code, message) ב-_handleLogin / _handleRegister / _handleChangePassword. נלכדים אוטומטית ב-debug console buffer (5-tap top-right) — מאפשר לדבג כשלי auth מהפקה ללא DevTools.',
    '🛡️ Internal — אין שינוי ב-engine, ב-shared/fsrs.js או בלוגיקת ה-RPC. UX-only port; +30 שורות ב-auth.js, אפס תוכן בחינה נגוע.',
  ],
  '1.21.15': [
    '🚀 SW install resilient + LCP fix (issue #25) — split the prod SW pre-cache into SHELL_URLS (atomic addAll, must succeed) + CRITICAL_DATA (Promise.allSettled, best-effort) + LAZY_DATA (cache-on-first-fetch only, NOT in install). Removed ~8 MB of chapter JSONs from the install path: harrison_chapters.json (2.3 MB), goroll_chapters.json (28 KB), nelson_chapters.json (16 KB), lerner_chapters.json (3.7 MB), data/afp_hari_index.json (1.97 MB), data/nelson_notes.json (21 KB) — all now SWR-cached on first Library visit. One transient 5xx on a chapter JSON no longer kills SW install. DATA_URLS preserved as [...CRITICAL_DATA,...LAZY_DATA] so the fetch handler\'s SWR matches still cover both sets. scripts/verify-dist-sw.cjs updated to extract the new 3-array layout.',
    '🐛 Dev sw.js URL manifest cleanup — dropped phantom paths that were cached but did not exist on disk: src/ui/tabs.js (HTML_URLS), shared/layout-primitives.css (CSS_URLS). Added 5 real-but-uncached modules: src/core/sw-update.js, src/core/tagMigration.js, src/features/post-login-restore.js, src/ui/settings-overlay.js. Added src/ui/quiz-view.css and src/styles/settings.css to CSS_URLS. (URL-list-only fix — prod dist/sw.js uses a separate build-time-generated manifest, so this bullet does NOT touch prod; the SHELL/CRITICAL/LAZY split above DOES ship to prod.)',
    '🛡️ Two new SW regression guards in tests/serviceWorker.test.js — (a) every entry in CSS_URLS resolves on disk (broader than the pre-existing src/styles/*.css-only check, which is exactly how the shared/layout-primitives.css phantom slipped past); (b) every *.js entry in HTML_URLS resolves on disk (the pre-existing test only checked *.html, missing JS phantoms like the dropped src/ui/tabs.js).',
    '♿ Lighthouse a11y issue #26 — added aria-label="התקדמות במבחן" to the role="progressbar" element in src/ui/quiz-view.js so screen readers announce the quiz progress sliver. Sweep of all role="progressbar" in src/ confirmed only this one site needed the fix.',
    '🧹 DEV-gated 14 console.* leaks across src/features/cloud.js (×6 — leaderboard submit/fetch + feedback submit + report save), src/ui/library-view.js (×6 — Goroll/Nelson/Nelson-notes/Lerner/AFP-הרי/Harrison chapter loaders), src/ui/settings-overlay.js (×1 — settings feedback non-ok warn), src/ai/client.js (×2 — proxy status + proxy error). Pattern matches existing codebase convention: `if(import.meta.env.DEV)console.X(...)` inline. Recovery diagnostics in core/data-loader, core/state, core/sw-update, core/utils, features/post-login-restore left intentionally unguarded (same rationale as the pre-existing app.js:426 IDB-init recovery log).',
  ],
  '1.21.14': [
    '🔑 _handleLogin reads api_key from auth_login_user response — saves a cloudRestore round-trip on flaky networks. Companion to the 2026-05-06 Supabase migration that added api_key column to app_users + auto-sync trigger from cloudBackup writes. _handleLogin now calls setApiKey(r.api_key) on successful login, AFTER setAuthSession (typeof guard for backwards compat). Empty string clears. Sibling-paired with Geri v10.64.50 / Pnimit v10.4.17 — all three apps share the auth_login_user RPC contract on Supabase project krmlzwwelqvlfslwltol.',
  ],
  '1.21.13': [
    '🛡️ P0 crash fixes from 7-hour chaos run on 2026-05-05 (5,135 pageerrors → 0). Three sibling-paired patterns:',
    '   (a) toLowerCase undefined defensive — 4,890 chaos crashes. One bad data record (missing topic/name/option text) poisoned every keystroke in src/ui/more-view.js + learn-view.js. Wrapped item.q/n.topic/n.notes/d.name with (field||\'\').toLowerCase(). Sibling-shared with IM v10.4.16.',
    '   (b) flashcards `f` undefined bounds-check — 245 chaos crashes. G.S.fci % G.FLASH.length when G.FLASH is empty/missing produces NaN → FLASH[NaN] → undefined.f throw. Added defensive early return in src/ui/learn-view.js when G.FLASH is empty/missing, plus FLASH[activeIdx]||FLASH[0] fallback for activeIdx out-of-bounds.',
    '   (c) startTimedQ G-binding — same root cause as IM v10.4.15. setTimeout closure now uses G.startTimedQ via setTimeout(()=>G.startTimedQ&&G.startTimedQ(), 100); app.js binds startTimedQ on G after import.',
  ],
  '1.21.12': [
    '☁️ Cloud-sync API key with user account — Anthropic API key (mishpacha_apikey localStorage) is now included in the cloudBackup() payload sent via backup_set RPC, and restored client-side in applyRestorePayload() during cloudRestore / post-login auto-restore. Effect: log in on a new device → API key arrives with the rest of your progress, no manual re-entry. Backwards compat: legacy backup rows without _apikey are ignored (typeof rowData._apikey === "string" guard) so existing users see no behavior change until their next backup. Sibling-paired with Geri v10.64.48 / Pnimit v10.4.14.',
  ],
  '1.21.11': [
    '☁️ Cloud backup write path migrated to SECURITY DEFINER RPC — Track-Q sibling propagation. v1.21.9 added the merge-duplicates upsert; v1.21.10 noted that "the 401 toast was already in place" — but the underlying 401 is real and present. Phase 2 (2026-04-29) migrated reads to backup_get RPC and dropped public SELECT, but writes were left on direct POST /rest/v1/mishpacha_backups. The new sb_publishable_* key format evaluates RLS context differently than the legacy anon JWT — direct INSERTs return PostgREST 401 / PG 42501 even with permissive policies (with_check=true, role=public). Geri v10.64.42 root-caused this and added backup_set SECURITY DEFINER RPC in shared project krmlzwwelqvlfslwltol. Same RPC powers all 3 sibling apps; Mishpacha now uses p_app:"mishpacha". Server-side now() eliminates client clock-skew. Tested e2e on Geri (200 OK + correct read-back).',
  ],
  '1.21.10': [
    '🐛 Feedback submission 400 fix — `submitFeedbackForm` (cloud.js), `submitSettingsFeedback` (settings-overlay.js) and `submitReport` (cloud.js, in-quiz wrong-answer report) sent `{message, app_version, diagnostics, context}` to PostgREST while the live `mishpacha_feedback` table only has `(id, type, text, ts, version, uid, created_at, status, processed_at, gh_issue_number, assessment)`. PostgREST rejected every submission with 400 "Could not find the X column". Renamed payload keys to match the schema (`message`→`text`, `app_version`→`version`, +`ts`+`uid`). For `submitReport`, folded `diagnostics`+`context` into the `text` field rather than expand the table.',
    '🔔 Surface server failures — both feedback paths now toast on non-ok response and on network failure ("⚠️ הפידבק נשמר מקומית, השליחה לשרת נכשלה"). The settings overlay no longer claims success when the server rejected the row. Local persistence still happens first, so users do not lose typed feedback either way.',
    '✅ Audit-only confirmation — cloudBackup 401 toast (Bug 1) is already in place at cloud.js:165-168 and `mishpacha_backups` schema matches the payload, so no change needed. Settings overlay sections (Bug 2) already use distinct `<section class="settings-section">` blocks with 👤/🔑/💾 emoji headers, so the API-key-vs-account confusion does not apply here.',
  ],
  '1.21.9': [
    '🩺 Citation audit + chaos hardening (port from Geri PR #146-151). Staged canonical Harrison 22e TOC at data/harrison_22e_toc.json (505 chapters extracted from the 4273-page PDF) and added 4-layer Harrison citation guard in tests/textbookChapters.test.js: bound (≤505), dict-membership, title-token-match, self-consistency. FM has only 0 Harrison + 5 Goroll + 2 Nelson-21e citations today, so the guard is mainly a regression net for future content ports from sibling repos.',
    '📚 Citation fix — idx=4 (cataract Q, 2020-Jun) cited "גורול פרק 203 עמוד 1388" but Goroll 8e Ch 203 is "Evaluation of Common Visual Disturbances: Flashing Lights, Floaters", not cataract. Cataract is Goroll 8e Ch 208 (Management of Cataracts). Page 1388 was the older 7e numbering and now wrong. Corrected to "גורול פרק 208 (Management of Cataracts)". Audit log: .audit_logs/harrison_title_consistency.json + .audit_logs/audit_harrison_title_consistency.py. Nelson 21e citations (idx=7 Ch 373, idx=8 Ch 612) flagged as edition-mismatch with the 22e TOC but left unchanged — those page numbers are correct for 21e and the explanations cite the correct edition explicitly.',
    '🛡️ Chaos hardening (3 patterns, 8 sites). (a) `navigator.clipboard.writeText(...)` calls in src/ui/app.js: `shareQ` and `shareApp` now have `.catch(()=>{})` so the silent NotAllowedError outside a user-gesture no longer leaves the share button half-state-frozen. (b) `setSelectionRange(...)` calls in src/ui/library-view.js (3 sites — Lerner/Nelson/AFP search inputs) and src/ui/app.js (1 site — global focus restore) now wrapped in try/catch so they no longer throw on `<input type="range">`/date inputs that some bookmarklets/extensions inject. (c) src/features/cloud.js `cloudBackup()` POST→409→PATCH dance replaced with a single POST + `Prefer: resolution=merge-duplicates` header so PostgREST does the upsert atomically (closes a small race window when two devices backed up simultaneously and removed a redundant network round-trip). Test tests/cloudFeatures.test.js updated to pin the new single-request behavior and the merge-duplicates Prefer header.',
  ],
  '1.21.8': [
    '🔤 remapExplanationLetters fix — explanations referencing options as bare labels (`**א\' שגויה**`, `ב\' נכונה`) were not remapped after option shuffle, only the explicit `תשובה X\'` form was. Fix: single-pass regex with two-branch alternation; mid-word gershayim (`מג\'ורי`, `ג\'נטיקה`) preserved via lookbehind. Same bug + fix as Geri v10.64.22 / IM v10.4.9. 7 new regression tests in tests/remapExplanationLetters.test.js.',
  ],
  '1.21.7': [
    '🎯 First structured exam-key audit for FM (2022-Jun batch only) — built dataset→IMA-PDF Q-num mapping using the 2026-05-03 cross-specialty bundle parser. FM bundle session naming is messier than IM/Geri (most non-2022-Jun sessions tagged "unknown Stage A" by the upstream parser), so the audit only covers 125 of 1061 Qs reliably. Net: 5 new c_accept additions for verified post-appeal multi-accept questions in 2022-Jun. The 90 single-accept disagreements + 1 conflicted multi-accept (idx=320) logged in .audit_logs/fm_audit.json + fm_skipped_for_review.json — NOT auto-flipped per the curator-override pattern.',
  ],
  '1.21.4': [
    '⚡ LCP perf — `<link rel="preload" as="fetch" crossorigin>` for data/questions.json (~7MB). The browser starts the fetch at HTML-parse time instead of waiting for the JS module graph to load and Promise.all() in src/core/data-loader.js to start it. crossorigin is required for as="fetch" even same-origin (default fetch credentials mode = same-origin). Ported from Geriatrics v10.63.7. Skeleton-card half of that fix not ported — FM data-loader blocks render on Promise.all, so renderQuiz never runs with empty G.QZ; skeleton would require a loader refactor (deferred to a separate change). Expected mobile LCP: -1 to -2s.',
    '🛡️ Internal — no engine, shared/fsrs.js, or test changes. HTML head + trinity bump only.',
  ],
  '1.21.3': [
    '🩹 תיקון מפתח תשובות — שאלת המטוריה מיקרוסקופית (2022-Jun ti=5, idx 447): התשובה הסומנה כנכונה (option 1, "להפסיק Dabigatran") סתרה את ההסבר עצמו ("אינה מחייבת הפסקת הטיפול"). על פי AUA Microhematuria Guideline 2020 §3, אין לייחס המטוריה לטיפול בנוגד קרישה ולוותר על הבירור; קבוצת סיכון גבוה (גיל >60 + עישון) מחייבת ציסטוסקופיה + CTU. תוקן ל-c=2 (בן 65 מעשן → ציסטוסקופיה) + c_accept=[2] + הסבר מפורט עם מקור.',
    '🛡️ Internal — אין שינוי ב-engine, ב-shared/fsrs.js או ב-tests. תיקון תוכן בלבד ב-data/questions.json[447].',
  ],
  '1.21.2': [
    '🧹 ניקוי מטא-דאטה ב-data/afp_hari_index.json — 16 מאמרי הר"י עם שנים שגויות (חלץ הראשון של 4 ספרות מתוכן ה-PDF במקום הכותרת) מתוקנים על-פי כותרת/שם-קובץ; 2 מאמרים בלא שנה מקבלים sentinel `null` במקום מחרוזת ריקה. סכמה חדשה: year הוא string|null ולעולם לא ריק.',
    '🎨 BIDI hygiene — שני בלוקים סטטיים ב-help-overlay (Quick Start + section template) מומרים מ-`dir="rtl"` ל-`dir="auto"`, להתאמה למוסכמה לרוחב הריפוזיטוריות (FamilyMedicine v1.3.4 BIDI hygiene pass).',
    '🧪 הרחבת בדיקות R2 — קובץ חדש (round2DeepCoverage.test.js) עם 40 בדיקות שמכסות: quiz-engine multi-tag intersection, study-plan DST/calendar-edge boundaries, service-worker manifest invariants, IndexedDB round-trip mock, Hebrew bidi numerics, mutation-resistance של isOk/allocateHours/defaultDailyQTarget. סך הבדיקות: 723 → 764.',
    '🔒 ביטחון — npm audit fix העלה את postcss מעבר ל-CVE GHSA-qx2v-qp2m-jg93 (XSS via unescaped </style>). transitive-only, לא משפיע על runtime של PWA.',
    '✅ 764 בדיקות עוברות, 0 כשלים, 0 פגיעויות.',
  ],
  '1.21.1': [
    '🧪 הרחבת בדיקות — שני קבצי vitest חדשים (afpTopicMap.test.js, fsrsBoundariesAndBidi.test.js) עם 50 בדיקות חדשות. הראשון מחבר את 23 התת-התמחויות ב-data/afp_hari_index.json עם 27 הנושאים בקווי-זוג מלאים (round-trip TOPIC_TO_AFP_SPECS ↔ AFP_SPEC_TO_TOPICS). השני מכסה את גבולות ה-FSRS (s≤0, t=0, ratings 1..4 clamps), ביידי-handling של מחרוזות עברית+אנגלית+ספרות.',
    '🗺️ תיקון מפה — 4 התת-התמחויות שהיו קוצצות (אא_ג, אונקולוגיה, כירורגיה, עיניים) מופות כעת לנושאי quiz רלוונטיים (22 — חירום במרפאה, 8 — המטולוגיה, וכו׳). תוצאה: כל 542 המאמרים ב-AFP/הר"י זמינים מנושאי quiz, גם ENT/oncology/surgery/ophth.',
    '🛡️ תיקון בדיקה — honestStats.test.js נכשל ב-Windows checkout (CRLF) כי regex דרש \\n\\}\\n. הוספת normalize ל-LF. רגרסיה תפוס בפועם הבא של ה-pipeline.',
    '✅ 723 בדיקות עוברות (מ-673), 0 כשלים.',
  ],
  '1.21.0': [
    '🐛 תיקון קריטי קומפליטרי ל-v1.20.0 — אם המכשיר במצב כהה ברמת מערכת ההפעלה אבל האפליקציה במצב Light, טקסט השאלה ופירוק הדיסטרקטורים נראו כקרם-על-לבן (בלתי-קריא לחלוטין). השורש: shared/tokens.css מכיל `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }` שנכנס לפעולה כש-OS כהה ו-`[data-theme]` לא נקבע במפורש על הדף. v1.20.0 גישר רק את body.dark/body.study — לא את התרחיש הזה.',
    '🩹 התיקון: `<html data-theme="light">` כברירת מחדל ב-HTML (מבטל את מדיה-קוורי לחלוטין על First Paint). JS מסנכרן `documentElement.dataset.theme` ב-toggleDark, toggleStudyMode, ובאתחול ראשון. תוצאה: light mode תמיד נשאר light אפילו כש-OS כהה.',
    '🪝 Internal — `_syncDataTheme()` helper חדש ב-app.js. אין שינוי ב-shared/tokens.css (קובץ byte-identical, off-limits). אין שינוי ב-quiz-view.js. 673 בדיקות עוברות.',
  ],
  '1.20.0': [
    '🐛 תיקון קריטי — טקסט השאלה היה כמעט בלתי-קריא ב-Dark Mode וב-Study Mode מאז v1.15.0 (28/04/26). השורש: quiz-view.css החדש (rebuild ב-v1.15.0) משתמש ב-CSS custom properties (`var(--color-fg)` וכו׳) המוגדרות ב-shared/tokens.css, אך הן מתחלפות רק כש-`[data-theme="dark"]` נקבע על ה-root. FM מחליפה מצב חשוך עם class על body (`body.dark`/`body.study`) — לא קבעה data-theme. תוצאה: --color-fg=#1a1916 (שחור-כמעט) על רקע כהה = טקסט שקוף.',
    '🩹 התיקון: הוספת bridge ב-quiz-view.css שמדריס את ה-CSS custom properties כש-body.dark או body.study פעילים. אין צורך לערוך את shared/tokens.css (זה קובץ byte-identical בין 3 ה-PWAs). מצב Study (סגנון נר חום, FM-only) מקבל פלטה מקבילה עם ערכי sepia מ-theme.css.',
    '📷 תיקון — כפתור "📷 צרף תמונה" חזר. ה-rebuild של v1.15.0 הוסיף img rendering ל-`q.img` קיים אך השמיט את כפתור-ה-attach אם אין img. עכשיו: כשאין תמונה (ולא במצב מבחן) מופיע כפתור attach + status indicator. כפתור הסרה (✕) חזר עם איקון מעוצב.',
    '🐞 תיקון — תמונות שהמשתמש העלה ל-Supabase לא נטענו אחרי refresh. השורש: ה-IIFE שטוען מ-localStorage (`mishpacha_q_images`) רץ בזמן module-load, ובאותו רגע `G.QZ===[]` (data-loader עדיין async). תוצאה: ה-loop איבד את כל הרשומות. עכשיו ה-IIFE ממתין ל-`G._dataPromise` לפני החלת המפה — עם fallback לסביבות test שבהן הנתונים כבר זמינים.',
    '🪝 Internal — `quiz-view.css` קיבל 4 קטגוריות חדשות: theme-bridge (body.dark/study → --color-* overrides), quiz-image-wrap, quiz-image-dep (warning surface ל-imgDep), quiz-image-attach. אין שינוי ב-shared/tokens.css. אין שינוי ב-quiz-view.js logic — רק UI affordances. 673 בדיקות עוברות.',
  ],
  '1.19.0': [
    '🧹 איחוד נווט — חמש לשוניות הפכו לארבע: Quiz / Library / Track / More. לשונית "Learn" התמזגה בתוך Library כתת-לשונית. Library כעת מכילה: Read (ספרים) · Cards (פלאשים) · Notes (סיכומי לימוד) · Drugs (תרופות). Mirror של Pnimit v10.0.',
    '⚙️ הגדרות עברו ל-overlay מסך-מלא — אייקון ⚙️ חדש בכותרת פותח עמוד הגדרות אחד במקום תת-לשונית במסך More. סדר ה-sections: Account · Study Plan · Theme (Light/Dark/Study) · 🔔 Reminders · API Key · Data · Feedback · About. Mirror של Pnimit v10.3.0.',
    '🎨 Theme picker מאחד — Light / Dark / Study (sepia) באותו card. Study Mode (סגנון נר חום, לקריאת לילה) נשאר ייחודי ל-Mishpacha; שני הכפתורים בכרטיס אחד שמסביר את המצב הנוכחי.',
    '🔁 Routing aliases — דפדוף ישן ל-`learn`/`study`/`flash`/`drugs` מנותב אוטומטית ל-`lib` עם תת-לשונית מתאימה. עומס legacy בעת `G.moreSub === \'settings\'` מנותב חזרה ל-`calc` (ההגדרות עברו ל-overlay).',
    '🪝 Internal — חדש: `src/ui/settings-overlay.js` (343 שורות, mirror של Pnimit), `src/styles/settings.css` עם תוספת `body.study` parity, `<div id="settings-overlay" hidden>` ב-mishpacha-mega.html, `data/tabs.json` הצטמצם ל-4 פריטים. `app.js`: ה-Learn-block הוחלף ב-redirect-to-Library; הגעת `goto-account` מהכותרת פותחת overlay במקום לדלג ל-More→Settings. אין שינוי בנתונים: 1061 שאלות, 7 sessions ללא שינוי.',
  ],
  '1.18.0': [
    '☁️ Auto-restore-on-login — מתחבר במכשיר חדש שאין בו עדיין נתונים? אנחנו מציעים לשחזר אוטומטית מהענן (תיבת דו-שיח אחת, שתי כפתורים: "שחזר" / "לא עכשיו"). הצעה מופיעה רק כש-(א) זה login, לא register; (ב) המכשיר ריק לחלוטין — qOk+qNo===0 ואין נתוני SR; (ג) קיים גיבוי בענן עבור שם המשתמש; (ד) לא ביקשנו את אותו דבר במכשיר הזה בעבר. סימון "לא להציג שוב" נשמר ב-localStorage לפי (מכשיר, שם משתמש), אז ההפעלה היא חד-פעמית גם אם בוחרים "לא עכשיו".',
    '🔌 Auth events — auth.js פולט כעת אירועי `mishpacha:auth` (CustomEvent על `window`) + API פנימי `subscribeAuthEvents(handler)`. פעולות: login / register / logout / change-password. מאפשר למודולים אחרים להגיב למעברי auth ללא תלות ב-UI. Mirror של ward-helper v1.32.0\'s `subscribeAuthChanges` — שמירה על עקביות ה-API בין 4 ה-PWAs.',
    '🪝 Internal — `cloud.js` מייצא כעת `peekCloudBackup()` (RPC backup_get ללא UI) ו-`applyRestorePayload(rowData)` (מיזוג G.S עם הגנת prototype-pollution דרך `filterRestorePayload`). `cloudRestore()` עבר refactor להשתמש ב-`applyRestorePayload`. New module `src/features/post-login-restore.js` + new test `tests/postLoginRestore.test.js` (16 cases).',
  ],
  '1.17.0': [
    '🐛 תיקון קריטי — Topic Heatmap הציג mastery גבוהה על נושאים שזה עתה ענית עליהם, גם אם רוב התשובות היו שגויות. השורש: הנוסחה ב-heatmap.js השתמשה ב-FSRS R בלבד, שהוא דעיכת זמן (R≈1 מיד אחרי כל ביקורת — נכונה או שגויה). חישוב חדש: per-card mastery = (ok/tot) × R. תשובה שגויה מורידה מאסטרי ל-0 מיידית; תשובות נכונות ישנות דועכות עם R. Fallback ל-hit-rate גולמי כשמצב FSRS חסר (legacy SM-2). Mirror של Pnimit v9.92.0.',
    '🐛 תיקון — Est. Score החזיר 60% מטעה כשרק נושאים בודדים נבחנו. השורש: הנוסחה הניחה 60% (neutral default) לכל נושא עם <3 תשובות. תיקון: נושאים עם <3 תשובות מודרים מהסכימה. מחזיר null כשפחות מ-3 נושאים יש להם נתונים — UI מציג "—".',
    '🪝 Internal — heatmap.js getTopicMastery() עודכנה. heatmap.test.js: 5 cases חדשים כולל regression test "wrong-just-now ≠ 100%". 643 בדיקות עוברות.',
  ],
  '1.15.0': [
    '🧱 Quiz tab rebuild from scratch — renderQuiz() main path replaced with semantic, class-driven HTML and ZERO inline style attributes. New src/ui/quiz-view.css owns the component layer (.quiz-stage, .quiz-question, .quiz-choices, .quiz-choice, .quiz-feedback, .quiz-actions); every dimension, color and radius resolves through var(--*) tokens — no hardcoded hex, no hardcoded px.',
    '✒️ Question stem — Frank Ruhl Libre at --text-xl, leading-snug, generous --space-8 block-margin. Choices are hairline-bordered cards with a leading-edge A/B/C/D mono chip; selected gets the accent border + soft-green wash, post-submit "correct/wrong/correct-unchosen/muted" states are encoded as data-state attributes (no ad-hoc class names).',
    '🪟 Reading column capped at min(640px, 100%) so lines stay readable; sticky action footer on mobile (Previous + Next) with a backdrop-blur band. Restrained motion: fade-in feedback panel over --motion-base, hover transitions over --motion-fast, all zeroed by prefers-reduced-motion.',
    '🔌 Behavioral preservation — every data-action name kept identical (pick / check-answer / give-up / next-q / prev-q / ai-explain / share-q / toggle-bk / toggle-qnote / wrong-reason / diff-rating / read-chapter / open-source / filter / filter-year / topic-select / start-mock / start-sd / start-oncall / start-pomo / start-mini-exam / wrong-review-clear). Event delegation in initQuizEvents() unchanged. Sudden-Death + on-call paths intentionally deferred to a follow-up.',
    '🧪 19 new tests in tests/quizViewMarkup.test.js — pin the new structure (.quiz-stage / .quiz-question / .quiz-choices / role=radiogroup / data-state=correct/wrong/correct-unchosen) and a regression guard that fails CI if any of the new component shells regrow inline style attributes. 622 → 641 passing.',
  ],
  '1.14.0': [
    '🎨 Editorial Clinical redesign — warm cream + forest green palette, Frank Ruhl Libre display serif (Hebrew + Latin), Heebo body. Hairline cards (no drop shadows), underline tab indicator that slides between active tabs, three-tier button system (primary accent fill / secondary hairline / ghost). Shared tokens v2 + new shared/layout-primitives.css used across Geriatrics + Pnimit + Mishpacha (byte-identical, same precedent as fsrs.js).',
    '🪧 Page header — slate gradient bar replaced with hairline-divided cream surface; "Family Medicine" eyebrow chip recoloured to forest-green-on-soft-green, version chip in monospace.',
    '📑 Tab bar (THE #1 win) — pill buttons → underline tabs. New module src/ui/tabs.js exports wireUnderlineTabs() with ResizeObserver + MutationObserver + window.resize wiring; indicator slides on tab change with a 220ms ease-out transition.',
    '🪪 Primary cards + buttons — .card now hairline-bordered + 24px padded with no shadow. .btn-p (primary CTA) takes the accent forest-green fill.',
    '♿ Accessibility: tabs keep role="tab" + aria-selected, 44px tap minimum preserved, prefers-reduced-motion zeroes the indicator transition. No behavior changes — pure re-skin.',
  ],
  '1.12.0': [
    '🗺️ Topic heatmap — 27-cell SVG grid colored by FSRS retention probability (R-value), 5-step Viridis colorblind-safe palette. Lives at the top of the Track tab; tap any cell to drill that topic. Replaces the legacy text-pill mastery map. New module src/ui/heatmap.js.',
    '❌ Wrong-answer review mode — new "Review wrong (N)" pill in the Quiz tab surfaces previously-wrong Qs sorted by recency × IMA topic weight. Persisted across reloads via G.S.wrongSet. Auto-evicts after 2 consecutive correct answers; manual Clear button on the in-mode banner. New module src/quiz/wrong-review.js.',
    '📚 Source-link in explanations — q.ref field is now a clickable chip that routes to the right reader (Goroll / Nelson / Lerner / Harrison / AFP). HARI guidelines and unknown sources render as plain text + 🔗 icon (no link). New module src/ui/source-link.js.',
    '🧪 +74 tests across 3 new files (heatmap, wrongReview, sourceLink); 548 → 622 passing.',
  ],
  '1.9.1': [
    '🪜 שבועות חזרה (1-6) קיבלו ייעוץ ייחודי לכל שלב — לפני, מסע 4-6 שבועות החזרה כולל 3 גורם תכנון "Mock #3" זהה במקום אסטרטגיות מובחנות. עכשיו: מוקים, תרגול ממוקד, עיבוי, וטייפר — שבוע סיום תמיד = הכנה אחרונה.',
    '🎯 יעד יומי שאלות מתואם אוטומטית לשעות לימוד — היה מקובע 25/יום, מיועד ל-19+ שעות שבועיות. עכשיו: hpw × 1.3 (8h→10/d, 12h→16/d, 16h→21/d). הצי שבועי מתואם לתקציב 30% של מנוע התכנית.',
    '🧪 Cross-language fixture tightened from ±0.05 → ±1e-9 (zero drift verified between JS port and Python reference for the Mishpacha slice). +11 tests for rampStages() / defaultDailyQTarget(); 537 → 548 passing.',
  ],
  '1.9.0': [
    '📅 תכנית לימוד בתוך האפליקציה — Settings → 📅 תכנית לימוד. בוחרים תאריך בחינה, שעות לימוד שבועיות (1-20), שבועות חזרה (1-6); המנוע מחלק את 27 הנושאים לפי תדירות אמפירית מ-1,061 שאלות עבר ובונה לוח שבועי. JS port verbatim של allocate_hours + schedule מ-auto-audit/scripts/generate_study_plan.py — fixture חוצה-שפות מאמת התאמה byte-identical (top-5 שעות + week_used לכל תא ±0.05). שמירה בענן דרך RPC SECURITY DEFINER (study_plan_upsert / study_plan_get); אורחים יוצרים תכנית מקומית עם רמז להתחבר. ייצוא .ics צד-לקוח לכל לוחות השנה (Google / Outlook / Apple) — אירועי שבוע + 3 מוקים + יום הבחינה. מיגרציית supabase 0002_study_plans.sql דורשת הרצה ידנית בלוח הבקרה לפני שהפיצ\'ר עובד למשתמשים מחוברים.',
  ],
  '1.8.0': [
    '👤 חשבונות משתמש — שם משתמש + סיסמה לחברי הצוות. Powered by Supabase pgcrypto bcrypt דרך RPC SECURITY DEFINER (auth_register_user / auth_login_user / auth_change_password). שם המשתמש הופך ל-uid: ההתקדמות, לוח התוצאות והגיבוי בענן עוקבים אחריך בין מכשירים. משתמשים אורחים (uid אקראי) ממשיכים לעבוד כרגיל — אין מיגרציה הכרחית. Lockout אחרי 5 נסיונות כושלים. Settings → 👤 חשבון.',
  ],
  '1.7.3': [
    '🚀 Deploy unblock — APP_VERSION + sw.js CACHE were not bumped in the v1.7.3 commit (only package.json was). deployConfigGuard.test.js failed → CI red → GitHub Pages skipped → live stuck at v1.7.2 since 2026-04-26 morning. This commit re-aligns the trinity so the actual code reaches users.',
  ],
  '1.7.2': [
    '🐛 callAI singleton AbortController fix (mirror of Geriatrics v10.38.2 + Pnimit v9.84.1). G._aiAbortController הוחלף ב-per-call AbortController + 30s safety timeout. בקשות מקבילות לא מבטלות זו את זו יותר. preventive port — לא דווח באג ב-Mishpacha אך אותו שורש קוד = אותו פגם.',
  ],
  '1.7.1': [
    '🐞 Debug console polish: report format עבר ל-=== DEBUG REPORT === בסגנון plain-text section headers (במקום markdown #/##), כולל URL ו-time ISO. הוספת window.__debug API: __debug.show() / __debug.report() / __debug.buffer / __debug.clear(). MAX_NETWORK 50→100, MAX_ACTIONS 50→100. לוגיקת click-action מזהה כעת data-action ו-onclick=fnName(...). tests/debugConsole.test.js + docs/DEBUG_CONSOLE.md סטנדרטי לכל שלושת ה-PWAs.',
  ],
  '1.7.0': [
    '🐛 Built-in debug console: 5 הקשות ברצף (תוך 3 שניות) על הפינה הימנית-עליונה של המסך פותחות panel דיבוג חי. מציג: APP/SW versions, מצב נוכחי (tab/libSec/pool/qi/QZ), 10 שגיאות אחרונות עם stack traces, 50 שורות console (בצבעים לפי level), 20 קריאות fetch אחרונות (status+ms+URL), 30 פעולות משתמש אחרונות. כפתור "📋 Copy" מעתיק הכל כ-markdown ללוח. מצמצם את צורך USB-debugging מהטלפון.',
    '🪝 Hooks: src/debug/console.js — first import ב-src/ui/app.js כך ש-console.{log,info,warn,error,debug} + window.fetch + onerror + unhandledrejection נעטפים לפני יתר ה-modules. document click capture (capture phase) רושם target+data-action+text. window.__debug_open() זמין מ-DevTools console.',
    '🔧 Sibling-port (matches Geriatrics v10.38.0 + Pnimit v9.83). אין שינוי בלוגיקת האפליקציה — רק תוספת observability טהורה. Bundle size delta ≈ 7KB gz.',
  ],
  '1.6.1': [
    '🧹 Parser-bleed historical audit (mirrors Geriatrics v10.34 + Pnimit v9.81). The shared IMA Hebrew RTL PDF parser had a known bleed bug — when a next-Q marker (`<digit>.`) failed to render cleanly, the parser silently concatenated adjacent questions, wadding next-Q stem fragments into the previous Q\'s option D.',
    '📊 Scan results across the 7 past-exam tags (2020/2021-Jun/2022-Jun/2023-Jun/2024-May/2024-Sep/2025-Jun, 950 Qs total): 0 next-Q-stem bleed pattern hits, 0 footer-cruft hits, 1 over-length option (idx 550, 2023-Jun, ti=26). Investigation: legitimate 4-patient comparison Q (home-hospitalization criteria, 2020 IL position paper) — all four options are clinical vignettes by design (lengths 176/256/200/176). Whitelisted, no surgery needed.',
    '🛡️ tests/parserBleedGuard.test.js — 3 locks against future regressions: (a) no past-exam option contains next-Q-stem bleed pattern after pos 30, (b) no past-exam option contains page-footer cruft (date+שלב), (c) no past-exam option exceeds 250 chars (idx 550 whitelisted). \'FM-Core\' tag intentionally excluded — curated content, not parser output.',
    '🏷️ BUILD_HASH 1010q-v1.5.0 → 1061q-v1.6.1 (corrects drift; v1.6.0 added +51 FM-Core but BUILD_HASH stayed at v1.5.0\'s 1010-Q baseline).',
  ],
  '1.5.0': [
      '🩺 Content sprint — +60 FM-Core Qs filling 6 syllabus gaps from v1.4.5 audit:',
      '   • Cancer screening (+12, ti=20): mammogram/colono/Pap/PSA/LDCT — IL MOH + USPSTF',
      '   • Vaccines / immunization (+12, ti=13): IL pediatric schedule + adult 65+ + pregnancy + travel + immunosuppressed',
      '   • Contraception (+10, ti=14): LARC, COC absolute CIs (smoking/migraine-aura/VTE), emergency contraception, postpartum, mature minor',
      '   • Adolescent / HEEADSSS (+10, ti=25): confidentiality framework, NSSI vs SI, bulimia, PrEP, IPV in teen dating, gender dysphoria, adolescent depression',
      '   • Family violence (+8, ti=18): IPV with controlling partner, elder abuse mandatory reporting, child abuse Form 223, post-rape protocol',
      '   • STI screening (+8, ti=13): <25 women, MSM 3-site, pregnancy panel, GC treatment per CDC 2020, BV diagnosis, primary syphilis',
      '🏷 t=\'FM-Core\' tag for textbook content (won\'t appear in EXAM_YEARS-filtered pools but available in all-mode + topic-filter)',
      '📊 950 → 1010 Qs (+6.3%); ti=13 IF/Vaccines: 30→50; ti=20 Prev: 29→41; ti=25 Adolescent: 18→28; ti=18 Mental: 24→32',
    ],
  '1.4.5': [
    '🎯 Audit-driven AI-Hard seed expansion +15 Qs (63→78), targeting the three high-weight-low-reference topics flagged in v1.4.4 coverage audit: ti 9 Rheum/MSK (+5, ratio was 4.36), ti 24 Peds-Acute/Infect (+5, ratio 6.25), ti 3 Pulm (+5, ratio 6.50). LBP red flags, knee OA ACR 2019, rotator cuff, gout ULT ACR 2020, RA window, FWS UTI priority, AOM <2y, strep testing, Kawasaki IVIG, infant meningitis empiric Abx, COPD GOLD 2024 ABE, PE Wells, asthma SMART GINA 2023, CAP CURB-65, Fleischner.',
    '🩻 Distractor autopsy gate in extend_seed_v145.mjs — validator rejects any Q where correct option is uniquely longest. Caught 7 anti-patterns on first pass before merge.',
    '📈 Total corpus: 950 base + 78 seed = 1028 Qs (was 1013).',
    '📒 Lerner reader sanity — no changes, still shipped as v1.4.4.',
  ],
  '1.4.4': [
    '📒 Lerner 2025 integrated as 6th Library tab — full 860-page Hebrew "סיכום רפואת המשפחה 2025" (Dr. Nataly Lerner) split into 329 topic-tagged sections (3.58 MB). Searchable, topic-filterable (27-topic taxonomy), inline chapter reader with prev/next + drill-topic button. Adds native Hebrew prose coverage where AFP/הר"י English abstracts were the only non-Q source.',
    '📊 Coverage audit (docs/coverage_audit_v144.md): 0 🚨 ZERO topics, 2 \'ok\' (ti 26 EBM ratio 4.00, ti 9 Rheum/MSK ratio 4.36), 25 ✅ rich. Lerner closed the gap most on HTN/Lipids (+12), GI (+12), Heme (+13), Peds-Newborn (+22).',
    '🏗️ build.sh + sw.js updated to cache lerner_chapters.json as first-class data asset alongside Goroll/Nelson/Harrison chapter indices. Cache bumped mishpacha-v1.4.3 → v1.4.4.',
  ],
  '1.4.3': [
    '🔥 AI-Hard seed expansion 39 → 63 Qs. +16 Nelson-sourced Peds hard MCQs (new AI-Hard-N tag, Chs 13/22/40/50/61/78/84/94/114/137/167/185/225/400/546 — kawasaki, bronchiolitis, DKA, meningitis, Kocher criteria, HSP, JIA, etc). +8 IMA-weighted gap-fill Qs (AF/DOAC, rotator cuff, statin myopathy, HRT window, NNT, PPV, geri pain ladder, GERD alarm features).',
    '🔗 Every AI-Hard Q now carries `ref` (Goroll chapter / AFP article / Nelson chapter) and AFP-tagged Qs also carry `ref_slug` — the UI can deep-link a wrong-answer banner straight to the source article. 63/63 refs populated (was 0/39).',
    '🎯 Track tab: new smart "Drill Your Weakest" card. Composite score = accuracy gap × coverage gap × IMA exam weight — always surfaces the single highest-leverage next topic, even when no single topic is below the 65% Rescue threshold. Cold-start aware: <10 Qs answered → shows 15-Q calibration drill instead of a bogus pick.',
    '🩻 Distractor autopsy v1.4.3: patched 9 Qs (23/25/26/27/28/30/31/32/34) that had the "correct_longest" anti-pattern — distractors rewritten with parity-length plausible clinical detail so option length no longer leaks the answer. 0 anti-pattern findings on the full 63-Q seed.',
    '🛡️ RLS sanity pass on shared Supabase (krmlzwwelqvlfslwltol): all 18 public tables have RLS on. Documented: 3 zero-policy tables are intentional service-role-only (app_config, toranot_config, toranot_patients_backup). P1 finding filed — proxy_rate_limits ALL qual=true public is a rate-limit bypass, cross-repo fix deferred pending Toranot coordination.',
    '📊 Syllabus coverage audit: 1013-Q corpus drifts ≤17% from IMA target on every topic (0 undercovered at 30% threshold). Near-margins to watch: Addictions (ti19 -30%), Thyroid/Mental Health (-17%).',
    '📈 Total corpus: 950 base + 63 seed = 1013 Qs.',
  ],
  '1.4.2': [
    '🔥 AI-Hard seed expansion 32→39 Qs — now covers all 27 topics (was 20/27). Added: HF quad-pillar/ARNI swap (ti 1), BCC Mohs H-zone indication (ti 11), anaphylaxis biphasic monitoring duration (ti 12), BPH combo therapy by gland size (ti 16), AUD naltrexone first-line (ti 19), opioid conversion morphine PO→fentanyl patch (ti 21), NNT from ARR (ti 26). Each with 5+ sentence explanation + structured src field.',
    '🏷️ Back-filled "src" field on all 39 seed Qs — AI-Hard-G → Goroll 8e / AI-Hard-AFP → AFP/הר"י review. Future Q-quality tooling can now filter/cite by source.',
    '📊 Total corpus: 950 base + 39 seed = 989 Qs.',
  ],
  '1.4.1': [
    '📝 Nelson notes: added 20th high-yield chapter — Ch 185 Childhood Asthma (NAEPP/GINA stepwise, SMART, exacerbation ED tiers, action plan). Fixes v1.4.0 CHANGELOG overclaim of "20 chapters" when only 19 shipped.',
  ],
  '1.4.0': [
    '📝 Nelson tab: 20 high-yield chapters now ship with hand-crafted Hebrew board notes (data/nelson_notes.json) — jaundice, pneumonia, AOM, febrile seizure, bronchiolitis/RSV, asthma, DKA, enuresis, UTI, anemia, leukemia, meningitis, strep pharyngitis, Kawasaki, abuse, development milestones, immunization, ADHD, obesity, lead. Inline "📝 הערות" per-row button next to the existing AI Summary / AI Quiz buttons — expands the notes card right under the chapter; ✨ badge flags chapters that have them.',
    '🔥 AI-Hard seed: 32 hard-level Hebrew board MCQs merged at build time into questions.json (base 950 + seed 32 = 982 total). 15 tagged AI-Hard-G (Goroll 8e decision-rule/threshold Qs) + 17 tagged AI-Hard-AFP (AFP SORT-A/B reviews). Quiz tag filter gets two new red-styled pills "🔥 Hard-G" and "🔥 Hard-AFP".',
    '🧰 scripts/gen_ai_hard.mjs — manual LLM generator (claude-sonnet-4-6, Anthropic API) to expand the seed from Goroll chapters + AFP/הר"י articles. Writes to ai_hard_seed.generated.json for human review before merge into ai_hard_seed.json. Not on the build path.',
    '🏗️ build.sh now merges data/ai_hard_seed.json into dist/data/questions.json post-Vite + caches data/nelson_notes.json in sw.js. Source-of-truth questions.json stays clean; seed ships only in the built bundle.',
  ],
  '1.3.4': [
    '🔤 BIDI hygiene pass — .heb class no longer force-sets direction:rtl (was forcing English content to render RTL inside Hebrew-font containers). Now uses unicode-bidi:plaintext + text-align:start, so each paragraph\'s base direction is computed from its own first strong character per the Unicode Bidi Algorithm. Hebrew stays right-aligned, English left-aligns, mixed-majority content renders the way the content dictates.',
    '🔤 Quiz chrome — AI-flag banner, imgDep banner, teach-back textarea, teach-back header span: dir="rtl" → dir="auto" + unicode-bidi:plaintext. Interpolated eFlag text wrapped in <bdi> so English error strings don\'t reorder into surrounding Hebrew.',
  ],
  '1.3.3': [
    '👶 Nelson Library tab now loads like Goroll — 1-tap on a chapter opens the PDF directly (Drive, with #page=N deep-link when a page number is present in nelson_chapters.json). Removed the shell-intermediate reader view; AI Summary (📝) and AI Quiz (🧠) are now small inline per-row buttons, non-blocking. The UI progressively upgrades: if a chapter gets a {file} field it serves from local nelson/, if {page} it Drive-deep-links, else Drive root.',
    '🧹 Dead state removed — G.nelChOpen, open-nel-chapter, close-nel-chapter actions purged along with the auto-AI-summary-on-open workaround (was only needed because the shell had no body text).',
  ],
  '1.3.2': [
    '🔑 Rotated SUPA_ANON from legacy JWT anon to new-format publishable key (sb_publishable_*) — matches § B Toranot, § D Geriatrics, § E Pnimit on the shared Supabase project. Drift-prevention comment added.',
  ],
  '1.3.1': [
    '🔇 DEV-gated 3 console.log leaks (data-loader × 2, sw-update × 1) — no more production console noise on data load / cache cleanup.',
    '🧼 Audit pass clean: 27 topics all ≥3 Qs, 950-Q corpus, BUILD_HASH tracks APP_VERSION, regression guards green.',
  ],
  '1.3.0': [
    '🚨 FORK-BUG REMEDIATION (CRITICAL DATA CORRECTNESS FIX) — Discovered that 5 of 7 exam sessions had been ingested from Internal Medicine PDFs, not Family Medicine, due to copy-paste from the Pnimit fork during initial setup. Affected: 2021-Jun, 2022-Jun, 2023-Jun, 2024-May, 2024-Sep. Users had been studying ~593 Internal Medicine board questions while believing they were Family Medicine.',
    '📚 Re-ingested all 5 polluted sessions from correct FM PDFs via Sonnet-4.5 image-based extraction (~$11, 30 min). Each session anchored on official IMA post-appeal answer key. Result: 800 fresh FM Qs validated, 65 multi-accept correctly captured (incl. 9 invalidated-after-appeal where IMA accepted all 4 options). Net corpus 943 → 950.',
    '✨ 2025-Jun cosmetically refreshed — content was already FM (someone had imported correctly from another source) but PDF was IM. Replaced PDF with the real IMA 2025-Jun FM PDF + re-extracted Qs for stem/option consistency.',
    '⚖️ EXAM_FREQ + IMA_WEIGHTS recalibrated for true 950-Q FM corpus. New shape reflects real FM exam emphasis: Peds-Acute 12% (was 4%), MSK 11% (was 8%), EBM 8% (was 3%), Geriatrics 5%, Women\u05f3s Health 6%. Old weights were tuned on IM-polluted data and would have biased Rescue Drill / weakest-topic detection toward IM topics.',
    '🛡️ Per-session count locks updated: 2021-Jun 149→150, 2022-Jun 147→150, 2023-Jun 147→150 (gained back the dropped Qs), 2025-Jun 150 (refreshed). 2024-May 100, 2024-Sep 100, 2020 150 unchanged.',
    '📂 Replaced 18 PDFs in exams/ with verified FM versions (questions + answers + images + references for each session). All 7 session PDFs now confirmed "רפואת המשפחה" not "רפואה פנימית".',
    '🗝️ Canonical answer keys regenerated for 6 sessions from the new IMA PDFs. Multi-accept and invalidated-after-appeal markers preserved.',
  ],
  '1.2.16': [
    '💊 Drugs tab rebuilt for Family Medicine — expanded from 12 geriatric-leaning entries to ~46 FM essentials with pregnancy category (A/B/C/D/X), renal dosing (CrCl cut-offs), and pediatric dosing per row. Color-coded Preg badges, BIDI-safe (dir="auto" + <bdi>).',
    '🧮 Calc tab rebuilt for FM — added BMI, HAS-BLED, CURB-65, Centor/McIsaac, Wells DVT, PHQ-9, GAD-7, HEART. Removed inpatient-only PADUA. Defaults tuned to FM patient (age 60 / wt 70 — was geriatric 75/55).',
    '🎯 Mock Exam upgraded to 150q/3h — matches real שלב א׳ format. By-year mode now pulls up to full 150 from that exam tag. Classic and realistic modes unified, both produce per-topic breakdown.',
    '🔗 Q ↔ Article cross-linking — after revealing an answer in Quiz, related AFP/הר"י articles for that topic appear inline (one tap opens). Article reader footer shows practice past-exam Qs from the same topic.',
    '📅 Daily Contract banner — Quiz tab now opens with a 3-item daily plan: Due reviews (FSRS), Weak drill (rescue pool from weakest topics), Required reading (1 AFP/הר"י article from weakest topic). Deterministic daily pick; resets each calendar day.',
  ],
  '1.2.15': [
    '🔍 Option-level audit pass — Sonnet image-based diff against original 2020 PDF flagged 29 candidate option corrections; 18 applied (clear typo/wording fixes), 11 skipped (Q5 cataract revert hallucinations + length anomalies). Notable real fixes: Q26 runner knee pain options ("בישוב"→"בכיפוף"), Q40 gout aspiration option (was gibberish), Q90 impetigo Tx duration (7→14 days), Q96 lung nodule follow-up interval (6mo→1yr per Fleischner), Q142 breastfeeding evaluation options. ~$0.50.',
  ],
  '1.2.14': [
    '🩺 Spot-check fixes for 2020 Q1-5 — the v1.2.12 stem polish corrupted some option-level details. Fixed: Q1 OSA option text ("יקיצות" instead of "נקיעות"; "ירידת לחץ דם" instead of "ידיעה"). Q2 Glaucoma → restored Hebrew name "ברקית" + fixed "עובי הקרנית" + "פונדוס" typos. Q4 HbA1c → "מהאוכלוסיות" instead of polish-drift "מהמצבים". Q5 cataract → restored 4 distractor ages (21/80/18/48; polish had homogenized to 75/80/50/60) + rewrote explanation to match official c=א.',
  ],
  '1.2.13': [
    '⚖️ EXAM_FREQ + IMA_WEIGHTS recalibrated for the new 943-Q corpus (was tuned for 884 Qs). Notable shifts: Pulm 10→9, GI 11→10, Heme 9→8, Endo-DM 2→3, Women\u05f3s 1→2, EBM 2→3. Readiness/est-score and weakest-topic detection now reflect the real distribution.',
    '🛠️ weekly-audit.yml fix — ti range guard was 0..23 (Pnimit-era) but Mishpacha has 27 topics (0..26); the audit had been silently failing every Sunday on every Q with ti≥24. Also bumped Q-count floor 800→940. CLAUDE.md updated to v1.2.12 state.',
  ],
  '1.2.12': [
    '✨ 2020 stems polished — Sonnet text-pass cleaned residual OCR/reconstruction typos on all 150 Qs (meaning unchanged, readability up). Examples fixed: "בלי\u05f3צו אמא" → "בליווי אמה", "מוחסרת הכרה" → "מחוסרת הכרה". ~$0.40.',
    '🎯 Q21 (16yo teen, confidentiality + school performance drop + depression) re-classified ti 26 → 25 (Peds Adolescent & Mental Health). Topic 25 was empty after initial AI classification; this Q is the textbook case for it.',
  ],
  '1.2.11': [
    '📚 2020 exam re-ingested — from 91 dirty Qs (wrong PDF: was accidentally Internal Medicine 2020) to 150 clean Family Medicine 2020 Shlav A Qs with post-appeal answer key, pre-populated explanations citing Goroll/Nelson/AFP. Total corpus 884 → 943.',
    '🗂️ Nav trimmed — Learn tab removed; Study/Cards/Drugs folded into the More tab alongside Calc/Search/Notes/Chat.',
    '📄 Articles consolidated — one tab now holds AFP reviews, הר"י guidelines, AND the syllabus required-reading list (Appendices ב\'/ג\'/ד\'/ה\'). New "📚 Syllabus" kind filter.',
    '🔤 BIDI overhaul — all AFP/הר"י rendering now uses dir="auto" + unicode-bidi:plaintext so mixed Hebrew/English text (titles, citations, SORT recs, summaries) lays out correctly without flipping.',
    '🔗 Links inside RTL paragraphs wrapped in <bdi> so URLs don\'t hijack paragraph direction.',
  ],
  '1.2.10': [
    '✂️ Harrison tab trimmed from 69 → 42 chapters (41% JSON shrink, 3.97 MB → 2.35 MB). Dropped 27 ICU/inpatient/specialist topics (shock, sepsis, oncologic emergencies, vasculitis, GBS/MG, ICH, encephalitis, IE, osteomyelitis, critical care, sarcoidosis) — Goroll 8e covers what Family Medicine needs at the outpatient level.',
    '🎯 TOPIC_REF rebuilt for FM — was Pnimit-era mapping with wrong chapters per topic (e.g. topic 14 Women\'s Health → Ch 437 Cerebrovascular). Now all 27 FM topics point to the correct primary Goroll 8e chapter.',
    '📖 "Open" button on weakest-topic card now routes to Goroll tab (primary source) instead of Harrison (cross-ref only). Same for Study-Plan chapter open action.',
    '🏷️ BUILD_HASH drift fix — was stuck at \'885q-v1.2.6\' while APP_VERSION advanced through 1.2.7, 1.2.8, 1.2.9. Now tracks with APP_VERSION.',
  ],
  '1.2.9': [
    '🛡️ 10 Pnimit-ported regression guards — catches every ingestion bug we shipped: ð-mojibake, Latin-1 adjacency to Hebrew, Hebrew+digit missing-space, wrong-side ?heb, adjacent-Q fragment bleed, per-tag + cross-tag duplicates, c-vs-explanation drift, stem/option length invariants.',
    '🗑️ Dropped Q[478] (2023-Jun Q133 spirogram, empty options unrecoverable). Fixed residual mojibake in Q[650] (ESAs CKD) explanation missed by reconstruct_mojibake.py.',
    '📉 Count lock: 2023-Jun 148→147, total 885→884.',
  ],
  '1.2.8': [
    '🔤 Reconstructed 191 mojibake Qs (CP1255 ð corruption) across 2024-May + 2024-Sep canonical exams.',
    '🧪 Added 108 tests covering tagMigration, utils, constants, srActivity, suddenDeath (+ coverage analysis workflow).',
    '🛠️ Deploy fix — build.sh hardened against missing optional dist directories (articles/, questions/, syllabus/).',
  ],
  '1.2.7': [
    '🔑 Fixed 114 c-vs-explanation mismatches — defended the official IMA answer key across the canonical 885-Q corpus where parse had drifted.',
  ],
  '1.2.6': [
    '👶 Nelson 22e tab now shows a searchable index of all 165 required chapters (Appendix א\').',
    '🔎 Filter by title or chapter number — useful when cross-referencing a peds topic from Goroll.',
    '📌 Drive link stays prominent (PDF is 167 MB — too big to bundle).',
    '📗 Harrison\'s tab header now flags it as cross-reference only — Goroll 8e is the primary source for P0062-2025.',
    '🛠️ Build fix — scripts/build.sh now copies goroll_chapters.json + nelson_chapters.json into dist/ and caches them in the prod SW (Goroll tab was silently 404ing post-deploy).',
  ],
  '1.2.5': [
    '🐛 Runtime crash fix — close-update-banner wrote to undefined UPDATE_DISMISS_KEY (ReferenceError silently broke the banner). Now routes through exported dismissUpdate() in sw-update.js.',
    '🏷️ Canonical exam tag 2024-Sep everywhere — quiz filter pills, track trend card, engine mock-picker, tagMigration map were all keyed to the non-existent 2024-Oct (produced empty pools).',
    '🔄 tagMigration sentinel bumped V1→V2 so users already migrated with Oct24→2024-Oct get re-remapped to 2024-Sep on next load.',
    '🤖 Dead AI-badge logic fixed — search/quiz cards were checking q.t===\'Harrison\' (never true in this corpus). Switched to q.t===\'AI-Ch\' (the tag actually assigned by library-view addChapterQsToBank).',
    '🇮🇱 CHAT_STARTERS replaced with family-medicine prompts (BP targets, HbA1c, adult vaccines, chest-pain triage, colonoscopy screening, perinatal depression) — were still geriatric (dementia/Beers/frailty/falls).',
    '💬 Chat textarea placeholder: "ברפואה פנימית" → "ברפואת משפחה".',
    '🧬 AI explain + autopsy prompts rewritten for family medicine (were "הרפואה הפנימית" / "Internal medicine board exam").',
    '🔤 Bidi isolation on mixed Hebrew/English strings — unicode-bidi:plaintext + <bdi> (help overlay, chat box, search card previews). English no longer visually flips inside RTL paragraphs.',
    '📣 Help overlay cleanup — Library "פרקי Harrison" → Goroll primary + Nelson + Harrison cross-ref; Articles "10 NEJM/Lancet" → "P0062-2025 required readings"; Quick Start "Library → Harrison" → "Library → Goroll".',
    '🛡️ sanitize() now wraps Q preview text in search cards (defensive, was raw).',
  ],
  '1.2.4': [
    '📄 Articles tab rewired for family medicine — 72 P0062-2025 required readings (Appendix ב/ג/ד/ה).',
    '🇮🇱 56 הר"י Israeli guidelines/position papers 2018-2025 grouped by year.',
    '📚 8 Patient-Centered Care + 7 Family + 9 EBM (JAMA Users\' Guides) articles.',
    '🔗 AFP: dynamic per-topic browsing via aafp.org/afp (link-out, not bundled).',
    '🧹 Branding leaks purged: app header, AI chat system prompt, teach-back rubric, chapter summarizer, quiz-generator, share-app text, syllabus link (P0064→P0062).',
  ],
  '1.2.3': [
    '➕ 3 Qs recovered via parallel pipeline — 882→885 (2022-Jun +1, 2024-May +1, 2024-Sep +1).',
    '🩹 Clinical answer-key corrections for the 3 recovered Qs: Q77 (AST:ALT hepatitis), Q42 (denosumab rebound), Q90 (IPF PFT pattern).',
    '🔒 Per-tag count lock test added — silent re-ingestion drops now fail CI.',
  ],
  '1.2': [
    '📚 882 Qs now in the bank — 7-session corpus (2020 + 2021-Jun through 2025-Jun).',
    '🤖 All Qs AI-classified into 27 topics with Hebrew explanations (Sonnet 4.5).',
    '⚖️ EXAM_FREQ + IMA_WEIGHTS recalibrated from real IMA distribution — readiness score now reflects actual topic weighting.',
    '🎯 Multi-accept answers (c_accept) preserved per IMA appeals across all sessions.',
    '🔄 Parallel ingestion pipeline validated — same pattern as Mishpacha Mega.',
    '📖 3 official reference PDFs bundled: P0062-2025 syllabus, sources list, AHA CPR guidelines.',
  ],
  '1.1': [
    '📝 First 150 Qs ingested — full 2025-Jun IMA exam.',
    '✅ All 150 Qs AI-classified into the 27 topics with Hebrew explanations (Sonnet 4.5).',
    '🎯 10 multi-accept questions preserved via `c_accept` array.',
    '🔧 Parser fix: Hebrew words ending in א/ב/ג/ד no longer false-match as option markers.',
    '🗂️ Exam ingestion pipeline ported from Pnimit (scripts/exam_audit/).',
  ],
  '1.0': [
    '🎉 Mishpacha Mega v1.0 — Family Medicine Shlav A board prep launches.',
    '📚 27 topics covering P0062-2025 syllabus (Goroll 8e + Nelson 22e + AFP + Israeli guidelines).',
    '📄 7 past exam PDFs staged, 800+ gold-standard answer keys extracted.',
    '🎨 Amber/teal skin to visually distinguish from Pnimit (blue) and Geriatrics (teal).',
    '🔗 Shares engine, FSRS, Supabase project, and AI proxy with sibling PWAs.',
  ],
};
