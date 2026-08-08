// ==========================================
// ABOOD SYSTEM BOT - Ultimate Full Version (Updated & Expanded)
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
        return db[guildId] || { 
            guildId, 
            security: { antiLinks: false, badWords: '', bypassRoles: [] }, 
            levels: { enabled: false, xpPerMessage: 10, channelId: '', message: '' }, 
            logs: {}, 
            welcome: { enabled: false, channel: '', embedMessage: '', image: '' }, 
            suggestions: { enabled: false, channelId: '', image: '' }, 
            autoReply: [], 
            selfRoles: { channelId: '', description: '', roles: [] } 
        };
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
        return db[guildId] || { title: '', description: '', type: 'button', image: '', options: [] };
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
    getGiveaways: () => readDB('giveaways') || {},
    saveGiveaway: (id, data) => {
        const db = readDB('giveaways');
        db[id] = data;
        writeDB('giveaways', db);
    },
    deleteGiveaway: (id) => {
        const db = readDB('giveaways');
        delete db[id];
        writeDB('giveaways', db);
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

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
app.use('/uploads', express.static(UPLOADS_DIR));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

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
    new SlashCommandBuilder().setName('suggest').setDescription('إرسال اقتراح جديد').addStringOption(o => o.setName('text').setDescription('نص الاقتراح').setRequired(true))
].map(c => c.toJSON());

// ==========================================
// 4. Auth Setup (Passport & Login)
// ==========================================
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
app.get('/callback', passport.authenticate('discord', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/dashboard');
});
app.get('/logout', (req, res) => {
    req.logout(() => { res.redirect('/login'); });
});

app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8"><title>Abood System - تسجيل الدخول</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Cairo', sans-serif; background: #0b0f19; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .login-card { background: rgba(17, 24, 39, 0.8); border: 1px solid rgba(255,255,255,0.05); padding: 40px; border-radius: 20px; text-align: center; width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        h1 { margin-bottom: 10px; color: #3b82f6; }
        .btn-discord { background: #5865F2; color: white; padding: 14px 25px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="login-card">
        <h1>Abood System</h1>
        <p>سجل دخولك عبر حساب ديسكورد لإدارة سيرفرك</p>
        <a href="/auth/discord" class="btn-discord">تسجيل الدخول بديسكورد</a>
    </div>
</body>
</html>`);
});

// ==========================================
// 5. UI Template Generator (VORTEX Style)
// ==========================================
function ui(guild, activePage, content) {
    const pages = [
        { id: 'home', icon: 'fa-home', label: 'نظرة عامة' },
        { id: 'suggestions', icon: 'fa-lightbulb', label: 'الاقتراحات' },
        { id: 'kick', icon: 'fa-video', label: 'بثوث كيك' },
        { id: 'welcome', icon: 'fa-user-plus', label: 'الترحيب' },
        { id: 'security', icon: 'fa-shield-alt', label: 'الحماية' },
        { id: 'giveaway', icon: 'fa-gift', label: 'القيف اواي' },
        { id: 'tickets', icon: 'fa-ticket-alt', label: 'التذاكر' },
        { id: 'levels', icon: 'fa-chart-line', label: 'المستويات' },
        { id: 'roles', icon: 'fa-id-badge', label: 'الرتب الذاتية' }
    ];

    const navItems = pages.map(p => `
        <a href="/manage/${guild.id}/${p.id}" class="nav-item ${activePage === p.id ? 'active' : ''}">
            <i class="fas ${p.icon}"></i>
            <span>${p.label}</span>
        </a>
    `).join('');

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>Abood System - ${guild.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif; }
        body { background-color: #0b0f19; color: #f3f4f6; display: flex; min-height: 100vh; overflow-x: hidden; }
        .sidebar { width: 280px; background: rgba(17, 24, 39, 0.95); border-left: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; position: fixed; height: 100vh; z-index: 100; }
        .sidebar-brand { padding: 25px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; }
        .sidebar-brand h2 { color: #3b82f6; }
        .nav-item { padding: 15px 25px; color: #9ca3af; text-decoration: none; display: flex; align-items: center; gap: 15px; transition: 0.3s; }
        .nav-item:hover, .nav-item.active { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border-right: 4px solid #3b82f6; }
        .main { flex: 1; margin-right: 280px; padding: 40px; }
        .card { background: rgba(17, 24, 39, 0.8); padding: 30px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 30px; }
        .form-control { width: 100%; padding: 12px; background: #1f2937; border: 1px solid #374151; border-radius: 10px; color: white; margin-bottom: 20px; font-size: 14px; }
        .btn { background: #3b82f6; color: white; padding: 12px 25px; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; transition: 0.3s; }
        .btn:hover { background: #2563eb; transform: translateY(-2px); }
        .btn-danger { background: #ef4444; }
        label { display: block; margin-bottom: 10px; font-weight: 600; color: #d1d5db; }
        .checkbox-container { display: flex; align-items: center; gap: 10px; cursor: pointer; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-brand"><h2>Abood System</h2></div>
        ${navItems}
        <a href="/logout" class="nav-item" style="margin-top: auto; border-top: 1px solid rgba(255,255,255,0.05);"><i class="fas fa-sign-out-alt"></i><span>تسجيل الخروج</span></a>
    </div>
    <div class="main">
        ${content}
    </div>
</body>
</html>`;
}

// ==========================================
// 6. Routes & Logic
// ==========================================

app.get('/', (req, res) => res.redirect('/dashboard'));

app.get('/dashboard', checkAuth, (req, res) => {
    const adminGuilds = req.user.guilds.filter(g => {
        const p = BigInt(g.permissions);
        return (p & 8n) === 8n || (p & 32n) === 32n;
    });
    let content = '<h1>اختر سيرفر لإدارته</h1><div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-top: 30px;">';
    adminGuilds.forEach(g => {
        content += `<a href="/manage/${g.id}/home" style="text-decoration: none; color: white;">
            <div class="card" style="text-align: center; transition: 0.3s;">
                <img src="https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px;" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
                <h3>${g.name}</h3>
            </div>
        </a>`;
    });
    content += '</div>';
    res.send(ui({ name: 'الرئيسية', id: '' }, 'home', content));
});

app.get('/manage/:guildId/home', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    if (!g) return res.redirect('/dashboard');
    const stats = DB.getStats(g.id);
    res.send(ui(g, 'home', `
        <h1>نظرة عامة - ${g.name}</h1>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 30px;">
            <div class="card" style="text-align: center;"><h3>الرسائل</h3><p style="font-size: 24px; color: #3b82f6;">${stats.messages.total}</p></div>
            <div class="card" style="text-align: center;"><h3>الأعضاء</h3><p style="font-size: 24px; color: #3b82f6;">${g.memberCount}</p></div>
            <div class="card" style="text-align: center;"><h3>القنوات</h3><p style="font-size: 24px; color: #3b82f6;">${g.channels.cache.size}</p></div>
        </div>
    `));
});

// --- Suggestions ---
app.get('/manage/:guildId/suggestions', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    let s = DB.getConfig(g.id);
    const content = `
    <div class="card">
        <h2>إعدادات الاقتراحات</h2>
        <form method="POST" action="/save/${g.id}/suggestions" enctype="multipart/form-data">
            <label class="checkbox-container">
                <input type="checkbox" name="enabled" ${s.suggestions?.enabled ? 'checked' : ''}> تفعيل النظام
            </label>
            <label>قناة الاقتراحات:</label>
            <select name="channelId" class="form-control">
                ${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}" ${s.suggestions?.channelId === c.id ? 'selected' : ''}># ${c.name}</option>`).join('')}
            </select>
            <label>صورة الإمباد (رفع ملف):</label>
            <input type="file" name="image" class="form-control">
            ${s.suggestions?.image ? `<img src="${s.suggestions.image}" style="max-width: 300px; border-radius: 10px; margin-bottom: 10px; display: block;">` : ''}
            <button type="submit" class="btn">حفظ</button>
        </form>
    </div>`;
    res.send(ui(g, 'suggestions', content));
});

app.post('/save/:guildId/suggestions', checkGuildAdmin, upload.single('image'), (req, res) => {
    let cfg = DB.getConfig(req.params.guildId);
    cfg.suggestions = {
        enabled: req.body.enabled === 'on',
        channelId: req.body.channelId,
        image: req.file ? `/uploads/${req.file.filename}` : cfg.suggestions.image
    };
    DB.saveConfig(req.params.guildId, cfg);
    res.redirect(`/manage/${req.params.guildId}/suggestions`);
});

// --- Welcome ---
app.get('/manage/:guildId/welcome', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    let s = DB.getConfig(g.id);
    const content = `
    <div class="card">
        <h2>إعدادات الترحيب</h2>
        <form method="POST" action="/save/${g.id}/welcome" enctype="multipart/form-data">
            <label class="checkbox-container">
                <input type="checkbox" name="enabled" ${s.welcome?.enabled ? 'checked' : ''}> تفعيل الترحيب
            </label>
            <label>قناة الترحيب:</label>
            <select name="channel" class="form-control">
                ${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}" ${s.welcome?.channel === c.id ? 'selected' : ''}># ${c.name}</option>`).join('')}
            </select>
            <label>رسالة الترحيب ({member}, {guild}, {count}):</label>
            <textarea name="embedMessage" class="form-control" rows="4">${s.welcome?.embedMessage || ''}</textarea>
            <label>صورة الترحيب (رفع ملف):</label>
            <input type="file" name="image" class="form-control">
            ${s.welcome?.image ? `<img src="${s.welcome.image}" style="max-width: 300px; border-radius: 10px; margin-bottom: 10px; display: block;">` : ''}
            <button type="submit" class="btn">حفظ</button>
        </form>
    </div>`;
    res.send(ui(g, 'welcome', content));
});

app.post('/save/:guildId/welcome', checkGuildAdmin, upload.single('image'), (req, res) => {
    let cfg = DB.getConfig(req.params.guildId);
    cfg.welcome = {
        enabled: req.body.enabled === 'on',
        channel: req.body.channel,
        embedMessage: req.body.embedMessage,
        image: req.file ? `/uploads/${req.file.filename}` : cfg.welcome.image
    };
    DB.saveConfig(req.params.guildId, cfg);
    res.redirect(`/manage/${req.params.guildId}/welcome`);
});

// --- Kick Streams ---
app.get('/manage/:guildId/kick', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    let s = DB.getKick(g.id);
    const content = `
    <div class="card">
        <h2>إعدادات بثوث كيك (بدون إيموجي)</h2>
        <form method="POST" action="/save/${g.id}/kick">
            <label>يوزر Kick:</label>
            <input type="text" name="kickUser" class="form-control" placeholder="streamername">
            <label>قناة التنبيه:</label>
            <select name="channelId" class="form-control">
                ${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}"># ${c.name}</option>`).join('')}
            </select>
            <button type="submit" class="btn">إضافة</button>
        </form>
        <div style="margin-top: 20px;">
            ${s.streamers.map((st, i) => `<div style="padding: 10px; background: #1f2937; margin-bottom: 10px; border-radius: 10px; display: flex; justify-content: space-between;">
                <span>${st.kickUsername} -> <#${st.channelId}></span>
                <a href="/delete-kick/${g.id}/${i}" class="btn btn-danger" style="padding: 5px 10px;">حذف</a>
            </div>`).join('')}
        </div>
    </div>`;
    res.send(ui(g, 'kick', content));
});

app.post('/save/:guildId/kick', checkGuildAdmin, (req, res) => {
    let s = DB.getKick(req.params.guildId);
    s.streamers.push({ kickUsername: req.body.kickUser.trim(), channelId: req.body.channelId, isLive: false });
    DB.saveKick(req.params.guildId, s);
    res.redirect(`/manage/${req.params.guildId}/kick`);
});

app.get('/delete-kick/:guildId/:index', checkGuildAdmin, (req, res) => {
    let s = DB.getKick(req.params.guildId);
    s.streamers.splice(Number(req.params.index), 1);
    DB.saveKick(req.params.guildId, s);
    res.redirect(`/manage/${req.params.guildId}/kick`);
});

// --- Tickets ---
app.get('/manage/:guildId/tickets', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    let s = DB.getTicketConfig(g.id);
    let optionsRows = '';
    for(let i=0; i<5; i++) {
        const opt = s.options?.[i] || {};
        optionsRows += `
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
            <input type="text" name="opt_id_${i}" class="form-control" placeholder="ID" value="${opt.id || ''}" style="margin:0;">
            <input type="text" name="opt_label_${i}" class="form-control" placeholder="Label" value="${opt.label || ''}" style="margin:0;">
            <input type="text" name="opt_emoji_${i}" class="form-control" placeholder="Emoji" value="${opt.emoji || ''}" style="margin:0;">
        </div>`;
    }

    const content = `
    <div class="card">
        <h2>نظام التذاكر</h2>
        <form method="POST" action="/save/${g.id}/tickets" enctype="multipart/form-data">
            <label>عنوان اللوحة:</label>
            <input type="text" name="title" class="form-control" value="${s.title || ''}">
            <label>الوصف:</label>
            <textarea name="description" class="form-control">${s.description || ''}</textarea>
            <label>نوع التحكم:</label>
            <select name="type" class="form-control">
                <option value="button" ${s.type === 'button' ? 'selected' : ''}>أزرار</option>
                <option value="menu" ${s.type === 'menu' ? 'selected' : ''}>منيو</option>
            </select>
            <label>صورة التذكرة (رفع ملف):</label>
            <input type="file" name="image" class="form-control">
            ${s.image ? `<img src="${s.image}" style="max-width: 300px; border-radius: 10px; margin-bottom: 10px; display: block;">` : ''}
            <label>الخيارات (ID, Label, Emoji):</label>
            ${optionsRows}
            <label>قناة الإرسال:</label>
            <select name="targetChannel" class="form-control">
                <option value="">-- لا ترسل الآن --</option>
                ${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}"># ${c.name}</option>`).join('')}
            </select>
            <button type="submit" class="btn">حفظ وإرسال</button>
        </form>
    </div>`;
    res.send(ui(g, 'tickets', content));
});

app.post('/save/:guildId/tickets', checkGuildAdmin, upload.single('image'), async (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    const options = [];
    for(let i=0; i<5; i++) {
        const id = req.body[`opt_id_${i}`];
        const label = req.body[`opt_label_${i}`];
        const emoji = req.body[`opt_emoji_${i}`];
        if(id && label) options.push({ id, label, emoji });
    }
    const data = {
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        image: req.file ? `/uploads/${req.file.filename}` : DB.getTicketConfig(g.id).image,
        options
    };
    DB.saveTicketConfig(g.id, data);

    if (req.body.targetChannel) {
        const channel = g.channels.cache.get(req.body.targetChannel);
        if (channel) {
            const embed = new EmbedBuilder().setTitle(data.title).setDescription(data.description).setColor(0x3b82f6);
            if(data.image) embed.setImage(`${process.env.BASE_URL || ''}${data.image}`);
            
            const row = new ActionRowBuilder();
            if (data.type === 'button') {
                data.options.forEach(opt => {
                    const btn = new ButtonBuilder().setCustomId(`ticket_open_${opt.id}`).setLabel(opt.label).setStyle(ButtonStyle.Primary);
                    if(opt.emoji) btn.setEmoji(opt.emoji);
                    row.addComponents(btn);
                });
            } else {
                const menu = new StringSelectMenuBuilder().setCustomId('ticket_open_menu').setPlaceholder('اختر نوع التذكرة');
                data.options.forEach(opt => {
                    menu.addOptions({ label: opt.label, value: opt.id, emoji: opt.emoji || undefined });
                });
                row.addComponents(menu);
            }
            await channel.send({ embeds: [embed], components: data.options.length > 0 ? [row] : [] });
        }
    }
    res.redirect(`/manage/${g.id}/tickets`);
});

// --- Levels ---
app.get('/manage/:guildId/levels', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    let s = DB.getConfig(g.id);
    const content = `
    <div class="card">
        <h2>إعدادات المستويات</h2>
        <form method="POST" action="/save/${g.id}/levels">
            <label class="checkbox-container">
                <input type="checkbox" name="enabled" ${s.levels?.enabled ? 'checked' : ''}> تفعيل المستويات
            </label>
            <label>XP لكل رسالة:</label>
            <input type="number" name="xpPerMessage" class="form-control" value="${s.levels?.xpPerMessage || 10}">
            <label>قناة إشعار الليفل:</label>
            <select name="channelId" class="form-control">
                <option value="">نفس القناة</option>
                ${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}" ${s.levels?.channelId === c.id ? 'selected' : ''}># ${c.name}</option>`).join('')}
            </select>
            <label>رسالة الترقية ({user}, {level}):</label>
            <textarea name="message" class="form-control" placeholder="مبروك {user} وصلت للمستوى {level}">${s.levels?.message || ''}</textarea>
            <button type="submit" class="btn">حفظ</button>
        </form>
    </div>`;
    res.send(ui(g, 'levels', content));
});

app.post('/save/:guildId/levels', checkGuildAdmin, (req, res) => {
    let cfg = DB.getConfig(req.params.guildId);
    cfg.levels = {
        enabled: req.body.enabled === 'on',
        xpPerMessage: Number(req.body.xpPerMessage),
        channelId: req.body.channelId,
        message: req.body.message
    };
    DB.saveConfig(req.params.guildId, cfg);
    res.redirect(`/manage/${req.params.guildId}/levels`);
});

// --- Security ---
app.get('/manage/:guildId/security', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    let s = DB.getConfig(g.id);
    const content = `
    <div class="card">
        <h2>إعدادات الحماية</h2>
        <form method="POST" action="/save/${g.id}/security">
            <label class="checkbox-container">
                <input type="checkbox" name="antiLinks" ${s.security?.antiLinks ? 'checked' : ''}> حظر الروابط
            </label>
            <label>الكلمات المحظورة:</label>
            <input type="text" name="badWords" class="form-control" value="${s.security?.badWords || ''}">
            <label>رتب تتجاوز الحماية (Bypass):</label>
            <select name="bypassRoles" class="form-control" multiple style="height: 150px;">
                ${g.roles.cache.filter(r => r.name !== '@everyone').map(r => `<option value="${r.id}" ${s.security?.bypassRoles?.includes(r.id) ? 'selected' : ''}>${r.name}</option>`).join('')}
            </select>
            <button type="submit" class="btn">حفظ</button>
        </form>
    </div>`;
    res.send(ui(g, 'security', content));
});

app.post('/save/:guildId/security', checkGuildAdmin, (req, res) => {
    let cfg = DB.getConfig(req.params.guildId);
    cfg.security = {
        antiLinks: req.body.antiLinks === 'on',
        badWords: req.body.badWords,
        bypassRoles: Array.isArray(req.body.bypassRoles) ? req.body.bypassRoles : (req.body.bypassRoles ? [req.body.bypassRoles] : [])
    };
    DB.saveConfig(req.params.guildId, cfg);
    res.redirect(`/manage/${req.params.guildId}/security`);
});

// --- Self Roles ---
app.get('/manage/:guildId/roles', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    let s = DB.getConfig(g.id).selfRoles || { channelId: '', description: '', roles: [] };
    let roleOptions = '';
    for(let i=0; i<6; i++) {
        roleOptions += `<label>خيار ${i+1}:</label><select name="role_${i}" class="form-control">
            <option value="">-- اختر رتبة --</option>
            ${g.roles.cache.filter(r => r.name !== '@everyone').map(r => `<option value="${r.id}" ${s.roles?.[i] === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
        </select>`;
    }

    const content = `
    <div class="card">
        <h2>الرتب الذاتية (للاشعارات)</h2>
        <form method="POST" action="/save/${g.id}/roles">
            <label>قناة المنيو:</label>
            <select name="channelId" class="form-control">
                ${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}" ${s.channelId === c.id ? 'selected' : ''}># ${c.name}</option>`).join('')}
            </select>
            <label>وصف المنيو (Embed Description):</label>
            <textarea name="description" class="form-control">${s.description || ''}</textarea>
            <label>الرتب (6 خيارات):</label>
            ${roleOptions}
            <button type="submit" class="btn">حفظ وإرسال المنيو</button>
        </form>
    </div>`;
    res.send(ui(g, 'roles', content));
});

app.post('/save/:guildId/roles', checkGuildAdmin, async (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    const roles = [];
    for(let i=0; i<6; i++) {
        if(req.body[`role_${i}`]) roles.push(req.body[`role_${i}`]);
    }
    const selfRoles = { channelId: req.body.channelId, description: req.body.description, roles };
    let cfg = DB.getConfig(g.id);
    cfg.selfRoles = selfRoles;
    DB.saveConfig(g.id, cfg);

    const channel = g.channels.cache.get(selfRoles.channelId);
    if(channel && roles.length > 0) {
        const embed = new EmbedBuilder().setTitle('قائمة الرتب الذاتية').setDescription(selfRoles.description || 'اختر الرتب التي تريدها من المنيو أدناه').setColor(0x3b82f6);
        const menu = new StringSelectMenuBuilder().setCustomId('self_roles_menu').setPlaceholder('اختر رتبك').setMinValues(0).setMaxValues(roles.length);
        roles.forEach(rid => {
            const role = g.roles.cache.get(rid);
            if(role) menu.addOptions({ label: role.name, value: rid });
        });
        const row = new ActionRowBuilder().addComponents(menu);
        await channel.send({ embeds: [embed], components: [row] });
    }
    res.redirect(`/manage/${g.id}/roles`);
});

// --- Giveaway ---
app.get('/manage/:guildId/giveaway', checkGuildAdmin, (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    const content = `
    <div class="card">
        <h2>إنشاء قيف اواي جديد</h2>
        <form method="POST" action="/save/${g.id}/giveaway">
            <label>الجائزة:</label>
            <input type="text" name="prize" class="form-control" required>
            <label>المدة (مثال: 1h أو 1d):</label>
            <input type="text" name="duration" class="form-control" required>
            <label>عدد الفائزين:</label>
            <input type="number" name="winners" class="form-control" value="1" required>
            <label>قناة الإرسال:</label>
            <select name="channel" class="form-control">
                ${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}"># ${c.name}</option>`).join('')}
            </select>
            <button type="submit" class="btn">تشغيل القيف اواي</button>
        </form>
    </div>`;
    res.send(ui(g, 'giveaway', content));
});

app.post('/save/:guildId/giveaway', checkGuildAdmin, async (req, res) => {
    const { prize, duration, winners, channel } = req.body;
    const g = client.guilds.cache.get(req.params.guildId);
    const timeMs = ms(duration);
    if (!timeMs) return res.send('صيغة الوقت غير صحيحة');
    const endAt = Date.now() + timeMs;
    const targetCh = g.channels.cache.get(channel);
    
    const embed = new EmbedBuilder()
        .setTitle(`🎉 قيف اواي: ${prize}`)
        .setDescription(`اضغط على التفاعل 🎉 للاشتراك!\n\nعدد الفائزين: ${winners}\nينتهي في: <t:${Math.floor(endAt/1000)}:R>`)
        .setColor(0x3b82f6);

    const msg = await targetCh.send({ embeds: [embed] });
    await msg.react('🎉');

    DB.saveGiveaway(msg.id, { guildId: g.id, channelId: targetCh.id, prize, winners: Number(winners), endAt });
    res.redirect(`/manage/${g.id}/giveaway`);
});

// ==========================================
// 7. Bot Event Handlers
// ==========================================

client.on('ready', () => {
    console.log(`[BOT] ${client.user.tag} Ready`);
    
    // Kick Stream Checker
    setInterval(async () => {
        const db = readDB('kick_configs');
        for (const guildId in db) {
            const g = client.guilds.cache.get(guildId);
            if (!g) continue;
            for (const st of db[guildId].streamers) {
                try {
                    const response = await axios.get(`https://kick.com/api/v1/channels/${st.kickUsername}`).catch(() => null);
                    if (response && response.data && response.data.livestream) {
                        if (!st.isLive) {
                            st.isLive = true;
                            const channel = g.channels.cache.get(st.channelId);
                            if (channel) {
                                const embed = new EmbedBuilder()
                                    .setTitle(`${st.kickUsername} فاتح بث الآن`)
                                    .setURL(`https://kick.com/${st.kickUsername}`)
                                    .setDescription(response.data.livestream.session_title || 'بث مباشر على Kick')
                                    .addFields(
                                        { name: 'المشاهدين', value: `${response.data.livestream.viewer_count || 0}`, inline: true }
                                    )
                                    .setImage(response.data.livestream.thumbnail.url)
                                    .setColor(0x53fc18);
                                await channel.send({ embeds: [embed] });
                            }
                        }
                    } else {
                        st.isLive = false;
                    }
                } catch (e) {}
            }
            DB.saveKick(guildId, db[guildId]);
        }
    }, 60000);

    // Giveaway Winner Picker
    setInterval(async () => {
        const giveaways = DB.getGiveaways();
        for (const id in giveaways) {
            const gw = giveaways[id];
            if (Date.now() > gw.endAt) {
                const g = client.guilds.cache.get(gw.guildId);
                if (!g) { DB.deleteGiveaway(id); continue; }
                const ch = g.channels.cache.get(gw.channelId);
                if (!ch) { DB.deleteGiveaway(id); continue; }
                const msg = await ch.messages.fetch(id).catch(() => null);
                if (!msg) { DB.deleteGiveaway(id); continue; }

                const reaction = msg.reactions.cache.get('🎉');
                if (reaction) {
                    const users = await reaction.users.fetch();
                    const candidates = users.filter(u => !u.bot).map(u => u.id);
                    const winners = [];
                    for(let i=0; i<gw.winners && candidates.length > 0; i++) {
                        const winner = candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
                        winners.push(`<@${winner}>`);
                    }
                    if(winners.length > 0) {
                        ch.send(`🎉 مبروك ${winners.join(', ')}! لقد فزت بـ **${gw.prize}**!`);
                    } else {
                        ch.send('❌ لم يشارك أحد في القيف اواي.');
                    }
                }
                DB.deleteGiveaway(id);
            }
        }
    }, 10000);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    const cfg = DB.getConfig(message.guild.id);

    // Stats
    let stats = DB.getStats(message.guild.id);
    stats.messages.total++;
    stats.messages.daily++;
    DB.saveStats(message.guild.id, stats);

    // Security (Bypass Roles Check)
    const hasBypass = message.member.roles.cache.some(r => cfg.security?.bypassRoles?.includes(r.id));
    if (!hasBypass) {
        if (cfg.security?.antiLinks && /(https?:\/\/[^\s]+)/g.test(message.content)) {
            await message.delete().catch(() => {});
            return;
        }
        if (cfg.security?.badWords) {
            const words = cfg.security.badWords.split(',').map(w => w.trim());
            if (words.some(w => message.content.includes(w))) {
                await message.delete().catch(() => {});
                return;
            }
        }
    }

    // Suggestions Listener
    if (cfg.suggestions?.enabled && message.channel.id === cfg.suggestions.channelId) {
        const text = message.content;
        await message.delete().catch(() => {});
        const embed = new EmbedBuilder()
            .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
            .setTitle('💡 اقتراح جديد')
            .setDescription(text)
            .setColor(0xfee75c)
            .setTimestamp();
        if(cfg.suggestions.image) embed.setImage(`${process.env.BASE_URL || ''}${cfg.suggestions.image}`);
        
        const msg = await message.channel.send({ embeds: [embed] });
        await msg.react('✅');
        await msg.react('❌');
        DB.saveSuggestion(msg.id, { guildId: message.guild.id, userId: message.author.id, text });
        return;
    }

    // Levels XP
    if (cfg.levels?.enabled) {
        let u = DB.getUserLevel(message.guild.id, message.author.id);
        u.xp += cfg.levels.xpPerMessage || 10;
        if (u.xp >= u.level * u.level * 100) {
            u.level++;
            const targetCh = cfg.levels.channelId ? message.guild.channels.cache.get(cfg.levels.channelId) : message.channel;
            let msgText = cfg.levels.message || 'مبروك {user} وصلت للمستوى {level} 🚀';
            msgText = msgText.replace('{user}', `<@${message.author.id}>`).replace('{level}', u.level);
            if(targetCh) targetCh.send(msgText).catch(() => {});
        }
        DB.saveUserLevel(message.guild.id, message.author.id, u);
    }

    // Auto Reply
    const ar = cfg.autoReply?.find(x => x.trigger && message.content.toLowerCase() === x.trigger.toLowerCase());
    if (ar) message.reply(ar.reply).catch(() => {});
});

client.on('guildMemberAdd', async (member) => {
    const cfg = DB.getConfig(member.guild.id);
    if (cfg.welcome?.enabled && cfg.welcome.channel) {
        const channel = member.guild.channels.cache.get(cfg.welcome.channel);
        if (channel) {
            let msg = cfg.welcome.embedMessage || 'أهلاً بك {member} في {guild}!';
            msg = msg.replace('{member}', `<@${member.id}>`).replace('{guild}', member.guild.name).replace('{count}', member.guild.memberCount);
            const embed = new EmbedBuilder().setDescription(msg).setColor(0x3b82f6);
            if(cfg.welcome.image) embed.setImage(`${process.env.BASE_URL || ''}${cfg.welcome.image}`);
            channel.send({ embeds: [embed] });
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    // Self Roles
    if (interaction.isStringSelectMenu() && interaction.customId === 'self_roles_menu') {
        const roles = interaction.values;
        const allRoles = DB.getConfig(interaction.guild.id).selfRoles.roles;
        await interaction.member.roles.remove(allRoles.filter(r => !roles.includes(r))).catch(() => {});
        await interaction.member.roles.add(roles).catch(() => {});
        return interaction.reply({ content: '✅ تم تحديث رتبك بنجاح!', ephemeral: true });
    }

    // Ticket Open
    if ((interaction.isButton() && interaction.customId.startsWith('ticket_open_')) || (interaction.isStringSelectMenu() && interaction.customId === 'ticket_open_menu')) {
        const ticketId = interaction.isButton() ? interaction.customId.replace('ticket_open_', '') : interaction.values[0];
        const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ]
        });

        const embed = new EmbedBuilder().setTitle('تذكرة جديدة').setDescription(`نوع التذكرة: ${ticketId}\nمرحباً بك <@${interaction.user.id}>، سيتم الرد عليك قريباً.`).setColor(0x3b82f6);
        const menu = new StringSelectMenuBuilder().setCustomId('ticket_internal_menu').setPlaceholder('خيارات التذكرة')
            .addOptions([
                { label: 'استلام التذكرة', value: 'claim', emoji: '📩' },
                { label: 'استدعاء صاحب التذكرة', value: 'call', emoji: '🔔' },
                { label: 'إغلاق التذكرة', value: 'close', emoji: '🔒' },
                { label: 'حذف التذكرة', value: 'delete', emoji: '🗑️' }
            ]);
        await channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
        return interaction.reply({ content: `✅ تم فتح تذكرتك: ${channel}`, ephemeral: true });
    }

    // Ticket Internal Menu Logic
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_internal_menu') {
        const action = interaction.values[0];
        if (action === 'claim') {
            return interaction.reply({ content: `تم استلام التكت بواسطه <@${interaction.user.id}>` });
        }
        if (action === 'call') {
            const topic = interaction.channel.name.split('-')[1];
            const owner = interaction.guild.members.cache.find(m => m.user.username.toLowerCase() === topic.toLowerCase());
            if(owner) return interaction.channel.send({ content: `<@${owner.id}> تم استدعاؤك بواسطه الاداره` });
            return interaction.reply({ content: '❌ لم يتم العثور على صاحب التذكرة.', ephemeral: true });
        }
        if (action === 'close') {
            return interaction.reply({ content: '🔒 تم إغلاق التذكرة.' });
        }
        if (action === 'delete') {
            await interaction.reply({ content: '🗑️ سيتم حذف التذكرة بالكامل الآن...' });
            return setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
app.listen(Number(process.env.PORT || 3000), () => console.log('Dashboard running...'));
