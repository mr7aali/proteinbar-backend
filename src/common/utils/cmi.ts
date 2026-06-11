import crypto from "crypto";

const REQUEST_HASH_EXCLUDED_KEYS = new Set(["hash", "encoding"]);
const RESPONSE_HASH_EXCLUDED_KEYS = new Set(["hash", "encoding", "countdown"]);
const APPROVED_MD_STATUSES = new Set(["1", "2", "3", "4"]);

type HashableParams = Record<string, string>;

function sanitizeCmiBillingValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_ -]/g, "")
    .trim();
}

function cmiBillingValue(value: string | undefined, fallback = "") {
  const sanitized = sanitizeCmiBillingValue(value?.trim() ?? "");
  const sanitizedFallback = sanitizeCmiBillingValue(fallback.trim());
  return sanitized || sanitizedFallback;
}

function escapeHashValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
}

function normalizeParams(
  params: Record<string, unknown>,
  excludedKeys: Set<string>,
) {
  const normalized = new Map<string, string>();

  Object.entries(params).forEach(([key, value]) => {
    const normalizedKey = key.trim().toLowerCase();
    if (!normalizedKey || excludedKeys.has(normalizedKey)) return;
    normalized.set(normalizedKey, String(value ?? ""));
  });

  return normalized;
}

function computeHash(
  params: Record<string, unknown>,
  storeKey: string,
  excludedKeys: Set<string>,
) {
  const normalized = normalizeParams(params, excludedKeys);
  const sortedKeys = [...normalized.keys()].sort((left, right) =>
    left.localeCompare(right),
  );
  const values = sortedKeys.map((key) => escapeHashValue(normalized.get(key) ?? ""));
  const plainText = [...values, escapeHashValue(storeKey)].join("|");

  return crypto
    .createHash("sha512")
    .update(plainText, "utf8")
    .digest("base64");
}

export function buildCmiHash(params: HashableParams, storeKey: string) {
  return computeHash(params, storeKey, REQUEST_HASH_EXCLUDED_KEYS);
}

export function verifyCmiResponseHash(
  params: Record<string, unknown>,
  storeKey: string,
) {
  const receivedHash = String(
    params.HASH ?? params.hash ?? params.Hash ?? "",
  ).trim();

  if (!receivedHash || !storeKey) {
    return false;
  }

  const expectedHash = computeHash(params, storeKey, RESPONSE_HASH_EXCLUDED_KEYS);
  return receivedHash === expectedHash;
}

export function isCmiApprovedResponse(params: Record<string, unknown>) {
  const response = String(params.Response ?? params.response ?? "")
    .trim()
    .toLowerCase();
  const procReturnCode = String(
    params.ProcReturnCode ?? params.procreturncode ?? "",
  ).trim();
  const mdStatus = String(params.mdStatus ?? params.mdstatus ?? "").trim();

  return (
    response === "approved" &&
    procReturnCode === "00" &&
    APPROVED_MD_STATUSES.has(mdStatus)
  );
}

export function buildCmiPaymentFields(input: {
  amount: number;
  callbackUrl: string;
  clientId: string;
  currency: string;
  failUrl: string;
  lang: string;
  okUrl: string;
  orderId: string;
  refreshTime: string;
  storeKey: string;
  storeType: string;
  tranType: string;
  billingName?: string;
  billingCompany?: string;
  billingStreet1?: string;
  billingCity?: string;
  billingStateProv?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  email?: string;
  phone?: string;
}) {
  const rnd = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const billingNameFallback = cmiBillingValue(input.email, "Customer") || "Customer";
  const fields: HashableParams = {
    amount: input.amount.toFixed(2),
    callbackUrl: input.callbackUrl,
    clientid: input.clientId,
    currency: input.currency,
    failUrl: input.failUrl,
    hashAlgorithm: "ver3",
    lang: input.lang,
    oid: input.orderId,
    okUrl: input.okUrl,
    rnd,
    storetype: input.storeType,
    TranType: input.tranType,
    BillToName: cmiBillingValue(input.billingName, billingNameFallback) || "Customer",
    BillToCompany: cmiBillingValue(input.billingCompany),
    BillToStreet1: cmiBillingValue(input.billingStreet1),
    BillToCity: cmiBillingValue(input.billingCity),
    BillToStateProv: cmiBillingValue(input.billingStateProv),
    BillToPostalCode: cmiBillingValue(input.billingPostalCode),
    BillToCountry: cmiBillingValue(input.billingCountry),
    email: input.email?.trim() ?? "",
    tel: input.phone?.trim() ?? "",
    Instalment: "",
    refreshtime: input.refreshTime,
    encoding: "UTF-8",
  };

  fields.hash = buildCmiHash(fields, input.storeKey);

  return fields;
}
