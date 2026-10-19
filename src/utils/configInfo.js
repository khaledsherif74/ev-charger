// Plain names, explanations, recommended values and OK / Check judgement for OCPP configuration keys. Bilingual.
const L = (en, ar) => ({ en, ar });

export const GROUPS = [
  { id: "current", title: L("Current & power limits", "حدود التيار والقدرة") },
  { id: "metering", title: L("Energy meter readings", "قراءات عداد الطاقة") },
  { id: "auth", title: L("Who may charge", "من يستطيع الشحن") },
  { id: "session", title: L("Cable, plug & sessions", "الكابل والفيشة والجلسات") },
  { id: "connection", title: L("Connection & timing", "الاتصال والتوقيت") },
  { id: "localList", title: L("Cards saved in the charger", "الكروت المحفوظة في الشاحن") },
  { id: "reservation", title: L("Reservations", "الحجوزات") },
  { id: "other", title: L("Other & maker-specific settings", "إعدادات أخرى وخاصة بالمصنّع") },
];

const n = (v) => Number(v);
// key: [group, name, what it does, unit?, recommended?, judge(value)=>true if OK, catalogCode if not OK]
const K = {
  ChargingScheduleAllowedChargingRateUnit: ["current", L("Limit unit allowed", "وحدة الحد المسموحة"), L("Whether limits may be set in amps, watts or both.", "هل يمكن ضبط الحدود بالأمبير أو الواط أو كليهما.")],
  ChargeProfileMaxStackLevel: ["current", L("Highest limit priority", "أعلى أولوية للحد"), L("The highest priority number a power limit can have.", "أعلى رقم أولوية يمكن أن يكون لحد القدرة.")],
  ChargingScheduleMaxPeriods: ["current", L("Steps in one schedule", "عدد الخطوات في جدول واحد"), L("How many different limits one schedule may contain.", "كم حدًا مختلفًا يمكن أن يحتويه جدول واحد.")],
  MaxChargingProfilesInstalled: ["current", L("Limits the charger can store", "عدد الحدود التي يخزنها الشاحن"), L("How many power limits can be saved at once.", "كم حد قدرة يمكن حفظه في نفس الوقت.")],
  ConnectorSwitch3to1PhaseSupported: ["current", L("Switch between 3 and 1 phase", "التبديل بين 3 و1 فاز"), L("Whether the charger can change between 3-phase and 1-phase.", "هل يستطيع الشاحن التبديل بين 3 فاز و1 فاز.")],
  MeterValuesSampledData: ["metering", L("What the meter reports", "ما يبلغ عنه العداد"), L("The values sent while charging. Energy must be included for billing.", "القيم المرسلة أثناء الشحن. يجب أن تتضمن الطاقة من أجل الفاتورة."), "", null, (v) => /Energy/i.test(String(v)) || v === "", "METER_INTERVAL"],
  MeterValueSampleInterval: ["metering", L("How often the meter reports", "كل كم ثانية يبلغ العداد"), L("Seconds between meter readings while charging. Needed to bill and to stop at zero balance. 0 means never.", "الثواني بين قراءات العداد أثناء الشحن. ضرورية للفاتورة ولإيقاف الشحن عند نفاد الرصيد. 0 يعني لا يبلغ أبدًا."), "s", "10", (v) => n(v) >= 4 && n(v) <= 30, "METER_INTERVAL"],
  MeterValuesSampledDataMaxLength: ["metering", L("Max reported values", "أقصى عدد قيم مبلغ عنها"), L("How many different values the meter can report.", "كم قيمة مختلفة يستطيع العداد الإبلاغ عنها.")],
  MeterValuesAlignedData: ["metering", L("Values reported on the clock", "قيم تُرسل حسب الساعة"), L("Values sent at fixed clock times.", "قيم تُرسل في أوقات ثابتة من الساعة.")],
  MeterValuesAlignedDataMaxLength: ["metering", L("Max clock-based values", "أقصى قيم حسب الساعة"), L("")],
  ClockAlignedDataInterval: ["metering", L("Clock-based report interval", "فترة التقرير حسب الساعة"), L("0 = off."), "s"],
  StopTxnSampledData: ["metering", L("Values sent at the end", "قيم تُرسل عند النهاية"), L("Meter values sent when charging ends.", "قيم العداد المرسلة عند انتهاء الشحن.")],
  StopTxnSampledDataMaxLength: ["metering", L("Max end values", "أقصى قيم عند النهاية"), L("")],
  StopTxnAlignedData: ["metering", L("Clock values at the end", "قيم الساعة عند النهاية"), L("")],
  StopTxnAlignedDataMaxLength: ["metering", L("Max clock values at the end", "أقصى قيم الساعة عند النهاية"), L("")],
  FreevendEnabled: ["auth", L("Free charging", "الشحن المجاني"), L("If true, anyone can charge WITHOUT paying. It must be false.", "إذا كانت true يستطيع أي شخص الشحن دون دفع. يجب أن تكون false."), "", "false", (v) => String(v).toLowerCase() === "false", "FREEVEND_ENABLED"],
  AuthorizeRemoteTxRequests: ["auth", L("Check remote starts with the system", "فحص البدء عن بعد مع النظام"), L("The charger asks the system before it starts for a customer. Should be true.", "يسأل الشاحن النظام قبل البدء للعميل. يجب أن تكون true."), "", "true", (v) => String(v).toLowerCase() === "true", "AUTHORIZE_REMOTE_OFF"],
  AuthorizationCacheEnabled: ["auth", L("Remember cards", "تذكر الكروت"), L("The charger remembers cards it accepted before.", "يتذكر الشاحن الكروت التي قبلها من قبل.")],
  LocalAuthorizeOffline: ["auth", L("Accept saved cards when offline", "قبول الكروت المحفوظة بدون اتصال"), L("When offline, cards saved in the charger may start charging (not billed).", "عند انقطاع الاتصال قد تبدأ الكروت المحفوظة الشحن (دون فاتورة).")],
  LocalPreAuthorize: ["auth", L("Check saved cards first", "فحص الكروت المحفوظة أولًا"), L("The charger checks its saved cards before asking the system.", "يفحص الشاحن كروته المحفوظة قبل سؤال النظام.")],
  AllowOfflineTxForUnknownId: ["auth", L("Charge unknown cards when offline", "الشحن بكروت مجهولة بدون اتصال"), L("When offline, unknown cards may charge.", "عند انقطاع الاتصال قد تشحن كروت غير معروفة.")],
  MaxEnergyOnInvalidId: ["auth", L("Energy allowed for an invalid card", "الطاقة المسموحة لكارت غير صالح"), L("Max energy before stopping an invalid card.", "أقصى طاقة قبل إيقاف كارت غير صالح."), "Wh"],
  StopTransactionOnInvalidId: ["auth", L("Stop when the card is invalid", "الإيقاف عند كارت غير صالح"), L("Stops charging if the system says the card is not valid.", "يوقف الشحن إذا قال النظام إن الكارت غير صالح.")],
  NumberOfConnectors: ["session", L("Number of plugs", "عدد المقابس"), L("How many plugs the charger has.", "كم مقبسًا في الشاحن.")],
  ConnectionTimeOut: ["session", L("Time to plug in the car", "مهلة توصيل السيارة"), L("Seconds the charger waits for the car after the start.", "الثواني التي ينتظرها الشاحن للسيارة بعد البدء."), "s"],
  StopTransactionOnEVSideDisconnect: ["session", L("Stop when the car is unplugged", "الإيقاف عند فصل السيارة"), L("Ends the session when the cable leaves the car.", "ينهي الجلسة عندما يخرج الكابل من السيارة.")],
  UnlockConnectorOnEVSideDisconnect: ["session", L("Unlock when the car is unplugged", "فتح القفل عند فصل السيارة"), L("Releases the lock when the cable leaves the car.", "يحرر القفل عندما يخرج الكابل من السيارة.")],
  MinimumStatusDuration: ["session", L("Minimum status time", "أقل مدة للحالة"), L("Seconds a status must last before it is reported.", "الثواني التي يجب أن تستمر فيها الحالة قبل الإبلاغ عنها."), "s"],
  ConnectorPhaseRotation: ["session", L("Wire order (phase rotation)", "ترتيب الأسلاك"), L("How the three power wires are connected.", "كيف تتصل أسلاك الكهرباء الثلاثة.")],
  ConnectorPhaseRotationMaxLength: ["session", L("Max wire order entries", "أقصى مدخلات ترتيب الأسلاك"), L("")],
  ResetRetries: ["session", L("Restart attempts", "محاولات إعادة التشغيل"), L("How many times the charger tries to restart.", "كم مرة يحاول الشاحن إعادة التشغيل.")],
  TransactionMessageAttempts: ["session", L("Resend attempts", "محاولات إعادة الإرسال"), L("How many times the charger resends a session message.", "كم مرة يعيد الشاحن إرسال رسالة جلسة.")],
  TransactionMessageRetryInterval: ["session", L("Wait between resends", "الانتظار بين الإرسال"), L("Seconds between resends.", "الثواني بين مرات إعادة الإرسال."), "s"],
  BlinkRepeat: ["session", L("Light blink times", "مرات وميض الضوء"), L("")],
  LightIntensity: ["session", L("Light brightness", "سطوع الضوء"), L(""), "%"],
  HeartbeatInterval: ["connection", L("\"I am alive\" signal interval", "فترة إشارة «أنا أعمل»"), L("Seconds between signals to the system. Short = problems are noticed faster.", "الثواني بين الإشارات للنظام. القصيرة = تُكتشف المشاكل أسرع."), "s", "60", (v) => n(v) > 0 && n(v) <= 120, "HEARTBEAT_LONG"],
  WebSocketPingInterval: ["connection", L("Connection check interval", "فترة فحص الاتصال"), L("Seconds between connection checks.", "الثواني بين فحوصات الاتصال."), "s"],
  GetConfigurationMaxKeys: ["connection", L("Settings per request", "عدد الإعدادات في الطلب"), L("How many settings can be read at once.", "كم إعدادًا يمكن قراءته دفعة واحدة.")],
  SupportedFeatureProfiles: ["connection", L("Features the charger supports", "الخصائص التي يدعمها الشاحن"), L("The groups of OCPP features this charger implements.", "مجموعات خصائص OCPP التي ينفذها هذا الشاحن.")],
  SupportedFeatureProfilesMaxLength: ["connection", L("Max feature groups", "أقصى مجموعات الخصائص"), L("")],
  LocalAuthListEnabled: ["localList", L("Saved card list", "قائمة الكروت المحفوظة"), L("If true the charger uses a list of cards saved inside it. Those cards are not billed.", "إذا كانت true يستخدم الشاحن قائمة كروت محفوظة بداخله. هذه الكروت لا تُحاسب."), "", "false", (v) => String(v).toLowerCase() !== "true", "LOCAL_LIST_USED"],
  LocalAuthListMaxLength: ["localList", L("Max saved cards", "أقصى عدد كروت محفوظة"), L("")],
  SendLocalListMaxLength: ["localList", L("Max cards per update", "أقصى كروت في التحديث"), L("")],
  ReserveConnectorZeroSupported: ["reservation", L("Reserve the whole charger", "حجز الشاحن كله"), L("Whether the whole charger can be reserved.", "هل يمكن حجز الشاحن كله.")],
};

const CURRENT_LIKE = /(current|amp|power|phase|limit|rating|voltage)/i;

export function describeKey(key) {
  const k = K[key];
  if (k) return { group: k[0], name: k[1], what: k[2], unit: k[3] || "", recommended: k[4] ?? null, judge: k[5] || null, code: k[6] || null };
  const group = CURRENT_LIKE.test(key) ? "current" : "other";
  return { group, name: L(key, key), what: L("A setting specific to this charger model.", "إعداد خاص بموديل هذا الشاحن."), unit: "", recommended: null, judge: null, code: null };
}

/** "ok" | "check" for a key and its current value. Keys without a recommendation are always "ok". */
export function judgeKey(key, value) {
  const d = describeKey(key);
  if (!d.judge || value === null || value === undefined) return "ok";
  try {
    return d.judge(value) ? "ok" : "check";
  } catch {
    return "ok";
  }
}

export function groupConfig(entries, query = "", tx = (o) => o.en) {
  const q = query.trim().toLowerCase();
  const buckets = new Map(GROUPS.map((g) => [g.id, []]));
  for (const entry of entries || []) {
    const d = describeKey(entry.key);
    if (q && !`${entry.key} ${tx(d.name)} ${entry.value ?? ""}`.toLowerCase().includes(q)) continue;
    buckets.get(d.group).push({ ...entry, info: d, status: judgeKey(entry.key, entry.value) });
  }
  return GROUPS.map((g) => ({ ...g, entries: buckets.get(g.id) })).filter((g) => g.entries.length);
}

// Settings the owner may change from the Actions page (standard writable OCPP 1.6 keys + ABB FreevendEnabled).
export const WRITABLE_KEYS = [
  "FreevendEnabled", "AuthorizeRemoteTxRequests", "MeterValueSampleInterval", "MeterValuesSampledData", "HeartbeatInterval",
  "ConnectionTimeOut", "WebSocketPingInterval", "MinimumStatusDuration", "ClockAlignedDataInterval", "MeterValuesAlignedData",
  "StopTxnSampledData", "StopTxnAlignedData", "StopTransactionOnEVSideDisconnect", "UnlockConnectorOnEVSideDisconnect",
  "StopTransactionOnInvalidId", "AuthorizationCacheEnabled", "LocalAuthorizeOffline", "LocalPreAuthorize", "LocalAuthListEnabled",
  "AllowOfflineTxForUnknownId", "MaxEnergyOnInvalidId", "ResetRetries", "TransactionMessageAttempts", "TransactionMessageRetryInterval",
  "LightIntensity", "BlinkRepeat", "ConnectorPhaseRotation",
];
export const BOOL_KEYS = new Set([
  "FreevendEnabled", "AuthorizeRemoteTxRequests", "StopTransactionOnEVSideDisconnect", "UnlockConnectorOnEVSideDisconnect",
  "StopTransactionOnInvalidId", "AuthorizationCacheEnabled", "LocalAuthorizeOffline", "LocalPreAuthorize", "LocalAuthListEnabled",
  "AllowOfflineTxForUnknownId",
]);

/** Dropdown groups: [{ id, title, keys:[{key, name, what, recommended, unit}] }] in menu order. */
export function writableGroups() {
  return GROUPS.map((g) => ({
    ...g,
    keys: WRITABLE_KEYS.filter((k) => describeKey(k).group === g.id).map((k) => {
      const d = describeKey(k);
      return { key: k, name: d.name, what: d.what, recommended: d.recommended, unit: d.unit };
    }),
  })).filter((g) => g.keys.length);
}

// Plain names for the values a meter can report (MeterValuesSampledData and friends).
export const MEASURAND = {
  "Energy.Active.Import.Register": L("Energy used", "الطاقة المستهلكة"),
  "Power.Active.Import": L("Power", "القدرة"),
  "Current.Import": L("Current drawn", "التيار المسحوب"),
  "Current.Offered": L("Current offered", "التيار المعروض"),
  Voltage: L("Voltage", "الجهد"),
  Frequency: L("Frequency", "التردد"),
  Temperature: L("Temperature", "الحرارة"),
  SoC: L("Battery level", "مستوى البطارية"),
  "Power.Factor": L("Power factor", "معامل القدرة"),
  "Power.Offered": L("Power offered", "القدرة المعروضة"),
  "Energy.Active.Export.Register": L("Energy sent back", "الطاقة المرسلة للشبكة"),
  "Energy.Reactive.Import.Register": L("Reactive energy used", "الطاقة غير الفعالة المستهلكة"),
  "Power.Reactive.Import": L("Reactive power", "القدرة غير الفعالة"),
  "Current.Export": L("Current sent back", "التيار المرسل للشبكة"),
  RPM: L("Fan speed", "سرعة المروحة"),
};
export const LIST_KEYS = new Set(["MeterValuesSampledData", "MeterValuesAlignedData", "StopTxnSampledData", "StopTxnAlignedData", "SupportedFeatureProfiles", "ConnectorPhaseRotation"]);
