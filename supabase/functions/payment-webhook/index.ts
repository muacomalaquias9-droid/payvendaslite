import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PLINQPAY_API_URL = "https://api.plinqpay.com/v1/transaction";
const PLINQPAY_PUBLIC_KEY = Deno.env.get("PLINQPAY_PUBLIC_KEY") || "";
const PLINQPAY_SECRET_KEY = Deno.env.get("PLINQPAY_SECRET_KEY") || Deno.env.get("PLINQPAY_API_KEY") || "";
const ENTITY_CODE = "01055";

const getCallbackUrl = () => {
  return `${supabaseUrl}/functions/v1/payment-webhook/plinqpay-callback`;
};

interface PlinqPayTransaction {
  externalId: string;
  callbackUrl: string;
  method: "REFERENCE" | "WALLET";
  client: {
    name: string;
    email: string;
    phone: string;
  };
  items: {
    title: string;
    price: number;
    quantity: number;
  }[];
  amount: number;
}

interface PlinqPayCallback {
  id?: string;
  externalId?: string;
  status?: string;
  amount?: number;
  reference?: string;
  paidAt?: string;
  [key: string]: unknown;
}

function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getAuthUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeAngolaPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return null;
  const national = digits.startsWith("244") ? digits.slice(3) : digits;
  if (national.length !== 9 || !national.startsWith("9")) return null;
  return `+244${national}`;
}

function normalizeIban(iban: string) {
  return iban.replace(/\s+/g, "").toUpperCase();
}

function isValidIban(iban: string) {
  return /^[A-Z]{2}[0-9A-Z]{13,32}$/.test(normalizeIban(iban));
}

async function parsePlinqPayResponse(response: Response) {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return { message: raw || "Resposta inválida da PlinqPay" };
  }
}

function extractReference(result: any): string {
  return String(
    result?.reference ||
      result?.data?.reference ||
      result?.transaction?.reference ||
      result?.id ||
      result?.data?.id ||
      "",
  ).trim();
}

function mapPaymentStatus(status: unknown): "paid" | "failed" | "pending" {
  const normalized = String(status || "").trim().toUpperCase();
  if (["PAID", "APPROVED", "COMPLETED", "SUCCESS", "SUCCESSFUL"].includes(normalized)) return "paid";
  if (["EXPIRED", "CANCELLED", "FAILED", "REJECTED", "VOID"].includes(normalized)) return "failed";
  return "pending";
}

function extractExternalId(payload: PlinqPayCallback): string {
  return String(
    payload?.externalId ||
      payload?.external_id ||
      (payload as any)?.data?.externalId ||
      (payload as any)?.data?.external_id ||
      (payload as any)?.transaction?.externalId ||
      (payload as any)?.transaction?.external_id ||
      "",
  ).trim();
}

function extractCallbackStatus(payload: PlinqPayCallback): string {
  return String(
    payload?.status ||
      (payload as any)?.data?.status ||
      (payload as any)?.transaction?.status ||
      "",
  ).trim();
}

function extractCallbackPaymentId(payload: PlinqPayCallback): string {
  return String(
    payload?.id ||
      (payload as any)?.data?.id ||
      (payload as any)?.transaction?.id ||
      "",
  ).trim();
}

async function createPlinqPayReference(payload: PlinqPayTransaction) {
  if (!PLINQPAY_PUBLIC_KEY) {
    return { ok: false, status: 500, result: { message: "PlinqPay public key não configurada" } };
  }

  const plinqpayResponse = await fetch(PLINQPAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": PLINQPAY_PUBLIC_KEY,
    },
    body: JSON.stringify(payload),
  });

  const result = await parsePlinqPayResponse(plinqpayResponse);
  return {
    ok: plinqpayResponse.ok,
    status: plinqpayResponse.status,
    result,
  };
}

async function verifyPlinqPaySignature(rawBody: string, signature: string) {
  if (!PLINQPAY_SECRET_KEY) return true;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(PLINQPAY_SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signedBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(signedBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signature.trim().toLowerCase() === expected;
}

// Route handler
Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const url = new URL(req.url);
  const path = url.pathname
    .replace(/^\/functions\/v1\/payment-webhook/, "")
    .replace(/^\/payment-webhook/, "") || "/";

  try {
    if (req.method === "POST" && path === "/") {
      const clonedReq = req.clone();
      const body = await clonedReq.json().catch(() => ({}));
      const action = typeof body?.action === "string" ? body.action : "";

      if (action === "initiate") return await handleInitiate(req);
      if (action === "purchase-pdf") return await handlePurchasePdf(req);
      if (action === "admin-process") return await handleAdminProcess(req);
      if (action === "external-sales-webhook") return await handleExternalSalesWebhook(req);
      if (action === "purchase-status") {
        const txId = typeof body?.transaction_id === "string" ? body.transaction_id : "";
        if (!txId) return jsonResponse({ error: "transaction_id obrigatório" }, 400);
        return await handlePurchaseStatus(req, txId);
      }
    }

    // PlinqPay callback
    if (req.method === "POST" && path === "/plinqpay-callback") {
      return await handleCallback(req);
    }

    // External sales webhook
    if (req.method === "POST" && path === "/external-sales-webhook") {
      return await handleExternalSalesWebhook(req);
    }

    // Initiate payment (deposit/withdrawal)
    if (req.method === "POST" && path === "/initiate") {
      return await handleInitiate(req);
    }

    // Purchase PDF
    if (req.method === "POST" && path === "/purchase-pdf") {
      return await handlePurchasePdf(req);
    }

    // Check purchase status
    if (req.method === "GET" && path.startsWith("/purchase-status/")) {
      const txId = path.replace("/purchase-status/", "");
      return await handlePurchaseStatus(req, txId);
    }

    // Admin process
    if (req.method === "POST" && path === "/admin/process") {
      return await handleAdminProcess(req);
    }

    // Status check
    if (req.method === "GET" && path.startsWith("/status/")) {
      const txId = path.replace("/status/", "");
      return await handleStatusCheck(txId);
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (error) {
    console.error("Request error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

// ---- CALLBACK ----
async function handlePdfPurchaseApproval(transaction: any): Promise<void> {
  const productId = transaction.description?.match(/product:(\S+)/)?.[1];
  if (!productId) return;

  const { data: existingPurchase } = await supabase
    .from("pdf_purchases")
    .select("id")
    .eq("user_id", transaction.user_id)
    .eq("product_id", productId)
    .limit(1)
    .maybeSingle();

  const isNewPurchase = !existingPurchase;

  if (isNewPurchase) {
    await supabase.from("pdf_purchases").insert({
      user_id: transaction.user_id,
      product_id: productId,
      amount: transaction.amount,
    });
  }

  const { data: product } = await supabase
    .from("pdf_products")
    .select("id, user_id, title, price, downloads_count")
    .eq("id", productId)
    .single();

  if (product && isNewPurchase) {
    await supabase
      .from("pdf_products")
      .update({ downloads_count: (product.downloads_count || 0) + 1 })
      .eq("id", productId);

    const { data: isSellerAdmin } = await supabase.rpc("has_role", {
      _user_id: product.user_id,
      _role: "admin",
    });

    if (!isSellerAdmin) {
      const { data: sellerProfile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("user_id", product.user_id)
        .single();

      if (sellerProfile) {
        await supabase
          .from("profiles")
          .update({ balance: (sellerProfile.balance || 0) + product.price * 0.85 })
          .eq("user_id", product.user_id);
      }
    }
  }

  await supabase.from("notifications").insert({
    user_id: transaction.user_id,
    type: "pdf_purchase",
    title: "Compra Confirmada",
    message: "Seu pagamento foi confirmado! Pode baixar o PDF agora.",
  });
}

async function markTransactionCompleted(transaction: any, paymentId: string): Promise<void> {
  if (transaction.status === "completed") return;

  await supabase
    .from("transactions")
    .update({
      status: "completed",
      description: `${transaction.description || "Transação"} - Pago: ${paymentId || "confirmado"}`,
    })
    .eq("id", transaction.id);

  if (transaction.type === "deposit") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("user_id", transaction.user_id)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({ balance: (profile.balance || 0) + transaction.amount })
        .eq("user_id", transaction.user_id);
    }

    await supabase.from("notifications").insert({
      user_id: transaction.user_id,
      type: "deposit",
      title: "Depósito Confirmado",
      message: `Seu depósito de ${transaction.amount.toLocaleString()} AOA foi confirmado!`,
    });
  }

  if (transaction.type === "pdf_purchase") {
    await handlePdfPurchaseApproval(transaction);
  }
}

async function markTransactionFailed(transaction: any, statusLabel: string): Promise<void> {
  if (transaction.status === "failed") return;

  await supabase
    .from("transactions")
    .update({
      status: "failed",
      description: `${transaction.description || "Transação"} - ${statusLabel || "FAILED"}`,
    })
    .eq("id", transaction.id);

  if (transaction.type === "withdrawal") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("user_id", transaction.user_id)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({ balance: (profile.balance || 0) + transaction.amount })
        .eq("user_id", transaction.user_id);
    }
  }
}

async function handleCallback(req: Request): Promise<Response> {
  const rawBody = await req.text();
  let payload: PlinqPayCallback;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "Payload inválido" }, 400);
  }

  const signature = req.headers.get("signature") || req.headers.get("x-signature");
  if (signature) {
    const valid = await verifyPlinqPaySignature(rawBody, signature);
    if (!valid) {
      return jsonResponse({ error: "Assinatura inválida" }, 401);
    }
  }

  const externalId = extractExternalId(payload);
  if (!externalId) {
    return jsonResponse({ error: "externalId não encontrado no callback" }, 400);
  }

  const paymentStatus = mapPaymentStatus(extractCallbackStatus(payload));
  const paymentId = extractCallbackPaymentId(payload);

  const { data: transaction, error: findError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", externalId)
    .single();

  if (findError || !transaction) {
    console.error("Transaction not found:", findError);
    return jsonResponse({ error: "Transaction not found" }, 404);
  }

  if (paymentStatus === "paid") {
    await markTransactionCompleted(transaction, paymentId);
    return jsonResponse({ success: true, message: "Payment confirmed" });
  }

  if (paymentStatus === "failed") {
    await markTransactionFailed(transaction, extractCallbackStatus(payload));
    return jsonResponse({ success: true, message: "Payment failed/cancelled" });
  }

  return jsonResponse({ success: true, message: "Webhook received", status: "pending" });
}

async function handleExternalSalesWebhook(req: Request): Promise<Response> {
  const authHeader = req.headers.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : "";
  const providedSecret = req.headers.get("x-webhook-secret") || req.headers.get("x-api-key") || bearerToken;

  if (!PLINQPAY_SECRET_KEY || providedSecret !== PLINQPAY_SECRET_KEY) {
    return jsonResponse({ error: "Unauthorized webhook" }, 401);
  }

  const payload = await req.json().catch(() => null);
  if (!payload) {
    return jsonResponse({ error: "Payload inválido" }, 400);
  }

  const transactionId = String(payload.transaction_id || payload.external_id || payload.externalId || "").trim();
  if (!transactionId) {
    return jsonResponse({ error: "transaction_id obrigatório" }, 400);
  }

  const status = mapPaymentStatus(payload.status);

  const { data: transaction } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", transactionId)
    .single();

  if (!transaction) {
    return jsonResponse({ error: "Transaction not found" }, 404);
  }

  if (status === "paid") {
    await markTransactionCompleted(transaction, String(payload.payment_id || payload.id || "external"));
    return jsonResponse({ success: true, status: "completed" });
  }

  if (status === "failed") {
    await markTransactionFailed(transaction, String(payload.status || "FAILED"));
    return jsonResponse({ success: true, status: "failed" });
  }

  return jsonResponse({ success: true, status: "pending" });
}

async function handleInitiate(req: Request): Promise<Response> {
  const user = await getAuthUser(req);
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

  const payload = await req.json().catch(() => null);
  if (!payload) {
    return jsonResponse({ error: "Payload inválido" }, 400);
  }

  const type = String(payload.type || "").trim();
  const amount = Number(payload.amount);
  const method = String(payload.method || "").trim();
  const clientName = String(payload.client_name || "").trim();
  const clientEmail = String(payload.client_email || "").trim().toLowerCase();
  const clientPhone = String(payload.client_phone || payload.phone || "").trim();
  const clientIban = normalizeIban(String(payload.client_iban || "").trim());

  if (!["deposit", "withdrawal"].includes(type)) {
    return jsonResponse({ error: "Tipo de transação inválido" }, 400);
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return jsonResponse({ error: "Valor inválido" }, 400);
  }

  if (!clientName || !isValidEmail(clientEmail)) {
    return jsonResponse({ error: "Nome e email válidos são obrigatórios" }, 400);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return jsonResponse({ error: "Profile not found" }, 404);
  }

  let normalizedPhone = "";

  // Validate withdrawal
  if (type === "withdrawal") {
    if (!clientIban || !isValidIban(clientIban)) {
      return jsonResponse({ error: "IBAN válido é obrigatório para levantamento manual" }, 400);
    }
    if (amount < 200) {
      return jsonResponse({ error: "Valor mínimo de levantamento: 200 AOA" }, 400);
    }
    if (amount > 200000) {
      return jsonResponse({ error: "Valor máximo de levantamento: 200.000 AOA" }, 400);
    }
    if ((profile.balance || 0) < amount) {
      return jsonResponse({ error: "Saldo insuficiente" }, 400);
    }

    // Deduct from balance immediately (refund on admin reject)
    await supabase
      .from("profiles")
      .update({ balance: (profile.balance || 0) - amount })
      .eq("user_id", user.id);
  }

  // Validate deposit
  if (type === "deposit") {
    normalizedPhone = normalizeAngolaPhone(clientPhone) || "";
    if (!normalizedPhone) {
      return jsonResponse({ error: "Número de telefone válido é obrigatório" }, 400);
    }
    if (amount < 12) {
      return jsonResponse({ error: "Valor mínimo de depósito: 12 AOA" }, 400);
    }
    if (amount > 1000000) {
      return jsonResponse({ error: "Valor máximo de depósito: 1.000.000 AOA" }, 400);
    }
  }

  // Create transaction
  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type,
      amount,
      status: "pending",
      method: type === "withdrawal" ? "Manual IBAN" : (method || "PlinqPay REFERENCE"),
      description: type === "withdrawal"
        ? `Levantamento Manual via IBAN ${clientIban} - ${clientName}`
        : `Depósito via PlinqPay - ${clientName}`,
    })
    .select()
    .single();

  if (txError) throw txError;

  if (type === "deposit") {
    const plinqpayPayload: PlinqPayTransaction = {
      externalId: transaction.id,
      callbackUrl: getCallbackUrl(),
      method: "REFERENCE",
      client: {
        name: clientName,
        email: clientEmail,
        phone: normalizedPhone,
      },
      items: [
        {
          title: "Depósito PayVendas",
          price: amount,
          quantity: 1,
        },
      ],
      amount,
    };

    console.log("Creating PlinqPay transaction:", JSON.stringify(plinqpayPayload));

    const plinqpayResponse = await createPlinqPayReference(plinqpayPayload);
    console.log("PlinqPay response:", JSON.stringify(plinqpayResponse.result));

    if (!plinqpayResponse.ok) {
      await supabase
        .from("transactions")
        .update({ status: "failed", description: `Erro PlinqPay: ${JSON.stringify(plinqpayResponse.result)}` })
        .eq("id", transaction.id);

      return jsonResponse({
        error: plinqpayResponse.result?.message || "Erro ao criar transação de pagamento",
      }, 400);
    }

    const reference = extractReference(plinqpayResponse.result);
    if (!reference) {
      await supabase
        .from("transactions")
        .update({ status: "failed", description: `Sem referência retornada: ${JSON.stringify(plinqpayResponse.result)}` })
        .eq("id", transaction.id);

      return jsonResponse({ error: "Não foi possível gerar referência de pagamento" }, 400);
    }

    await supabase
      .from("transactions")
      .update({
        description: `Depósito via PlinqPay - Ref: ${reference} - ${clientName}`,
      })
      .eq("id", transaction.id);

    return jsonResponse({
      success: true,
      transaction_id: transaction.id,
      plinqpay_id: String(plinqpayResponse.result?.id || ""),
      reference,
      entity: ENTITY_CODE,
      status: "pending",
      instructions: `Entidade: ${ENTITY_CODE}\nReferência: ${reference}\nValor: ${amount.toLocaleString()} AOA\n\nPague a referência para confirmar o depósito.`,
      message: "Siga as instruções para completar o depósito",
    });
  }

  // Withdrawals - manual admin processing by IBAN
  return jsonResponse({
    success: true,
    transaction_id: transaction.id,
    status: "pending",
    instructions: `Seu levantamento de ${amount.toLocaleString()} AOA foi solicitado para o IBAN ${clientIban}.\nSerá processado manualmente pelo administrador em até 24 horas úteis.`,
    message: "Seu levantamento manual está sendo processado",
  });
}

// ---- PURCHASE PDF ----
async function handlePurchasePdf(req: Request): Promise<Response> {
  const user = await getAuthUser(req);
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

  const payload = await req.json().catch(() => null);
  if (!payload) {
    return jsonResponse({ error: "Payload inválido" }, 400);
  }

  const productId = String(payload.product_id || "").trim();
  const clientName = String(payload.client_name || "").trim();
  const clientEmail = String(payload.client_email || "").trim().toLowerCase();
  const normalizedPhone = normalizeAngolaPhone(String(payload.client_phone || "").trim());

  if (!productId) {
    return jsonResponse({ error: "Produto inválido" }, 400);
  }

  if (!clientName || !isValidEmail(clientEmail) || !normalizedPhone) {
    return jsonResponse({ error: "Nome, email e número válidos são obrigatórios para o checkout" }, 400);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return jsonResponse({ error: "Profile not found" }, 404);
  }

  const { data: product } = await supabase
    .from("pdf_products")
    .select("*")
    .eq("id", productId)
    .eq("status", "approved")
    .single();

  if (!product) {
    return jsonResponse({ error: "Produto não encontrado" }, 404);
  }

  if (product.user_id === user.id) {
    return jsonResponse({ error: "Você não pode comprar seu próprio produto" }, 400);
  }

  const { data: existingPurchase } = await supabase
    .from("pdf_purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existingPurchase) {
    return jsonResponse({ error: "Você já comprou este produto", already_purchased: true }, 400);
  }

  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: "pdf_purchase",
      amount: product.price,
      status: "pending",
      method: "PlinqPay REFERENCE",
      description: `Compra PDF: ${product.title} - product:${product.id}`,
    })
    .select()
    .single();

  if (txError) throw txError;

  const plinqpayPayload: PlinqPayTransaction = {
    externalId: transaction.id,
    callbackUrl: getCallbackUrl(),
    method: "REFERENCE",
    client: {
      name: clientName,
      email: clientEmail,
      phone: normalizedPhone,
    },
    items: [
      {
        title: product.title,
        price: product.price,
        quantity: 1,
      },
    ],
    amount: product.price,
  };

  const plinqpayResponse = await createPlinqPayReference(plinqpayPayload);

  if (!plinqpayResponse.ok) {
    await supabase
      .from("transactions")
      .update({ status: "failed", description: `Erro PlinqPay: ${JSON.stringify(plinqpayResponse.result)}` })
      .eq("id", transaction.id);

    return jsonResponse({
      error: plinqpayResponse.result?.message || "Erro ao criar pagamento",
    }, 400);
  }

  const reference = extractReference(plinqpayResponse.result);
  if (!reference) {
    await supabase
      .from("transactions")
      .update({ status: "failed", description: `Sem referência retornada: ${JSON.stringify(plinqpayResponse.result)}` })
      .eq("id", transaction.id);

    return jsonResponse({ error: "Não foi possível gerar referência de pagamento" }, 400);
  }

  await supabase
    .from("transactions")
    .update({
      description: `${transaction.description} - Ref: ${reference}`,
    })
    .eq("id", transaction.id);

  return jsonResponse({
    success: true,
    transaction_id: transaction.id,
    reference,
    entity: ENTITY_CODE,
    status: "pending",
    product_title: product.title,
    amount: product.price,
    instructions: `Entidade: ${ENTITY_CODE}\nReferência: ${reference}\nValor: ${product.price.toLocaleString()} AOA\n\nPague a referência para aprovar a compra.`,
  });
}

// ---- PURCHASE STATUS ----
async function handlePurchaseStatus(req: Request, transactionId: string): Promise<Response> {
  const user = await getAuthUser(req);
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

  const { data: transaction } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", transactionId)
    .eq("user_id", user.id)
    .single();

  if (!transaction) {
    return jsonResponse({ error: "Transaction not found" }, 404);
  }

  const productId = transaction.description?.match(/product:(\S+)/)?.[1];
  let fileUrl = null;

  if (transaction.status === "completed" && productId) {
    const { data: product } = await supabase
      .from("pdf_products")
      .select("file_url, title")
      .eq("id", productId)
      .single();
    
    if (product) {
      fileUrl = product.file_url;
    }
  }

  return jsonResponse({
    status: transaction.status,
    file_url: fileUrl,
    amount: transaction.amount
  });
}

// ---- ADMIN PROCESS ----
async function handleAdminProcess(req: Request): Promise<Response> {
  const user = await getAuthUser(req);
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

  const { data: isAdmin } = await supabase
    .rpc("has_role", { _user_id: user.id, _role: "admin" });

  if (!isAdmin) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  const { transaction_id, action } = await req.json();

  if (!transaction_id || !action) {
    return jsonResponse({ error: "Missing required fields" }, 400);
  }

  const { data: transaction } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", transaction_id)
    .single();

  if (!transaction) {
    return jsonResponse({ error: "Transaction not found" }, 404);
  }

  if (action === "approve") {
    await supabase
      .from("transactions")
      .update({ status: "completed" })
      .eq("id", transaction_id);

    if (transaction.type === "deposit") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("user_id", transaction.user_id)
        .single();

      await supabase
        .from("profiles")
        .update({ balance: (profile?.balance || 0) + transaction.amount })
        .eq("user_id", transaction.user_id);
    }

    await supabase
      .from("notifications")
      .insert({
        user_id: transaction.user_id,
        type: transaction.type,
        title: transaction.type === "deposit" ? "Depósito Aprovado" : "Levantamento Aprovado",
        message: `Sua transação de ${transaction.amount.toLocaleString()} AOA foi aprovada!`
      });

  } else if (action === "reject") {
    await supabase
      .from("transactions")
      .update({ status: "failed" })
      .eq("id", transaction_id);

    if (transaction.type === "withdrawal") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("user_id", transaction.user_id)
        .single();

      await supabase
        .from("profiles")
        .update({ balance: (profile?.balance || 0) + transaction.amount })
        .eq("user_id", transaction.user_id);
    }

    await supabase
      .from("notifications")
      .insert({
        user_id: transaction.user_id,
        type: transaction.type,
        title: "Transação Rejeitada",
        message: `Sua transação de ${transaction.amount.toLocaleString()} AOA foi rejeitada.`
      });
  }

  return jsonResponse({ success: true });
}

// ---- STATUS CHECK ----
async function handleStatusCheck(transactionId: string): Promise<Response> {
  const { data: transaction, error } = await supabase
    .from("transactions")
    .select("id, status, amount, type, method, created_at, description")
    .eq("id", transactionId)
    .single();

  if (error || !transaction) {
    return jsonResponse({ error: "Transaction not found" }, 404);
  }

  return jsonResponse(transaction);
}
