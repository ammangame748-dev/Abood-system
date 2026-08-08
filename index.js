// ==========================================
// ABOOD SYSTEM BOT - Ultimate Complete Version (JSON DB + All Features)
// ==========================================

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const { createCanvas, loadImage } = require('canvas');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const ms = require('ms');
const {
    Client, GatewayIntentBits, Partials, EmbedBuilder, AuditLogEvent,
    AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder, UserSelectMenuBuilder, ChannelType, PermissionFlagsBits,
    ModalBuilder, TextInputBuilder, TextInputStyle, ActivityType,
    REST, Routes, SlashCommandBuilder
} = require('discord.js');

// ==========================================
// 1. JSON Database Helper System
// ==========================================
const DB_DIR = path.join(__dirname, 'database');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

function getDBFile(name) {
    const filePath = path.join(DB_DIR, `${name}.json`);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    }
    return filePath;
}

function readDB(name) {
    try {
        const filePath = getDBFile(name);
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return {};
    }
}

function writeDB(name, data) {
    const filePath = getDBFile(name);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

const DB = {
    getConfig: (guildId) => {
        const db = readDB('guild_configs');
        return db[guildId] || { guildId, security: {}, levels: {}, logs: {}, welcome: {}, suggestions: {}, autoReply: [], selfRoles: [] };
    },
    saveConfig: (guildId, newConfig) => {
        const db = readDB('guild_configs');
        db[guildId] = { ...(db[guildId] || {}), ...newConfig };
        writeDB('guild_configs', db);
    },
    getKick: (guildId) => {
        const db = readDB('kick_configs');
        return db[guildId] || { streamers: [] };
    },
    saveKick: (guildId, data) => {
        const db = readDB('kick_configs');
        db[guildId] = data;
        writeDB('kick_configs', db);
    },
    getTicketConfig: (guildId) => {
        const db = readDB('ticket_configs');
        return db[guildId] || { type: 'buttons', buttons: [], menuOptions: [], imageUrl: '' };
    },
    saveTicketConfig: (guildId, data) => {
        const db = readDB('ticket_configs');
        db[guildId] = data;
        writeDB('ticket_configs', db);
    },
    getUserLevel: (guildId, userId) => {
        const db = readDB('user_levels');
        const key = `${guildId}_${userId}`;
        return db[key] || { guildId, userId, xp: 0, level: 1, msgCount: 0 };
    },
    saveUserLevel: (guildId, userId, data) => {
        const db = readDB('user_levels');
        const key = `${guildId}_${userId}`;
        db[key] = data;
        writeDB('user_levels', db);
    },
    getSuggestion: (messageId) => {
        const db = readDB('suggestions');
        return db[messageId];
    },
    saveSuggestion: (messageId, data) => {
        const db = readDB('suggestions');
        db[messageId] = data;
        writeDB('suggestions', db);
    },
    deleteSuggestion: (messageId) => {
        const db = readDB('suggestions');
        delete db[messageId];
        writeDB('suggestions', db);
    },
    getStats: (guildId) => {
        const db = readDB('stats');
        return db[guildId] || { messages: { total: 0, daily: 0 } };
    },
    saveStats: (guildId, data) => {
        const db = readDB('stats');
        db[guildId] = data;
        writeDB('stats', db);
    }
};

// ==========================================
// 2. Express App Setup
// ==========================================
const app = express();
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json());
app.set('trust proxy', 1);
app.set('view engine', 'ejs');

if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// 3. Discord Client Setup
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.User, Partials.GuildMember, Partials.Reaction]
});

const commands = [
    new SlashCommandBuilder().setName('setbanner').setDescription('رفع صورة الخط').addAttachmentOption(o => o.setName('image').setDescription('صورة البنر').setRequired(true)),
    new SlashCommandBuilder().setName('rename_panel').setDescription('لوحة تغيير الاسم').addStringOption(o => o.setName('name').setRequired(true).setDescription('الاسم')).addAttachmentOption(o => o.setName('image').setDescription('صورة اختيارية')),
    new SlashCommandBuilder().setName('suggest').setDescription('إرسال اقتراح جديد').addStringOption(o => o.setName('text').setDescription('نص الاقتراح').setRequired(true)).addAttachmentOption(o => o.setName('image').setDescription('صورة الاقتراح').setRequired(false))
].map(c => c.toJSON());

// ==========================================
// 4. Helper Functions & Advanced Features
// ==========================================
function buildSuggestionEmbed(author, text, imageUrl = null, status = 'قيد المراجعة', replyText = null, votes = { approve: 0, reject: 0 }) {
    const embed = new EmbedBuilder()
        .setAuthor({ name: author.username || 'مستخدم', iconURL: author.displayAvatarURL ? author.displayAvatarURL() : undefined })
        .setTitle('اقتراح جديد')
        .setDescription(text)
        .addFields(
            { name: 'الحالة', value: status, inline: true },
            { name: 'التصويت', value: `نعم: ${votes.approve} | لا: ${votes.reject}`, inline: true }
        )
        .setColor(status.includes('موافقة') ? 0x57f287 : 0xfee75c)
        .setTimestamp();
    if (imageUrl) embed.setImage(imageUrl);
    if (replyText) {
        embed.addFields({ name: 'رد الادارة', value: replyText, inline: false });
    }
    return embed;
}

function buildSuggestionMenu(threadUrl = null) {
    const select = new StringSelectMenuBuilder()
        .setCustomId('suggestion_admin_action')
        .setPlaceholder('قائمة ادارة الاقتراح')
        .addOptions([
            { label: 'موافقة على الاقتراح', value: 'approve', description: 'تغيير الحالة إلى تمت الموافقة' },
            { label: 'الرد على الاقتراح', value: 'reply', description: 'فتح نافذة لكتابة الرد وإنشاء ثريد' },
            { label: 'حذف الاقتراح', value: 'delete', description: 'حذف رسالة الاقتراح نهائياً' }
        ]);
    const row1 = new ActionRowBuilder().addComponents(select);
    const rows = [row1];
    if (threadUrl) {
        const btnRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel('رؤية رد الادارة').setStyle(ButtonStyle.Link).setURL(threadUrl)
        );
        rows.push(btnRow);
    }
    return rows;
}

// ==========================================
// 5. Auth Setup
// ==========================================
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    proxy: true,
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

app.use(session({
    secret: process.env.SESSION_SECRET || 'abood-system-secret-2024',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

const checkAuth = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
};

const checkGuildAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) return res.redirect('/login');
    const guildId = req.params.guildId;
    if (!guildId) return next();
    const userGuild = req.user.guilds.find(g => g.id === guildId);
    if (!userGuild) return res.status(403).send('Forbidden');
    const p = BigInt(userGuild.permissions);
    if ((p & 8n) === 8n || (p & 32n) === 32n) return next();
    return res.status(403).send('Forbidden');
};

app.get('/auth/discord', passport.authenticate('discord'));
app.get('/callback', passport.authenticate('discord', { failureRedirect: '/login' }), (req, res) => res.redirect('/dashboard'));
app.get('/auth/callback', passport.authenticate('discord', { failureRedirect: '/login' }), (req, res) => res.redirect('/dashboard'));
app.get('/logout', (req, res) => { req.logout(() => res.redirect('/login')); });
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>Abood System - تسجيل الدخول</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet"><style>body{font-family:'Cairo',sans-serif;background:#0b0f19;color:white;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;}.card{background:rgba(17,24,39,0.8);padding:40px;border-radius:20px;text-align:center;border:1px solid rgba(255,255,255,0.05);}a{background:#5865F2;color:white;padding:12px 25px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:20px;}</style></head><body><div class="card"><h1>Abood System</h1><p>سجل دخولك عبر ديسكورد لإدارة سيرفرك</p><a href="/auth/discord">تسجيل الدخول</a></div></body></html>`);
});

// ==========================================
// 6. UI Template Generator
// ==========================================
function ui(guild, activePage, content) {
    const pages = [
        { id: 'home', label: 'نظرة عامة' },
        { id: 'suggestions', label: 'الاقتراحات' },
        { id: 'tickets', label: 'التذاكر' },
        { id: 'roles', label: 'الرتب الذاتية' },
        { id: 'kick', label: 'بثوث كيك' },
        { id: 'welcome', label: 'الترحيب' },
        { id: 'levels', label: 'المستويات' },
        { id: 'security', label: 'الحماية' },
        { id: 'autoreply', label: 'الرد الآلي' },
        { id: 'giveaway', label: 'القيف اواي' },
        { id: 'logs', label: 'السجلات' }
    ];

    const nav = pages.map(p => `<a href="/manage/${guild.id}/${p.id}" class="nav-item ${activePage === p.id ? 'active' : ''}">${p.label}</a>`).join('');

    return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>Abood System - ${guild.name}</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet"><style>
    *{box-sizing:border-box;margin:0;padding:0;font-family:'Cairo',sans-serif;}
    body{background:#0b0f19;color:#f3f4f6;display:flex;min-height:100vh;}
    .sidebar{width:260px;background:#111827;border-left:1px solid rgba(255,255,255,0.05);display:flex;flex-direction:column;position:fixed;height:100vh;}
    .brand{padding:25px;font-size:20px;font-weight:bold;color:#3b82f6;border-bottom:1px solid rgba(255,255,255,0.05);}
    .nav{padding:20px 0;overflow-y:auto;flex:1;}
    .nav-item{display:block;padding:12px 25px;color:#9ca3af;text-decoration:none;font-weight:600;border-left:4px solid transparent;}
    .nav-item:hover,.nav-item.active{color:#fff;background:rgba(59,130,246,0.1);border-left-color:#3b82f6;}
    .main{flex:1;margin-right:260px;padding:40px;}
    .card{background:#111827;border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:25px;margin-bottom:25px;}
    .btn{background:#3b82f6;color:white;border:none;padding:10px 20px;border-radius:8px;font-weight:bold;cursor:pointer;text-decoration:none;display:inline-block;}
    .form-control{width:100%;background:#0b0f19;border:1px solid rgba(255,255,255,0.1);padding:10px;border-radius:8px;color:white;margin-top:5px;margin-bottom:15px;}
    label{font-weight:600;color:#d1d5db;font-size:14px;display:block;margin-top:10px;}
    </style></head><body>
    <div class="sidebar"><div class="brand">Abood System</div><div class="nav">${nav}</div></div>
    <div class="main"><div class="card" style="display:flex;justify-content:space-between;align-items:center;"><h2>${guild.name}</h2><a href="/dashboard" class="btn">السيرفرات</a></div>${content}</div></body></html>`;
}

// ==========================================
// 7. Dashboard Routes
// ==========================================
app.get('/dashboard', checkAuth, (req, res) => {
    const guilds = req.user.guilds.filter(g => (BigInt(g.permissions) & 8n) === 8n || (BigInt(g.permissions) & 32n) === 32n);
    const cards = guilds.map(g => `
        <div style="background:#111827;padding:20px;border-radius:12px;text-align:center;border:1px solid rgba(255,255,255,0.05);">
            <h3>${g.name}</h3>
            <a href="/manage/${g.id}/home" class="btn" style="margin-top:15px;">إدارة</a>
        </div>
    `).join('');
    res.send(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>السيرفرات</title><style>body{background:#0b0f19;color:white;font-family:Cairo;padding:40px;}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px;}</style></head><body><h1>اختر السيرفر</h1><div class="grid">${cards}</div></body></html>`);
});

app.get('/manage/:guildId/home', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    if (!g) return res.redirect('/dashboard');
    res.send(ui(g, 'home', `<div class="card"><h3>أهلاً بك في لوحة تحكم Abood System</h3><p>الأعضاء: ${g.memberCount}</p></div>`));
});

// --- Suggestions ---
app.get('/manage/:guildId/suggestions', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    let cfg = DB.getConfig(g.id);
    res.send(ui(g, 'suggestions', `
        <div class="card"><h2>نظام الاقتراحات</h2>
        <form method="POST">
            <label><input type="checkbox" name="enabled" ${cfg.suggestions?.enabled ? 'checked' : ''}> تفعيل الاقتراحات</label>
            <label>قناة الاقتراحات:</label>
            <select name="channelId" class="form-control">${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}" ${cfg.suggestions?.channelId === c.id ? 'selected' : ''}># ${c.name}</option>`).join('')}</select>
            <button type="submit" class="btn">حفظ</button>
        </form></div>
    `));
});
app.post('/manage/:guildId/suggestions', checkGuildAdmin, (req, res) => {
    let cfg = DB.getConfig(req.params.guildId);
    cfg.suggestions = { enabled: req.body.enabled === 'on', channelId: req.body.channelId };
    DB.saveConfig(req.params.guildId, cfg);
    res.redirect('back');
});

// --- Tickets ---
app.get('/manage/:guildId/tickets', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    let t = DB.getTicketConfig(g.id);
    res.send(ui(g, 'tickets', `
        <div class="card"><h2>نظام التذاكر المطور</h2>
        <form method="POST">
            <label>عنوان اللوحة:</label>
            <input type="text" name="title" class="form-control" value="${t.title || 'الدعم الفني'}">
            <label>الوصف:</label>
            <textarea name="description" class="form-control">${t.description || 'اضغط أدناه لفتح تذكرة'}</textarea>
            <label>نوع القائمة:</label>
            <select name="type" class="form-control">
                <option value="buttons" ${t.type === 'buttons' ? 'selected' : ''}>أزرار</option>
                <option value="menu" ${t.type === 'menu' ? 'selected' : ''}>قائمة (منيو)</option>
            </select>
            <label>رابط صورة اللوحة:</label>
            <input type="text" name="imageUrl" class="form-control" value="${t.imageUrl || ''}">
            <label>قناة إرسال اللوحة:</label>
            <select name="channelId" class="form-control"><option value="">-- اختر --</option>${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}"># ${c.name}</option>`).join('')}</select>
            <button type="submit" class="btn">حفظ وإرسال اللوحة</button>
        </form></div>
    `));
});

app.post('/manage/:guildId/tickets', checkGuildAdmin, async (req, res) => {
    const { title, description, type, imageUrl, channelId } = req.body;
    DB.saveTicketConfig(req.params.guildId, { title, description, type, imageUrl });
    if (channelId) {
        const g = client.guilds.cache.get(req.params.guildId);
        const ch = g.channels.cache.get(channelId);
        if (ch) {
            const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(0x3b82f6);
            if (imageUrl) embed.setImage(imageUrl);
            let row = new ActionRowBuilder();
            if (type === 'buttons') {
                row.addComponents(new ButtonBuilder().setCustomId('open_ticket_main').setLabel('فتح تذكرة').setStyle(ButtonStyle.Primary));
            } else {
                row.addComponents(new StringSelectMenuBuilder().setCustomId('open_ticket_menu').setPlaceholder('اختر قسم التذكرة').addOptions([{ label: 'الدعم العام', value: 'general' }]));
            }
            await ch.send({ embeds: [embed], components: [row] });
        }
    }
    res.redirect('back');
});

// --- Self Roles ---
app.get('/manage/:guildId/roles', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    let cfg = DB.getConfig(g.id);
    const rolesHtml = Array.from({ length: 6 }, (_, i) => `
        <div style="display:flex;gap:10px;margin-bottom:10px;">
            <input type="text" name="label_${i}" class="form-control" placeholder="اسم الخيار ${i+1}" value="${cfg.selfRoles?.[i]?.label || ''}" style="margin:0;">
            <select name="role_${i}" class="form-control" style="margin:0;"><option value="">-- اختر الرتبة --</option>${g.roles.cache.map(r => `<option value="${r.id}" ${cfg.selfRoles?.[i]?.roleId === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}</select>
            <input type="text" name="emoji_${i}" class="form-control" placeholder="ايدي الايموجي" value="${cfg.selfRoles?.[i]?.emojiId || ''}" style="margin:0;">
        </div>
    `).join('');

    res.send(ui(g, 'roles', `
        <div class="card"><h2>الرتب الذاتية (6 خيارات للإشعارات)</h2>
        <form method="POST">
            <label>قناة إرسال المنيو:</label>
            <select name="channelId" class="form-control"><option value="">-- اختر --</option>${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}" ${cfg.selfRolesChannel === c.id ? 'selected' : ''}># ${c.name}</option>`).join('')}</select>
            <label>محتوى الايمباد:</label>
            <textarea name="embedText" class="form-control">${cfg.selfRolesText || 'اختر الرتب التي تناسبك'}</textarea>
            <h3>خيارات الرتب (6)</h3>
            ${rolesHtml}
            <button type="submit" class="btn" style="margin-top:15px;">حفظ ونشر المنيو</button>
        </form></div>
    `));
});

app.post('/manage/:guildId/roles', checkGuildAdmin, async (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    const { channelId, embedText } = req.body;
    const selfRoles = [];
    for (let i = 0; i < 6; i++) {
        const label = req.body[`label_${i}`];
        const roleId = req.body[`role_${i}`];
        const emojiId = req.body[`emoji_${i}`];
        if (label && roleId) selfRoles.push({ label, roleId, emojiId });
    }
    let cfg = DB.getConfig(g.id);
    cfg.selfRoles = selfRoles;
    cfg.selfRolesChannel = channelId;
    cfg.selfRolesText = embedText;
    DB.saveConfig(g.id, cfg);

    if (channelId && selfRoles.length > 0) {
        const ch = g.channels.cache.get(channelId);
        if (ch) {
            const embed = new EmbedBuilder().setTitle('الرتب الذاتية').setDescription(embedText).setColor(0x3b82f6);
            const select = new StringSelectMenuBuilder().setCustomId('self_roles_menu').setPlaceholder('اختر الرتب المطلوبة').setMinValues(0).setMaxValues(selfRoles.length);
            selfRoles.forEach((sr, idx) => {
                const opt = { label: sr.label, value: sr.roleId };
                if (sr.emojiId) opt.emoji = sr.emojiId;
                select.addOptions(opt);
            });
            await ch.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
        }
    }
    res.redirect('back');
});

// --- Kick ---
app.get('/manage/:guildId/kick', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    let k = DB.getKick(g.id);
    res.send(ui(g, 'kick', `
        <div class="card"><h2>بثوث كيك</h2>
        <form method="POST">
            <label>يوزر الكيك:</label>
            <input type="text" name="username" class="form-control" required>
            <label>قناة التنبيهات:</label>
            <select name="channelId" class="form-control">${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}"># ${c.name}</option>`).join('')}</select>
            <button type="submit" class="btn">إضافة</button>
        </form>
        <hr style="margin:20px 0;border:0;border-top:1px solid rgba(255,255,255,0.05)">
        <div>${k.streamers.map(s => `<p>${s.username}</p>`).join('') || 'لا يوجد'}</div></div>
    `));
});
app.post('/manage/:guildId/kick', checkGuildAdmin, (req, res) => {
    let k = DB.getKick(req.params.guildId);
    k.streamers.push({ username: req.body.username, channelId: req.body.channelId, isLive: false });
    DB.saveKick(req.params.guildId, k);
    res.redirect('back');
});

// --- Welcome ---
app.get('/manage/:guildId/welcome', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    let cfg = DB.getConfig(g.id);
    res.send(ui(g, 'welcome', `
        <div class="card"><h2>الترحيب</h2>
        <form method="POST">
            <label><input type="checkbox" name="enabled" ${cfg.welcome?.enabled ? 'checked' : ''}> تفعيل</label>
            <label>القناة:</label>
            <select name="channelId" class="form-control">${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}" ${cfg.welcome?.channelId === c.id ? 'selected' : ''}># ${c.name}</option>`).join('')}</select>
            <label>الرسالة:</label>
            <textarea name="message" class="form-control">${cfg.welcome?.message || 'أهلاً بك'}</textarea>
            <label>رابط الصورة:</label>
            <input type="text" name="imageUrl" class="form-control" value="${cfg.welcome?.imageUrl || ''}">
            <button type="submit" class="btn">حفظ</button>
        </form></div>
    `));
});
app.post('/manage/:guildId/welcome', checkGuildAdmin, (req, res) => {
    let cfg = DB.getConfig(req.params.guildId);
    cfg.welcome = { enabled: req.body.enabled === 'on', channelId: req.body.channelId, message: req.body.message, imageUrl: req.body.imageUrl };
    DB.saveConfig(req.params.guildId, cfg);
    res.redirect('back');
});

// --- Levels ---
app.get('/manage/:guildId/levels', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    let cfg = DB.getConfig(g.id);
    res.send(ui(g, 'levels', `
        <div class="card"><h2>المستويات</h2>
        <form method="POST">
            <label><input type="checkbox" name="enabled" ${cfg.levels?.enabled ? 'checked' : ''}> تفعيل</label>
            <label>قناة الإشعارات:</label>
            <select name="channelId" class="form-control">${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}" ${cfg.levels?.channelId === c.id ? 'selected' : ''}># ${c.name}</option>`).join('')}</select>
            <label>رسالة التهنئة:</label>
            <input type="text" name="message" class="form-control" value="${cfg.levels?.message || 'مبروك {member} وصولك للمستوى {level}'}">
            <button type="submit" class="btn">حفظ</button>
        </form></div>
    `));
});
app.post('/manage/:guildId/levels', checkGuildAdmin, (req, res) => {
    let cfg = DB.getConfig(req.params.guildId);
    cfg.levels = { enabled: req.body.enabled === 'on', channelId: req.body.channelId, message: req.body.message };
    DB.saveConfig(req.params.guildId, cfg);
    res.redirect('back');
});

// --- Security ---
app.get('/manage/:guildId/security', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    let cfg = DB.getConfig(g.id);
    res.send(ui(g, 'security', `
        <div class="card"><h2>الحماية مع التجاوز</h2>
        <form method="POST">
            <label><input type="checkbox" name="antiLinks" ${cfg.security?.antiLinks ? 'checked' : ''}> منع الروابط</label>
            <label>رتب التجاوز (اختر الرتب التي تتجاوز الحماية):</label>
            <select name="bypassRoles" class="form-control" multiple style="height:120px;">
                ${g.roles.cache.map(r => `<option value="${r.id}" ${(cfg.security?.bypassRoles || []).includes(r.id) ? 'selected' : ''}>${r.name}</option>`).join('')}
            </select>
            <button type="submit" class="btn">حفظ</button>
        </form></div>
    `));
});
app.post('/manage/:guildId/security', checkGuildAdmin, (req, res) => {
    let cfg = DB.getConfig(req.params.guildId);
    cfg.security = { antiLinks: req.body.antiLinks === 'on', bypassRoles: Array.isArray(req.body.bypassRoles) ? req.body.bypassRoles : [req.body.bypassRoles].filter(Boolean) };
    DB.saveConfig(req.params.guildId, cfg);
    res.redirect('back');
});

// --- Auto Reply ---
app.get('/manage/:guildId/autoreply', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    let cfg = DB.getConfig(g.id);
    res.send(ui(g, 'autoreply', `<div class="card"><h2>الرد الآلي</h2><p>قريباً</p></div>`));
});

// --- Giveaway ---
app.get('/manage/:guildId/giveaway', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    res.send(ui(g, 'giveaway', `
        <div class="card"><h2>قيف اواي</h2>
        <form method="POST">
            <label>الجائزة:</label><input type="text" name="prize" class="form-control" required>
            <label>المدة (مثال 1h):</label><input type="text" name="duration" class="form-control" required>
            <label>القناة:</label><select name="channelId" class="form-control">${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}"># ${c.name}</option>`).join('')}</select>
            <button type="submit" class="btn">بدء</button>
        </form></div>
    `));
});
app.post('/manage/:guildId/giveaway', checkGuildAdmin, async (req, res) => {
    const { prize, duration, channelId } = req.body;
    const g = client.guilds.cache.get(req.params.guildId);
    const ch = g.channels.cache.get(channelId);
    const time = ms(duration);
    if (ch && time) {
        const embed = new EmbedBuilder().setTitle(`قيف اواي: ${prize}`).setDescription('اضغط على التفاعل أدناه للمشاركة').setColor(0x3b82f6);
        const msg = await ch.send({ embeds: [embed] });
        await msg.react('🎉');
        setTimeout(async () => {
            try {
                const fetched = await ch.messages.fetch(msg.id);
                const reaction = fetched.reactions.cache.get('🎉');
                if (reaction) {
                    const users = await reaction.users.fetch();
                    const valid = users.filter(u => !u.bot);
                    if (valid.size > 0) {
                        const winner = valid.random();
                        ch.send(`مبروك ${winner} لقد فزت بـ ${prize}`);
                    } else {
                        ch.send('لم يشارك أحد في القيف اواي');
                    }
                }
            } catch (e) {}
        }, time);
    }
    res.redirect('back');
});

// --- Logs ---
app.get('/manage/:guildId/logs', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    res.send(ui(g, 'logs', `<div class="card"><h2>السجلات</h2><p>قريباً</p></div>`));
});

app.get('/ping', (req, res) => res.send('OK'));
app.get('/', (req, res) => res.redirect('/dashboard'));

// ==========================================
// 8. Discord Bot Events & Handlers
// ==========================================
client.on('ready', async () => {
    console.log(`[BOT] Logged in as ${client.user.tag}`);
    client.user.setActivity('Abood System | /suggest', { type: ActivityType.Watching });
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    const cfg = DB.getConfig(message.guild.id);

    // Security Check with Bypass
    if (cfg.security?.antiLinks && /(https?:\/\/[^\s]+)/g.test(message.content)) {
        const bypass = cfg.security?.bypassRoles || [];
        const hasBypass = message.member.roles.cache.some(r => bypass.includes(r.id)) || message.member.permissions.has(PermissionFlagsBits.Administrator);
        if (!hasBypass) {
            await message.delete().catch(() => {});
            return message.channel.send(`${message.author} ممنوع إرسال الروابط هنا!`).then(m => setTimeout(() => m.delete().catch(() => {}), 4000));
        }
    }

    // Suggestions listener
    if (cfg?.suggestions?.enabled && message.channel.id === cfg.suggestions.channelId) {
        const text = message.content;
        let imageUrl = message.attachments.first()?.url || null;
        await message.delete().catch(() => {});
        const embed = buildSuggestionEmbed(message.author, text, imageUrl);
        const msg = await message.channel.send({ embeds: [embed], components: buildSuggestionMenu() });
        await msg.react('✅');
        await msg.react('❌');

        DB.saveSuggestion(msg.id, { guildId: message.guild.id, messageId: msg.id, userId: message.author.id, text, imageUrl, status: 'قيد المراجعة', votes: { approve: 0, reject: 0 } });
        return;
    }

    // Levels
    if (cfg?.levels?.enabled) {
        let u = DB.getUserLevel(message.guild.id, message.author.id);
        u.xp += 10;
        if (u.xp >= u.level * u.level * 100) {
            u.level++;
            const ch = message.guild.channels.cache.get(cfg.levels.channelId) || message.channel;
            const text = (cfg.levels.message || 'مبروك {member} وصولك للمستوى {level}').replace('{member}', message.author).replace('{level}', u.level);
            ch.send(text).catch(() => {});
        }
        DB.saveUserLevel(message.guild.id, message.author.id, u);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'suggest') {
            const cfg = DB.getConfig(interaction.guild.id);
            if (!cfg?.suggestions?.enabled || !cfg?.suggestions?.channelId) return interaction.reply({ content: 'الاقتراحات غير مفعلة', ephemeral: true });
            const text = interaction.options.getString('text');
            const image = interaction.options.getAttachment('image');
            const ch = interaction.guild.channels.cache.get(cfg.suggestions.channelId);
            const embed = buildSuggestionEmbed(interaction.user, text, image?.url || null);
            const msg = await ch.send({ embeds: [embed], components: buildSuggestionMenu() });
            await msg.react('✅');
            await msg.react('❌');
            DB.saveSuggestion(msg.id, { guildId: interaction.guild.id, messageId: msg.id, userId: interaction.user.id, text, imageUrl: image?.url || null, status: 'قيد المراجعة', votes: { approve: 0, reject: 0 } });
            await interaction.reply({ content: 'تم الإرسال', ephemeral: true });
        }
    }

    // Tickets
    if (interaction.isButton() && interaction.customId === 'open_ticket_main') {
        const ticketCh = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ]
        });
        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('ticket_manage_menu').setPlaceholder('خيارات التذكرة').addOptions([
                { label: 'استلام التذكرة', value: 'claim', description: 'استلام التذكرة كإداري' },
                { label: 'استدعاء صاحب التذكرة', value: 'summon', description: 'منشن صاحب التذكرة' },
                { label: 'إغلاق التذكرة', value: 'close', description: 'إغلاق التذكرة' },
                { label: 'حذف التذكرة', value: 'delete', description: 'حذف التذكرة نهائياً' }
            ])
        );
        await ticketCh.send({ content: `مرحباً ${interaction.user}، فريق الدعم سيرد عليك قريباً.`, components: [row] });
        return interaction.reply({ content: `تم فتح التذكرة: ${ticketCh}`, ephemeral: true });
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_manage_menu') {
        const val = interaction.values[0];
        if (val === 'claim') {
            await interaction.reply({ content: `تم استلام التذكرة بواسطة ${interaction.user}` });
        } else if (val === 'summon') {
            await interaction.reply({ content: `تم استدعاؤك بواسطة الادارة` });
        } else if (val === 'close') {
            await interaction.reply({ content: 'جاري إغلاق التذكرة...' });
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        } else if (val === 'delete') {
            await interaction.channel.delete().catch(() => {});
        }
    }

    // Self Roles
    if (interaction.isStringSelectMenu() && interaction.customId === 'self_roles_menu') {
        const selectedRoles = interaction.values;
        const member = interaction.member;
        const cfg = DB.getConfig(interaction.guild.id);
        const allRoles = cfg.selfRoles.map(sr => sr.roleId);

        for (const rId of allRoles) {
            if (selectedRoles.includes(rId)) {
                if (!member.roles.cache.has(rId)) await member.roles.add(rId).catch(() => {});
            } else {
                if (member.roles.cache.has(rId)) await member.roles.remove(rId).catch(() => {});
            }
        }
        return interaction.reply({ content: 'تم تحديث رتبك بنجاح', ephemeral: true });
    }

    // Suggestion Admin Action
    if (interaction.isStringSelectMenu() && interaction.customId === 'suggestion_admin_action') {
        const data = DB.getSuggestion(interaction.message.id);
        if (!data) return interaction.reply({ content: 'غير موجود', ephemeral: true });
        const action = interaction.values[0];
        if (action === 'delete') {
            await interaction.message.delete().catch(() => {});
            DB.deleteSuggestion(interaction.message.id);
            return interaction.reply({ content: 'تم الحذف', ephemeral: true });
        }
        if (action === 'approve') {
            data.status = 'تمت الموافقة';
            DB.saveSuggestion(interaction.message.id, data);
            const author = await client.users.fetch(data.userId).catch(() => ({ username: 'مستخدم' }));
            const embed = buildSuggestionEmbed(author, data.text, data.imageUrl, data.status, data.replyText, data.votes);
            await interaction.message.edit({ embeds: [embed], components: buildSuggestionMenu(data.threadId ? `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${data.threadId}` : null) });
            return interaction.reply({ content: 'تمت الموافقة', ephemeral: true });
        }
        if (action === 'reply') {
            const modal = new ModalBuilder().setCustomId(`s_reply_${data.messageId}`).setTitle('الرد على الاقتراح').addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('r_text').setLabel('الرد').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('s_reply_')) {
        const mId = interaction.customId.replace('s_reply_', '');
        const data = DB.getSuggestion(mId);
        const replyText = interaction.fields.getTextInputValue('r_text');
        data.replyText = replyText;
        data.status = 'تم الرد';
        const thread = await interaction.message.startThread({ name: 'رد الادارة', autoArchiveDuration: 60 }).catch(() => null);
        if (thread) {
            data.threadId = thread.id;
            await thread.send(`رد الادارة: ${replyText}`);
        }
        DB.saveSuggestion(mId, data);
        const author = await client.users.fetch(data.userId).catch(() => ({ username: 'مستخدم' }));
        const threadUrl = thread ? `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${thread.id}` : null;
        const embed = buildSuggestionEmbed(author, data.text, data.imageUrl, data.status, replyText, data.votes);
        await interaction.message.edit({ embeds: [embed], components: buildSuggestionMenu(threadUrl) });
        return interaction.reply({ content: 'تم الرد بنجاح', ephemeral: true });
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch().catch(() => {});
    const data = DB.getSuggestion(reaction.message.id);
    if (!data) return;
    if (reaction.emoji.name === '✅') data.votes.approve++;
    if (reaction.emoji.name === '❌') data.votes.reject++;
    DB.saveSuggestion(reaction.message.id, data);
    const author = await client.users.fetch(data.userId).catch(() => ({ username: 'مستخدم' }));
    const embed = buildSuggestionEmbed(author, data.text, data.imageUrl, data.status, data.replyText, data.votes);
    await reaction.message.edit({ embeds: [embed] }).catch(() => {});
});

// ==========================================
// 9. Kick Live Checker Background
// ==========================================
setInterval(async () => {
    const guilds = client.guilds.cache.map(g => g.id);
    for (const gId of guilds) {
        const kData = DB.getKick(gId);
        if (!kData || !kData.streamers) continue;
        const g = client.guilds.cache.get(gId);
        if (!g) continue;

        for (const st of kData.streamers) {
            try {
                const res = await axios.get(`https://kick.com/api/v1/channels/${st.username}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const isLive = res.data?.livestream !== null;
                const ch = g.channels.cache.get(st.channelId);
                if (ch && isLive && !st.isLive) {
                    st.isLive = true;
                    const ls = res.data.livestream;
                    const embed = new EmbedBuilder()
                        .setTitle(`الستريمر ${st.username} فتح بث مباشر على كيك`)
                        .setDescription(`التصنيف: ${ls.categories?.[0]?.name || 'غير معروف'}\nالمشاهدين: ${ls.viewer_count || 0}`)
                        .setImage(ls.thumbnail?.url || '')
                        .setColor(0x00e701);
                    await ch.send({ embeds: [embed] });
                } else if (!isLive) {
                    st.isLive = false;
                }
            } catch (e) {}
        }
        DB.saveKick(gId, kData);
    }
}, 60000);

// ==========================================
// 10. Start Server
// ==========================================
client.login(process.env.DISCORD_TOKEN);
app.listen(Number(process.env.PORT || 3000), () => {
    console.log(`[Dashboard] Running on port ${process.env.PORT || 3000}`);
});
