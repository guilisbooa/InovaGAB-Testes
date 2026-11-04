const { Given, When, Then, Before } = require("@cucumber/cucumber");
const Ajv = require("ajv");
const fs = require("node:fs");
const path = require("node:path");

const ajv = new Ajv({ allErrors: true });
const projectId = process.env.FIREBASE_PROJECT_ID || "demo-inovagab";
const apiKey = process.env.FIREBASE_API_KEY || "fake-api-key";
const authBase = process.env.AUTH_BASE_URL || "http://127.0.0.1:9099";
const firestoreBase = process.env.FIRESTORE_BASE_URL || "http://127.0.0.1:8080";

let ctx = {};
Before(function () { ctx = {}; });

async function waitFor(url, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    try { await fetch(url); return; } catch { await new Promise(resolve => setTimeout(resolve, 1000)); }
  }
  throw new Error(`Serviço indisponível após ${attempts} tentativas: ${url}`);
}
async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const raw = await response.text();
  let body = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { body = { raw }; }
  ctx.response = response;
  ctx.body = body;
  return { status: response.status, body };
}
function readSchema(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "../../schemas", name), "utf8"));
}
function assertSchema(body, name) {
  const validate = ajv.compile(readSchema(name));
  if (!validate(body)) throw new Error(`JSON Schema inválido (${name}): ${JSON.stringify(validate.errors)}`);
}
function firestoreUrl(collection, id = "") {
  const suffix = id ? `/${encodeURIComponent(id)}` : "";
  return `${firestoreBase}/v1/projects/${projectId}/databases/(default)/documents/${collection}${suffix}`;
}
function encodeFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") fields[k] = { stringValue: v };
    else if (typeof v === "number" && Number.isInteger(v)) fields[k] = { integerValue: String(v) };
    else if (typeof v === "number") fields[k] = { doubleValue: v };
    else if (typeof v === "boolean") fields[k] = { booleanValue: v };
  }
  return fields;
}
function decodeValue(v) {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  return v;
}

Given("que o serviço Firebase Authentication está disponível", async function () {
  await waitFor(`${authBase}/`);
});
When('cadastro um usuário com e-mail {string} e senha {string}', async function (email, password) {
  ctx.email = email; ctx.password = password;
  ctx.result = await request(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: "POST", body: JSON.stringify({ email, password, returnSecureToken: true })
  });
});
Then("a API deve responder com status {int}", function (status) {
  if (!ctx.response || ctx.response.status !== status)
    throw new Error(`Esperado HTTP ${status}; recebido ${ctx.response ? ctx.response.status : "nenhuma resposta"}: ${JSON.stringify(ctx.body)}`);
});
Then("a resposta deve conter um identificador de usuário e um token", function () {
  assertSchema(ctx.body, "auth-signup.schema.json");
});
When("realizo login com as mesmas credenciais", async function () {
  ctx.result = await request(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: "POST", body: JSON.stringify({ email: ctx.email, password: ctx.password, returnSecureToken: true })
  });
});
Then("a resposta de login deve conter um token de autenticação", function () {
  if (typeof ctx.body.idToken !== "string" || !ctx.body.idToken.length)
    throw new Error("A resposta de login não contém idToken");
});
Given('que existe uma conta de teste com e-mail {string}', async function (email) {
  ctx.email = email; ctx.password = "SenhaValida@123";
  const created = await request(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: "POST", body: JSON.stringify({ email, password: ctx.password, returnSecureToken: true })
  });
  if (created.status !== 200) throw new Error(`Não foi possível preparar conta: ${JSON.stringify(created.body)}`);
});
When("tento autenticar essa conta com uma senha incorreta", async function () {
  ctx.result = await request(`${authBase}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: "POST", body: JSON.stringify({ email: ctx.email, password: "SenhaErrada@123", returnSecureToken: true })
  });
});
Then("a resposta deve informar erro de autenticação", function () {
  const message = JSON.stringify(ctx.body).toLowerCase();
  if (!message.includes("password") && !message.includes("invalid")) throw new Error("A API não retornou erro de credenciais inválidas");
});
Given("que o Firestore Emulator está disponível", async function () {
  await waitFor(`${firestoreBase}/`);
});
When('cadastro uma ideia na coleção {string}', async function (collection) {
  ctx.collection = collection;
  ctx.idea = { title: "Reduzir desperdício de combustível", description: "Otimizar rotas e reduzir consumo", category: "logística", status: "pending", createdBy: "operador-teste-001" };
  ctx.result = await request(firestoreUrl(collection), { method: "POST", body: JSON.stringify({ fields: encodeFields(ctx.idea) }) });
  ctx.documentName = ctx.body.name;
  ctx.documentId = ctx.documentName ? ctx.documentName.split("/").pop() : null;
});
When("consulto a ideia cadastrada", async function () {
  ctx.result = await request(firestoreUrl(ctx.collection, ctx.documentId));
});
Then("o documento retornado deve respeitar o contrato de ideia", function () {
  assertSchema(ctx.body, "firestore-document.schema.json");
  assertSchema(ctx.body.fields, "idea-fields.schema.json");
});
Then("os dados da ideia devem ser os mesmos enviados", function () {
  for (const [key, value] of Object.entries(ctx.idea)) {
    if (decodeValue(ctx.body.fields[key]) !== value) throw new Error(`Campo ${key} não corresponde ao valor enviado`);
  }
});
When("excluo a ideia cadastrada", async function () {
  ctx.result = await request(firestoreUrl(ctx.collection, ctx.documentId), { method: "DELETE" });
});
Then("a consulta posterior deve retornar status 404", async function () {
  ctx.result = await request(firestoreUrl(ctx.collection, ctx.documentId));
  if (ctx.response.status !== 404) throw new Error(`Esperado HTTP 404 após exclusão; recebido ${ctx.response.status}`);
});
When('cadastro um projeto na coleção {string}', async function (collection) {
  ctx.collection = collection;
  ctx.project = { name: "Otimização de consumo energético", description: "Reduzir consumo das unidades", stage: "planejamento", status: "on_track", investment: 10000.0, roi: 0.0, progressPercent: 0 };
  ctx.result = await request(firestoreUrl(collection), { method: "POST", body: JSON.stringify({ fields: encodeFields(ctx.project) }) });
  ctx.documentName = ctx.body.name;
  ctx.documentId = ctx.documentName ? ctx.documentName.split("/").pop() : null;
});
Then("o documento retornado deve respeitar o contrato de projeto", function () {
  assertSchema(ctx.body, "firestore-document.schema.json");
  assertSchema(ctx.body.fields, "project-fields.schema.json");
});
When("atualizo o progresso do projeto para {int} por cento e ROI {int}", async function (progress, roi) {
  ctx.project.progressPercent = progress;
  ctx.project.roi = roi;
  const fields = encodeFields({ progressPercent: progress, roi });
  const url = `${firestoreUrl(ctx.collection, ctx.documentId)}?updateMask.fieldPaths=progressPercent&updateMask.fieldPaths=roi`;
  ctx.result = await request(url, { method: "PATCH", body: JSON.stringify({ fields }) });
});
Then("os indicadores atualizados devem ser retornados corretamente", function () {
  if (decodeValue(ctx.body.fields.progressPercent) !== 75 || decodeValue(ctx.body.fields.roi) !== 18)
    throw new Error("Indicadores do projeto não foram persistidos corretamente");
});
When("excluo o projeto cadastrado", async function () {
  ctx.result = await request(firestoreUrl(ctx.collection, ctx.documentId), { method: "DELETE" });
});

When('cadastro um usuário na coleção {string}', async function (collection) {
  ctx.collection = collection;
  ctx.user = { name: "Operador de Teste", email: "operador.firestore@inovagab.test", role: "operator", points: 10, level: "Iniciante" };
  ctx.result = await request(firestoreUrl(collection), { method: "POST", body: JSON.stringify({ fields: encodeFields(ctx.user) }) });
  ctx.documentName = ctx.body.name;
  ctx.documentId = ctx.documentName ? ctx.documentName.split("/").pop() : null;
});
Then("o perfil retornado deve conter os dados do usuário", function () {
  assertSchema(ctx.body, "firestore-document.schema.json");
  assertSchema(ctx.body.fields, "user-fields.schema.json");
  for (const [key, value] of Object.entries(ctx.user)) {
    if (decodeValue(ctx.body.fields[key]) !== value) throw new Error(`Campo ${key} do perfil não corresponde`);
  }
});
When("consulto o perfil cadastrado", async function () {
  ctx.result = await request(firestoreUrl(ctx.collection, ctx.documentId));
});
When('cadastro uma orientação na coleção {string}', async function (collection) {
  ctx.collection = collection;
  ctx.strategy = { title: "Eficiência energética", description: "Reduzir consumo e desperdício nas operações", order: 1, createdBy: "lider-teste-001" };
  ctx.result = await request(firestoreUrl(collection), { method: "POST", body: JSON.stringify({ fields: encodeFields(ctx.strategy) }) });
  ctx.documentName = ctx.body.name;
  ctx.documentId = ctx.documentName ? ctx.documentName.split("/").pop() : null;
});
Then("a orientação retornada deve respeitar o contrato", function () {
  assertSchema(ctx.body, "firestore-document.schema.json");
  assertSchema(ctx.body.fields, "strategy-fields.schema.json");
});
When("atualizo a descrição da orientação", async function () {
  ctx.strategy.description = "Reduzir consumo energético e desperdício nas unidades";
  const url = `${firestoreUrl(ctx.collection, ctx.documentId)}?updateMask.fieldPaths=description`;
  ctx.result = await request(url, { method: "PATCH", body: JSON.stringify({ fields: encodeFields({ description: ctx.strategy.description }) }) });
});
Then("a orientação deve apresentar a descrição atualizada", function () {
  if (decodeValue(ctx.body.fields.description) !== ctx.strategy.description)
    throw new Error("A descrição da orientação não foi atualizada");
});
When("excluo a orientação cadastrada", async function () {
  ctx.result = await request(firestoreUrl(ctx.collection, ctx.documentId), { method: "DELETE" });
});

When('atualizo a prioridade da ideia para {string}', async function (priority) {
  const url = `${firestoreUrl(ctx.collection, ctx.documentId)}?updateMask.fieldPaths=priority`;
  ctx.result = await request(url, { method: "PATCH", body: JSON.stringify({ fields: encodeFields({ priority }) }) });
});
Then('a prioridade da ideia deve ser {string}', function (priority) {
  if (decodeValue(ctx.body.fields.priority) !== priority) throw new Error("Prioridade da ideia não foi persistida");
});
When("consulto o projeto cadastrado", async function () {
  ctx.result = await request(firestoreUrl(ctx.collection, ctx.documentId));
});
When("consulto a orientação cadastrada", async function () {
  ctx.result = await request(firestoreUrl(ctx.collection, ctx.documentId));
});
When("atualizo a pontuação do usuário para {int}", async function (points) {
  const url = `${firestoreUrl(ctx.collection, ctx.documentId)}?updateMask.fieldPaths=points`;
  ctx.result = await request(url, { method: "PATCH", body: JSON.stringify({ fields: encodeFields({ points }) }) });
});
