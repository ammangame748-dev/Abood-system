// ==========================================
// ABOOD SYSTEM BOT - Full Version (Adapted from VORTEX)
// ==========================================

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const mongoose = require('mongoose');
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
// 1. تعريف الـ Schemas (قاعدة البيانات) - بدون Streaks و Clans
// ==========================================

const KickConfig = mongoose.model('KickConfig', new mongoose.Schema({
    guildId: String,
    streamers: [{
        kickUsername: String,
        channelId: String,
        roleId: String,
        customMessage: String,
        isLive: { type: Boolean, default: false },
        mentionCategories: [String],
        lastCategory: String,
        lastLiveData: {
            title: String,
            viewers: Number,
            startedAt: Date,
            thumbnail: String
        }
    }]
}));

const TicketData = mongoose.model('TicketData', new mongoose.Schema({
    ticketCount: { type: Number, default: 0 },
    guildId: String,
    channelId: String,
    ownerId: String,
    ticketType: { type: String, default: 'تذكرة دعم' },
    claimedBy: String,
    openedAt: Date,
    closedAt: Date,
    closedBy: String
}));

const UserLevel = mongoose.model('UserLevel', new mongoose.Schema({
    guildId: String,
    userId: String,
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    msgCount: { type: Number, default: 0 },
    dailyMsgs: { type: Number, default: 0 },
    lastMessageDate: { type: Date, default: Date.now },
    warned: { type: Boolean, default: false }
}));

const ModConfig = mongoose.model('ModConfig', new mongoose.Schema({
    guildId: String,
    jail: {
        commandName: { type: String, default: 'jail' },
        unjailCommand: { type: String, default: 'unjail' },
        roleId: String,
        channelId: String,
        adminRoles: [String]
    }
}));

const JailData = mongoose.model('JailData', new mongoose.Schema({
    guildId: String,
    userId: String,
    oldRoles: [String],
    endAt: Date
}));

const GuildConfig = mongoose.model('GuildConfig', new mongoose.Schema({
    guildId: String,
    autoReply: [{
        trigger: String,
        reply: String
    }],
    security: {
        antiLinks: Boolean,
        badWords: String,
        badEmojis: String,
        punishment: { type: String, default: 'none' },
        bypassRoles: [String]
    },
    levels: {
        enabled: Boolean,
        xpPerMessage: { type: Number, default: 10 },
        levelUpChannel: String,
        leaderboardCommand: { type: String, default: '!levels' }
    },
    rolesPanel: [{
        roleId: String,
        label: String,
        type: { type: String, default: 'button' }
    }],
    rolesChannel: String,
    logs: {
        messages: { channel: String, enabled: Boolean },
        moderation: { channel: String, enabled: Boolean },
        members: { channel: String, enabled: Boolean },
        channels: { channel: String, enabled: Boolean },
        roles: { channel: String, enabled: Boolean },
        voice: { channel: String, enabled: Boolean }
    },
    welcome: {
        enabled: { type: Boolean, default: false },
        channel: String,
        embedMessage: { type: String, default: "مرحباً بك {member} في سيرفر {guild}!" },
        imagePath: String,
        avatarX: { type: Number, default: 50 },
        avatarY: { type: Number, default: 50 },
        avatarWidth: { type: Number, default: 150 },
        avatarHeight: { type: Number, default: 150 },
        aiPrompt: { type: String, default: "Anime style landscape, forest, sun light, high quality" },
        bannerURL: String
    },
    suggestions: {
        enabled: { type: Boolean, default: false },
        channelId: String,
        color: { type: String, default: '#fee75c' }
    }
}));

const Stats = mongoose.model('Stats', new mongoose.Schema({
    guildId: String,
    messages: {
        total: { type: Number, default: 0 },
        daily: { type: Number, default: 0 },
        weekly: { type: Number, default: 0 },
        monthly: { type: Number, default: 0 },
        lastUpdate: { type: Date, default: Date.now }
    },
    activeChannels: { type: Map, of: Number, default: {} },
    membersLog: {
        joined: [Date],
        left: [Date]
    },
    modActions: {
        bans: { type: Number, default: 0 },
        kicks: { type: Number, default: 0 },
        warns: { type: Number, default: 0 }
    }
}));

const Giveaway = mongoose.model('Giveaway', new mongoose.Schema({
    guildId: String,
    messageId: String,
    channelId: String,
    endAt: Date,
    winnersCount: Number,
    prize: String,
    description: String,
    ended: { type: Boolean, default: false }
}));

const SuggestionStore = mongoose.model('SuggestionStore', new mongoose.Schema({
    guildId: String,
    messageId: String,
    userId: String,
    text: String,
    status: { type: String, default: 'قيد المراجعة' },
    replyText: String,
    threadId: String,
    votes: {
        approve: { type: Number, default: 0 },
        reject: { type: Number, default: 0 }
    }
}));

const TicketConfig = mongoose.model('TicketConfig', new mongoose.Schema({
    guildId: String,
    channelId: String,
    title: String,
    description: String,
    color: String,
    adminRole: String,
    topImagePath: String,
    bottomImagePath: String,
    ticketCount: { type: Number, default: 0 },
    buttons: [{ label: String, emoji: String }],
    menuOptions: [{ label: String, emoji: String }]
}));

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
// 3. تعريف الـ Client
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
    new SlashCommandBuilder().setName('suggest').setDescription('إرسال اقتراح جديد').addStringOption(o => o.setName('text').setDescription('نص الاقتراح').setRequired(true))
].map(c => c.toJSON());

// ==========================================
// 4. اتصال قاعدة البيانات
// ==========================================
mongoose.connect(process.env.MONGO_CONNECTION_STRING)
    .then(() => console.log('[DB] Connected to MongoDB'))
    .catch(err => console.log('[DB] Connection Error:', err));

// ==========================================
// 5. الدوال المساعدة ونظام الاقتراحات المطور
// ==========================================
async function sendLog(guild, type, embed) {
    const config = await GuildConfig.findOne({ guildId: guild.id });
    if (!config?.logs) return;
    const logChannelId = config.logs[type]?.channel;
    const enabled = config.logs[type]?.enabled;
    if (!enabled || !logChannelId) return;
    const logChannel = guild.channels.cache.get(logChannelId);
    if (!logChannel) return;
    logChannel.send({ embeds: [embed] }).catch(() => {});
}

function buildSuggestionEmbed(author, text, status = 'قيد المراجعة', replyText = null, votes = { approve: 0, reject: 0 }) {
    const embed = new EmbedBuilder()
        .setAuthor({ name: author.username || 'مستخدم', iconURL: author.displayAvatarURL ? author.displayAvatarURL() : undefined })
        .setTitle('💡 اقتراح جديد')
        .setDescription(text)
        .addFields(
            { name: 'الحالة', value: status, inline: true },
            { name: 'التصويت', value: `✅ ${votes.approve} | ❌ ${votes.reject}`, inline: true }
        )
        .setColor(status.includes('موافقة') ? 0x57f287 : 0xfee75c)
        .setTimestamp();
    if (replyText) {
        embed.addFields({ name: 'رد الإدارة', value: replyText, inline: false });
    }
    return embed;
}

function buildSuggestionMenu(threadUrl = null) {
    const select = new StringSelectMenuBuilder()
        .setCustomId('suggestion_admin_action')
        .setPlaceholder('قائمة إزالة وتعديل الاقتراح (للإدارة)')
        .addOptions([
            { label: 'موافقة على الاقتراح', value: 'approve', description: 'تغيير الحالة إلى تمت الموافقة', emoji: '✅' },
            { label: 'الرد على الاقتراح', value: 'reply', description: 'فتح نافذة لكتابة الرد وإنشاء ثريد', emoji: '💬' },
            { label: 'حذف الاقتراح', value: 'delete', description: 'حذف رسالة الاقتراح نهائياً', emoji: '🗑️' }
        ]);
    const row1 = new ActionRowBuilder().addComponents(select);
    const rows = [row1];
    if (threadUrl) {
        const btnRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel('رؤية رد الإدارة').setStyle(ButtonStyle.Link).setURL(threadUrl)
        );
        rows.push(btnRow);
    }
    return rows;
}

// ==========================================
// 6. Upload & Auth Setup
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
    if (!userGuild) return res.status(403).send('Forbidden: You are not in this guild.');
    const p = BigInt(userGuild.permissions);
    if ((p & 8n) === 8n || (p & 32n) === 32n) {
        return next();
    }
    return res.status(403).send('Forbidden: You do not have admin permissions in this guild.');
};

app.get('/auth/discord', passport.authenticate('discord'));
app.get('/callback', passport.authenticate('discord', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
    req.logout(() => { res.redirect('/login'); });
});

// ==========================================
// 7. UI Template (Abood System - Dark Animated Design)
// ==========================================
function t(key, lang = 'ar') {
    const dict = {
        ar: {
            home: 'نظرة عامة',
            kick: 'بثوث كيك',
            logs: 'سجل اللوق',
            welcome: 'الترحيب',
            security: 'الحماية',
            autoreply: 'الرد الآلي',
            giveaway: 'القيف اواي',
            tickets: 'التذاكر',
            levels: 'المستويات',
            roles: 'الرتب الذاتية',
            suggestions: 'الاقتراحات',
            dashboard: 'لوحة التحكم',
            logout: 'تسجيل الخروج',
            save: 'حفظ التغييرات',
            delete: 'حذف',
            channel: 'القناة'
        }
    };
    return dict[lang]?.[key] || dict['ar'][key] || key;
}

function ui(guild, activePage, content, lang = 'ar') {
    const pages = [
        { id: 'home', icon: 'fa-home', label: t('home', lang) },
        { id: 'suggestions', icon: 'fa-lightbulb', label: t('suggestions', lang) },
        { id: 'kick', icon: 'fa-video', label: t('kick', lang) },
        { id: 'logs', icon: 'fa-list-alt', label: t('logs', lang) },
        { id: 'welcome', icon: 'fa-user-plus', label: t('welcome', lang) },
        { id: 'security', icon: 'fa-shield-alt', label: t('security', lang) },
        { id: 'autoreply', icon: 'fa-robot', label: t('autoreply', lang) },
        { id: 'giveaway', icon: 'fa-gift', label: t('giveaway', lang) },
        { id: 'tickets', icon: 'fa-ticket-alt', label: t('tickets', lang) },
        { id: 'levels', icon: 'fa-chart-line', label: t('levels', lang) },
        { id: 'roles', icon: 'fa-id-badge', label: t('roles', lang) }
    ];

    const navItems = pages.map(p => `
        <a href="/manage/${guild.id}/${p.id}?lang=${lang}" class="nav-item ${activePage === p.id ? 'active' : ''}">
            <i class="fas ${p.icon}"></i>
            <span>${p.label}</span>
        </a>
    `).join('');

    return `<!DOCTYPE html>
<html lang="${lang}" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abood System - ${guild.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif; }
        body { background-color: #0b0f19; color: #f3f4f6; display: flex; min-height: 100vh; overflow-x: hidden; }
        .sidebar { width: 280px; background: rgba(17, 24, 39, 0.95); backdrop-filter: blur(10px); border-left: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; position: fixed; height: 100vh; z-index: 100; }
        .sidebar-brand { padding: 25px; display: flex; align-items: center; gap: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sidebar-brand h2 { font-size: 22px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .nav-links { padding: 20px 0; overflow-y: auto; flex: 1; }
        .nav-item { display: flex; align-items: center; gap: 15px; padding: 14px 25px; color: #9ca3af; text-decoration: none; transition: all 0.3s ease; font-weight: 600; border-left: 4px solid transparent; }
        .nav-item:hover, .nav-item.active { color: #ffffff; background: rgba(59, 130, 246, 0.1); border-left-color: #3b82f6; }
        .main-content { flex: 1; margin-right: 280px; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; background: rgba(17, 24, 39, 0.6); padding: 20px 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
        .guild-info { display: flex; align-items: center; gap: 15px; }
        .guild-avatar { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; }
        .card { background: rgba(17, 24, 39, 0.7); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 30px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .btn { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; padding: 12px 25px; border-radius: 10px; font-weight: bold; cursor: pointer; transition: all 0.3s; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4); }
        .form-control { width: 100%; background: #0b0f19; border: 1px solid rgba(255,255,255,0.1); padding: 12px 15px; border-radius: 10px; color: white; font-size: 15px; margin-top: 8px; margin-bottom: 20px; }
        .form-control:focus { outline: none; border-color: #3b82f6; }
        label { font-weight: 600; color: #d1d5db; font-size: 14px; display: block; margin-top: 10px; }
        .checkbox-container { display: flex; align-items: center; gap: 10px; margin: 15px 0; cursor: pointer; }
        .checkbox-container input { width: 20px; height: 20px; accent-color: #3b82f6; }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-brand">
            <i class="fas fa-robot fa-2x" style="color: #3b82f6;"></i>
            <h2>Abood System</h2>
        </div>
        <div class="nav-links">
            ${navItems}
        </div>
    </div>
    <div class="main-content">
        <div class="header">
            <div class="guild-info">
                <img src="${guild.iconURL() || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="guild-avatar">
                <div>
                    <h1 style="font-size: 20px;">${guild.name}</h1>
                    <span style="color: #9ca3af; font-size: 13px;">لوحة تحكم السيرفر</span>
                </div>
            </div>
            <a href="/dashboard" class="btn" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);"><i class="fas fa-arrow-right"></i> السيرفرات</a>
        </div>
        ${content}
    </div>
</body>
</html>`;
}

// ==========================================
// 8. Dashboard Routes
// ==========================================
app.get('/dashboard', checkAuth, (req, res) => {
    const adminGuilds = req.user.guilds.filter(g => {
        const p = BigInt(g.permissions);
        return (p & 8n) === 8n || (p & 32n) === 32n;
    });

    const cards = adminGuilds.map(g => {
        const hasBot = client.guilds.cache.has(g.id);
        const iconURL = g.icon
            ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=256`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';

        return `
        <div style="background: rgba(17, 24, 39, 0.7); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 25px; text-align: center;">
            <img src="${iconURL}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px; object-fit: cover;">
            <h3 style="margin-bottom: 15px; font-size: 18px;">${g.name}</h3>
            ${hasBot
                ? `<a href="/manage/${g.id}/home" class="btn" style="width: 100%; justify-content: center;">إدارة السيرفر</a>`
                : `<a href="https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot%20applications.commands&guild_id=${g.id}" class="btn" style="width: 100%; justify-content: center; background: #10b981;">إدخال البوت</a>`
            }
        </div>`;
    }).join('');

    res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8"><title>Abood System - اختيار السيرفر</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Cairo', sans-serif; background: #0b0f19; color: white; padding: 50px; }
        h1 { text-align: center; margin-bottom: 40px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; max-width: 1200px; margin: 0 auto; }
        .btn { background: #3b82f6; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold; }
    </style>
</head>
<body>
    <h1>اختر السيرفر لإدارته عبر Abood System</h1>
    <div class="grid">${cards}</div>
</body>
</html>`);
});

// --- [ Home / Stats ] ---
app.get('/manage/:guildId/home', checkGuildAdmin, async (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    if (!g) return res.redirect('/dashboard');
    const statsData = await Stats.findOne({ guildId: g.id }) || {};
    const content = `
    <div class="card">
        <h2>إحصائيات السيرفر العامة</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px;">
            <div style="background: rgba(59, 130, 246, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.2);">
                <h3 style="color: #3b82f6; font-size: 28px;">${g.memberCount}</h3>
                <p style="color: #9ca3af;">الأعضاء</p>
            </div>
            <div style="background: rgba(16, 185, 129, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
                <h3 style="color: #10b981; font-size: 28px;">${statsData.messages?.total || 0}</h3>
                <p style="color: #9ca3af;">إجمالي الرسائل</p>
            </div>
            <div style="background: rgba(139, 92, 246, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(139, 92, 246, 0.2);">
                <h3 style="color: #8b5cf6; font-size: 28px;">${statsData.messages?.daily || 0}</h3>
                <p style="color: #9ca3af;">رسائل اليوم</p>
            </div>
        </div>
    </div>`;
    res.send(ui(g, 'home', content));
});

// --- [ Suggestions Dashboard Page - NEW ] ---
app.get('/manage/:guildId/suggestions', checkGuildAdmin, async (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    if (!g) return res.redirect('/dashboard');
    let cfg = await GuildConfig.findOne({ guildId: g.id }) || {};

    const content = `
    <div class="card">
        <h2>💡 إعدادات نظام الاقتراحات</h2>
        <form method="POST" action="/save/${g.id}/suggestions">
            <label class="checkbox-container">
                <input type="checkbox" name="enabled" ${cfg.suggestions?.enabled ? 'checked' : ''}>
                تفعيل نظام الاقتراحات في القناة المخصصة
            </label>
            <label>قناة الاقتراحات:</label>
            <select name="channelId" class="form-control">
                <option value="">-- اختر القناة --</option>
                ${g.channels.cache.filter(c => c.type === ChannelType.GuildText).map(c => `<option value="${c.id}" ${cfg.suggestions?.channelId === c.id ? 'selected' : ''}># ${c.name}</option>`).join('')}
            </select>
            <button type="submit" class="btn"><i class="fas fa-save"></i> حفظ الإعدادات</button>
        </form>
    </div>`;
    res.send(ui(g, 'suggestions', content));
});

app.post('/save/:guildId/suggestions', checkGuildAdmin, async (req, res) => {
    const { enabled, channelId } = req.body;
    await GuildConfig.findOneAndUpdate(
        { guildId: req.params.guildId },
        { $set: { 'suggestions.enabled': enabled === 'on', 'suggestions.channelId': channelId } },
        { upsert: true }
    );
    res.redirect(`/manage/${req.params.guildId}/suggestions`);
});

// --- [ Kick Notifications ] ---
app.get('/manage/:guildId/kick', checkGuildAdmin, async (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    if (!g) return res.redirect('/dashboard');
    let s = await KickConfig.findOne({ guildId: g.id }) || { streamers: [] };
    const categories = ['Grand Theft Auto V', 'GTA RP', 'Just Chatting', 'Gaming', 'Music', 'Creative'];
    const catOptions = categories.map(c => `<option value="${c}">${c}</option>`).join('');

    const streamerRows = s.streamers.map((st, i) => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 10px; margin-bottom: 10px;">
            <div>
                <strong>${st.kickUsername}</strong> (#${g.channels.cache.get(st.channelId)?.name || 'Deleted'})
            </div>
            <a href="/delete-kick/${g.id}/${i}" class="btn" style="background: #ef4444; padding: 6px 12px; font-size: 13px;">حذف</a>
        </div>
    `).join('');

    const content = `
    <div class="card">
        <h2>إعدادات تنبيهات كيك</h2>
        <form method="POST" action="/save/${g.id}/kick">
            <label>يوزر حساب Kick:</label>
            <input type="text" name="kickUser" class="form-control" placeholder="مثال: streamername" required>
            <label>قناة الإرسال:</label>
            <select name="channelId" class="form-control">
                ${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}"># ${c.name}</option>`).join('')}
            </select>
            <label>الكاتيقوريات المطلوبة للمنشن:</label>
            <select name="mentionCats" class="form-control" multiple style="height: 120px;">
                ${catOptions}
            </select>
            <button type="submit" class="btn">إضافة الستريمر</button>
        </form>
        <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.05); margin: 20px 0;">
        <h3>الستريمرز المضافين</h3>
        <div style="margin-top: 15px;">${streamerRows || '<p style="color: #9ca3af;">لا يوجد ستريمرز مضافين.</p>'}</div>
    </div>`;
    res.send(ui(g, 'kick', content));
});

app.post('/save/:guildId/kick', checkGuildAdmin, async (req, res) => {
    const { guildId } = req.params;
    const { kickUser, channelId, mentionCats } = req.body;
    const username = kickUser.replace('https://kick.com', '').replace('/', '').trim();
    const cats = Array.isArray(mentionCats) ? mentionCats : (mentionCats ? [mentionCats] : []);
    await KickConfig.findOneAndUpdate(
        { guildId },
        { $push: { streamers: { kickUsername: username, channelId, mentionCategories: cats, isLive: false } } },
        { upsert: true }
    );
    res.redirect(`/manage/${guildId}/kick`);
});

app.get('/delete-kick/:guildId/:index', checkGuildAdmin, async (req, res) => {
    const { guildId, index } = req.params;
    const config = await KickConfig.findOne({ guildId });
    if (config) { config.streamers.splice(index, 1); await config.save(); }
    res.redirect(`/manage/${guildId}/kick`);
});

// --- [ Logs ] ---
app.get('/manage/:guildId/logs', checkGuildAdmin, async (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    if (!g) return res.redirect('/dashboard');
    let s = await GuildConfig.findOne({ guildId: g.id }) || { logs: {} };
    const types = ['messages', 'moderation', 'members', 'channels', 'roles', 'voice'];
    const typeLabels = { messages: 'الرسائل', moderation: 'الإشراف', members: 'الأعضاء', channels: 'القنوات', roles: 'الرتب', voice: 'الصوت' };

    const content = `
    <div class="card">
        <h2>نظام اللوق (السجلات)</h2>
        <form method="POST" action="/save/${g.id}/logs">
            ${types.map(t => `
                <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 15px;">
                    <label class="checkbox-container" style="width: 150px;">
                        <input type="checkbox" name="${t}_st" ${s.logs?.[t]?.enabled ? 'checked' : ''}> ${typeLabels[t]}
                    </label>
                    <select name="${t}_ch" class="form-control" style="margin: 0; flex: 1;">
                        <option value="">-- اختر القناة --</option>
                        ${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}" ${s.logs?.[t]?.channel === c.id ? 'selected' : ''}># ${c.name}</option>`).join('')}
                    </select>
                </div>
            `).join('')}
            <button type="submit" class="btn" style="margin-top: 20px;">حفظ اللوق</button>
        </form>
    </div>`;
    res.send(ui(g, 'logs', content));
});

app.post('/save/:guildId/logs', checkGuildAdmin, async (req, res) => {
    const b = req.body;
    const types = ['messages', 'moderation', 'members', 'channels', 'roles', 'voice'];
    let logData = {};
    types.forEach(t => {
        logData[`logs.${t}`] = { enabled: b[`${t}_st`] === 'on', channel: b[`${t}_ch`] };
    });
    await GuildConfig.findOneAndUpdate({ guildId: req.params.guildId }, { $set: logData }, { upsert: true });
    res.redirect(`/manage/${req.params.guildId}/logs`);
});

// --- [ Welcome ] ---
app.get('/manage/:guildId/welcome', checkGuildAdmin, async (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    if (!g) return res.redirect('/dashboard');
    let s = await GuildConfig.findOne({ guildId: g.id }) || { welcome: {} };

    const content = `
    <div class="card">
        <h2>إعدادات الترحيب</h2>
        <form method="POST" action="/save/${g.id}/welcome" enctype="multipart/form-data">
            <label class="checkbox-container">
                <input type="checkbox" name="enabled" ${s.welcome?.enabled ? 'checked' : ''}> تفعيل الترحيب
            </label>
            <label>قناة الترحيب:</label>
            <select name="channel" class="form-control">
                <option value="">-- اختر القناة --</option>
                ${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}" ${s.welcome?.channel === c.id ? 'selected' : ''}># ${c.name}</option>`).join('')}
            </select>
            <label>رسالة الترحيب (استخدم {member} {guild} {count}):</label>
            <textarea name="embedMessage" class="form-control" rows="4">${s.welcome?.embedMessage || ''}</textarea>
            <button type="submit" class="btn">حفظ الإعدادات</button>
        </form>
    </div>`;
    res.send(ui(g, 'welcome', content));
});

app.post('/save/:guildId/welcome', checkGuildAdmin, upload.single('bgImage'), async (req, res) => {
    const b = req.body;
    await GuildConfig.findOneAndUpdate(
        { guildId: req.params.guildId },
        { $set: { 'welcome.enabled': b.enabled === 'on', 'welcome.channel': b.channel, 'welcome.embedMessage': b.embedMessage } },
        { upsert: true }
    );
    res.redirect(`/manage/${req.params.guildId}/welcome`);
});

// --- [ Security ] ---
app.get('/manage/:guildId/security', checkGuildAdmin, async (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    if (!g) return res.redirect('/dashboard');
    let s = await GuildConfig.findOne({ guildId: g.id }) || { security: {} };

    const content = `
    <div class="card">
        <h2>إعدادات الحماية</h2>
        <form method="POST" action="/save/${g.id}/security">
            <label class="checkbox-container">
                <input type="checkbox" name="antiLinks" ${s.security?.antiLinks ? 'checked' : ''}> حظر الروابط
            </label>
            <label>الكلمات المحظورة (افصل بينها بفاصلة):</label>
            <input type="text" name="badWords" class="form-control" value="${s.security?.badWords || ''}">
            <button type="submit" class="btn">حفظ الإعدادات</button>
        </form>
    </div>`;
    res.send(ui(g, 'security', content));
});

app.post('/save/:guildId/security', checkGuildAdmin, async (req, res) => {
    const b = req.body;
    await GuildConfig.findOneAndUpdate(
        { guildId: req.params.guildId },
        { $set: { security: { antiLinks: b.antiLinks === 'on', badWords: b.badWords } } },
        { upsert: true }
    );
    res.redirect(`/manage/${req.params.guildId}/security`);
});

// --- [ Auto Reply ] ---
app.get('/manage/:guildId/autoreply', checkGuildAdmin, async (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    if (!g) return res.redirect('/dashboard');
    let s = await GuildConfig.findOne({ guildId: g.id }) || { autoReply: [] };

    const rows = Array.from({ length: 5 }, (_, i) => `
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
            <input type="text" name="trigger_${i}" class="form-control" placeholder="الكلمة المفتاحية" value="${s.autoReply?.[i]?.trigger || ''}" style="margin:0;">
            <input type="text" name="reply_${i}" class="form-control" placeholder="الرد" value="${s.autoReply?.[i]?.reply || ''}" style="margin:0;">
        </div>
    `).join('');

    const content = `
    <div class="card">
        <h2>الرد الآلي</h2>
        <form method="POST" action="/save/${g.id}/autoreply">
            ${rows}
            <button type="submit" class="btn" style="margin-top: 15px;">حفظ الردود</button>
        </form>
    </div>`;
    res.send(ui(g, 'autoreply', content));
});

app.post('/save/:guildId/autoreply', checkGuildAdmin, async (req, res) => {
    const { guildId } = req.params;
    const finalData = [];
    for (let i = 0; i < 5; i++) {
        const t = req.body[`trigger_${i}`]?.trim();
        const r = req.body[`reply_${i}`]?.trim();
        if (t && r) finalData.push({ trigger: t, reply: r });
    }
    await GuildConfig.findOneAndUpdate({ guildId }, { $set: { autoReply: finalData } }, { upsert: true });
    res.redirect(`/manage/${guildId}/autoreply`);
});

// --- [ Giveaway ] ---
app.get('/manage/:guildId/giveaway', checkGuildAdmin, async (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    if (!g) return res.redirect('/dashboard');
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
    if (!g) return res.status(404).send('السيرفر غير موجود');
    const timeMs = ms(duration);
    if (!timeMs) return res.send('صيغة الوقت غير صحيحة');
    const endAt = new Date(Date.now() + timeMs);
    const targetCh = g.channels.cache.get(channel);
    if (!targetCh) return res.send('القناة غير موجودة');

    const embed = new EmbedBuilder()
        .setTitle(`🎉 قيف اواي: ${prize}`)
        .setDescription(`اضغط على التفاعل 🎉 للاشتراك!\n\nعدد الفائزين: ${winners}`)
        .setColor(0x3b82f6)
        .setTimestamp(endAt);

    const giveawayMsg = await targetCh.send({ embeds: [embed] });
    await giveawayMsg.react('🎉');
    await Giveaway.create({ guildId: g.id, messageId: giveawayMsg.id, channelId: channel, endAt, winnersCount: parseInt(winners), prize });
    res.redirect(`/manage/${g.id}/giveaway`);
});

// --- [ Tickets ] ---
app.get('/manage/:guildId/tickets', checkGuildAdmin, async (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    if (!g) return res.redirect('/dashboard');
    let s = await TicketConfig.findOne({ guildId: g.id }) || {};

    const content = `
    <div class="card">
        <h2>نظام التذاكر</h2>
        <form method="POST" action="/save/${g.id}/tickets">
            <label>عنوان اللوحة:</label>
            <input type="text" name="title" class="form-control" value="${s.title || 'الدعم الفني'}">
            <label>الوصف:</label>
            <textarea name="description" class="form-control">${s.description || 'اضغط الزر أدناه لفتح تذكرة'}</textarea>
            <label>قناة الإرسال:</label>
            <select name="targetChannel" class="form-control">
                <option value="">-- لا ترسل الآن --</option>
                ${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}"># ${c.name}</option>`).join('')}
            </select>
            <button type="submit" class="btn">حفظ وإرسال اللوحة</button>
        </form>
    </div>`;
    res.send(ui(g, 'tickets', content));
});

app.post('/save/:guildId/tickets', checkGuildAdmin, async (req, res) => {
    const b = req.body;
    const g = client.guilds.cache.get(req.params.guildId);
    await TicketConfig.findOneAndUpdate(
        { guildId: req.params.guildId },
        { $set: { title: b.title, description: b.description } },
        { upsert: true }
    );
    if (b.targetChannel) {
        const channel = g.channels.cache.get(b.targetChannel);
        if (channel) {
            const embed = new EmbedBuilder().setTitle(b.title).setDescription(b.description).setColor(0x3b82f6);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('open_ticket').setLabel('فتح تذكرة').setStyle(ButtonStyle.Primary).setEmoji('🎫')
            );
            await channel.send({ embeds: [embed], components: [row] });
        }
    }
    res.redirect(`/manage/${req.params.guildId}/tickets`);
});

// --- [ Levels ] ---
app.get('/manage/:guildId/levels', checkGuildAdmin, async (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    if (!g) return res.redirect('/dashboard');
    let s = await GuildConfig.findOne({ guildId: g.id }) || { levels: {} };

    const content = `
    <div class="card">
        <h2>إعدادات المستويات</h2>
        <form method="POST" action="/save/${g.id}/levels">
            <label class="checkbox-container">
                <input type="checkbox" name="enabled" ${s.levels?.enabled ? 'checked' : ''}> تفعيل المستويات
            </label>
            <label>XP لكل رسالة:</label>
            <input type="number" name="xpPerMessage" class="form-control" value="${s.levels?.xpPerMessage || 10}">
            <button type="submit" class="btn">حفظ الإعدادات</button>
        </form>
    </div>`;
    res.send(ui(g, 'levels', content));
});

app.post('/save/:guildId/levels', checkGuildAdmin, async (req, res) => {
    const b = req.body;
    await GuildConfig.findOneAndUpdate(
        { guildId: req.params.guildId },
        { $set: { levels: { enabled: b.enabled === 'on', xpPerMessage: Number(b.xpPerMessage) || 10 } } },
        { upsert: true }
    );
    res.redirect(`/manage/${req.params.guildId}/levels`);
});

// --- [ Roles Panel ] ---
app.get('/manage/:guildId/roles', checkGuildAdmin, async (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    if (!g) return res.redirect('/dashboard');
    const content = `
    <div class="card">
        <h2>لوحة الرتب الذاتية</h2>
        <p style="color: #9ca3af;">قريباً سيتم تفعيل إعدادات الرتب الذاتية الكاملة.</p>
    </div>`;
    res.send(ui(g, 'roles', content));
});

app.get('/ping', (req, res) => res.send('I am alive!'));
app.get('/', (req, res) => res.redirect('/dashboard'));

// ==========================================
// 9. Discord Bot Event Handlers (Suggestions & Tickets & Kick & Levels)
// ==========================================

client.on('ready', async () => {
    console.log(`[BOT] Logged in as ${client.user.tag}`);
    client.user.setActivity('Abood System | /suggest', { type: ActivityType.Watching });
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('[BOT] Slash commands registered successfully.');
    } catch (e) {
        console.error('[Slash Command Error]', e);
    }
});

// --- Suggestion Creation via Slash Command & Message ---
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // Auto Reply
    const cfg = await GuildConfig.findOne({ guildId: message.guild.id });
    const ar = cfg?.autoReply?.find(x => x.trigger && message.content.toLowerCase() === x.trigger.toLowerCase());
    if (ar) message.reply(ar.reply).catch(() => {});

    // Suggestions channel listener
    if (cfg?.suggestions?.enabled && message.channel.id === cfg.suggestions.channelId) {
        const text = message.content;
        await message.delete().catch(() => {});
        const embed = buildSuggestionEmbed(message.author, text);
        const msg = await message.channel.send({ embeds: [embed], components: buildSuggestionMenu() });
        await msg.react('✅');
        await msg.react('❌');

        await SuggestionStore.create({
            guildId: message.guild.id,
            messageId: msg.id,
            userId: message.author.id,
            text: text,
            status: 'قيد المراجعة',
            votes: { approve: 0, reject: 0 }
        });
        return;
    }

    // Levels XP
    if (cfg?.levels?.enabled) {
        let u = await UserLevel.findOne({ guildId: message.guild.id, userId: message.author.id });
        if (!u) u = await UserLevel.create({ guildId: message.guild.id, userId: message.author.id });
        u.xp += cfg.levels.xpPerMessage || 10;
        u.msgCount++;
        if (u.xp >= u.level * u.level * 100) {
            u.level++;
            message.channel.send(`مبروك ${message.author}! وصلت للمستوى **${u.level}** 🚀`).catch(() => {});
        }
        await u.save();
    }
});

// Slash Command handler
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'suggest') {
            const cfg = await GuildConfig.findOne({ guildId: interaction.guild.id });
            if (!cfg?.suggestions?.enabled || !cfg?.suggestions?.channelId) {
                return interaction.reply({ content: '❌ نظام الاقتراحات غير مفعل أو القناة غير محددة.', ephemeral: true });
            }
            const text = interaction.options.getString('text');
            const channel = interaction.guild.channels.cache.get(cfg.suggestions.channelId);
            if (!channel) return interaction.reply({ content: '❌ قناة الاقتراحات غير موجودة.', ephemeral: true });

            const embed = buildSuggestionEmbed(interaction.user, text);
            const msg = await channel.send({ embeds: [embed], components: buildSuggestionMenu() });
            await msg.react('✅');
            await msg.react('❌');

            await SuggestionStore.create({
                guildId: interaction.guild.id,
                messageId: msg.id,
                userId: interaction.user.id,
                text: text,
                status: 'قيد المراجعة',
                votes: { approve: 0, reject: 0 }
            });

            await interaction.reply({ content: '✅ تم إرسال اقتراحك بنجاح!', ephemeral: true });
        }
    }

    // Reactions votes tracking
    if (interaction.isStringSelectMenu() && interaction.customId === 'suggestion_admin_action') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ content: '❌ هذا الأمر مخصص للإدارة فقط!', ephemeral: true });
        }

        const data = await SuggestionStore.findOne({ messageId: interaction.message.id });
        if (!data) return interaction.reply({ content: '❌ بيانات الاقتراح غير موجودة.', ephemeral: true });

        const action = interaction.values[0];

        if (action === 'delete') {
            await interaction.message.delete().catch(() => {});
            await SuggestionStore.deleteOne({ messageId: interaction.message.id });
            return interaction.reply({ content: '🗑️ تم حذف الاقتراح.', ephemeral: true });
        }

        if (action === 'approve') {
            data.status = '✅ تمت الموافقة';
            await data.save();
            const author = await client.users.fetch(data.userId).catch(() => ({ username: 'مستخدم' }));
            const embed = buildSuggestionEmbed(author, data.text, data.status, data.replyText, data.votes);
            await interaction.message.edit({ embeds: [embed], components: buildSuggestionMenu(data.threadId ? `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${data.threadId}` : null) });
            return interaction.reply({ content: '✅ تمت الموافقة على الاقتراح.', ephemeral: true });
        }

        if (action === 'reply') {
            const modal = new ModalBuilder()
                .setCustomId(`suggestion_reply_modal_${data.messageId}`)
                .setTitle('الرد على الاقتراح')
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('reply_text')
                            .setLabel('اكتب رد الإدارة هنا')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    )
                );
            return interaction.showModal(modal);
        }
    }

    // Modal Submit for Suggestion Reply
    if (interaction.isModalSubmit() && interaction.customId.startsWith('suggestion_reply_modal_')) {
        const messageId = interaction.customId.replace('suggestion_reply_modal_', '');
        const data = await SuggestionStore.findOne({ messageId });
        if (!data) return interaction.reply({ content: '❌ بيانات الاقتراح غير موجودة.', ephemeral: true });

        const replyText = interaction.fields.getTextInputValue('reply_text');
        data.replyText = replyText;
        data.status = '💬 تم الرد';

        // Create Thread
        const thread = await interaction.message.startThread({
            name: `رد الإدارة على الاقتراح`,
            autoArchiveDuration: 60
        }).catch(() => null);

        if (thread) {
            data.threadId = thread.id;
            await thread.send(`**رد الإدارة:** ${replyText}`);
        }
        await data.save();

        const author = await client.users.fetch(data.userId).catch(() => ({ username: 'مستخدم' }));
        const threadUrl = thread ? `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${thread.id}` : null;
        const embed = buildSuggestionEmbed(author, data.text, data.status, replyText, data.votes);
        await interaction.message.edit({ embeds: [embed], components: buildSuggestionMenu(threadUrl) });

        // DM User
        if (author && author.send) {
            author.send(`📬 **تم الرد على اقتراحك في سيرفر ${interaction.guild.name}**\nالرد: ${replyText}`).catch(() => {});
        }

        return interaction.reply({ content: '✅ تم إرسال الرد وفتح الثريد بنجاح!', ephemeral: true });
    }

    // Tickets open button
    if (interaction.isButton() && interaction.customId === 'open_ticket') {
        const tConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
        const category = interaction.guild.channels.cache.get(tConfig?.categoryId);
        const channelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9]/g, '');

        const ticketChannel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: category ? category.id : undefined,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
            ]
        });

        await TicketData.create({
            guildId: interaction.guild.id,
            channelId: ticketChannel.id,
            ownerId: interaction.user.id,
            openedAt: new Date()
        });

        const closeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('close_ticket').setLabel('إغلاق التذكرة').setStyle(ButtonStyle.Danger).setEmoji('🔒')
        );

        await ticketChannel.send({
            content: `مرحباً ${interaction.user}، فريق الدعم سيرد عليك قريباً.`,
            components: [closeRow]
        });

        return interaction.reply({ content: `✅ تم فتح تذكرتك: ${ticketChannel}`, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'close_ticket') {
        await interaction.reply({ content: '🔒 جاري إغلاق التذكرة خلال 5 ثواني...' });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
});

// Reaction add vote tracking
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch().catch(() => {});
    const data = await SuggestionStore.findOne({ messageId: reaction.message.id });
    if (!data) return;

    if (reaction.emoji.name === '✅') {
        data.votes.approve += 1;
        await data.save();
    } else if (reaction.emoji.name === '❌') {
        data.votes.reject += 1;
        await data.save();
    }

    const author = await client.users.fetch(data.userId).catch(() => ({ username: 'مستخدم' }));
    const embed = buildSuggestionEmbed(author, data.text, data.status, data.replyText, data.votes);
    await reaction.message.edit({ embeds: [embed] }).catch(() => {});
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch().catch(() => {});
    const data = await SuggestionStore.findOne({ messageId: reaction.message.id });
    if (!data) return;

    if (reaction.emoji.name === '✅') {
        data.votes.approve = Math.max(0, data.votes.approve - 1);
        await data.save();
    } else if (reaction.emoji.name === '❌') {
        data.votes.reject = Math.max(0, data.votes.reject - 1);
        await data.save();
    }

    const author = await client.users.fetch(data.userId).catch(() => ({ username: 'مستخدم' }));
    const embed = buildSuggestionEmbed(author, data.text, data.status, data.replyText, data.votes);
    await reaction.message.edit({ embeds: [embed] }).catch(() => {});
});

// ==========================================
// 10. Start Express & Bot
// ==========================================
client.login(process.env.DISCORD_TOKEN);
app.listen(Number(process.env.PORT || 3000), () => {
    console.log(`[Dashboard] Running on port ${process.env.PORT || 3000}`);
});
