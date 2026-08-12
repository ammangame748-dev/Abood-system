
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
// 1. تعريف الـ Schemas (قاعدة البيانات)
// ==========================================

const AdminCmdConfig = mongoose.model('AdminCmdConfig', new mongoose.Schema({
    guildId: String,
    adminRoles: { type: [String], default: [] },
    settings: {
        lock: { shortcut: { type: String, default: '-ق' }, delUser: { type: Boolean, default: false }, delBot: { type: Boolean, default: false } },
        unlock: { shortcut: { type: String, default: '-ف' }, delUser: { type: Boolean, default: false }, delBot: { type: Boolean, default: false } },
        timeout: { shortcut: { type: String, default: '-ت' }, delUser: { type: Boolean, default: false }, delBot: { type: Boolean, default: false } },
        untimeout: { shortcut: { type: String, default: '-فت' }, delUser: { type: Boolean, default: false }, delBot: { type: Boolean, default: false } },
        ban: { shortcut: { type: String, default: '-ب' }, delUser: { type: Boolean, default: false }, delBot: { type: Boolean, default: false } },
        unban: { shortcut: { type: String, default: '-فب' }, delUser: { type: Boolean, default: false }, delBot: { type: Boolean, default: false } },
        kick: { shortcut: { type: String, default: '-ك' }, delUser: { type: Boolean, default: false }, delBot: { type: Boolean, default: false } }
    }
}));

const KickConfig = mongoose.model('KickConfig', new mongoose.Schema({
    guildId: String,
    streamers: [{
        kickUsername: String,
        channelId: String,
        roleId: String,
        customMessage: String,
        isLive: { type: Boolean, default: false }
    }]
}));

const TicketData = mongoose.model('TicketData', new mongoose.Schema({
    ticketCount: { type: Number, default: 0 },
    guildId: String,
    channelId: String,
    ownerId: String,
    ticketType: { type: String, default: 'تذكرة دعم' },
    adminRoleId: String,
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
    msgCount: { type: Number, default: 0 }
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

const Warn = mongoose.model('Warn', new mongoose.Schema({
    guildId: String,
    userId: String,
    reason: String,
    moderatorId: String,
    createdAt: { type: Date, default: Date.now }
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
}));

const SuggestionConfig = mongoose.model('SuggestionConfig', new mongoose.Schema({
    guildId: String,
    channelId: String,
    imagePath: String,
    emoji1: String,
    emoji2: String
}));

const Suggestion = mongoose.model('Suggestion', new mongoose.Schema({
    guildId: String,
    messageId: String,
    channelId: String,
    authorId: String,
    content: String,
    status: { type: String, default: 'pending' },
    votes1: { type: [String], default: [] },
    votes2: { type: [String], default: [] },
    replyThreadId: String,
    createdAt: { type: Date, default: Date.now }
}));

const TicketConfig = mongoose.model('TicketConfig', new mongoose.Schema({
    guildId: String,
    channelId: String,
    title: String,
    description: String,
    color: String,
    topImagePath: String,
    bottomImagePath: String,
    ticketCount: { type: Number, default: 0 },
    buttons: [{ label: String, emoji: String, roleId: String }],
    menuOptions: [{ label: String, emoji: String, roleId: String }]
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

// ==========================================
// 4. اتصال قاعدة البيانات
// ==========================================
mongoose.connect(process.env.MONGO_CONNECTION_STRING)
    .then(() => console.log('[DB] Connected to MongoDB'))
    .catch(err => console.log('[DB] Connection Error:', err));

// ==========================================
// 5. الدوال المساعدة
// ==========================================
function getEmojiDisplay(guild, emojiId) {
    if (!emojiId) return '❓';
    const em = guild.emojis.cache.get(emojiId);
    return em ? em.toString() : `<:v:${emojiId}>`;
}

// ==========================================
// 6. Auth Setup
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
    secret: process.env.SESSION_SECRET || 'Abood System -secret-key-2026',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

const checkAuth = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
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
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abood System - تسجيل الدخول</title>
    <link href="https://fonts.googleapis.com/css2?family=Changa:wght@400;500;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --blue: #39FF14;
            --blue-dark: #2ECC71;
            --red: #FF3131;
            --red-light: #FF5E5E;
            --black: #050508;
            --dark: #0d0d18;
            --card: rgba(10, 25, 10, 0.85);
            --border: rgba(57, 255, 20, 0.25);
        }
        body {
            font-family: 'Changa', sans-serif;
            background: var(--black);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }
        .bg-particles {
            position: fixed; inset: 0; z-index: 0;
            background: radial-gradient(ellipse at 20% 50%, rgba(57,255,20,0.08) 0%, transparent 60%),
                        radial-gradient(ellipse at 80% 20%, rgba(255,49,49,0.06) 0%, transparent 50%);
        }
        .login-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 50px 60px;
            text-align: center;
            backdrop-filter: blur(30px);
            box-shadow: 0 0 60px rgba(57,255,20,0.1);
            min-width: 380px;
            z-index: 10;
        }
        .btn-discord {
            display: inline-flex; align-items: center; gap: 12px;
            background: linear-gradient(135deg, var(--blue), var(--blue-dark));
            color: black; padding: 16px 40px; border-radius: 14px;
            text-decoration: none; font-weight: 700; font-size: 16px;
            transition: all 0.3s; border: 1px solid rgba(57,255,20,0.3);
        }
        .logo-text { font-size: 32px; font-weight: 800; color: var(--blue); margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="bg-particles"></div>
    <div class="login-card">
        <div class="logo-text">Abood System</div>
        <h2>مرحباً بك</h2>
        <p style="color:white; margin-bottom:20px;">سجل دخولك عبر ديسكورد</p>
        <a href="/auth/discord" class="btn-discord">تسجيل الدخول</a>
    </div>
</body>
</html>`);
});

app.get('/dashboard', checkAuth, async (req, res) => {
    const guilds = req.user.guilds.filter(g => (g.permissions & 0x8) === 0x8);
    let content = '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:20px;">';
    guilds.forEach(g => {
        const icon = g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : 'https://placehold.co/100x100?text=Server';
        content += `
        <a href="/manage/${g.id}/home" style="text-decoration:none; color:white;">
            <div class="card" style="text-align:center;">
                <img src="${icon}" style="width:80px; height:80px; border-radius:50%; margin-bottom:10px; border:2px solid var(--border);">
                <div style="font-weight:700;">${g.name}</div>
            </div>
        </a>`;
    });
    content += '</div>';
    res.send(ui({}, 'dashboard', content));
});

function ui(guild, active, content) {
    const sidebarWidth = '280px';
    const navItems = guild.id ? `
        <a class="${active === 'home' ? 'active' : ''}" href="/manage/${guild.id}/home">الإحصائيات</a>
        <a class="${active === 'kick' ? 'active' : ''}" href="/manage/${guild.id}/kick">تنبيهات Kick</a>
        <a class="${active === 'admincmds' ? 'active' : ''}" href="/manage/${guild.id}/admincmds">الأوامر الإدارية</a>
        <a class="${active === 'suggestions' ? 'active' : ''}" href="/manage/${guild.id}/suggestions">الاقتراحات</a>
        <a class="${active === 'tickets' ? 'active' : ''}" href="/manage/${guild.id}/tickets">التذاكر</a>
    ` : '';

    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>Abood System | Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Changa:wght@400;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --blue: #39FF14;
            --blue-glow: rgba(57, 255, 20, 0.15);
            --black: #050508;
            --dark: #0a140a;
            --card: rgba(12, 24, 12, 0.75);
            --border: rgba(57, 255, 20, 0.18);
            --sidebar-w: ${sidebarWidth};
        }
        body { font-family: 'Changa', sans-serif; background: var(--black); color: white; display: flex; direction: rtl; }
        .sidebar {
            width: var(--sidebar-w); background: var(--dark); border-left: 1px solid var(--border);
            position: fixed; right: 0; top: 0; bottom: 0; display: flex; flex-direction: column; padding: 20px;
        }
        .nav a { display: block; padding: 12px; color: #ccc; text-decoration: none; margin-bottom: 5px; border-radius: 8px; }
        .nav a:hover, .nav a.active { background: var(--blue-glow); color: var(--blue); border: 1px solid var(--border); }
        .main { margin-right: var(--sidebar-w); padding: 40px; flex: 1; min-height: 100vh; }
        .card { background: var(--card); border: 1px solid var(--border); border-radius: 18px; padding: 24px; margin-bottom: 20px; }
        input, select, textarea { width: 100%; padding: 12px; background: #000; border: 1px solid var(--border); color: white; border-radius: 8px; margin-bottom: 15px; }
        button { background: var(--blue); color: black; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 700; }
    </style>
</head>
<body>
    <div class="sidebar">
        <h2 style="color:var(--blue); margin-bottom:30px; text-align:center;">Abood System</h2>
        <div class="nav">${navItems}</div>
    </div>
    <div class="main">${content}</div>
</body>
</html>`;
}

// --- [ Suggestions ] ---
app.get('/manage/:guildId/suggestions', checkAuth, async (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    if (!g) return res.redirect('/dashboard');
    const s = await SuggestionConfig.findOne({ guildId: g.id }) || {};
    const content = `
    <form method="POST" action="/save/${g.id}/suggestions">
        <div class="card">
            <h3>إعدادات الاقتراحات</h3>
            <label>قناة الاقتراحات</label>
            <select name="channelId">
                <option value="">-- اختر القناة --</option>
                ${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}" ${s.channelId === c.id ? 'selected' : ''}># ${c.name}</option>`).join('')}
            </select>
            <label>إيموجي 1 (موافقة)</label>
            <input name="emoji1" value="${s.emoji1 || '✅'}">
            <label>إيموجي 2 (رفض)</label>
            <input name="emoji2" value="${s.emoji2 || '❌'}">
            <button type="submit">حفظ الإعدادات</button>
        </div>
    </form>`;
    res.send(ui(g, 'suggestions', content));
});

app.post('/save/:guildId/suggestions', checkAuth, async (req, res) => {
    await SuggestionConfig.findOneAndUpdate({ guildId: req.params.guildId }, { $set: req.body }, { upsert: true });
    res.redirect(`/manage/${req.params.guildId}/suggestions`);
});

// --- [ Admin Commands ] ---
app.get('/manage/:guildId/admincmds', checkAuth, async (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    if (!g) return res.redirect('/dashboard');
    const s = await AdminCmdConfig.findOne({ guildId: g.id }) || { settings: {} };
    const content = `
    <form method="POST" action="/save/${g.id}/admincmds">
        <div class="card">
            <h3>الأوامر الإدارية</h3>
            ${Object.keys(s.settings || {}).map(cmd => `
            <div style="margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;">
                <h4>${cmd.toUpperCase()}</h4>
                <label>الاختصار</label>
                <input name="shortcut_${cmd}" value="${s.settings[cmd]?.shortcut || ''}">
                <label><input type="checkbox" name="delUser_${cmd}" ${s.settings[cmd]?.delUser ? 'checked' : ''}> حذف رسالة المستخدم</label><br>
                <label><input type="checkbox" name="delBot_${cmd}" ${s.settings[cmd]?.delBot ? 'checked' : ''}> حذف رد البوت</label>
            </div>`).join('')}
            <button type="submit">حفظ التغييرات</button>
        </div>
    </form>`;
    res.send(ui(g, 'admincmds', content));
});

app.post('/save/:guildId/admincmds', checkAuth, async (req, res) => {
    const b = req.body;
    const settings = {};
    ['lock', 'unlock', 'timeout', 'untimeout', 'ban', 'unban', 'kick'].forEach(cmd => {
        settings[cmd] = {
            shortcut: b[`shortcut_${cmd}`],
            delUser: b[`delUser_${cmd}`] === 'on',
            delBot: b[`delBot_${cmd}`] === 'on'
        };
    });
    await AdminCmdConfig.findOneAndUpdate({ guildId: req.params.guildId }, { $set: { settings } }, { upsert: true });
    res.redirect(`/manage/${req.params.guildId}/admincmds`);
});

// --- [ Tickets ] ---
app.get('/manage/:guildId/tickets', checkAuth, async (req, res) => {
    const g = client.guilds.cache.get(req.params.guildId);
    if (!g) return res.redirect('/dashboard');
    const s = await TicketConfig.findOne({ guildId: g.id }) || { buttons: [], menuOptions: [] };
    const content = `
    <form method="POST" action="/save/${g.id}/tickets">
        <div class="card">
            <h3>إعدادات التذاكر</h3>
            <label>قناة إرسال اللوحة</label>
            <select name="targetChannel">
                ${g.channels.cache.filter(c => c.type === 0).map(c => `<option value="${c.id}" ${s.channelId === c.id ? 'selected' : ''}># ${c.name}</option>`).join('')}
            </select>
            <h4>الأقسام (الرتب)</h4>
            ${[0,1,2,3].map(i => `
            <div style="display:flex; gap:10px; margin-bottom:10px;">
                <input name="btn_label_${i}" value="${s.buttons?.[i]?.label || ''}" placeholder="اسم القسم">
                <select name="btn_role_${i}">
                    <option value="">-- رتبة القسم --</option>
                    ${g.roles.cache.map(r => `<option value="${r.id}" ${s.buttons?.[i]?.roleId === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
                </select>
            </div>`).join('')}
            <button type="submit">حفظ وإرسال</button>
        </div>
    </form>`;
    res.send(ui(g, 'tickets', content));
});

app.post('/save/:guildId/tickets', checkAuth, async (req, res) => {
    const b = req.body;
    const buttons = [];
    for (let i = 0; i < 4; i++) {
        if (b[`btn_label_${i}`]) buttons.push({ label: b[`btn_label_${i}`], roleId: b[`btn_role_${i}`] });
    }
    const config = await TicketConfig.findOneAndUpdate({ guildId: req.params.guildId }, { $set: { channelId: b.targetChannel, buttons } }, { upsert: true, new: true });
    
    const channel = client.channels.cache.get(b.targetChannel);
    if (channel) {
        const row = new ActionRowBuilder();
        config.buttons.forEach((btn, i) => {
            row.addComponents(new ButtonBuilder().setCustomId(`ticket_btn_${i}`).setLabel(btn.label).setStyle(ButtonStyle.Primary));
        });
        await channel.send({ content: 'لوحة التذاكر', components: [row] });
    }
    res.redirect(`/manage/${req.params.guildId}/tickets`);
});

// --- [ Discord Events ] ---
client.on('messageCreate', async (msg) => {
    if (!msg.guild || msg.author.bot) return;

    // --- Admin Commands ---
    const adminCfg = await AdminCmdConfig.findOne({ guildId: msg.guild.id });
    if (adminCfg) {
        const args = msg.content.trim().split(/ +/);
        const cmdText = args[0];
        const entry = Object.entries(adminCfg.settings).find(([k, v]) => v.shortcut === cmdText);
        if (entry) {
            const [actionKey, settings] = entry;
            if (msg.member.permissions.has(PermissionFlagsBits.Administrator)) {
                const target = msg.mentions.members.first() || msg.guild.members.cache.get(args[1]);
                if (settings.delUser) await msg.delete().catch(() => {});
                
                let resultMsg = null;
                if (actionKey === 'lock') {
                    await msg.channel.permissionOverwrites.edit(msg.guild.roles.everyone, { SendMessages: false });
                    resultMsg = await msg.channel.send('🔒 تم القفل');
                } else if (actionKey === 'unlock') {
                    await msg.channel.permissionOverwrites.edit(msg.guild.roles.everyone, { SendMessages: null });
                    resultMsg = await msg.channel.send('🔓 تم الفتح');
                } else if (actionKey === 'timeout' && target) {
                    let duration = 60 * 60 * 1000; // Default 1 hour
                    const timeArg = args[2];
                    if (timeArg) {
                        const val = parseInt(timeArg);
                        if (!isNaN(val)) {
                            // Extract unit: d, w, h, m or nothing
                            const unitMatch = timeArg.match(/[a-zA-Z]+/);
                            const unit = unitMatch ? unitMatch[0].toLowerCase() : 'm'; // Default to minutes if no unit
                            
                            if (unit === 'd') duration = val * 24 * 60 * 60 * 1000;
                            else if (unit === 'w') duration = val * 7 * 24 * 60 * 60 * 1000;
                            else if (unit === 'h') duration = val * 60 * 60 * 1000;
                            else if (unit === 'm') duration = val * 60 * 1000;
                            else duration = val * 60 * 1000; // Fallback to minutes
                        }
                    }
                    await target.timeout(duration).catch((e) => console.error(e));
                    resultMsg = await msg.channel.send(`⏳ تم التايم أوت لـ ${target.user.username} بنجاح.`);
                } else if (actionKey === 'ban' && target) {
                    await target.ban().catch(() => {});
                    resultMsg = await msg.channel.send(`🔨 تم الباند`);
                }
                if (resultMsg && settings.delBot) setTimeout(() => resultMsg.delete().catch(() => {}), 5000);
                return;
            }
        }
    }

    // --- Suggestions ---
    const sugCfg = await SuggestionConfig.findOne({ guildId: msg.guild.id, channelId: msg.channel.id });
    if (sugCfg) {
        const embed = new EmbedBuilder().setAuthor({ name: msg.author.username, iconURL: msg.author.displayAvatarURL() }).setDescription(msg.content).setColor(0x39FF14);
        await msg.delete().catch(() => {});
        const sent = await msg.channel.send({ embeds: [embed] });
        await sent.react(sugCfg.emoji1 || '✅');
        await sent.react(sugCfg.emoji2 || '❌');
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId.startsWith('ticket_btn_')) {
        const tConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
        const idx = parseInt(interaction.customId.replace('ticket_btn_', ''));
        const roleId = tConfig.buttons[idx].roleId;

        const ticketCount = await TicketData.countDocuments({ guildId: interaction.guild.id }) + 1;
        const ch = await interaction.guild.channels.create({
            name: `ticket-${ticketCount}`,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
                { id: roleId, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }
            ]
        });

        await TicketData.create({ guildId: interaction.guild.id, channelId: ch.id, ownerId: interaction.user.id, adminRoleId: roleId });
        
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('claim_ticket').setLabel('استلام التذكرة').setStyle(ButtonStyle.Success));
        await ch.send({ content: `تذكرة جديدة من ${interaction.user} | <@&${roleId}>`, components: [row] });
        await interaction.reply({ content: `تم فتح التذكرة: ${ch}`, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'claim_ticket') {
        const data = await TicketData.findOne({ channelId: interaction.channelId });
        if (data.claimedBy) return interaction.reply({ content: 'مستلمة بالفعل', ephemeral: true });

        const isAdmin = interaction.member.roles.cache.has(data.adminRoleId) || interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        if (!isAdmin) return interaction.reply({ content: 'لست من الإدارة المسؤولة', ephemeral: true });

        data.claimedBy = interaction.user.id;
        await data.save();

        await interaction.channel.permissionOverwrites.set([
            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: data.ownerId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]);

        await interaction.reply(`تم الاستلام بواسطة ${interaction.user}`);
    }
});

// --- Kick Checker ---
async function checkKick() {
    const configs = await KickConfig.find({});
    for (const c of configs) {
        for (const s of c.streamers) {
            try {
                const res = await axios.get(`https://kick.com/api/v2/channels/${s.kickUsername}`);
                const isLive = !!res.data.livestream;
                if (isLive && !s.isLive) {
                    s.isLive = true;
                    const ch = client.channels.cache.get(s.channelId);
                    if (ch) ch.send(`${s.kickUsername} هو الآن مباشر! https://kick.com/${s.kickUsername}`);
                } else if (!isLive) s.isLive = false;
            } catch (e) {}
        }
        await c.save();
    }
}
setInterval(checkKick, 25000);

client.login(process.env.TOKEN);
app.listen(process.env.PORT || 3000, () => console.log('Dashboard ready'));
