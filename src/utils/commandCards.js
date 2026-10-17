const L = (en, ar) => ({ en, ar });
const sel = (key, label, options, extra = {}) => ({
  key,
  label,
  type: "select",
  options,
  ...extra,
});
const num = (key, label, min, max, extra = {}) => ({
  key,
  label,
  type: "number",
  min,
  max,
  ...extra,
});
const txt = (key, label, extra = {}) => ({
  key,
  label,
  type: "text",
  ...extra,
});
const dt = (key, label, extra = {}) => ({
  key,
  label,
  type: "datetime",
  ...extra,
});
const json = (key, label, extra = {}) => ({
  key,
  label,
  type: "json",
  ...extra,
});

export function localDateTime(offsetMin = 0) {
  const d = new Date(Date.now() + offsetMin * 60000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const RAW_PROFILE = JSON.stringify(
  {
    chargingProfileId: 101,
    stackLevel: 1,
    chargingProfilePurpose: "TxDefaultProfile",
    chargingProfileKind: "Relative",
    chargingSchedule: {
      chargingRateUnit: "A",
      chargingSchedulePeriod: [{ startPeriod: 0, limit: 16 }],
    },
  },
  null,
  2,
);

export const GOALS = [
  "charging",
  "limits",
  "status",
  "settings",
  "cards",
  "maintenance",
];

// prettier-ignore
export const COMMAND_CARDS = [
  // ── Charging ──
  { name: "RemoteStartTransaction", goal: "charging", risk: "careful", needsOffline: false,
    title: L("Start charging from the dashboard", "بدء الشحن من لوحة التحكم"),
    what: L("Asks the charger to start. The system still checks the code, so a start that is not linked to a customer session is refused. This does not give free charging.", "يطلب من الشاحن أن يبدأ. النظام مازال يفحص الكود، لذلك يُرفض أي بدء غير مرتبط بجلسة عميل. هذا لا يعطي شحنًا مجانيًا."),
    when: L("Only for a test. Customers start charging from their own app.", "للتجربة فقط. العملاء يبدأون الشحن من تطبيقهم."),
    money: L("No customer is billed because the start is refused without a customer session.", "لا يُحاسب أي عميل لأن البدء يُرفض بدون جلسة عميل."),
    fields: [txt("idTag", L("Test code", "كود التجربة"), { default: "ADMINTEST" }), num("connectorId", L("Plug number", "رقم المقبس"), 1, 2, { optional: true, default: 1, advanced: true })] },
  { name: "RemoteStopTransaction", goal: "charging", risk: "careful",
    title: L("Stop a charging session", "إيقاف جلسة شحن"),
    what: L("Stops the car that is charging now. The customer pays only for the energy already delivered.", "يوقف السيارة التي تشحن الآن. يدفع العميل فقط ثمن الطاقة التي وصلت بالفعل."),
    when: L("When a customer asks you to stop, or the car must leave.", "عندما يطلب العميل الإيقاف أو يجب أن تغادر السيارة."),
    money: L("The customer is billed for the energy delivered until now.", "يُحاسب العميل على الطاقة التي وصلت حتى الآن."),
    fields: [num("transactionId", L("Session number", "رقم الجلسة"), 1, undefined)] },
  { name: "UnlockConnector", goal: "charging", risk: "careful",
    title: L("Unlock the cable", "فتح قفل الكابل"),
    what: L("Releases the cable lock so the plug can be removed. Not allowed while a car is charging.", "يحرر قفل الكابل لتُسحب الفيشة. غير مسموح أثناء شحن سيارة."),
    when: L("When the cable is stuck and no car is charging.", "عندما يكون الكابل عالقًا ولا توجد سيارة تشحن."),
    money: L("No effect on customer money.", "لا تأثير على أموال العملاء."),
    fields: [num("connectorId", L("Plug number", "رقم المقبس"), 1, 2, { default: 1 })] },
  { name: "ChangeAvailability", goal: "charging", risk: "careful",
    title: L("Enable or disable the charger", "تفعيل أو تعطيل الشاحن"),
    what: L("Disabled = customers cannot start charging. Enabled = open for customers. Not allowed while a car is charging.", "معطّل = لا يستطيع العملاء بدء الشحن. مفعّل = مفتوح للعملاء. غير مسموح أثناء شحن سيارة."),
    when: L("To close the charger for maintenance, or to open it again.", "لإغلاق الشاحن للصيانة أو لفتحه مرة أخرى."),
    money: L("No effect on money already in wallets.", "لا تأثير على الأموال الموجودة في المحافظ."),
    fields: [sel("type", L("What do you want?", "ماذا تريد؟"), ["Operative", "Inoperative"], { labels: { Operative: L("Enable (open)", "تفعيل (مفتوح)"), Inoperative: L("Disable (closed)", "تعطيل (مغلق)") } }), num("connectorId", L("Plug (0 = whole charger)", "المقبس (0 = الشاحن كله)"), 0, 2, { default: 0, advanced: true })] },
  // ── Limits ──
  { name: "SetCurrentLimit", goal: "limits", risk: "careful",
    title: L("Limit the charging power", "تحديد قدرة الشحن"),
    what: L("Sets the maximum current (amps) for new sessions. Lower is slower and gentler on your electricity. Allowed: 6 to 32 A.", "يحدد أقصى تيار (أمبير) للجلسات الجديدة. الأقل أبطأ وأخف على الكهرباء. المسموح: من 6 إلى 32 أمبير."),
    when: L("When your electricity supply is weak or the breaker trips.", "عندما تكون كهرباؤك ضعيفة أو يفصل القاطع."),
    money: L("Customers pay for the energy they receive, so slow charging means fewer kWh per hour.", "يدفع العملاء ثمن الطاقة التي يستلمونها، فالشحن البطيء يعني كيلوواط ساعة أقل في الساعة."),
    fields: [num("limitAmps", L("Maximum current (A)", "أقصى تيار (أمبير)"), 6, 32, { default: 16 }), sel("purpose", L("Applies to", "ينطبق على"), ["TxDefaultProfile", "ChargePointMaxProfile"], { advanced: true, labels: { TxDefaultProfile: L("Each new session", "كل جلسة جديدة"), ChargePointMaxProfile: L("The whole charger", "الشاحن كله") } }), num("connectorId", L("Plug", "المقبس"), 0, 2, { default: 1, advanced: true }), num("profileId", L("Limit number", "رقم الحد"), 1, 999, { default: 100, advanced: true }), num("stackLevel", L("Priority", "الأولوية"), 0, 3, { default: 1, advanced: true })] },
  { name: "GetCompositeSchedule", goal: "limits", risk: "safe",
    title: L("Read the active power limit", "قراءة حد القدرة الحالي"),
    what: L("Asks the charger which current limit it uses right now. \"Rejected\" usually means no limit is set.", "يسأل الشاحن عن حد التيار الذي يستخدمه الآن. «مرفوض» يعني غالبًا أنه لا يوجد حد."),
    when: L("When cars charge slower than expected.", "عندما تشحن السيارات أبطأ من المتوقع."),
    fields: [num("connectorId", L("Plug (0 = whole charger)", "المقبس (0 = الشاحن كله)"), 0, 2, { default: 1 }), num("duration", L("Look ahead (seconds)", "النظر للأمام (ثواني)"), 1, 86400, { default: 3600, advanced: true }), sel("chargingRateUnit", L("Unit", "الوحدة"), ["A", "W"], { default: "A", optional: true, advanced: true })] },
  { name: "SetChargingProfile", goal: "limits", risk: "careful", advancedOnly: true,
    title: L("Advanced charging profile", "ملف شحن متقدم"),
    what: L("Sends a full charging profile written as technical text. A limit of 0 stops all charging.", "يرسل ملف شحن كاملًا مكتوبًا بنص فني. حد 0 يوقف كل الشحن."),
    when: L("Only when the technician gives you the text to paste.", "فقط عندما يعطيك الفني النص لتلصقه."),
    money: L("A wrong profile can stop charging, so no customer can be billed.", "ملف خاطئ قد يوقف الشحن فلا يُحاسب أي عميل."),
    fields: [num("connectorId", L("Plug", "المقبس"), 0, 2, { default: 1 }), json("csChargingProfiles", L("Profile (technical text)", "الملف (نص فني)"), { default: RAW_PROFILE })] },
  { name: "ClearChargingProfile", goal: "limits", risk: "careful",
    title: L("Remove power limits", "إزالة حدود القدرة"),
    what: L("Removes limits. Fill nothing and it removes ALL limits from the charger.", "يزيل الحدود. إذا لم تملأ شيئًا يزيل كل الحدود من الشاحن."),
    when: L("When a limit was set by mistake and cars charge too slowly.", "عندما تم ضبط حد بالخطأ وتشحن السيارات ببطء."),
    money: L("No effect on money. Charging may become faster.", "لا تأثير على المال. قد يصبح الشحن أسرع."),
    fields: [num("id", L("Limit number (leave empty for all)", "رقم الحد (اتركه فارغًا للكل)"), 1, 999, { optional: true }), num("connectorId", L("Plug", "المقبس"), 0, 2, { optional: true, advanced: true }), sel("chargingProfilePurpose", L("Type", "النوع"), ["ChargePointMaxProfile", "TxDefaultProfile", "TxProfile"], { optional: true, advanced: true }), num("stackLevel", L("Priority", "الأولوية"), 0, 3, { optional: true, advanced: true })],
    dangerWord: (p) => (p.id === undefined && p.connectorId === undefined && p.chargingProfilePurpose === undefined && p.stackLevel === undefined ? "CLEAR" : null) },
  // ── Check status ──
  { name: "TriggerMessage", goal: "status", risk: "safe",
    title: L("Ask the charger to report now", "اطلب من الشاحن أن يبلّغ الآن"),
    what: L("Asks the charger to send one report right away (status, meter reading, heartbeat...).", "يطلب من الشاحن إرسال تقرير واحد فورًا (الحالة، قراءة العداد، النبضة...)."),
    when: L("To refresh what you see, or to test that the charger answers.", "لتحديث ما تراه أو لتجربة أن الشاحن يرد."),
    fields: [sel("requestedMessage", L("Report", "التقرير"), ["StatusNotification", "MeterValues", "Heartbeat", "BootNotification", "DiagnosticsStatusNotification", "FirmwareStatusNotification"], { labels: { StatusNotification: L("Current status", "الحالة الحالية"), MeterValues: L("Energy meter reading", "قراءة عداد الطاقة"), Heartbeat: L("\"I am alive\" signal", "إشارة «أنا أعمل»"), BootNotification: L("Start-up report", "تقرير بدء التشغيل"), DiagnosticsStatusNotification: L("Diagnostics status", "حالة التشخيص"), FirmwareStatusNotification: L("Software update status", "حالة تحديث البرنامج") } }), num("connectorId", L("Plug", "المقبس"), 1, 2, { optional: true, default: 1, advanced: true })] },
  { name: "GetLocalListVersion", goal: "status", risk: "safe",
    title: L("Check the saved card list", "فحص قائمة الكروت المحفوظة"),
    what: L("Reads the version of the card list stored inside the charger. -1 means no list, which is what you want.", "يقرأ إصدار قائمة الكروت المخزنة داخل الشاحن. -1 تعني لا توجد قائمة وهذا هو المطلوب."),
    when: L("To make sure no card can charge without being billed.", "للتأكد أنه لا يوجد كارت يشحن دون فاتورة."), fields: [] },
  // ── Settings ──
  { name: "GetConfiguration", goal: "settings", risk: "safe",
    title: L("Read the charger's settings", "قراءة إعدادات الشاحن"),
    what: L("Reads settings stored in the charger. Leave empty to read all. The Charger settings page shows them nicely.", "يقرأ الإعدادات المخزنة في الشاحن. اتركه فارغًا لقراءة الكل. صفحة إعدادات الشاحن تعرضها بشكل أفضل."),
    when: L("To check how the charger is set up.", "لمعرفة كيف تم ضبط الشاحن."),
    fields: [txt("key", L("Setting names (optional, separated by commas)", "أسماء الإعدادات (اختياري، مفصولة بفواصل)"), { optional: true, placeholder: "HeartbeatInterval,MeterValuesSampledData" })] },
  { name: "ChangeConfiguration", goal: "settings", risk: "careful",
    title: L("Change one charger setting", "تغيير إعداد واحد في الشاحن"),
    what: L("Writes one setting. A wrong value can break charging or billing. The charger password cannot be changed here.", "يكتب إعدادًا واحدًا. قيمة خاطئة قد تكسر الشحن أو الفواتير. لا يمكن تغيير كلمة مرور الشاحن من هنا."),
    when: L("Prefer \"Charger settings\" where each setting is explained and has a Fix button.", "يفضل استخدام «إعدادات الشاحن» حيث يشرح كل إعداد وبه زر إصلاح."),
    money: L("Wrong values (for example FreevendEnabled = true) can let customers charge for free.", "القيم الخاطئة (مثل FreevendEnabled = true) قد تسمح للعملاء بالشحن مجانًا."),
    fields: [txt("key", L("Setting name", "اسم الإعداد"), { placeholder: "MeterValueSampleInterval" }), txt("value", L("New value", "القيمة الجديدة"), { placeholder: "10" })] },
  // ── Cards & reservations ──
  { name: "ClearCache", goal: "cards", risk: "safe",
    title: L("Clear the charger's remembered cards", "مسح الكروت التي يتذكرها الشاحن"),
    what: L("Makes the charger forget cards it remembered, so it asks the system again.", "يجعل الشاحن ينسى الكروت التي تذكرها فيسأل النظام مرة أخرى."),
    when: L("After a card list problem.", "بعد مشكلة في قائمة الكروت."), fields: [] },
  { name: "SendLocalList", goal: "cards", risk: "dangerous", dangerWord: () => "SEND",
    title: L("Send a card list to the charger", "إرسال قائمة كروت للشاحن"),
    what: L("Cards in this list can charge WITHOUT asking the system. They are NOT billed.", "الكروت في هذه القائمة تشحن دون سؤال النظام. ولا تُحاسب."),
    when: L("Almost never. Only if the technician asks.", "تقريبًا أبدًا. فقط إذا طلب الفني."),
    money: L("Charging with these cards is free: no wallet is charged.", "الشحن بهذه الكروت مجاني: لا يُخصم من أي محفظة."),
    fields: [num("listVersion", L("List version", "إصدار القائمة"), 0, undefined, { default: 1 }), sel("updateType", L("Update type", "نوع التحديث"), ["Full", "Differential"], { labels: { Full: L("Replace the whole list", "استبدال القائمة كلها"), Differential: L("Change some cards", "تغيير بعض الكروت") } }), json("localAuthorizationList", L("Cards (technical text)", "الكروت (نص فني)"), { optional: true, default: "[]" })] },
  { name: "ReserveNow", goal: "cards", risk: "careful",
    title: L("Reserve the charger", "حجز الشاحن"),
    what: L("Keeps the charger for one code until the expiry time. Many chargers do not support this.", "يحجز الشاحن لكود واحد حتى وقت الانتهاء. كثير من الشواحن لا تدعم ذلك."),
    when: L("Rarely. Customers cannot reserve from the app.", "نادرًا. لا يستطيع العملاء الحجز من التطبيق."),
    money: L("Other customers cannot use the charger while it is reserved.", "لا يستطيع العملاء الآخرون استخدام الشاحن أثناء الحجز."),
    fields: [num("connectorId", L("Plug (0 = any)", "المقبس (0 = أي)"), 0, 2, { default: 1 }), dt("expiryDate", L("Reserved until", "محجوز حتى"), { default: () => localDateTime(60) }), txt("idTag", L("Code", "الكود"), { default: "ADMINTEST" }), num("reservationId", L("Reservation number", "رقم الحجز"), 0, undefined, { default: 1 }), txt("parentIdTag", L("Parent code", "الكود الأب"), { optional: true, advanced: true })] },
  { name: "CancelReservation", goal: "cards", risk: "careful",
    title: L("Cancel a reservation", "إلغاء حجز"),
    what: L("Cancels a reservation by its number.", "يلغي حجزًا برقمه."), when: L("When the charger is reserved by mistake.", "عندما يكون الشاحن محجوزًا بالخطأ."),
    money: L("No effect on money.", "لا تأثير على المال."), fields: [num("reservationId", L("Reservation number", "رقم الحجز"), 0, undefined, { default: 1 })] },
  // ── Maintenance ──
  { name: "Reset", goal: "maintenance", risk: "careful",
    title: L("Restart the charger", "إعادة تشغيل الشاحن"),
    what: L("Soft = normal restart (about 1 minute offline). Hard = full restart, use only if soft did not help. Not allowed while a car is charging.", "عادية = إعادة تشغيل عادية (حوالي دقيقة بدون اتصال). كاملة = إعادة تشغيل كاملة، استخدمها فقط إذا لم تنفع العادية. غير مسموح أثناء شحن سيارة."),
    when: L("When the charger is stuck, faulted or silent.", "عندما يكون الشاحن عالقًا أو معطلًا أو صامتًا."),
    money: L("No effect on money. A charging car is not allowed to be interrupted by this.", "لا تأثير على المال. لا يُسمح بقطع سيارة تشحن بهذا الأمر."),
    fields: [sel("type", L("Restart type", "نوع إعادة التشغيل"), ["Soft", "Hard"], { labels: { Soft: L("Normal (soft)", "عادية"), Hard: L("Full (hard)", "كاملة") } })],
    dangerWord: (p) => (p.type === "Hard" ? "RESET" : null) },
  { name: "GetDiagnostics", goal: "maintenance", risk: "careful",
    title: L("Send the charger's log file", "إرسال ملف سجل الشاحن"),
    what: L("The charger uploads its log file to a web or FTP address you give. This system has no place to receive it.", "يرفع الشاحن ملف السجل إلى عنوان ويب أو FTP تعطيه. هذا النظام ليس به مكان لاستقباله."),
    when: L("When the technician gives you an address to send the log to.", "عندما يعطيك الفني عنوانًا لإرسال السجل إليه."),
    money: L("No effect on money.", "لا تأثير على المال."),
    fields: [txt("location", L("Upload address", "عنوان الرفع"), { placeholder: "ftp://user:pass@host/path/" }), num("retries", L("Retries", "المحاولات"), 0, 10, { optional: true, advanced: true }), num("retryInterval", L("Seconds between retries", "ثواني بين المحاولات"), 0, 3600, { optional: true, advanced: true }), dt("startTime", L("Log from", "السجل من"), { optional: true, advanced: true }), dt("stopTime", L("Log until", "السجل حتى"), { optional: true, advanced: true })] },
  { name: "UpdateFirmware", goal: "maintenance", risk: "dangerous", dangerWord: () => "UPDATE",
    title: L("Update the charger software", "تحديث برنامج الشاحن"),
    what: L("The charger downloads and installs new software, then restarts. A wrong or interrupted update can break the charger for good. Not allowed while a car is charging.", "يحمّل الشاحن برنامجًا جديدًا ويثبته ثم يعيد التشغيل. تحديث خاطئ أو مقطوع قد يعطّل الشاحن نهائيًا. غير مسموح أثناء شحن سيارة."),
    when: L("Only when the technician gives you the file address and asks you to.", "فقط عندما يعطيك الفني عنوان الملف ويطلب منك ذلك."),
    money: L("The charger is offline during the update, so nobody can charge.", "يكون الشاحن بدون اتصال أثناء التحديث فلا يستطيع أحد الشحن."),
    fields: [txt("location", L("Software file address", "عنوان ملف البرنامج"), { placeholder: "https://host/firmware.bin" }), dt("retrieveDate", L("Download at", "التحميل في"), { default: () => localDateTime(5) }), num("retries", L("Retries", "المحاولات"), 0, 10, { optional: true, advanced: true }), num("retryInterval", L("Seconds between retries", "ثواني بين المحاولات"), 0, 3600, { optional: true, advanced: true })] },
  { name: "DataTransfer", goal: "maintenance", risk: "careful",
    title: L("Send a vendor message", "إرسال رسالة خاصة بالمصنّع"),
    what: L("A custom message defined by the charger maker. Most chargers answer \"unknown vendor\".", "رسالة خاصة يحددها مصنّع الشاحن. أغلب الشواحن ترد «مصنّع غير معروف»."),
    when: L("Only when the technician gives you the vendor name and message.", "فقط عندما يعطيك الفني اسم المصنّع والرسالة."),
    money: L("No effect on money.", "لا تأثير على المال."),
    fields: [txt("vendorId", L("Vendor name", "اسم المصنّع"), { default: "ABB" }), txt("messageId", L("Message name", "اسم الرسالة"), { optional: true }), txt("data", L("Data", "البيانات"), { optional: true })] },
];

export const CARD_BY_NAME = Object.fromEntries(
  COMMAND_CARDS.map((c) => [c.name, c]),
);

export function methodTitle(method, tx) {
  const names = {
    SetChargingProfile: "SetCurrentLimit",
    RemoteStartTransaction: "RemoteStartTransaction",
  };
  const card = CARD_BY_NAME[method] || CARD_BY_NAME[names[method]];
  return card ? tx(card.title) : method || "";
}

export function initialForm(card) {
  const out = {};
  for (const f of card.fields) {
    if (f.default !== undefined)
      out[f.key] = typeof f.default === "function" ? f.default() : f.default;
    else if (f.type === "select" && !f.optional) out[f.key] = f.options[0];
    else out[f.key] = "";
  }
  return out;
}

export function buildParams(card, form) {
  const params = {};
  for (const f of card.fields) {
    const raw = form[f.key];
    if (raw === "" || raw === null || raw === undefined) {
      if (!f.optional) return { errorKey: "act.required", label: f.label };
      continue;
    }
    if (card.name === "GetConfiguration" && f.key === "key") {
      params.key = String(raw)
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
    } else if (f.type === "number") {
      const n = Number(raw);
      if (!Number.isFinite(n))
        return { errorKey: "act.badNumber", label: f.label };
      if (f.min !== undefined && n < f.min)
        return { errorKey: "act.tooLow", label: f.label, vars: { min: f.min } };
      if (f.max !== undefined && n > f.max)
        return {
          errorKey: "act.tooHigh",
          label: f.label,
          vars: { max: f.max },
        };
      params[f.key] = n;
    } else if (f.type === "datetime") {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime()))
        return { errorKey: "act.badDate", label: f.label };
      params[f.key] = d.toISOString();
    } else if (f.type === "json") {
      try {
        params[f.key] = JSON.parse(raw);
      } catch {
        return { errorKey: "act.badJson", label: f.label };
      }
    } else {
      params[f.key] = String(raw).trim();
    }
  }
  return { params };
}
