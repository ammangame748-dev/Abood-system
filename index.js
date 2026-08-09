var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";
var users, guildConfigs, ticketConfigs, ticketData, userLevels, modConfigs, jailData, stats, giveaways, kickConfigs, suggestionConfigs, warns, autoReplies;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    guildConfigs = mysqlTable("guild_configs", {
      id: int("id").autoincrement().primaryKey(),
      guildId: varchar("guildId", { length: 64 }).notNull(),
      autoReply: json("autoReply"),
      security: json("security"),
      levels: json("levels"),
      rolesPanel: json("rolesPanel"),
      rolesChannel: varchar("rolesChannel", { length: 64 }),
      logs: json("logs"),
      welcome: json("welcome"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    ticketConfigs = mysqlTable("ticket_configs", {
      id: int("id").autoincrement().primaryKey(),
      guildId: varchar("guildId", { length: 64 }).notNull(),
      channelId: varchar("channelId", { length: 64 }),
      title: varchar("title", { length: 255 }),
      description: text("description"),
      color: varchar("color", { length: 16 }),
      adminRole: varchar("adminRole", { length: 64 }),
      topImagePath: varchar("topImagePath", { length: 512 }),
      bottomImagePath: varchar("bottomImagePath", { length: 512 }),
      ticketCount: int("ticketCount").default(0),
      buttons: json("buttons"),
      menuOptions: json("menuOptions"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    ticketData = mysqlTable("ticket_data", {
      id: int("id").autoincrement().primaryKey(),
      guildId: varchar("guildId", { length: 64 }).notNull(),
      channelId: varchar("channelId", { length: 64 }),
      ownerId: varchar("ownerId", { length: 64 }),
      ticketType: varchar("ticketType", { length: 128 }).default("\u062A\u0630\u0643\u0631\u0629 \u062F\u0639\u0645"),
      claimedBy: varchar("claimedBy", { length: 64 }),
      openedAt: timestamp("openedAt").defaultNow().notNull(),
      closedAt: timestamp("closedAt"),
      closedBy: varchar("closedBy", { length: 64 })
    });
    userLevels = mysqlTable("user_levels", {
      id: int("id").autoincrement().primaryKey(),
      guildId: varchar("guildId", { length: 64 }).notNull(),
      userId: varchar("userId", { length: 64 }).notNull(),
      xp: int("xp").default(0),
      level: int("level").default(1),
      msgCount: int("msgCount").default(0),
      dailyMsgs: int("dailyMsgs").default(0),
      lastMessageDate: timestamp("lastMessageDate").defaultNow().notNull(),
      warned: boolean("warned").default(false)
    });
    modConfigs = mysqlTable("mod_configs", {
      id: int("id").autoincrement().primaryKey(),
      guildId: varchar("guildId", { length: 64 }).notNull(),
      jail: json("jail")
    });
    jailData = mysqlTable("jail_data", {
      id: int("id").autoincrement().primaryKey(),
      guildId: varchar("guildId", { length: 64 }).notNull(),
      userId: varchar("userId", { length: 64 }).notNull(),
      oldRoles: json("oldRoles"),
      endAt: timestamp("endAt")
    });
    stats = mysqlTable("stats", {
      id: int("id").autoincrement().primaryKey(),
      guildId: varchar("guildId", { length: 64 }).notNull(),
      messages: json("messages"),
      activeChannels: json("activeChannels"),
      membersLog: json("membersLog"),
      modActions: json("modActions"),
      lastUpdate: timestamp("lastUpdate").defaultNow().notNull()
    });
    giveaways = mysqlTable("giveaways", {
      id: int("id").autoincrement().primaryKey(),
      guildId: varchar("guildId", { length: 64 }).notNull(),
      messageId: varchar("messageId", { length: 64 }),
      channelId: varchar("channelId", { length: 64 }),
      endAt: timestamp("endAt"),
      winnersCount: int("winnersCount"),
      prize: varchar("prize", { length: 255 }),
      description: text("description"),
      ended: boolean("ended").default(false)
    });
    kickConfigs = mysqlTable("kick_configs", {
      id: int("id").autoincrement().primaryKey(),
      guildId: varchar("guildId", { length: 64 }).notNull(),
      streamers: json("streamers")
    });
    suggestionConfigs = mysqlTable("suggestion_configs", {
      id: int("id").autoincrement().primaryKey(),
      guildId: varchar("guildId", { length: 64 }).notNull(),
      channelId: varchar("channelId", { length: 64 }),
      imagePath: varchar("imagePath", { length: 512 }),
      emoji1Id: varchar("emoji1Id", { length: 128 }),
      emoji2Id: varchar("emoji2Id", { length: 128 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    warns = mysqlTable("warns", {
      id: int("id").autoincrement().primaryKey(),
      guildId: varchar("guildId", { length: 64 }).notNull(),
      userId: varchar("userId", { length: 64 }).notNull(),
      moderatorId: varchar("moderatorId", { length: 64 }).notNull(),
      reason: varchar("reason", { length: 512 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    autoReplies = mysqlTable("auto_replies", {
      id: int("id").autoincrement().primaryKey(),
      guildId: varchar("guildId", { length: 64 }).notNull(),
      trigger: varchar("trigger", { length: 255 }).notNull(),
      reply: text("reply").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/db.ts
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
  }
});

// server/bot/db.ts
var db_exports2 = {};
__export(db_exports2, {
  addAutoReply: () => addAutoReply,
  addWarn: () => addWarn,
  clearWarns: () => clearWarns,
  createGiveaway: () => createGiveaway,
  createJailData: () => createJailData,
  createTicketData: () => createTicketData,
  deleteAutoReply: () => deleteAutoReply,
  deleteJailData: () => deleteJailData,
  getActiveGiveaways: () => getActiveGiveaways,
  getAutoReplies: () => getAutoReplies,
  getGuildConfig: () => getGuildConfig,
  getJailData: () => getJailData,
  getKickConfig: () => getKickConfig,
  getModConfig: () => getModConfig,
  getStats: () => getStats,
  getSuggestionConfig: () => getSuggestionConfig,
  getTicketConfig: () => getTicketConfig,
  getTicketDataByChannel: () => getTicketDataByChannel,
  getUserLevel: () => getUserLevel,
  getWarns: () => getWarns,
  updateGiveaway: () => updateGiveaway,
  updateTicketData: () => updateTicketData,
  upsertGuildConfig: () => upsertGuildConfig,
  upsertKickConfig: () => upsertKickConfig,
  upsertModConfig: () => upsertModConfig,
  upsertStats: () => upsertStats,
  upsertSuggestionConfig: () => upsertSuggestionConfig,
  upsertTicketConfig: () => upsertTicketConfig,
  upsertUserLevel: () => upsertUserLevel
});
import { eq as eq2, and } from "drizzle-orm";
async function getGuildConfig(guildId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(guildConfigs).where(eq2(guildConfigs.guildId, guildId)).limit(1);
  return result[0] || null;
}
async function upsertGuildConfig(guildId, data) {
  const db = await getDb();
  if (!db) return;
  const existing = await getGuildConfig(guildId);
  if (existing) {
    await db.update(guildConfigs).set(data).where(eq2(guildConfigs.guildId, guildId));
  } else {
    await db.insert(guildConfigs).values({ guildId, ...data });
  }
}
async function getTicketConfig(guildId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(ticketConfigs).where(eq2(ticketConfigs.guildId, guildId)).limit(1);
  return result[0] || null;
}
async function upsertTicketConfig(guildId, data) {
  const db = await getDb();
  if (!db) return;
  const existing = await getTicketConfig(guildId);
  if (existing) {
    await db.update(ticketConfigs).set(data).where(eq2(ticketConfigs.guildId, guildId));
  } else {
    await db.insert(ticketConfigs).values({ guildId, ...data });
  }
}
async function getSuggestionConfig(guildId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(suggestionConfigs).where(eq2(suggestionConfigs.guildId, guildId)).limit(1);
  return result[0] || null;
}
async function upsertSuggestionConfig(guildId, data) {
  const db = await getDb();
  if (!db) return;
  const existing = await getSuggestionConfig(guildId);
  if (existing) {
    await db.update(suggestionConfigs).set(data).where(eq2(suggestionConfigs.guildId, guildId));
  } else {
    await db.insert(suggestionConfigs).values({ guildId, ...data });
  }
}
async function getModConfig(guildId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(modConfigs).where(eq2(modConfigs.guildId, guildId)).limit(1);
  return result[0] || null;
}
async function upsertModConfig(guildId, data) {
  const db = await getDb();
  if (!db) return;
  const existing = await getModConfig(guildId);
  if (existing) {
    await db.update(modConfigs).set(data).where(eq2(modConfigs.guildId, guildId));
  } else {
    await db.insert(modConfigs).values({ guildId, ...data });
  }
}
async function getJailData(guildId, userId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(jailData).where(and(eq2(jailData.guildId, guildId), eq2(jailData.userId, userId))).limit(1);
  return result[0] || null;
}
async function createJailData(guildId, userId, oldRoles, endAt) {
  const db = await getDb();
  if (!db) return;
  await db.insert(jailData).values({ guildId, userId, oldRoles, endAt });
}
async function deleteJailData(guildId, userId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(jailData).where(and(eq2(jailData.guildId, guildId), eq2(jailData.userId, userId)));
}
async function getUserLevel(guildId, userId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userLevels).where(and(eq2(userLevels.guildId, guildId), eq2(userLevels.userId, userId))).limit(1);
  return result[0] || null;
}
async function upsertUserLevel(guildId, userId, data) {
  const db = await getDb();
  if (!db) return;
  const existing = await getUserLevel(guildId, userId);
  if (existing) {
    await db.update(userLevels).set(data).where(and(eq2(userLevels.guildId, guildId), eq2(userLevels.userId, userId)));
  } else {
    await db.insert(userLevels).values({ guildId, userId, ...data });
  }
}
async function getWarns(guildId, userId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(warns).where(and(eq2(warns.guildId, guildId), eq2(warns.userId, userId)));
  return result;
}
async function addWarn(guildId, userId, moderatorId, reason) {
  const db = await getDb();
  if (!db) return;
  await db.insert(warns).values({ guildId, userId, moderatorId, reason });
}
async function clearWarns(guildId, userId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(warns).where(and(eq2(warns.guildId, guildId), eq2(warns.userId, userId)));
}
async function getStats(guildId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(stats).where(eq2(stats.guildId, guildId)).limit(1);
  return result[0] || null;
}
async function upsertStats(guildId, data) {
  const db = await getDb();
  if (!db) return;
  const existing = await getStats(guildId);
  if (existing) {
    await db.update(stats).set(data).where(eq2(stats.guildId, guildId));
  } else {
    await db.insert(stats).values({ guildId, ...data });
  }
}
async function getKickConfig(guildId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(kickConfigs).where(eq2(kickConfigs.guildId, guildId)).limit(1);
  return result[0] || null;
}
async function upsertKickConfig(guildId, data) {
  const db = await getDb();
  if (!db) return;
  const existing = await getKickConfig(guildId);
  if (existing) {
    await db.update(kickConfigs).set(data).where(eq2(kickConfigs.guildId, guildId));
  } else {
    await db.insert(kickConfigs).values({ guildId, ...data });
  }
}
async function getActiveGiveaways() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(giveaways);
  return result.filter((g) => !g.ended);
}
async function createGiveaway(guildId, data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(giveaways).values({ guildId, ...data });
}
async function updateGiveaway(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(giveaways).set(data).where(eq2(giveaways.id, id));
}
async function getAutoReplies(guildId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(autoReplies).where(eq2(autoReplies.guildId, guildId));
  return result;
}
async function addAutoReply(guildId, trigger, reply) {
  const db = await getDb();
  if (!db) return;
  await db.insert(autoReplies).values({ guildId, trigger, reply });
}
async function deleteAutoReply(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(autoReplies).where(eq2(autoReplies.id, id));
}
async function createTicketData(guildId, channelId, ownerId, ticketType) {
  const db = await getDb();
  if (!db) return;
  await db.insert(ticketData).values({ guildId, channelId, ownerId, ticketType });
}
async function getTicketDataByChannel(guildId, channelId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(ticketData).where(and(eq2(ticketData.guildId, guildId), eq2(ticketData.channelId, channelId))).limit(1);
  return result[0] || null;
}
async function updateTicketData(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(ticketData).set(data).where(eq2(ticketData.id, id));
}
var init_db2 = __esm({
  "server/bot/db.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/_core/oauth.ts
init_db();
import { parse as parseCookieHeader2 } from "cookie";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client2) {
    this.client = client2;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client2 = createOAuthHttpClient()) {
    this.client = client2;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader2(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
init_env();
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_db2();
import { z as z2 } from "zod";

// server/bot/client.ts
import {
  Client,
  GatewayIntentBits,
  Partials
} from "discord.js";
var client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildInvites
  ],
  partials: [Partials.Message, Partials.Channel, Partials.User, Partials.GuildMember]
});
var BOT_NAME = "Aboud System";
var BOT_FOOTER = "Aboud System";

// server/routers.ts
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  dashboard: router({
    guilds: protectedProcedure.query(() => Array.from(client.guilds.cache.values()).map((guild) => ({ id: guild.id, name: guild.name, icon: guild.iconURL({ size: 64 }) })).sort((a, b) => a.name.localeCompare(b.name))),
    suggestions: router({
      get: protectedProcedure.input(z2.object({ guildId: z2.string().min(1) })).query(({ input }) => getSuggestionConfig(input.guildId)),
      save: protectedProcedure.input(z2.object({ guildId: z2.string().min(1), channelId: z2.string().nullable(), imagePath: z2.string().nullable(), emoji1Id: z2.string().nullable(), emoji2Id: z2.string().nullable() })).mutation(({ input }) => upsertSuggestionConfig(input.guildId, { channelId: input.channelId, imagePath: input.imagePath, emoji1Id: input.emoji1Id, emoji2Id: input.emoji2Id }).then(() => ({ success: true })))
    }),
    welcome: router({
      get: protectedProcedure.input(z2.object({ guildId: z2.string().min(1) })).query(({ input }) => getGuildConfig(input.guildId).then((config) => config?.welcome || null)),
      save: protectedProcedure.input(z2.object({ guildId: z2.string().min(1), config: z2.record(z2.string(), z2.any()) })).mutation(({ input }) => upsertGuildConfig(input.guildId, { welcome: input.config }).then(() => ({ success: true })))
    }),
    tickets: router({
      get: protectedProcedure.input(z2.object({ guildId: z2.string().min(1) })).query(({ input }) => getTicketConfig(input.guildId)),
      save: protectedProcedure.input(z2.object({ guildId: z2.string().min(1), config: z2.record(z2.string(), z2.any()) })).mutation(({ input }) => upsertTicketConfig(input.guildId, input.config).then(() => ({ success: true })))
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/bot/start.ts
import { REST, Routes, EmbedBuilder as EmbedBuilder2, ActionRowBuilder as ActionRowBuilder2, StringSelectMenuBuilder as StringSelectMenuBuilder2 } from "discord.js";

// server/bot/commands.ts
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
var slashCommands = [
  // 1. BAN
  new SlashCommandBuilder().setName("ban").setDescription("\u062D\u0638\u0631 \u0639\u0636\u0648 \u0645\u0646 \u0627\u0644\u0633\u064A\u0631\u0641\u0631").addUserOption((o) => o.setName("user").setDescription("\u0627\u0644\u0639\u0636\u0648 \u0627\u0644\u0645\u0631\u0627\u062F \u062D\u0638\u0631\u0647").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("\u0633\u0628\u0628 \u0627\u0644\u062D\u0638\u0631")).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  // 2. UNBAN
  new SlashCommandBuilder().setName("unban").setDescription("\u0631\u0641\u0639 \u0627\u0644\u062D\u0638\u0631 \u0639\u0646 \u0639\u0636\u0648").addStringOption((o) => o.setName("userid").setDescription("\u0627\u064A\u062F\u064A \u0627\u0644\u0639\u0636\u0648 \u0627\u0644\u0645\u062D\u0638\u0648\u0631").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  // 3. KICK
  new SlashCommandBuilder().setName("kick").setDescription("\u0637\u0631\u062F \u0639\u0636\u0648 \u0645\u0646 \u0627\u0644\u0633\u064A\u0631\u0641\u0631").addUserOption((o) => o.setName("user").setDescription("\u0627\u0644\u0639\u0636\u0648 \u0627\u0644\u0645\u0631\u0627\u062F \u0637\u0631\u062F\u0647").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("\u0633\u0628\u0628 \u0627\u0644\u0637\u0631\u062F")).setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  // 4. TIMEOUT
  new SlashCommandBuilder().setName("timeout").setDescription("\u0643\u062A\u0645 \u0639\u0636\u0648 \u0644\u0645\u062F\u0629 \u0645\u0639\u064A\u0646\u0629").addUserOption((o) => o.setName("user").setDescription("\u0627\u0644\u0639\u0636\u0648 \u0627\u0644\u0645\u0631\u0627\u062F \u0643\u062A\u0645\u0647").setRequired(true)).addStringOption((o) => o.setName("duration").setDescription("\u0627\u0644\u0645\u062F\u0629 (\u0645\u062B\u0644: 10m, 1h, 1d)").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("\u0633\u0628\u0628 \u0627\u0644\u0643\u062A\u0645")).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  // 5. UNTIMEOUT
  new SlashCommandBuilder().setName("untimeout").setDescription("\u0631\u0641\u0639 \u0627\u0644\u0643\u062A\u0645 \u0639\u0646 \u0639\u0636\u0648").addUserOption((o) => o.setName("user").setDescription("\u0627\u0644\u0639\u0636\u0648 \u0627\u0644\u0645\u0631\u0627\u062F \u0631\u0641\u0639 \u0627\u0644\u0643\u062A\u0645 \u0639\u0646\u0647").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  // 6. WARN
  new SlashCommandBuilder().setName("warn").setDescription("\u062A\u062D\u0630\u064A\u0631 \u0639\u0636\u0648").addUserOption((o) => o.setName("user").setDescription("\u0627\u0644\u0639\u0636\u0648 \u0627\u0644\u0645\u0631\u0627\u062F \u062A\u062D\u0630\u064A\u0631\u0647").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("\u0633\u0628\u0628 \u0627\u0644\u062A\u062D\u0630\u064A\u0631").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  // 7. CLEARWARNS
  new SlashCommandBuilder().setName("clearwarns").setDescription("\u0645\u0633\u062D \u062C\u0645\u064A\u0639 \u062A\u062D\u0630\u064A\u0631\u0627\u062A \u0627\u0644\u0639\u0636\u0648").addUserOption((o) => o.setName("user").setDescription("\u0627\u0644\u0639\u0636\u0648").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  // 8. ANNOUNCE
  new SlashCommandBuilder().setName("announce").setDescription("\u0646\u0634\u0631 \u0625\u0639\u0644\u0627\u0646 \u0631\u0633\u0645\u064A \u0641\u064A \u0627\u0644\u0633\u064A\u0631\u0641\u0631").addStringOption((o) => o.setName("title").setDescription("\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0625\u0639\u0644\u0627\u0646").setRequired(true)).addStringOption((o) => o.setName("message").setDescription("\u0646\u0635 \u0627\u0644\u0625\u0639\u0644\u0627\u0646").setRequired(true)).addRoleOption((o) => o.setName("role").setDescription("\u0631\u062A\u0628\u0629 \u0627\u0644\u0645\u0646\u0634\u0646")).addChannelOption((o) => o.setName("channel").setDescription("\u0642\u0646\u0627\u0629 \u0627\u0644\u0625\u0631\u0633\u0627\u0644")).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  // 9. SLOWMODE
  new SlashCommandBuilder().setName("slowmode").setDescription("\u0636\u0628\u0637 \u0627\u0644\u0633\u0644\u0648 \u0645\u0648\u062F \u0644\u0644\u0642\u0646\u0627\u0629").addIntegerOption((o) => o.setName("seconds").setDescription("\u0627\u0644\u062B\u0648\u0627\u0646\u064A (0 \u0644\u0625\u0644\u063A\u0627\u0621)").setRequired(true).setMinValue(0).setMaxValue(21600)).setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  // 10. LOCK
  new SlashCommandBuilder().setName("lock").setDescription("\u0642\u0641\u0644 \u0627\u0644\u0642\u0646\u0627\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629").addChannelOption((o) => o.setName("channel").setDescription("\u0627\u0644\u0642\u0646\u0627\u0629 (\u0627\u0641\u062A\u0631\u0627\u0636\u064A: \u0627\u0644\u062D\u0627\u0644\u064A\u0629)")).setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  // 11. UNLOCK
  new SlashCommandBuilder().setName("unlock").setDescription("\u0641\u062A\u062D \u0627\u0644\u0642\u0646\u0627\u0629 \u0627\u0644\u0645\u0642\u0641\u0648\u0644\u0629").addChannelOption((o) => o.setName("channel").setDescription("\u0627\u0644\u0642\u0646\u0627\u0629 (\u0627\u0641\u062A\u0631\u0627\u0636\u064A: \u0627\u0644\u062D\u0627\u0644\u064A\u0629)")).setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  // 12. PURGE
  new SlashCommandBuilder().setName("purge").setDescription("\u062D\u0630\u0641 \u0631\u0633\u0627\u0626\u0644 \u0628\u0627\u0644\u0643\u0645\u064A\u0629").addIntegerOption((o) => o.setName("count").setDescription("\u0639\u062F\u062F \u0627\u0644\u0631\u0633\u0627\u0626\u0644 (1-100)").setRequired(true).setMinValue(1).setMaxValue(100)).addUserOption((o) => o.setName("user").setDescription("\u062D\u0630\u0641 \u0631\u0633\u0627\u0626\u0644 \u0639\u0636\u0648 \u0645\u0639\u064A\u0646 \u0641\u0642\u0637")).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  // 13. ROLE-ADD
  new SlashCommandBuilder().setName("role-add").setDescription("\u0625\u0639\u0637\u0627\u0621 \u0631\u062A\u0628\u0629 \u0644\u0639\u0636\u0648").addUserOption((o) => o.setName("user").setDescription("\u0627\u0644\u0639\u0636\u0648").setRequired(true)).addRoleOption((o) => o.setName("role").setDescription("\u0627\u0644\u0631\u062A\u0628\u0629").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  // 14. ROLE-REMOVE
  new SlashCommandBuilder().setName("role-remove").setDescription("\u0625\u0632\u0627\u0644\u0629 \u0631\u062A\u0628\u0629 \u0645\u0646 \u0639\u0636\u0648").addUserOption((o) => o.setName("user").setDescription("\u0627\u0644\u0639\u0636\u0648").setRequired(true)).addRoleOption((o) => o.setName("role").setDescription("\u0627\u0644\u0631\u062A\u0628\u0629").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  // 15. NICK
  new SlashCommandBuilder().setName("nick").setDescription("\u062A\u063A\u064A\u064A\u0631 \u0644\u0642\u0628 \u0639\u0636\u0648").addUserOption((o) => o.setName("user").setDescription("\u0627\u0644\u0639\u0636\u0648").setRequired(true)).addStringOption((o) => o.setName("nickname").setDescription("\u0627\u0644\u0644\u0642\u0628 \u0627\u0644\u062C\u062F\u064A\u062F (\u0641\u0627\u0631\u063A \u0644\u0625\u0632\u0627\u0644\u0629)")).setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
  // 16. MUTE
  new SlashCommandBuilder().setName("mute").setDescription("\u0643\u062A\u0645 \u0639\u0636\u0648 \u0641\u064A \u0627\u0644\u0631\u0648\u0645\u0627\u062A \u0627\u0644\u0635\u0648\u062A\u064A\u0629").addUserOption((o) => o.setName("user").setDescription("\u0627\u0644\u0639\u0636\u0648").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("\u0627\u0644\u0633\u0628\u0628")).setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
  // 17. UNMUTE
  new SlashCommandBuilder().setName("unmute").setDescription("\u0631\u0641\u0639 \u0627\u0644\u0643\u062A\u0645 \u0627\u0644\u0635\u0648\u062A\u064A \u0639\u0646 \u0639\u0636\u0648").addUserOption((o) => o.setName("user").setDescription("\u0627\u0644\u0639\u0636\u0648").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
  // 18. JAIL
  new SlashCommandBuilder().setName("jail").setDescription("\u0633\u062C\u0646 \u0639\u0636\u0648 (\u0625\u0632\u0627\u0644\u0629 \u0631\u062A\u0628\u0647 \u0648\u0648\u0636\u0639\u0647 \u0641\u064A \u0631\u0648\u0645 \u0627\u0644\u0633\u062C\u0646)").addUserOption((o) => o.setName("user").setDescription("\u0627\u0644\u0639\u0636\u0648").setRequired(true)).addStringOption((o) => o.setName("duration").setDescription("\u0627\u0644\u0645\u062F\u0629 (\u0645\u062B\u0644: 10m, 1h, 1d)")).addStringOption((o) => o.setName("reason").setDescription("\u0627\u0644\u0633\u0628\u0628")).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  // 19. UNJAIL
  new SlashCommandBuilder().setName("unjail").setDescription("\u0641\u0643 \u0633\u062C\u0646 \u0639\u0636\u0648").addUserOption((o) => o.setName("user").setDescription("\u0627\u0644\u0639\u0636\u0648").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  // 20. SERVERINFO
  new SlashCommandBuilder().setName("serverinfo").setDescription("\u0639\u0631\u0636 \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0633\u064A\u0631\u0641\u0631")
].map((c) => c.toJSON());

// server/bot/interactions.ts
init_db2();
import {
  EmbedBuilder,
  PermissionFlagsBits as PermissionFlagsBits2,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";
import ms from "ms";
var EMBED_COLOR = 6514417;
var EMBED_SUCCESS = 2278750;
var EMBED_ERROR = 15680580;
var EMBED_WARN = 16096779;
function successEmbed(title, description) {
  return new EmbedBuilder().setTitle(title).setDescription(description).setColor(EMBED_SUCCESS).setTimestamp().setFooter({ text: BOT_FOOTER });
}
function errorEmbed(title, description) {
  return new EmbedBuilder().setTitle(title).setDescription(description).setColor(EMBED_ERROR).setTimestamp().setFooter({ text: BOT_FOOTER });
}
function warnEmbed(title, description) {
  return new EmbedBuilder().setTitle(title).setDescription(description).setColor(EMBED_WARN).setTimestamp().setFooter({ text: BOT_FOOTER });
}
async function sendLog(guild, type, embed) {
  const config = await getGuildConfig(guild.id);
  if (!config?.logs) return;
  const logConfig = config.logs?.[type];
  if (!logConfig?.enabled || !logConfig?.channel) return;
  const logChannel = guild.channels.cache.get(logConfig.channel);
  if (!logChannel) return;
  logChannel.send({ embeds: [embed] }).catch(() => {
  });
}
async function handleInteraction(interaction) {
  try {
    if (!interaction.guild) return;
    if (interaction.isChatInputCommand()) {
      const { commandName, options, member, guild } = interaction;
      switch (commandName) {
        // 1. BAN
        case "ban": {
          const target = options.getMember("user");
          const reason = options.getString("reason") || "\u0628\u062F\u0648\u0646 \u0633\u0628\u0628";
          if (!target) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0627\u0644\u0639\u0636\u0648 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F")], ephemeral: true });
          if (!target.bannable) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0644\u0627 \u064A\u0645\u0643\u0646\u0646\u064A \u062D\u0638\u0631 \u0647\u0630\u0627 \u0627\u0644\u0639\u0636\u0648")], ephemeral: true });
          await target.ban({ reason });
          await interaction.reply({ embeds: [successEmbed("\u062A\u0645 \u0627\u0644\u062D\u0638\u0631", `\u062A\u0645 \u062D\u0638\u0631 <@${target.id}> | \u0627\u0644\u0633\u0628\u0628: ${reason}`)] });
          const logEmbed = new EmbedBuilder().setTitle("\u0639\u0636\u0648 \u0645\u062D\u0638\u0648\u0631").setColor(EMBED_ERROR).addFields({ name: "\u0627\u0644\u0639\u0636\u0648", value: `<@${target.id}>`, inline: true }, { name: "\u0628\u0648\u0627\u0633\u0637\u0629", value: `<@${member.id}>`, inline: true }, { name: "\u0627\u0644\u0633\u0628\u0628", value: reason, inline: true }).setTimestamp();
          await sendLog(guild, "moderation", logEmbed);
          await upsertStats(guild.id, { modActions: { bans: (await getStats(guild.id))?.modActions?.bans + 1 || 1 } });
          break;
        }
        // 2. UNBAN
        case "unban": {
          const userId = options.getString("userid");
          const reason = options.getString("reason") || "\u0628\u062F\u0648\u0646 \u0633\u0628\u0628";
          try {
            await guild.bans.remove(userId, reason);
            await interaction.reply({ embeds: [successEmbed("\u062A\u0645 \u0631\u0641\u0639 \u0627\u0644\u062D\u0638\u0631", `\u062A\u0645 \u0631\u0641\u0639 \u0627\u0644\u062D\u0638\u0631 \u0639\u0646 <@${userId}>`)] });
            const logEmbed = new EmbedBuilder().setTitle("\u0631\u0641\u0639 \u062D\u0638\u0631").setColor(EMBED_SUCCESS).addFields({ name: "\u0627\u0644\u0639\u0636\u0648", value: `<@${userId}>`, inline: true }, { name: "\u0628\u0648\u0627\u0633\u0637\u0629", value: `<@${member.id}>`, inline: true }).setTimestamp();
            await sendLog(guild, "moderation", logEmbed);
          } catch {
            interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u0639\u0636\u0648 \u0641\u064A \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062D\u0638\u0631")], ephemeral: true });
          }
          break;
        }
        // 3. KICK
        case "kick": {
          const target = options.getMember("user");
          const reason = options.getString("reason") || "\u0628\u062F\u0648\u0646 \u0633\u0628\u0628";
          if (!target) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0627\u0644\u0639\u0636\u0648 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F")], ephemeral: true });
          if (!target.kickable) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0644\u0627 \u064A\u0645\u0643\u0646\u0646\u064A \u0637\u0631\u062F \u0647\u0630\u0627 \u0627\u0644\u0639\u0636\u0648")], ephemeral: true });
          await target.kick(reason);
          await interaction.reply({ embeds: [successEmbed("\u062A\u0645 \u0627\u0644\u0637\u0631\u062F", `\u062A\u0645 \u0637\u0631\u062F <@${target.id}> | \u0627\u0644\u0633\u0628\u0628: ${reason}`)] });
          const logEmbed = new EmbedBuilder().setTitle("\u0639\u0636\u0648 \u0645\u0637\u0631\u0648\u062F").setColor(EMBED_WARN).addFields({ name: "\u0627\u0644\u0639\u0636\u0648", value: `<@${target.id}>`, inline: true }, { name: "\u0628\u0648\u0627\u0633\u0637\u0629", value: `<@${member.id}>`, inline: true }, { name: "\u0627\u0644\u0633\u0628\u0628", value: reason, inline: true }).setTimestamp();
          await sendLog(guild, "moderation", logEmbed);
          break;
        }
        // 4. TIMEOUT
        case "timeout": {
          const target = options.getMember("user");
          const durationStr = options.getString("duration");
          const reason = options.getString("reason") || "\u0628\u062F\u0648\u0646 \u0633\u0628\u0628";
          const durationMs = Number(ms(durationStr) || 0);
          if (!durationMs || durationMs > 24192e5) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0645\u062F\u0629 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629 (\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 28 \u064A\u0648\u0645)")], ephemeral: true });
          if (!target) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0627\u0644\u0639\u0636\u0648 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F")], ephemeral: true });
          await target.timeout(durationMs, reason);
          await interaction.reply({ embeds: [successEmbed("\u062A\u0645 \u0627\u0644\u0643\u062A\u0645", `\u062A\u0645 \u0643\u062A\u0645 <@${target.id}> \u0644\u0645\u062F\u0629 ${durationStr} | \u0627\u0644\u0633\u0628\u0628: ${reason}`)] });
          const logEmbed = new EmbedBuilder().setTitle("\u0639\u0636\u0648 \u0645\u0643\u062A\u0648\u0645").setColor(EMBED_WARN).addFields({ name: "\u0627\u0644\u0639\u0636\u0648", value: `<@${target.id}>`, inline: true }, { name: "\u0627\u0644\u0645\u062F\u0629", value: durationStr, inline: true }, { name: "\u0628\u0648\u0627\u0633\u0637\u0629", value: `<@${member.id}>`, inline: true }).setTimestamp();
          await sendLog(guild, "moderation", logEmbed);
          break;
        }
        // 5. UNTIMEOUT
        case "untimeout": {
          const target = options.getMember("user");
          if (!target) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0627\u0644\u0639\u0636\u0648 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F")], ephemeral: true });
          await target.timeout(null);
          await interaction.reply({ embeds: [successEmbed("\u062A\u0645 \u0631\u0641\u0639 \u0627\u0644\u0643\u062A\u0645", `\u062A\u0645 \u0631\u0641\u0639 \u0627\u0644\u0643\u062A\u0645 \u0639\u0646 <@${target.id}>`)] });
          const logEmbed = new EmbedBuilder().setTitle("\u0631\u0641\u0639 \u0627\u0644\u0643\u062A\u0645").setColor(EMBED_SUCCESS).addFields({ name: "\u0627\u0644\u0639\u0636\u0648", value: `<@${target.id}>`, inline: true }, { name: "\u0628\u0648\u0627\u0633\u0637\u0629", value: `<@${member.id}>`, inline: true }).setTimestamp();
          await sendLog(guild, "moderation", logEmbed);
          break;
        }
        // 6. WARN
        case "warn": {
          const target = options.getUser("user");
          const reason = options.getString("reason");
          if (!target) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0627\u0644\u0639\u0636\u0648 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F")], ephemeral: true });
          await addWarn(guild.id, target.id, member.id, reason);
          const userWarns = await getWarns(guild.id, target.id);
          await interaction.reply({ embeds: [warnEmbed("\u062A\u062D\u0630\u064A\u0631", `\u062A\u0645 \u062A\u062D\u0630\u064A\u0631 <@${target.id}> | \u0627\u0644\u0633\u0628\u0628: ${reason}
\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u062A\u062D\u0630\u064A\u0631\u0627\u062A: ${userWarns.length}`)] });
          const logEmbed = new EmbedBuilder().setTitle("\u062A\u062D\u0630\u064A\u0631 \u0639\u0636\u0648").setColor(EMBED_WARN).addFields({ name: "\u0627\u0644\u0639\u0636\u0648", value: `<@${target.id}>`, inline: true }, { name: "\u0628\u0648\u0627\u0633\u0637\u0629", value: `<@${member.id}>`, inline: true }, { name: "\u0627\u0644\u0633\u0628\u0628", value: reason, inline: true }).setTimestamp();
          await sendLog(guild, "moderation", logEmbed);
          break;
        }
        // 7. CLEARWARNS
        case "clearwarns": {
          const target = options.getUser("user");
          if (!target) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0627\u0644\u0639\u0636\u0648 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F")], ephemeral: true });
          await clearWarns(guild.id, target.id);
          await interaction.reply({ embeds: [successEmbed("\u062A\u0645 \u0627\u0644\u0645\u0633\u062D", `\u062A\u0645 \u0645\u0633\u062D \u062C\u0645\u064A\u0639 \u062A\u062D\u0630\u064A\u0631\u0627\u062A <@${target.id}>`)] });
          break;
        }
        // 8. ANNOUNCE
        case "announce": {
          const title = options.getString("title");
          const message = options.getString("message");
          const role = options.getRole("role");
          const channel = options.getChannel("channel") || interaction.channel;
          if (!channel || channel.type !== ChannelType.GuildText) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0627\u0644\u0642\u0646\u0627\u0629 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629")], ephemeral: true });
          const embed = new EmbedBuilder().setTitle(`\u{1F4E2} ${title}`).setDescription(message).setColor(EMBED_COLOR).setTimestamp().setFooter({ text: `${BOT_FOOTER} \u2022 ${member.user.tag}` });
          const content = role ? `${role}` : "";
          await channel.send({ content, embeds: [embed] });
          await interaction.reply({ embeds: [successEmbed("\u062A\u0645 \u0627\u0644\u0646\u0634\u0631", `\u062A\u0645 \u0646\u0634\u0631 \u0627\u0644\u0625\u0639\u0644\u0627\u0646 \u0641\u064A ${channel}`)], ephemeral: true });
          break;
        }
        // 9. SLOWMODE
        case "slowmode": {
          const seconds = options.getInteger("seconds");
          const channel = options.getChannel("channel") || interaction.channel;
          if (!channel || typeof channel.setRateLimitPerUser !== "function") {
            return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0627\u062E\u062A\u0631 \u0642\u0646\u0627\u0629 \u0646\u0635\u064A\u0629 \u0635\u0627\u0644\u062D\u0629")], ephemeral: true });
          }
          await channel.setRateLimitPerUser(seconds);
          await interaction.reply({ embeds: [successEmbed("\u062A\u0645 \u0627\u0644\u0636\u0628\u0637", `\u062A\u0645 \u0636\u0628\u0637 \u0627\u0644\u0633\u0644\u0648 \u0645\u0648\u062F \u0639\u0644\u0649 ${seconds} \u062B\u0627\u0646\u064A\u0629 \u0641\u064A ${channel}`)] });
          break;
        }
        // 10. LOCK
        case "lock": {
          const channel = options.getChannel("channel") || interaction.channel;
          if (channel && channel.permissionOverwrites) {
            await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
            await interaction.reply({ embeds: [successEmbed("\u062A\u0645 \u0627\u0644\u0642\u0641\u0644", `\u062A\u0645 \u0642\u0641\u0644 ${channel}`)] });
          }
          break;
        }
        // 11. UNLOCK
        case "unlock": {
          const channel = options.getChannel("channel") || interaction.channel;
          if (channel && channel.permissionOverwrites) {
            await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: true });
            await interaction.reply({ embeds: [successEmbed("\u062A\u0645 \u0627\u0644\u0641\u062A\u062D", `\u062A\u0645 \u0641\u062A\u062D ${channel}`)] });
          }
          break;
        }
        // 12. PURGE
        case "purge": {
          const count = options.getInteger("count");
          const user = options.getUser("user");
          const channel = interaction.channel;
          if (!channel?.messages) return;
          let messages = [];
          if (user) {
            const filtered = (await channel.messages.fetch({ limit: 100 })).filter((m) => m.author.id === user.id).first(count);
            messages = await channel.bulkDelete(filtered, true);
          } else {
            messages = await channel.messages.bulkDelete(count, true);
          }
          const deleted = messages?.size ?? messages?.length ?? 0;
          await interaction.reply({ embeds: [successEmbed("\u062A\u0645 \u0627\u0644\u062D\u0630\u0641", `\u062A\u0645 \u062D\u0630\u0641 ${deleted} \u0631\u0633\u0627\u0644\u0629`)], ephemeral: true });
          break;
        }
        // 13. ROLE-ADD
        case "role-add": {
          const target = options.getMember("user");
          const role = options.getRole("role");
          if (!target || !role) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0627\u0644\u0639\u0636\u0648 \u0623\u0648 \u0627\u0644\u0631\u062A\u0628\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629")], ephemeral: true });
          await target.roles.add(role);
          await interaction.reply({ embeds: [successEmbed("\u062A\u0645 \u0627\u0644\u0625\u0636\u0627\u0641\u0629", `\u062A\u0645 \u0625\u0639\u0637\u0627\u0621 \u0631\u062A\u0628\u0629 ${role} \u0625\u0644\u0649 <@${target.id}>`)] });
          break;
        }
        // 14. ROLE-REMOVE
        case "role-remove": {
          const target = options.getMember("user");
          const role = options.getRole("role");
          if (!target || !role) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0627\u0644\u0639\u0636\u0648 \u0623\u0648 \u0627\u0644\u0631\u062A\u0628\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629")], ephemeral: true });
          await target.roles.remove(role);
          await interaction.reply({ embeds: [successEmbed("\u062A\u0645 \u0627\u0644\u0625\u0632\u0627\u0644\u0629", `\u062A\u0645 \u0625\u0632\u0627\u0644\u0629 \u0631\u062A\u0628\u0629 ${role} \u0645\u0646 <@${target.id}>`)] });
          break;
        }
        // 15. NICK
        case "nick": {
          const target = options.getMember("user");
          const nickname = options.getString("nickname") || null;
          if (!target) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0627\u0644\u0639\u0636\u0648 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F")], ephemeral: true });
          await target.setNickname(nickname);
          await interaction.reply({ embeds: [successEmbed("\u062A\u0645 \u0627\u0644\u062A\u063A\u064A\u064A\u0631", `\u062A\u0645 \u062A\u063A\u064A\u064A\u0631 \u0644\u0642\u0628 <@${target.id}> \u0625\u0644\u0649: ${nickname || "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0623\u0635\u0644\u064A"}`)] });
          break;
        }
        // 16. MUTE
        case "mute": {
          const target = options.getMember("user");
          const reason = options.getString("reason") || "\u0628\u062F\u0648\u0646 \u0633\u0628\u0628";
          if (!target) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0627\u0644\u0639\u0636\u0648 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F")], ephemeral: true });
          await target.voice.setMute(true, reason);
          await interaction.reply({ embeds: [successEmbed("\u062A\u0645 \u0627\u0644\u0643\u062A\u0645", `\u062A\u0645 \u0643\u062A\u0645 <@${target.id}> \u0635\u0648\u062A\u064A\u0627\u064B | \u0627\u0644\u0633\u0628\u0628: ${reason}`)] });
          break;
        }
        // 17. UNMUTE
        case "unmute": {
          const target = options.getMember("user");
          if (!target) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0627\u0644\u0639\u0636\u0648 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F")], ephemeral: true });
          await target.voice.setMute(false);
          await interaction.reply({ embeds: [successEmbed("\u062A\u0645 \u0631\u0641\u0639 \u0627\u0644\u0643\u062A\u0645", `\u062A\u0645 \u0631\u0641\u0639 \u0627\u0644\u0643\u062A\u0645 \u0627\u0644\u0635\u0648\u062A\u064A \u0639\u0646 <@${target.id}>`)] });
          break;
        }
        // 18. JAIL
        case "jail": {
          const target = options.getMember("user");
          const durationStr = options.getString("duration");
          const reason = options.getString("reason") || "\u0628\u062F\u0648\u0646 \u0633\u0628\u0628";
          if (!target) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0627\u0644\u0639\u0636\u0648 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F")], ephemeral: true });
          const modConfig = await getModConfig(guild.id);
          const jailConfig = modConfig?.jail || {};
          if (!jailConfig.roleId) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0646\u0638\u0627\u0645 \u0627\u0644\u0633\u062C\u0646 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623. \u064A\u0631\u062C\u0649 \u0636\u0628\u0637\u0647 \u0645\u0646 \u0627\u0644\u062F\u0627\u0634\u0628\u0648\u0631\u062F")], ephemeral: true });
          const oldRoles = target.roles.cache.filter((r) => r.id !== guild.roles.everyone.id).map((r) => r.id);
          for (const roleId of oldRoles) {
            await target.roles.remove(roleId).catch(() => {
            });
          }
          await target.roles.add(jailConfig.roleId).catch(() => {
          });
          let endAt = null;
          if (durationStr) {
            const durationMs = Number(ms(durationStr) || 0);
            if (durationMs) endAt = new Date(Date.now() + durationMs);
          }
          await createJailData(guild.id, target.id, oldRoles, endAt);
          await interaction.reply({ embeds: [successEmbed("\u062A\u0645 \u0627\u0644\u0633\u062C\u0646", `\u062A\u0645 \u0633\u062C\u0646 <@${target.id}> | \u0627\u0644\u0633\u0628\u0628: ${reason}${durationStr ? ` | \u0627\u0644\u0645\u062F\u0629: ${durationStr}` : ""}`)] });
          const logEmbed = new EmbedBuilder().setTitle("\u0639\u0636\u0648 \u0645\u0633\u062C\u0648\u0646").setColor(EMBED_ERROR).addFields({ name: "\u0627\u0644\u0639\u0636\u0648", value: `<@${target.id}>`, inline: true }, { name: "\u0628\u0648\u0627\u0633\u0637\u0629", value: `<@${member.id}>`, inline: true }, { name: "\u0627\u0644\u0633\u0628\u0628", value: reason, inline: true }).setTimestamp();
          await sendLog(guild, "moderation", logEmbed);
          break;
        }
        // 19. UNJAIL
        case "unjail": {
          const target = options.getMember("user");
          if (!target) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0627\u0644\u0639\u0636\u0648 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F")], ephemeral: true });
          const jailRecord = await getJailData(guild.id, target.id);
          const modConfig = await getModConfig(guild.id);
          if (!jailRecord) return interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u0647\u0630\u0627 \u0627\u0644\u0639\u0636\u0648 \u0644\u064A\u0633 \u0645\u0633\u062C\u0648\u0646\u0627\u064B")], ephemeral: true });
          const jailConfig = modConfig?.jail || {};
          if (jailConfig.roleId) {
            await target.roles.remove(jailConfig.roleId).catch(() => {
            });
          }
          const oldRoles = jailRecord.oldRoles || [];
          for (const roleId of oldRoles) {
            if (guild.roles.cache.has(roleId)) {
              await target.roles.add(roleId).catch(() => {
              });
            }
          }
          await deleteJailData(guild.id, target.id);
          await interaction.reply({ embeds: [successEmbed("\u062A\u0645 \u0641\u0643 \u0627\u0644\u0633\u062C\u0646", `\u062A\u0645 \u0641\u0643 \u0633\u062C\u0646 <@${target.id}> \u0648\u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0631\u062A\u0628\u0647`)] });
          const logEmbed = new EmbedBuilder().setTitle("\u0641\u0643 \u0627\u0644\u0633\u062C\u0646").setColor(EMBED_SUCCESS).addFields({ name: "\u0627\u0644\u0639\u0636\u0648", value: `<@${target.id}>`, inline: true }, { name: "\u0628\u0648\u0627\u0633\u0637\u0629", value: `<@${member.id}>`, inline: true }).setTimestamp();
          await sendLog(guild, "moderation", logEmbed);
          break;
        }
        // 20. SERVERINFO
        case "serverinfo": {
          const g = guild;
          const embed = new EmbedBuilder().setTitle(`\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0633\u064A\u0631\u0641\u0631: ${g.name}`).setColor(EMBED_COLOR).setThumbnail(g.iconURL()).addFields(
            { name: "\u0627\u0644\u0645\u0627\u0644\u0643", value: `<@${g.ownerId}>`, inline: true },
            { name: "\u0627\u0644\u0623\u0639\u0636\u0627\u0621", value: `${g.memberCount}`, inline: true },
            { name: "\u0627\u0644\u0642\u0646\u0648\u0627\u062A", value: `${g.channels.cache.size}`, inline: true },
            { name: "\u0627\u0644\u0631\u062A\u0628", value: `${g.roles.cache.size}`, inline: true },
            { name: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0625\u0646\u0634\u0627\u0621", value: `<t:${Math.floor(g.createdTimestamp / 1e3)}:F>`, inline: true },
            { name: "\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u062A\u0639\u0632\u064A\u0632", value: `${g.premiumTier}`, inline: true }
          ).setTimestamp().setFooter({ text: BOT_FOOTER });
          await interaction.reply({ embeds: [embed] });
          break;
        }
      }
      return;
    }
    if (interaction.isStringSelectMenu() && interaction.customId === "suggestion_menu") {
      const action = interaction.values[0];
      const message = interaction.message;
      if (action === "reply") {
        const modal = new ModalBuilder().setCustomId("suggestion_reply_modal").setTitle("\u0627\u0644\u0631\u062F \u0639\u0644\u0649 \u0627\u0644\u0627\u0642\u062A\u0631\u0627\u062D");
        const replyInput = new TextInputBuilder().setCustomId("reply_text").setLabel("\u0627\u0643\u062A\u0628 \u0631\u062F \u0627\u0644\u0625\u062F\u0627\u0631\u0629").setStyle(TextInputStyle.Paragraph).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(replyInput));
        await interaction.showModal(modal);
      } else if (action === "delete") {
        await message.delete().catch(() => {
        });
      } else if (action === "accept") {
        const embed = message.embeds[0];
        if (embed) {
          const newEmbed = EmbedBuilder.from(embed).setColor(EMBED_SUCCESS).setDescription((embed.description || "") + "\n\n\u2705 **\u062A\u0645\u062A \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649 \u0627\u0644\u0627\u0642\u062A\u0631\u0627\u062D**");
          await message.edit({ embeds: [newEmbed], components: [] });
          await message.reactions.removeAll().catch(() => {
          });
        }
        await interaction.reply({ content: "\u062A\u0645 \u0642\u0628\u0648\u0644 \u0627\u0644\u0627\u0642\u062A\u0631\u0627\u062D!", ephemeral: true });
      }
      return;
    }
    if (interaction.isModalSubmit() && interaction.customId === "suggestion_reply_modal") {
      const replyText = interaction.fields.getTextInputValue("reply_text");
      const message = interaction.message;
      if (message) {
        const thread = await message.channel.threads.create({
          name: `\u0631\u062F \u0627\u0644\u0625\u062F\u0627\u0631\u0629 - \u0627\u0642\u062A\u0631\u0627\u062D`,
          autoArchiveDuration: 60,
          type: ChannelType.PrivateThread
        }).catch(() => null);
        if (thread) {
          await thread.members.add(interaction.user.id);
          const replyEmbed = new EmbedBuilder().setTitle("\u0631\u062F \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u0627\u0642\u062A\u0631\u0627\u062D").setDescription(replyText).setColor(EMBED_COLOR).setTimestamp().setFooter({ text: `${BOT_FOOTER} \u2022 ${interaction.user.tag}` });
          await thread.send({ embeds: [replyEmbed] });
        }
        const embed = message.embeds[0];
        if (embed && thread) {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`view_reply_${thread.id}`).setLabel("\u0639\u0631\u0636 \u0631\u062F \u0627\u0644\u0625\u062F\u0627\u0631\u0629").setStyle(ButtonStyle.Primary).setEmoji("\u{1F441}\uFE0F")
          );
          const existingComponents = message.components.filter((c) => c.type === 3);
          await message.edit({ components: [row, ...existingComponents] });
        }
      }
      await interaction.reply({ content: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u062F!", ephemeral: true });
      return;
    }
    if (interaction.isButton() && interaction.customId.startsWith("view_reply_")) {
      const threadId = interaction.customId.replace("view_reply_", "");
      const thread = interaction.channel.threads.cache.get(threadId);
      if (thread) {
        await thread.members.add(interaction.user.id).catch(() => {
        });
        await interaction.reply({ content: `\u062A\u0645 \u0645\u0646\u062D\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0644\u0631\u062F: ${thread}`, ephemeral: true });
      } else {
        await interaction.reply({ content: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0631\u062F", ephemeral: true });
      }
      return;
    }
    if (interaction.isButton() && interaction.customId.startsWith("ticket_btn_")) {
      const ticketConfig = await getGuildConfig(interaction.guild.id);
      const ticketIndex = parseInt(interaction.customId.replace("ticket_btn_", ""));
      const config = await Promise.resolve().then(() => (init_db2(), db_exports2)).then((m) => m.getTicketConfig(interaction.guild.id));
      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: null,
        permissionOverwrites: [
          { id: interaction.guild.roles.everyone, deny: [PermissionFlagsBits2.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits2.ViewChannel, PermissionFlagsBits2.SendMessages, PermissionFlagsBits2.ReadMessageHistory] },
          ...config?.adminRole ? [{ id: config.adminRole, allow: [PermissionFlagsBits2.ViewChannel, PermissionFlagsBits2.SendMessages, PermissionFlagsBits2.ReadMessageHistory] }] : []
        ]
      });
      await Promise.resolve().then(() => (init_db2(), db_exports2)).then((m) => m.createTicketData(interaction.guild.id, channel.id, interaction.user.id, `\u062A\u0630\u0643\u0631\u0629 ${ticketIndex + 1}`));
      const ticketEmbed = new EmbedBuilder().setTitle(config?.title || "\u062A\u0630\u0643\u0631\u0629 \u062F\u0639\u0645").setDescription(config?.description || "\u0645\u0631\u062D\u0628\u0627\u064B\u060C \u0643\u064A\u0641 \u064A\u0645\u0643\u0646\u0646\u0627 \u0645\u0633\u0627\u0639\u062F\u062A\u0643\u061F").setColor(EMBED_COLOR).setTimestamp().setFooter({ text: BOT_FOOTER });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket_close").setLabel("\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u062A\u0630\u0643\u0631\u0629").setStyle(ButtonStyle.Danger).setEmoji("\u{1F512}"),
        new ButtonBuilder().setCustomId("ticket_claim").setLabel("\u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u062A\u0630\u0643\u0631\u0629").setStyle(ButtonStyle.Success).setEmoji("\u270B")
      );
      await channel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed], components: [row] });
      await interaction.reply({ content: `\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u062A\u0630\u0643\u0631\u062A\u0643: ${channel}`, ephemeral: true });
      return;
    }
    if (interaction.isButton() && interaction.customId === "ticket_close") {
      const channel = interaction.channel;
      await channel.delete().catch(() => {
      });
      return;
    }
    if (interaction.isButton() && interaction.customId === "ticket_claim") {
      const embed = interaction.message.embeds[0];
      if (embed) {
        const newEmbed = EmbedBuilder.from(embed).setDescription((embed.description || "") + `

\u270B \u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u062A\u0630\u0643\u0631\u0629 \u0628\u0648\u0627\u0633\u0637\u0629 <@${interaction.user.id}>`);
        await interaction.message.edit({ embeds: [newEmbed] });
      }
      await interaction.reply({ content: "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u062A\u0630\u0643\u0631\u0629!", ephemeral: true });
      return;
    }
    if (interaction.isStringSelectMenu() && interaction.customId === "ticket_menu") {
      const optIndex = parseInt(interaction.values[0].replace("ticket_opt_", ""));
      const config = await Promise.resolve().then(() => (init_db2(), db_exports2)).then((m) => m.getTicketConfig(interaction.guild.id));
      const menuOptions = config?.menuOptions || [];
      const label = menuOptions[optIndex]?.label || "\u062A\u0630\u0643\u0631\u0629";
      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.roles.everyone, deny: [PermissionFlagsBits2.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits2.ViewChannel, PermissionFlagsBits2.SendMessages, PermissionFlagsBits2.ReadMessageHistory] },
          ...config?.adminRole ? [{ id: config.adminRole, allow: [PermissionFlagsBits2.ViewChannel, PermissionFlagsBits2.SendMessages, PermissionFlagsBits2.ReadMessageHistory] }] : []
        ]
      });
      await Promise.resolve().then(() => (init_db2(), db_exports2)).then((m) => m.createTicketData(interaction.guild.id, channel.id, interaction.user.id, label));
      const ticketEmbed = new EmbedBuilder().setTitle(config?.title || "\u062A\u0630\u0643\u0631\u0629 \u062F\u0639\u0645").setDescription(config?.description || "\u0645\u0631\u062D\u0628\u0627\u064B\u060C \u0643\u064A\u0641 \u064A\u0645\u0643\u0646\u0646\u0627 \u0645\u0633\u0627\u0639\u062F\u062A\u0643\u061F").setColor(EMBED_COLOR).setTimestamp().setFooter({ text: BOT_FOOTER });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket_close").setLabel("\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u062A\u0630\u0643\u0631\u0629").setStyle(ButtonStyle.Danger).setEmoji("\u{1F512}"),
        new ButtonBuilder().setCustomId("ticket_claim").setLabel("\u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u062A\u0630\u0643\u0631\u0629").setStyle(ButtonStyle.Success).setEmoji("\u270B")
      );
      await channel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed], components: [row] });
      await interaction.reply({ content: `\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u062A\u0630\u0643\u0631\u062A\u0643: ${channel}`, ephemeral: true });
      return;
    }
    if (interaction.isButton() && interaction.customId.startsWith("role_assign_")) {
      const roleId = interaction.customId.replace("role_assign_", "");
      const member = interaction.member;
      if (member.roles.cache.has(roleId)) {
        await member.roles.remove(roleId);
        await interaction.reply({ content: `\u062A\u0645 \u0625\u0632\u0627\u0644\u0629 \u0631\u062A\u0628\u0629 <@&${roleId}>`, ephemeral: true });
      } else {
        await member.roles.add(roleId);
        await interaction.reply({ content: `\u062A\u0645 \u0625\u0639\u0637\u0627\u0621 \u0631\u062A\u0628\u0629 <@&${roleId}>`, ephemeral: true });
      }
      return;
    }
  } catch (err) {
    console.error("[Interaction Error]", err);
    if (interaction.isRepliable() && !interaction.replied) {
      interaction.reply({ embeds: [errorEmbed("\u062E\u0637\u0623", "\u062D\u062F\u062B \u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639")], ephemeral: true }).catch(() => {
      });
    }
  }
}

// server/bot/start.ts
init_db2();
var started = false;
function parseEmoji(id) {
  if (!id) return null;
  const clean = id.trim();
  if (/^\d+$/.test(clean)) return { id: clean };
  return clean;
}
async function registerCommands() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!token || !clientId) {
    console.warn("[Aboud System] DISCORD_TOKEN or DISCORD_CLIENT_ID is missing; Discord startup skipped.");
    return;
  }
  const rest = new REST({ version: "10" }).setToken(token);
  const guildId = process.env.DISCORD_GUILD_ID;
  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: slashCommands });
    console.log(`[${BOT_NAME}] Registered 20 commands for guild ${guildId}`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body: slashCommands });
    console.log(`[${BOT_NAME}] Registered 20 global commands`);
  }
}
async function handleSuggestion(message) {
  if (!message.guild || message.author.bot || !message.content.trim()) return false;
  const config = await getSuggestionConfig(message.guild.id);
  if (!config?.channelId || message.channel.id !== config.channelId) return false;
  const emoji1 = parseEmoji(config.emoji1Id);
  const emoji2 = parseEmoji(config.emoji2Id);
  const embed = new EmbedBuilder2().setTitle("\u0627\u0642\u062A\u0631\u0627\u062D \u062C\u062F\u064A\u062F").setDescription(message.content).setColor(8141549).addFields(
    { name: "\u0635\u0627\u062D\u0628 \u0627\u0644\u0627\u0642\u062A\u0631\u0627\u062D", value: `${message.author}`, inline: true },
    { name: "\u0627\u0644\u062A\u0635\u0648\u064A\u062A", value: `${emoji1 ? "0" : "\u2014"} \u0645\u0624\u064A\u062F  \u2022  ${emoji2 ? "0" : "\u2014"} \u0645\u0639\u0627\u0631\u0636`, inline: true }
  ).setTimestamp().setFooter({ text: BOT_FOOTER });
  if (config.imagePath) embed.setImage(config.imagePath);
  const menu = new StringSelectMenuBuilder2().setCustomId("suggestion_menu").setPlaceholder("\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0627\u0642\u062A\u0631\u0627\u062D").addOptions(
    { label: "\u0627\u0644\u0631\u062F \u0639\u0644\u0649 \u0627\u0644\u0627\u0642\u062A\u0631\u0627\u062D", value: "reply", description: "\u0641\u062A\u062D \u0631\u062F \u062E\u0627\u0635 \u0644\u0644\u0625\u062F\u0627\u0631\u0629" },
    { label: "\u062D\u0630\u0641 \u0627\u0644\u0627\u0642\u062A\u0631\u0627\u062D", value: "delete", description: "\u062D\u0630\u0641 \u0627\u0644\u0627\u0642\u062A\u0631\u0627\u062D \u0628\u0627\u0644\u0643\u0627\u0645\u0644" },
    { label: "\u0642\u0628\u0648\u0644 \u0627\u0644\u0627\u0642\u062A\u0631\u0627\u062D", value: "accept", description: "\u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u0627\u0642\u062A\u0631\u0627\u062D \u0648\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u0625\u062C\u0631\u0627\u0621\u0627\u062A" }
  );
  const sent = await message.channel.send({ embeds: [embed], components: [new ActionRowBuilder2().addComponents(menu)] });
  if (emoji1) await sent.react(emoji1).catch(() => {
  });
  if (emoji2) await sent.react(emoji2).catch(() => {
  });
  await message.delete().catch(() => {
  });
  return true;
}
function wireEvents() {
  client.on("interactionCreate", handleInteraction);
  client.on("messageCreate", async (message) => {
    try {
      if (await handleSuggestion(message)) return;
      if (!message.guild || message.author.bot) return;
      const replies = await getAutoReplies(message.guild.id);
      const hit = replies.find((item) => message.content.toLowerCase().includes(item.trigger.toLowerCase()));
      if (hit) await message.reply(hit.reply).catch(() => {
      });
      await upsertStats(message.guild.id, { lastUpdate: /* @__PURE__ */ new Date() });
      const config = await getGuildConfig(message.guild.id);
      if (config?.levels && config.levels.enabled) {
        await upsertUserLevel(message.guild.id, message.author.id, { xp: 10, msgCount: 1, lastMessageDate: /* @__PURE__ */ new Date() });
      }
    } catch (error) {
      console.error("[Aboud System] messageCreate error", error);
    }
  });
  client.on("guildMemberAdd", async (member) => {
    const config = await getGuildConfig(member.guild.id);
    const welcome = config?.welcome || {};
    if (!welcome.enabled || !welcome.channel) return;
    const channel = member.guild.channels.cache.get(welcome.channel);
    if (!channel?.send) return;
    const description = String(welcome.embedMessage || "\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643 {member} \u0641\u064A \u0633\u064A\u0631\u0641\u0631 {guild}!").replaceAll("{member}", `${member}`).replaceAll("{guild}", member.guild.name).replaceAll("{count}", String(member.guild.memberCount));
    const embed = new EmbedBuilder2().setTitle("\u0639\u0636\u0648 \u062C\u062F\u064A\u062F \u0627\u0646\u0636\u0645 \u0625\u0644\u064A\u0646\u0627").setDescription(description).setColor(440020).setThumbnail(member.user.displayAvatarURL()).setTimestamp().setFooter({ text: `${BOT_FOOTER} \u2022 \u0627\u0644\u0639\u0636\u0648 \u0631\u0642\u0645 ${member.guild.memberCount}` });
    if (welcome.bannerURL) embed.setImage(welcome.bannerURL);
    await channel.send({ embeds: [embed] }).catch(() => {
    });
  });
  const refreshSuggestionVotes = async (reaction) => {
    try {
      const message = reaction.message;
      if (!message.guild || reaction.emoji.name === null && reaction.emoji.id === null) return;
      const config = await getSuggestionConfig(message.guild.id);
      if (!config || message.channel.id !== config.channelId || !message.embeds?.[0]) return;
      const embed = EmbedBuilder2.from(message.embeds[0]);
      const first = parseEmoji(config.emoji1Id);
      const second = parseEmoji(config.emoji2Id);
      const count = (value2) => Math.max(0, (value2?.count || 1) - (value2?.me ? 1 : 0));
      const firstReaction = message.reactions.cache.find((r) => first && typeof first === "object" ? r.emoji.id === first.id : r.emoji.name === first);
      const secondReaction = message.reactions.cache.find((r) => second && typeof second === "object" ? r.emoji.id === second.id : r.emoji.name === second);
      const fields = embed.data.fields || [];
      const voteField = fields.findIndex((field) => field.name === "\u0627\u0644\u062A\u0635\u0648\u064A\u062A");
      const value = `${first ? count(firstReaction) : "\u2014"} \u0645\u0624\u064A\u062F  \u2022  ${second ? count(secondReaction) : "\u2014"} \u0645\u0639\u0627\u0631\u0636`;
      if (voteField >= 0) fields[voteField] = { ...fields[voteField], value };
      else fields.push({ name: "\u0627\u0644\u062A\u0635\u0648\u064A\u062A", value, inline: true });
      await message.edit({ embeds: [embed] });
    } catch (error) {
      console.error("[Aboud System] suggestion vote update failed", error);
    }
  };
  client.on("messageReactionAdd", refreshSuggestionVotes);
  client.on("messageReactionRemove", refreshSuggestionVotes);
  const sendConfiguredLog = async (guild, title, description, color = 6514417) => {
    const config = await getGuildConfig(guild.id);
    const log = config?.logs || {};
    const channelId = log.events?.channel || log.messages?.channel || log.moderation?.channel;
    const channel = channelId ? guild.channels.cache.get(channelId) : null;
    if (channel?.send) await channel.send({ embeds: [new EmbedBuilder2().setTitle(title).setDescription(description).setColor(color).setTimestamp().setFooter({ text: BOT_FOOTER })] }).catch(() => {
    });
  };
  client.on("messageUpdate", async (oldMessage, newMessage) => {
    if (!newMessage.guild || newMessage.author?.bot || oldMessage.content === newMessage.content) return;
    await sendConfiguredLog(newMessage.guild, "\u0631\u0633\u0627\u0644\u0629 \u062A\u0645 \u062A\u0639\u062F\u064A\u0644\u0647\u0627", `\u0627\u0644\u0639\u0636\u0648: ${newMessage.author}
\u0642\u0628\u0644: ${oldMessage.content || "\u2014"}
\u0628\u0639\u062F: ${newMessage.content || "\u2014"}`, 16096779);
  });
  client.on("guildMemberRemove", async (member) => {
    await sendConfiguredLog(member.guild, "\u0639\u0636\u0648 \u063A\u0627\u062F\u0631 \u0627\u0644\u0633\u064A\u0631\u0641\u0631", `${member.user} \u063A\u0627\u062F\u0631 \u0627\u0644\u0633\u064A\u0631\u0641\u0631.`, 15680580);
  });
  client.on("channelCreate", async (channel) => {
    if (channel.guild) await sendConfiguredLog(channel.guild, "\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0642\u0646\u0627\u0629", `${channel} \u2022 ${channel.name}`, 2278750);
  });
  client.on("channelDelete", async (channel) => {
    if (channel.guild) await sendConfiguredLog(channel.guild, "\u062A\u0645 \u062D\u0630\u0641 \u0642\u0646\u0627\u0629", `#${channel.name}`, 15680580);
  });
  client.on("roleCreate", async (role) => {
    await sendConfiguredLog(role.guild, "\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0631\u062A\u0628\u0629", `${role}`, 2278750);
  });
  client.on("roleDelete", async (role) => {
    await sendConfiguredLog(role.guild, "\u062A\u0645 \u062D\u0630\u0641 \u0631\u062A\u0628\u0629", `${role.name}`, 15680580);
  });
  client.on("voiceStateUpdate", async (oldState, newState) => {
    if (!newState.guild || oldState.channelId === newState.channelId) return;
    const action = newState.channel ? `\u0627\u0646\u0636\u0645 \u0625\u0644\u0649 ${newState.channel}` : `\u063A\u0627\u062F\u0631 \u0627\u0644\u0631\u0648\u0645 \u0627\u0644\u0635\u0648\u062A\u064A`;
    await sendConfiguredLog(newState.guild, "\u0646\u0634\u0627\u0637 \u0635\u0648\u062A\u064A", `${newState.member?.user || newState.id} ${action}`, 440020);
  });
  client.on("messageDelete", async (message) => {
    if (!message.guild || !message.author) return;
    const config = await getGuildConfig(message.guild.id);
    const log = config?.logs || {};
    const channel = log.messages?.enabled ? message.guild.channels.cache.get(log.messages.channel) : null;
    if (channel?.send) await channel.send({ embeds: [new EmbedBuilder2().setTitle("\u0631\u0633\u0627\u0644\u0629 \u0645\u062D\u0630\u0648\u0641\u0629").setColor(15680580).addFields({ name: "\u0627\u0644\u0639\u0636\u0648", value: `${message.author}`, inline: true }, { name: "\u0627\u0644\u0645\u062D\u062A\u0648\u0649", value: message.content || "\u0644\u0627 \u064A\u0648\u062C\u062F \u0646\u0635" }).setTimestamp()] }).catch(() => {
    });
  });
}
async function startDiscordBot() {
  if (started || !process.env.DISCORD_TOKEN) return;
  started = true;
  wireEvents();
  await registerCommands();
  await client.login(process.env.DISCORD_TOKEN);
  console.log(`[${BOT_NAME}] online as ${client.user?.tag || "unknown"}`);
}
void startDiscordBot().catch((error) => {
  started = false;
  console.error("[Aboud System] Discord startup failed", error);
});

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
