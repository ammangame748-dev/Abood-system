/*
  Discord Community Bot + Dark Animated Dashboard
  Single-file implementation: index.js

  Required environment variables:
  DISCORD_TOKEN=...
  DISCORD_CLIENT_ID=...
  DISCORD_CLIENT_SECRET=...
  DISCORD_REDIRECT_URI=http://localhost:3000/auth/callback
  SESSION_SECRET=change-this
  PORT=3000

  Install dependencies:
  npm i discord.js express express-session multer dotenv

  The dashboard stores settings in data/store.json and uploaded images in data/uploads.
*/

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const {
    Client,
    GatewayIntentBits,
    Partials,
    REST,
    Routes,
    PermissionFlagsBits,
    PermissionsBitField,
    ChannelType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    AttachmentBuilder,
} = require('discord.js');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const DEFAULT_STORE = {
    guilds: {},
    users: {},
    giveaways: {},
    reminders: [],
    tickets: {},
    warnings: {},
    levels: {},
};

function loadStore() {
    try {
        if (!fs.existsSync(STORE_FILE)) return structuredClone(DEFAULT_STORE);
        return { ...structuredClone(DEFAULT_STORE), ...JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')) };
    } catch (error) {
        console.error('Could not read store:', error.message);
        return structuredClone(DEFAULT_STORE);
    }
}
let store = loadStore();
let saveTimer;
function saveStore() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
    }, 250);
}
function guildConfig(guildId) {
    if (!store.guilds[guildId]) {
        store.guilds[guildId] = {
            welcome: { enabled: false, channelId: '', title: 'أهلاً وسهلاً بك', description: 'نورت السيرفر يا {user}', color: '#5865f2', image: '', rulesUrl: '' },
            autorole: { enabled: false, roleId: '' },
            verification: { enabled: false, channelId: '', roleId: '', title: 'التحقق من العضوية', description: 'اضغط على الزر للموافقة على قوانين السيرفر.', color: '#57f287' },
            logs: { enabled: false, channelId: '' },
            protection: { antiSpam: true, antiLinks: false, antiInvites: true, muteMinutes: 10, maxMessages: 6, windowSeconds: 8 },
            warnings: { enabled: true, maxWarnings: 3, action: 'kick' },
            leveling: { enabled: true, channelId: '', xpMin: 8, xpMax: 15, cooldownSeconds: 60 },
            tickets: {
                enabled: false, channelId: '', categoryId: '', supportRoleId: '', title: 'مركز الدعم', description: 'اختر نوع الطلب من القائمة لفتح تذكرة خاصة.', color: '#5865f2', image: '', options: [
                    { label: 'دعم فني', value: 'technical', description: 'مشكلة تقنية أو عطل', emoji: '' },
                    { label: 'شكوى', value: 'complaint', description: 'تقديم شكوى للإدارة', emoji: '' },
                    { label: 'شراء أو متجر', value: 'store', description: 'استفسار عن المتجر', emoji: '' },
                    { label: 'استفسار عام', value: 'general', description: 'أي سؤال آخر', emoji: '' },
                ]
            },
            suggestions: { enabled: false, channelId: '', image: '', color: '#fee75c', approveEmoji: '✅', rejectEmoji: '❌', approveEmojiId: '', rejectEmojiId: '' },
            reports: { enabled: true, channelId: '' },
            reminders: { enabled: false, channelId: '', text: '', intervalMinutes: 1440 },
            giveaways: { enabled: true, channelId: '' },
            announcements: { enabled: true, allowedChannelIds: [] },
            anonymous: { enabled: false, channelId: '' },
            autoresponses: { enabled: true, items: [{ trigger: 'كيف أحصل على رتبة؟', response: 'افتح التذاكر واختر استفسار عام.' }] },
        };
        saveStore();
    }
    return store.guilds[guildId];
}
function safeText(value, fallback = '') { return String(value ?? fallback).trim().slice(0, 4000); }
function bool(value) { return value === true || value === 'true' || value === 'on' || value === '1'; }
function color(value, fallback = '#5865f2') {
    const v = String(value || '').trim();
    return /^#[0-9a-f]{6}$/i.test(v) ? v : fallback;
}
function replaceTokens(text, member) {
    return String(text || '').replaceAll('{user}', `<@${member.id}>`).replaceAll('{username}', member.user.username).replaceAll('{server}', member.guild.name).replaceAll('{count}', String(member.guild.memberCount));
}
function discordEmoji(input, fallback) {
    const raw = String(input || '').trim();
    if (/^\d{5,25}$/.test(raw)) return { id: raw };
    if (/^<a?:\w+:\d+>$/.test(raw)) {
        const match = raw.match(/^<a?:(\w+):(\d+)>$/);
        return match ? { name: match[1], id: match[2] } : fallback;
    }
    return raw || fallback;
}
function dashboardUser(req) { return req.session?.user || null; }
function requireLogin(req, res, next) { if (!dashboardUser(req)) return res.redirect('/'); next(); }
function canManageGuild(guild, userId) {
    const member = guild.members.cache.get(userId);
    return Boolean(member && (member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ManageGuild)));
}
function isBotInGuild(guildId) { return Boolean(client.guilds.cache.get(guildId)); }
function inviteUrl(guildId = '') {
    const perms = new PermissionsBitField([
        PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions,
    ]).bitfield.toString();
    return `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(process.env.DISCORD_CLIENT_ID || '')}&permissions=${perms}&scope=bot%20applications.commands${guildId ? `&guild_id=${encodeURIComponent(guildId)}` : ''}`;
}
async function getChannel(guild, id) { if (!id) return null; return guild.channels.cache.get(id) || guild.channels.fetch(id).catch(() => null); }
async function sendLog(guild, title, description, logColor = '#5865f2') {
    const cfg = guildConfig(guild.id);
    if (!cfg.logs.enabled || !cfg.logs.channelId) return;
    const channel = await getChannel(guild, cfg.logs.channelId);
    if (!channel?.isTextBased()) return;
    await channel.send({ embeds: [new EmbedBuilder().setTitle(title).setDescription(description).setColor(color(logColor)).setTimestamp()] }).catch(() => { });
}
function userLevel(guildId, userId) {
    const key = `${guildId}:${userId}`;
    if (!store.levels[key]) store.levels[key] = { xp: 0, level: 0, messages: 0 };
    return store.levels[key];
}
function nextLevelXp(level) { return 100 + (level * 50); }
async function addXp(message) {
    const cfg = guildConfig(message.guild.id);
    if (!cfg.leveling.enabled || message.author.bot) return;
    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    const cooldown = (cfg.leveling.cooldownSeconds || 60) * 1000;
    const last = store.levels[key]?.lastAt || 0;
    if (now - last < cooldown) return;
    const entry = userLevel(message.guild.id, message.author.id);
    entry.lastAt = now;
    entry.messages += 1;
    entry.xp += Math.floor(Math.random() * ((cfg.leveling.xpMax || 15) - (cfg.leveling.xpMin || 8) + 1)) + (cfg.leveling.xpMin || 8);
    const needed = nextLevelXp(entry.level);
    if (entry.xp >= needed) {
        entry.xp -= needed;
        entry.level += 1;
        const out = await getChannel(message.guild, cfg.leveling.channelId) || message.channel;
        await out.send({ embeds: [new EmbedBuilder().setTitle('ترقية مستوى').setDescription(`مبروك <@${message.author.id}> وصلت إلى المستوى **${entry.level}**.`).setColor('#57f287')] }).catch(() => { });
    }
    saveStore();
}

const intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
];
const client = new Client({ intents, partials: [Partials.Channel, Partials.Message, Partials.GuildMember] });
const messageWindows = new Map();

const commandData = [
    { name: 'warn', description: 'تحذير عضو', options: [{ name: 'member', description: 'العضو', type: 6, required: true }, { name: 'reason', description: 'السبب', type: 3, required: false }] },
    { name: 'leaderboard', description: 'عرض لوحة المتصدرين' },
    { name: 'userinfo', description: 'معلومات عضو', options: [{ name: 'member', description: 'العضو', type: 6, required: false }] },
    { name: 'serverinfo', description: 'معلومات السيرفر' },
    { name: 'suggest', description: 'إرسال اقتراح', options: [{ name: 'text', description: 'نص الاقتراح', type: 3, required: true }] },
    { name: 'report', description: 'إرسال بلاغ سري', options: [{ name: 'member', description: 'العضو المبلغ عنه', type: 6, required: true }, { name: 'reason', description: 'السبب', type: 3, required: true }] },
    { name: 'anonymous', description: 'إرسال رسالة مجهولة', options: [{ name: 'text', description: 'الرسالة', type: 3, required: true }] },
    { name: 'ticket-panel', description: 'إرسال لوحة التذاكر' },
    { name: 'verify-panel', description: 'إرسال لوحة التحقق' },
];

async function registerCommands() {
    if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CLIENT_ID) return;
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commandData }).catch(error => console.error('Slash command registration:', error.message));
}

function ticketPanel(cfg) {
    const options = (cfg.tickets.options || []).slice(0, 4).map((o, i) => new StringSelectMenuOptionBuilder().setLabel(o.label || `الخيار ${i + 1}`).setValue(o.value || `option_${i + 1}`).setDescription(o.description || 'فتح طلب جديد').setEmoji(discordEmoji(o.emoji, ['🛠️', '⚠️', '🛒', '❓'][i])));
    const menu = new StringSelectMenuBuilder().setCustomId('ticket:create').setPlaceholder('اختر نوع التذكرة').addOptions(options);
    const embed = new EmbedBuilder().setTitle(cfg.tickets.title).setDescription(cfg.tickets.description).setColor(color(cfg.tickets.color));
    if (cfg.tickets.image) embed.setImage(`${publicBaseUrl()}/uploads/${path.basename(cfg.tickets.image)}`);
    return { embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] };
}
function verificationPanel(cfg) {
    return { embeds: [new EmbedBuilder().setTitle(cfg.verification.title).setDescription(cfg.verification.description).setColor(color(cfg.verification.color))], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('verification:accept').setLabel('موافق على القوانين').setStyle(ButtonStyle.Success))] };
}
function publicBaseUrl() { return process.env.PUBLIC_URL || `http://localhost:${PORT}`; }
function suggestionEmbed(cfg, author, text, status = 'قيد المراجعة') {
    const embed = new EmbedBuilder().setTitle('اقتراح جديد').setDescription(text).addFields({ name: 'الحالة', value: status, inline: true }, { name: 'المرسل', value: `<@${author.id}>`, inline: true }).setColor(color(cfg.suggestions.color, '#fee75c')).setTimestamp();
    if (cfg.suggestions.image) embed.setImage(`${publicBaseUrl()}/uploads/${path.basename(cfg.suggestions.image)}`);
    return embed;
}
function suggestionAdminMenu(cfg) {
    const options = [
        new StringSelectMenuOptionBuilder().setLabel('الرد على صاحب الاقتراح').setValue('reply_owner').setDescription('جواب يصل للعضو على الخاص'),
        new StringSelectMenuOptionBuilder().setLabel('حذف الاقتراح').setValue('delete_suggestion').setDescription('حذف رسالة الاقتراح'),
        new StringSelectMenuOptionBuilder().setLabel('اعتماد الاقتراح').setValue('approve_suggestion').setDescription('تغيير الحالة إلى تمت الموافقة'),
    ];
    if (cfg.suggestions.approveEmojiId) options.forEach(o => o.setEmoji(discordEmoji(cfg.suggestions.approveEmojiId)));
    return new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('suggestion:admin').setPlaceholder('قائمة الإدارة فقط').addOptions(options));
}
function isAdmin(member) { return member && (member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ManageGuild) || member.permissions.has(PermissionFlagsBits.ModerateMembers)); }
async function createTicket(interaction, type) {
    const cfg = guildConfig(interaction.guild.id);
    if (!cfg.tickets.enabled) return interaction.reply({ content: 'نظام التذاكر غير مفعل حالياً.', ephemeral: true });
    const existing = Object.values(store.tickets).find(t => t.guildId === interaction.guild.id && t.userId === interaction.user.id && t.open);
    if (existing) return interaction.reply({ content: `لديك تذكرة مفتوحة بالفعل: <#${existing.channelId}>`, ephemeral: true });
    const option = (cfg.tickets.options || []).find(x => x.value === type);
    const slug = `${option?.value || 'ticket'}-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || interaction.user.id.slice(-5)}`;
    const overwrites = [
        { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    ];
    if (cfg.tickets.supportRoleId) overwrites.push({ id: cfg.tickets.supportRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
    const channel = await interaction.guild.channels.create({ name: slug.slice(0, 90), type: ChannelType.GuildText, parent: cfg.tickets.categoryId || undefined, permissionOverwrites: overwrites }).catch(() => null);
    if (!channel) return interaction.reply({ content: 'تعذر إنشاء التذكرة. تأكد من صلاحيات البوت.', ephemeral: true });
    store.tickets[channel.id] = { guildId: interaction.guild.id, channelId: channel.id, userId: interaction.user.id, type, open: true, createdAt: Date.now() };
    saveStore();
    const close = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket:close').setLabel('إغلاق التذكرة').setStyle(ButtonStyle.Danger));
    await channel.send({ content: `<@${interaction.user.id}>${cfg.tickets.supportRoleId ? ` <@&${cfg.tickets.supportRoleId}>` : ''}`, embeds: [new EmbedBuilder().setTitle(`تذكرة: ${option?.label || type}`).setDescription('اكتب تفاصيل طلبك هنا. الإدارة سترد عليك قريباً.').setColor('#5865f2')], components: [close] });
    return interaction.reply({ content: `تم فتح تذكرتك: ${channel}`, ephemeral: true });
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await registerCommands();
    setInterval(runReminders, 60 * 1000);
    setInterval(runGiveaways, 15 * 1000);
});

client.on('guildMemberAdd', async member => {
    const cfg = guildConfig(member.guild.id);
    if (cfg.autorole.enabled && cfg.autorole.roleId) await member.roles.add(cfg.autorole.roleId).catch(() => { });
    if (cfg.welcome.enabled && cfg.welcome.channelId) {
        const channel = await getChannel(member.guild, cfg.welcome.channelId);
        if (channel?.isTextBased()) {
            const embed = new EmbedBuilder().setTitle(replaceTokens(cfg.welcome.title, member)).setDescription(replaceTokens(cfg.welcome.description, member)).setColor(color(cfg.welcome.color)).setThumbnail(member.user.displayAvatarURL({ extension: 'png' })).addFields({ name: 'العضو رقم', value: String(member.guild.memberCount), inline: true });
            if (cfg.welcome.rulesUrl) embed.addFields({ name: 'القوانين', value: `[اضغط هنا](${cfg.welcome.rulesUrl})`, inline: true });
            if (cfg.welcome.image) embed.setImage(`${publicBaseUrl()}/uploads/${path.basename(cfg.welcome.image)}`);
            await channel.send({ embeds: [embed] }).catch(() => { });
        }
    }
    await sendLog(member.guild, 'عضو جديد', `انضم ${member.user.tag} إلى السيرفر.`);
});
client.on('guildMemberRemove', member => sendLog(member.guild, 'مغادرة عضو', `${member.user?.tag || member.id} غادر السيرفر.`));
client.on('messageDelete', message => { if (message.guild && !message.author?.bot) sendLog(message.guild, 'حذف رسالة', `تم حذف رسالة في <#${message.channel.id}>.`); });
client.on('messageUpdate', (oldMessage, newMessage) => { if (newMessage.guild && !newMessage.author?.bot && oldMessage.content !== newMessage.content) sendLog(newMessage.guild, 'تعديل رسالة', `تم تعديل رسالة في <#${newMessage.channel.id}>.`); });

client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    const cfg = guildConfig(message.guild.id);
    const text = message.content || '';
    const now = Date.now();
    const key = `${message.guild.id}:${message.author.id}`;
    const history = (messageWindows.get(key) || []).filter(t => now - t < (cfg.protection.windowSeconds || 8) * 1000);
    history.push(now);
    messageWindows.set(key, history);
    const repeated = cfg.protection.antiSpam && history.length > (cfg.protection.maxMessages || 6);
    const externalLink = cfg.protection.antiLinks && /https?:\/\/|www\./i.test(text);
    const invite = cfg.protection.antiInvites && /(discord\.gg|discord\.com\/invite)/i.test(text);
    if (repeated || externalLink || invite) {
        await message.delete().catch(() => { });
        await message.member.timeout((cfg.protection.muteMinutes || 10) * 60 * 1000, repeated ? 'Anti-spam' : 'Link protection').catch(() => { });
        await sendLog(message.guild, 'حماية تلقائية', `تم التعامل مع مخالفة من <@${message.author.id}> في <#${message.channel.id}>.`, '#ed4245');
        return;
    }
    const auto = cfg.autoresponses.items?.find(item => item.trigger && text.toLowerCase().includes(item.trigger.toLowerCase()));
    if (cfg.autoresponses.enabled && auto) await message.reply({ content: auto.response }).catch(() => { });
    if (cfg.anonymous.enabled && message.channel.id === cfg.anonymous.channelId) {
        await message.delete().catch(() => { });
        const components = [];
        if (cfg.reports.channelId) components.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('anonymous:report').setLabel('إبلاغ عن عضو').setStyle(ButtonStyle.Danger)));
        const embed = new EmbedBuilder().setTitle('رسالة مجهولة').setDescription(text).setColor('#5865f2').setTimestamp();
        await message.channel.send({ embeds: [embed], components }).catch(() => { });
        return;
    }
    await addXp(message);
});

client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;
    const cfg = guildConfig(message.guild.id);
    if (cfg.suggestions.enabled && message.channel.id === cfg.suggestions.channelId && !message.system) {
        const text = message.content || '';
        await message.delete().catch(() => { });
        const channel = await getChannel(message.guild, cfg.suggestions.channelId);
        if (channel?.isTextBased()) await channel.send({ embeds: [suggestionEmbed(cfg, message.author, text)], components: [suggestionAdminMenu(cfg)] }).catch(() => { });
    }
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const name = interaction.commandName;
            if (!isAdmin(interaction.member)) return interaction.reply({ content: 'هذا الأمر للإدارة فقط.', ephemeral: true });
            if (name === 'warn') {
                const member = interaction.options.getMember('member');
                const reason = interaction.options.getString('reason') || 'بدون سبب';
                if (!member) return interaction.reply({ content: 'لم أجد هذا العضو.', ephemeral: true });
                const key = `${interaction.guild.id}:${member.id}`;
                store.warnings[key] = (store.warnings[key] || 0) + 1;
                const count = store.warnings[key];
                const cfg = guildConfig(interaction.guild.id);
                saveStore();
                await member.send(`تم تحذيرك في ${interaction.guild.name}. السبب: ${reason}`).catch(() => { });
                if (count >= cfg.warnings.maxWarnings) {
                    if (cfg.warnings.action === 'ban') await member.ban({ reason: 'Reached warning limit' }).catch(() => { });
                    else await member.kick('Reached warning limit').catch(() => { });
                }
                await sendLog(interaction.guild, 'تحذير عضو', `<@${member.id}> حصل على التحذير رقم ${count}. السبب: ${reason}`, '#fee75c');
                return interaction.reply({ content: `تم تحذير ${member.user.tag}. مجموع التحذيرات: ${count}.`, ephemeral: true });
            }
            if (name === 'leaderboard') {
                const rows = Object.entries(store.levels).filter(([key]) => key.startsWith(`${interaction.guild.id}:`)).sort((a, b) => b[1].level - a[1].level || b[1].xp - a[1].xp).slice(0, 10);
                const description = rows.length ? rows.map(([key, v], i) => `**${i + 1}.** <@${key.split(':')[1]}> — مستوى ${v.level} (${v.xp} XP)`).join('\n') : 'لا توجد بيانات مستويات حتى الآن.';
                return interaction.reply({ embeds: [new EmbedBuilder().setTitle('لوحة المتصدرين').setDescription(description).setColor('#5865f2')] });
            }
            if (name === 'userinfo') {
                const member = interaction.options.getMember('member') || interaction.member;
                return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`معلومات ${member.user.username}`).setThumbnail(member.user.displayAvatarURL()).addFields({ name: 'المعرف', value: member.id, inline: true }, { name: 'تاريخ الانضمام', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: true }, { name: 'الرتب', value: member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => r.toString()).join('، ') || 'لا توجد' }).setColor('#5865f2')] });
            }
            if (name === 'serverinfo') return interaction.reply({ embeds: [new EmbedBuilder().setTitle(interaction.guild.name).setThumbnail(interaction.guild.iconURL()).addFields({ name: 'المعرف', value: interaction.guild.id, inline: true }, { name: 'الأعضاء', value: String(interaction.guild.memberCount), inline: true }, { name: 'القنوات', value: String(interaction.guild.channels.cache.size), inline: true }).setColor('#5865f2')] });
            if (name === 'suggest') return await handleSuggestion(interaction, interaction.options.getString('text'));
            if (name === 'report') return await handleReport(interaction, interaction.options.getMember('member'), interaction.options.getString('reason'), interaction);
            if (name === 'anonymous') return await handleAnonymous(interaction, interaction.options.getString('text'));
            if (name === 'ticket-panel') { const cfg = guildConfig(interaction.guild.id); return interaction.reply({ ...ticketPanel(cfg) }); }
            if (name === 'verify-panel') { const cfg = guildConfig(interaction.guild.id); return interaction.reply({ ...verificationPanel(cfg) }); }
        }
        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket:create') return createTicket(interaction, interaction.values[0]);
        if (interaction.isStringSelectMenu() && interaction.customId === 'suggestion:admin') {
            if (!isAdmin(interaction.member)) return interaction.reply({ content: 'هذا المنيو للإدارة فقط.', ephemeral: true });
            const action = interaction.values[0];
            if (action === 'reply_owner') {
                const modal = new ModalBuilder().setCustomId('suggestion:replyModal').setTitle('الرد على الاقتراح');
                modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('replyText').setLabel('نص الجواب').setStyle(TextInputStyle.Paragraph).setMaxLength(1800)));
                return interaction.showModal(modal);
            }
            if (action === 'delete_suggestion') {
                await interaction.message.delete().catch(() => { });
                return interaction.reply({ content: 'تم حذف الاقتراح.', ephemeral: true });
            }
            if (action === 'approve_suggestion') {
                const embed = EmbedBuilder.from(interaction.message.embeds[0]).setColor('#57f287').spliceFields(0, 1, { name: 'الحالة', value: 'تمت الموافقة', inline: true });
                await interaction.update({ embeds: [embed], components: [] });
                return;
            }
            return interaction.reply({ content: 'خيار غير معروف.', ephemeral: true });
        }
        if (interaction.isModalSubmit() && interaction.customId === 'suggestion:replyModal') {
            if (!isAdmin(interaction.member)) return interaction.reply({ content: 'هذا للإدارة فقط.', ephemeral: true });
            const embed = EmbedBuilder.from(interaction.message.embeds[0]);
            const sender = (embed.fields.find(f => f.name === 'المرسل')?.value || '').match(/<@(\d+)>/)?.[1];
            await interaction.update({ embeds: [embed], components: [] }).catch(() => { });
            if (sender) await client.users.send(sender, { embeds: [new EmbedBuilder().setTitle('رد الإدارة على اقتراحك').setDescription(safeText(interaction.fields.getTextInputValue('replyText'))).setColor('#5865f2').setTimestamp()] }).catch(() => { });
            return interaction.reply({ content: 'تم إرسال الجواب لصاحب الاقتراح على الخاص.', ephemeral: true });
        }
        if (interaction.isButton() && interaction.customId === 'ticket:close') {
            const ticket = store.tickets[interaction.channel.id];
            if (!ticket) return interaction.reply({ content: 'هذه ليست تذكرة مسجلة.', ephemeral: true });
            if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels) && interaction.user.id !== ticket.userId) return interaction.reply({ content: 'لا تملك صلاحية إغلاق هذه التذكرة.', ephemeral: true });
            ticket.open = false; ticket.closedAt = Date.now(); saveStore();
            await interaction.reply({ content: 'سيتم إغلاق التذكرة وحذفها بعد لحظات.' });
            setTimeout(() => interaction.channel.delete().catch(() => { }), 4000);
        }
        if (interaction.isButton() && interaction.customId === 'verification:accept') {
            const cfg = guildConfig(interaction.guild.id);
            if (cfg.verification.roleId) await interaction.member.roles.add(cfg.verification.roleId).catch(() => { });
            return interaction.reply({ content: 'تم التحقق من عضويتك. أهلاً بك.', ephemeral: true });
        }
        if (interaction.isButton() && /^suggestion:(approve|reject)$/.test(interaction.customId)) {
            const approved = interaction.customId.endsWith('approve');
            const embed = EmbedBuilder.from(interaction.message.embeds[0]).setColor(approved ? '#57f287' : '#ed4245').spliceFields(0, 1, { name: 'الحالة', value: approved ? 'تم التأييد' : 'تمت المعارضة', inline: true });
            await interaction.update({ embeds: [embed], components: [] });
        }
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'anonymous:modal') return await handleAnonymous(interaction, interaction.fields.getTextInputValue('text'));
        }
        if (interaction.isButton() && interaction.customId === 'anonymous:report') {
            const modal = new ModalBuilder().setCustomId('anonymous:reportModal').setTitle('بلاغ عن عضو').setComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('memberId').setLabel('معرف أو اسم العضو المبلغ عنه').setStyle(TextInputStyle.Short).setMaxLength(128)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reason').setLabel('سبب البلاغ').setStyle(TextInputStyle.Paragraph).setMaxLength(800)),
            );
            return interaction.showModal(modal);
        }
        if (interaction.isModalSubmit() && interaction.customId === 'anonymous:reportModal') {
            const cfg = guildConfig(interaction.guild.id);
            const channel = await getChannel(interaction.guild, cfg.reports.channelId);
            if (!channel?.isTextBased()) return interaction.reply({ content: 'لم يتم إعداد قناة البلاغات.', ephemeral: true });
            const rawId = interaction.fields.getTextInputValue('memberId').trim();
            const member = interaction.guild.members.cache.find(m => m.id === rawId || m.user.username.toLowerCase().includes(rawId.toLowerCase()) || (m.user.globalName || '').toLowerCase().includes(rawId.toLowerCase()));
            await channel.send({ embeds: [new EmbedBuilder().setTitle('بلاغ من القناة المجهولة').addFields({ name: 'المبلغ', value: `<@${interaction.user.id}>`, inline: true }, { name: 'المبلغ عنه', value: member ? `<@${member.id}>` : safeText(rawId), inline: true }, { name: 'السبب', value: safeText(interaction.fields.getTextInputValue('reason')) }).setColor('#ed4245').setTimestamp()] });
            return interaction.reply({ content: 'تم إرسال البلاغ إلى الإدارة بسرية.', ephemeral: true });
        }
    } catch (error) {
        console.error('Interaction error:', error);
        const reply = { content: 'حدث خطأ غير متوقع. تأكد من صلاحيات البوت والإعدادات.', ephemeral: true };
        if (interaction.deferred || interaction.replied) await interaction.followUp(reply).catch(() => { }); else await interaction.reply(reply).catch(() => { });
    }
});

async function handleSuggestion(interaction, text) {
    const cfg = guildConfig(interaction.guild.id);
    if (!cfg.suggestions.enabled || !cfg.suggestions.channelId) return interaction.reply({ content: 'نظام الاقتراحات غير مفعل أو لم تحدد قناته.', ephemeral: true });
    const channel = await getChannel(interaction.guild, cfg.suggestions.channelId);
    if (!channel?.isTextBased()) return interaction.reply({ content: 'قناة الاقتراحات غير متاحة.', ephemeral: true });
    await channel.send({ embeds: [suggestionEmbed(cfg, interaction.user, text)], components: [suggestionButtons(cfg)] });
    return interaction.reply({ content: 'تم إرسال اقتراحك للمراجعة.', ephemeral: true });
}
async function handleReport(interaction, member, reason, via = interaction) {
    const cfg = guildConfig(interaction.guild.id);
    const channel = await getChannel(interaction.guild, cfg.reports.channelId);
    if (!channel?.isTextBased()) return via.reply({ content: 'لم يتم إعداد قناة البلاغات.', ephemeral: true });
    await channel.send({ embeds: [new EmbedBuilder().setTitle('بلاغ سري').addFields({ name: 'المبلغ', value: `<@${via.user.id}>`, inline: true }, { name: 'المبلغ عنه', value: member ? `<@${member.id}>` : 'غير معروف', inline: true }, { name: 'السبب', value: safeText(reason) }).setColor('#ed4245').setTimestamp()] });
    return via.reply({ content: 'تم إرسال البلاغ إلى الإدارة بسرية.', ephemeral: true });
}
async function handleAnonymous(interaction, text) {
    const cfg = guildConfig(interaction.guild.id);
    const channel = await getChannel(interaction.guild, cfg.anonymous.channelId);
    if (!cfg.anonymous.enabled || !channel?.isTextBased()) return interaction.reply({ content: 'نظام الرسائل المجهولة غير مفعل أو لم تحدد قناته.', ephemeral: true });
    await channel.send({ embeds: [new EmbedBuilder().setTitle('رسالة مجهولة').setDescription(safeText(text)).setColor('#5865f2').setTimestamp()] });
    return interaction.reply({ content: 'تم نشر رسالتك دون إظهار اسمك.', ephemeral: true });
}
async function runReminders() {
    const now = Date.now();
    for (const item of store.reminders) {
        if (!item.enabled || now < item.nextAt) continue;
        const guild = client.guilds.cache.get(item.guildId);
        const channel = guild && await getChannel(guild, item.channelId);
        if (channel?.isTextBased()) await channel.send({ embeds: [new EmbedBuilder().setTitle(item.title || 'تذكير').setDescription(item.text).setColor(color(item.color)).setTimestamp()] }).catch(() => { });
        item.nextAt = now + Math.max(1, Number(item.intervalMinutes || 1440)) * 60000;
    }
    saveStore();
}
async function runGiveaways() {
    const now = Date.now();
    for (const [id, g] of Object.entries(store.giveaways)) {
        if (g.ended || now < g.endsAt) continue;
        const guild = client.guilds.cache.get(g.guildId); const channel = guild && await getChannel(guild, g.channelId); if (!channel?.isTextBased()) continue;
        const message = await channel.messages.fetch(g.messageId).catch(() => null); const users = message ? await message.reactions.cache.get('🎉')?.users.fetch().catch(() => null) : null;
        const participants = users ? users.filter(u => !u.bot).map(u => u.id) : [];
        const winner = participants.length ? participants[Math.floor(Math.random() * participants.length)] : null;
        g.ended = true; g.winnerId = winner || ''; saveStore();
        await channel.send({ embeds: [new EmbedBuilder().setTitle('انتهت المسابقة').setDescription(winner ? `الفائز هو <@${winner}>\nالجائزة: **${g.prize}**` : 'لم يشارك أحد في المسابقة.').setColor('#fee75c')] });
    }
}

const app = express();
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET || 'change-me-now', resave: false, saveUninitialized: false, cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' } }));
const upload = multer({ storage: multer.diskStorage({ destination: UPLOAD_DIR, filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${path.extname(file.originalname).toLowerCase()}`) }), limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (req, file, cb) => cb(null, /^image\/(png|jpeg|jpg|webp|gif)$/.test(file.mimetype)) });
app.use('/uploads', express.static(UPLOAD_DIR));

function layout(title, body, req) {
    const user = dashboardUser(req);
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Nebula Bot</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet"><style>
  :root{--bg:#080b14;--panel:#101624;--panel2:#151d2f;--line:#25314a;--text:#eef3ff;--muted:#9ba8c3;--accent:#7c5cff;--cyan:#27d7ff;--green:#57f287;--red:#ed4245;--yellow:#fee75c}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 10% 0%,#172052 0,#080b14 38%),var(--bg);color:var(--text);font-family:Cairo,Arial,sans-serif;min-height:100vh}.orb{position:fixed;width:320px;height:320px;border-radius:50%;filter:blur(80px);opacity:.18;pointer-events:none;background:var(--accent);top:10%;left:4%;animation:float 12s ease-in-out infinite}.orb.two{background:var(--cyan);top:65%;left:75%;animation-delay:-4s}@keyframes float{50%{transform:translate(40px,-30px) scale(1.15)}}a{color:inherit;text-decoration:none}.top{height:74px;border-bottom:1px solid var(--line);backdrop-filter:blur(18px);display:flex;align-items:center;justify-content:space-between;padding:0 34px;position:sticky;top:0;z-index:5;background:#080b14c9}.brand{font-weight:800;font-size:21px;letter-spacing:.5px}.brand span{color:var(--cyan)}.user{display:flex;align-items:center;gap:10px;color:var(--muted)}.avatar{width:34px;height:34px;border-radius:50%;border:2px solid var(--accent)}.shell{display:grid;grid-template-columns:270px 1fr;max-width:1500px;margin:auto;min-height:calc(100vh - 74px)}.side{border-left:1px solid var(--line);padding:28px 18px}.side h4{color:var(--muted);font-size:12px;margin:20px 12px 8px}.nav{display:block;padding:11px 13px;border-radius:12px;color:var(--muted);margin:3px 0;transition:.2s}.nav:hover,.nav.active{color:var(--text);background:linear-gradient(90deg,#7c5cff2a,#27d7ff12);transform:translateX(-3px)}.main{padding:36px;max-width:1150px;width:100%}.hero{padding:28px;border:1px solid var(--line);border-radius:22px;background:linear-gradient(135deg,#171f39d9,#0f1423d9);box-shadow:0 20px 80px #0004;animation:rise .7s ease both}.hero h1{margin:0 0 8px;font-size:30px}.hero p{color:var(--muted);margin:0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:20px 0}.card{border:1px solid var(--line);border-radius:18px;background:#101624d9;padding:20px;transition:.25s;animation:rise .6s ease both}.card:hover{transform:translateY(-4px);border-color:#7c5cff99;box-shadow:0 15px 40px #0003}.stat{font-size:28px;font-weight:800}.muted{color:var(--muted);font-size:13px}.section{margin-top:22px}.section h2{font-size:20px;margin:0 0 14px}.form{display:grid;gap:13px}.row{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.field label{display:block;font-size:13px;color:var(--muted);margin-bottom:6px}.input,.select,.textarea{width:100%;border:1px solid var(--line);background:#0b101c;color:var(--text);border-radius:10px;padding:11px 12px;font:inherit;outline:none}.input:focus,.select:focus,.textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px #7c5cff22}.textarea{min-height:110px;resize:vertical}.btn{display:inline-flex;justify-content:center;align-items:center;gap:7px;border:0;border-radius:10px;padding:11px 16px;background:linear-gradient(135deg,var(--accent),#5e42d0);color:white;font:inherit;font-weight:700;cursor:pointer;transition:.2s}.btn:hover{transform:translateY(-2px);filter:brightness(1.1)}.btn.secondary{background:#1b263c;border:1px solid var(--line)}.btn.danger{background:#7c2534}.check{display:flex;align-items:center;gap:8px;color:var(--text);font-size:13px}.check input{accent-color:var(--accent)}.notice{padding:13px 15px;border-radius:12px;background:#182238;color:#cbd5f5;border:1px solid var(--line);margin-bottom:15px}.guilds{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.guild{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--line);padding:16px;border-radius:15px;background:#101624}.guild-main{display:flex;align-items:center;gap:12px}.guild-icon{width:44px;height:44px;border-radius:14px;background:#222d4b;object-fit:cover}.tag{font-size:11px;color:var(--cyan)}.option{padding:14px;border:1px solid var(--line);border-radius:12px;background:#0b101c}.option h3{margin:0 0 8px;font-size:15px}.footer{color:var(--muted);font-size:12px;text-align:center;padding:26px}.upload-preview{max-width:180px;max-height:90px;border-radius:10px;border:1px solid var(--line);object-fit:cover}.toast{position:fixed;bottom:24px;left:24px;background:#151d2f;border:1px solid var(--line);padding:12px 16px;border-radius:12px;display:none}@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@media(max-width:900px){.shell{grid-template-columns:1fr}.side{border-left:0;border-bottom:1px solid var(--line);padding:12px 18px;display:flex;gap:8px;overflow:auto}.side h4{display:none}.nav{white-space:nowrap}.main{padding:20px}.grid{grid-template-columns:1fr 1fr}.guilds{grid-template-columns:1fr}}@media(max-width:580px){.top{padding:0 16px}.grid,.row{grid-template-columns:1fr}.main{padding:15px}.hero h1{font-size:23px}}
  </style></head><body><div class="orb"></div><div class="orb two"></div><header class="top"><a class="brand" href="/">NEBULA <span>BOT</span></a><div class="user">${user ? `<img class="avatar" src="${user.avatar || ''}"><span>${user.username}</span><a class="btn secondary" href="/auth/logout">خروج</a>` : '<a class="btn" href="/auth/discord">تسجيل الدخول بالديسكورد</a>'}</div></header>${body}<div class="footer">Nebula Bot Dashboard — إدارة مجتمعك من مكان واحد</div><script>document.querySelectorAll('input[type=file]').forEach(i=>i.addEventListener('change',e=>{const f=e.target.files[0],p=document.querySelector('#preview-'+i.name);if(f&&p){p.src=URL.createObjectURL(f);p.style.display='block'}}));</script></body></html>`;
}
function sideNav(guildId, active) {
    if (!guildId) return '';
    const items = [['overview', 'نظرة عامة'], ['welcome', 'الترحيب والتحقق'], ['tickets', 'التذاكر'], ['suggestions', 'الاقتراحات والبلاغات'], ['moderation', 'الإدارة والحماية'], ['engagement', 'التفاعل والمستويات'], ['events', 'التذكيرات والمسابقات'], ['announcements', 'الإعلانات'], ['utilities', 'الأدوات العامة']];
    return `<aside class="side"><h4>لوحة الإدارة</h4>${items.map(([id, label]) => `<a class="nav ${active === id ? 'active' : ''}" href="/dashboard/${guildId}/${id}">${label}</a>`).join('')}<h4>روابط</h4><a class="nav" href="/dashboard">اختيار سيرفر آخر</a><a class="nav" target="_blank" href="${inviteUrl(guildId)}">دعوة البوت</a></aside>`;
}
function dashboardPage(req, guildId, active, title, content) { return layout(title, `<div class="shell">${sideNav(guildId, active)}<main class="main">${content}</main></div>`, req); }
function guildFromReq(req, res) {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild || !canManageGuild(guild, req.session.user.id)) { res.status(403).send(layout('غير مصرح', '<main class="main"><div class="notice">لا تملك صلاحية إدارة هذا السيرفر أو أن البوت غير موجود فيه.</div></main>', req)); return null; }
    return guild;
}
function optionField(name, label, value, type = 'text', extra = '') { return `<div class="field"><label>${label}</label><input class="input" name="${name}" type="${type}" value="${String(value ?? '').replaceAll('"', '&quot;')}" ${extra}></div>`; }
function selectField(name, label, value, options) { return `<div class="field"><label>${label}</label><select class="select" name="${name}">${options.map(([v, l]) => `<option value="${v}" ${String(value) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`; }
function channelSelect(guild, name, label, selected, includeBlank = true) { const chans = [...guild.channels.cache.values()].filter(c => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement); return `<div class="field"><label>${label}</label><select class="select" name="${name}">${includeBlank ? '<option value="">غير محدد</option>' : ''}${chans.map(c => `<option value="${c.id}" ${selected === c.id ? 'selected' : ''}># ${c.name}</option>`).join('')}</select></div>`; }
function roleSelect(guild, name, label, selected) { const roles = [...guild.roles.cache.values()].filter(r => r.id !== guild.id).sort((a, b) => b.position - a.position); return `<div class="field"><label>${label}</label><select class="select" name="${name}"><option value="">غير محدد</option>${roles.map(r => `<option value="${r.id}" ${selected === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}</select></div>`; }
function saveUpload(file) { return file ? path.join(UPLOAD_DIR, file.filename) : ''; }

app.get('/', (req, res) => {
    if (dashboardUser(req)) return res.redirect('/dashboard');
    res.send(layout('ابدأ الآن', `<main class="main" style="max-width:1100px;margin:auto"><section class="hero"><div class="tag">COMMUNITY CONTROL CENTER</div><h1>لوحة تحكم قوية لسيرفر ديسكورد</h1><p>إدارة الترحيب، التذاكر، الاقتراحات، الحماية، المستويات، الفعاليات وأكثر، بتصميم داكن متحرك.</p><br><a class="btn" href="/auth/discord">الدخول عبر ديسكورد</a></section><section class="grid"><div class="card"><div class="stat">15+</div><div class="muted">نظام جاهز للإدارة</div></div><div class="card"><div class="stat">4</div><div class="muted">خيارات تذاكر قابلة للتخصيص</div></div><div class="card"><div class="stat">100%</div><div class="muted">إعدادات منفصلة لكل سيرفر</div></div></section></main>`, req));
});
app.get('/auth/discord', (req, res) => {
    const params = new URLSearchParams({ client_id: process.env.DISCORD_CLIENT_ID || '', redirect_uri: process.env.DISCORD_REDIRECT_URI || `${publicBaseUrl()}/auth/callback`, response_type: 'code', scope: 'identify guilds' });
    res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});
app.get('/auth/callback', async (req, res) => {
    try {
        const body = new URLSearchParams({ client_id: process.env.DISCORD_CLIENT_ID || '', client_secret: process.env.DISCORD_CLIENT_SECRET || '', grant_type: 'authorization_code', code: req.query.code, redirect_uri: process.env.DISCORD_REDIRECT_URI || `${publicBaseUrl()}/auth/callback` });
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        const token = await tokenResponse.json();
        if (!token.access_token) throw new Error('OAuth token missing');
        const headers = { Authorization: `Bearer ${token.access_token}` };
        const [user, guilds] = await Promise.all([fetch('https://discord.com/api/users/@me', { headers }).then(r => r.json()), fetch('https://discord.com/api/users/@me/guilds', { headers }).then(r => r.json())]);
        req.session.user = { id: user.id, username: user.global_name || user.username, avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64` : '' };
        req.session.guilds = Array.isArray(guilds) ? guilds : [];
        res.redirect('/dashboard');
    } catch (error) { console.error('OAuth error:', error.message); res.status(500).send(layout('خطأ تسجيل الدخول', '<main class="main"><div class="notice">تعذر تسجيل الدخول. تأكد من إعدادات OAuth والرابط المعاد في بوابة ديسكورد.</div></main>', req)); }
});
app.get('/auth/logout', (req, res) => req.session.destroy(() => res.redirect('/')));
app.get('/dashboard', requireLogin, (req, res) => {
    const guilds = (req.session.guilds || []).filter(g => (BigInt(g.permissions || 0) & BigInt(0x20)) !== BigInt(0) || (BigInt(g.permissions || 0) & BigInt(0x8)) !== BigInt(0));
    const cards = guilds.map(g => { const inBot = isBotInGuild(g.id); const icon = g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=96` : ''; return `<div class="guild"><div class="guild-main"><img class="guild-icon" src="${icon}" onerror="this.style.display='none'"><div><strong>${g.name}</strong><div class="tag">${inBot ? 'البوت متصل' : 'البوت غير موجود'}</div></div></div>${inBot ? `<a class="btn" href="/dashboard/${g.id}/overview">فتح اللوحة</a>` : `<a class="btn secondary" href="${inviteUrl(g.id)}">إدخال البوت</a>`}</div>`; }).join('');
    res.send(layout('اختيار السيرفر', `<main class="main" style="max-width:1100px;margin:auto"><section class="hero"><div class="tag">WELCOME BACK</div><h1>اختر السيرفر الذي تريد إدارته</h1><p>تظهر هنا السيرفرات التي تملك فيها صلاحية الإدارة. إذا لم يكن البوت موجوداً، استخدم زر إدخال البوت.</p></section><section class="section"><div class="guilds">${cards || '<div class="notice">لم يتم العثور على سيرفرات قابلة للإدارة.</div>'}</div></section></main>`, req));
});

app.get('/dashboard/:guildId/:page', requireLogin, (req, res) => {
    const guild = guildFromReq(req, res); if (!guild) return;
    const cfg = guildConfig(guild.id); const p = req.params.page;
    if (p === 'overview') {
        const members = guild.memberCount; const channels = guild.channels.cache.size; const tickets = Object.values(store.tickets).filter(t => t.guildId === guild.id && t.open).length; const levels = Object.keys(store.levels).filter(k => k.startsWith(`${guild.id}:`)).length;
        return res.send(dashboardPage(req, guild.id, p, 'نظرة عامة', `<section class="hero"><div class="tag">${guild.name}</div><h1>مرحباً بك في مركز التحكم</h1><p>كل إعدادات البوت في مكان واحد. عدّل أي نظام ثم احفظ التغييرات.</p></section><div class="grid"><div class="card"><div class="stat">${members}</div><div class="muted">أعضاء السيرفر</div></div><div class="card"><div class="stat">${channels}</div><div class="muted">القنوات</div></div><div class="card"><div class="stat">${tickets}</div><div class="muted">تذاكر مفتوحة</div></div><div class="card"><div class="stat">${levels}</div><div class="muted">أعضاء لديهم مستوى</div></div></div><section class="card"><h2>اختصارات سريعة</h2><div class="row"><a class="btn" href="/dashboard/${guild.id}/tickets">إعداد التذاكر</a><a class="btn secondary" href="/dashboard/${guild.id}/suggestions">إعداد الاقتراحات</a></div></section>`));
    }
    if (p === 'welcome') return res.send(dashboardPage(req, guild.id, p, 'الترحيب والتحقق', welcomeForm(guild, cfg)));
    if (p === 'tickets') return res.send(dashboardPage(req, guild.id, p, 'التذاكر', ticketForm(guild, cfg)));
    if (p === 'suggestions') return res.send(dashboardPage(req, guild.id, p, 'الاقتراحات والبلاغات', suggestionForm(guild, cfg)));
    if (p === 'moderation') return res.send(dashboardPage(req, guild.id, p, 'الإدارة والحماية', moderationForm(guild, cfg)));
    if (p === 'engagement') return res.send(dashboardPage(req, guild.id, p, 'التفاعل والمستويات', engagementForm(guild, cfg)));
    if (p === 'events') return res.send(dashboardPage(req, guild.id, p, 'التذكيرات والمسابقات', eventsForm(guild, cfg)));
    if (p === 'announcements') return res.send(dashboardPage(req, guild.id, p, 'الإعلانات', announcementsForm(guild, cfg)));
    if (p === 'utilities') return res.send(dashboardPage(req, guild.id, p, 'الأدوات العامة', utilitiesForm(guild, cfg)));
    return res.redirect(`/dashboard/${guild.id}/overview`);
});

function formStart(action, enctype = '') { return `<form class="form" method="post" action="${action}" ${enctype ? `enctype="${enctype}"` : ''}>`; }
function saveButton() { return '<button class="btn" type="submit">حفظ التغييرات</button>'; }
function welcomeForm(guild, cfg) { return `<section class="card"><h2>نظام الترحيب</h2>${formStart(`/dashboard/${guild.id}/welcome`, 'multipart/form-data')}<label class="check"><input type="checkbox" name="welcomeEnabled" ${cfg.welcome.enabled ? 'checked' : ''}> تفعيل الترحيب عند دخول عضو جديد</label><div class="row">${channelSelect(guild, 'welcomeChannelId', 'قناة الترحيب', cfg.welcome.channelId)}${optionField('welcomeColor', 'لون الإيمبد', cfg.welcome.color, 'color')}</div><div class="row">${optionField('welcomeTitle', 'العنوان', cfg.welcome.title)}${optionField('welcomeRulesUrl', 'رابط القوانين', cfg.welcome.rulesUrl, 'url')}</div>${optionField('welcomeDescription', 'الوصف — المتغيرات: {user} {username} {server} {count}', cfg.welcome.description)}<div class="field"><label>صورة الترحيب</label><input class="input" type="file" name="welcomeImage" accept="image/png,image/jpeg,image/webp,image/gif"><img id="preview-welcomeImage" class="upload-preview" src="${cfg.welcome.image ? `/uploads/${path.basename(cfg.welcome.image)}` : ''}" style="${cfg.welcome.image ? '' : 'display:none'}"></div><hr><h2>الرتبة التلقائية</h2><label class="check"><input type="checkbox" name="autoroleEnabled" ${cfg.autorole.enabled ? 'checked' : ''}> إعطاء رتبة تلقائياً</label>${roleSelect(guild, 'autoroleRoleId', 'الرتبة', cfg.autorole.roleId)}<hr><h2>التحقق</h2><label class="check"><input type="checkbox" name="verificationEnabled" ${cfg.verification.enabled ? 'checked' : ''}> تفعيل نظام التحقق</label><div class="row">${channelSelect(guild, 'verificationChannelId', 'قناة التحقق', cfg.verification.channelId)}${roleSelect(guild, 'verificationRoleId', 'رتبة التحقق', cfg.verification.roleId)}</div>${optionField('verificationTitle', 'عنوان لوحة التحقق', cfg.verification.title)}${optionField('verificationDescription', 'وصف لوحة التحقق', cfg.verification.description)}<button class="btn secondary" type="submit" name="sendVerification" value="1">إرسال لوحة التحقق الآن</button> ${saveButton()}</form></section>`; }
function ticketForm(guild, cfg) { const opts = cfg.tickets.options || []; return `<section class="card"><h2>نظام التذاكر — قائمة منسدلة بأربعة خيارات</h2><p class="muted">ضع اسم الخيار ووصفه، ثم اكتب معرف الإيموجي المخصص في الحقل. يمكن وضع Emoji ID رقمي أو Emoji كامل من ديسكورد.</p>${formStart(`/dashboard/${guild.id}/tickets`, 'multipart/form-data')}<label class="check"><input type="checkbox" name="ticketsEnabled" ${cfg.tickets.enabled ? 'checked' : ''}> تفعيل التذاكر</label><div class="row">${channelSelect(guild, 'ticketsPanelChannelId', 'قناة لوحة التذاكر', cfg.tickets.channelId)}${roleSelect(guild, 'ticketsSupportRoleId', 'رتبة الدعم', cfg.tickets.supportRoleId)}</div>${optionField('ticketsCategoryId', 'معرف تصنيف التذاكر', cfg.tickets.categoryId)}<div class="row">${optionField('ticketsTitle', 'عنوان اللوحة', cfg.tickets.title)}${optionField('ticketsColor', 'لون الإيمبد', cfg.tickets.color, 'color')}</div>${optionField('ticketsDescription', 'وصف اللوحة', cfg.tickets.description)}<div class="field"><label>صورة مربعة للتكت</label><input class="input" type="file" name="ticketsImage" accept="image/png,image/jpeg,image/webp,image/gif"><img id="preview-ticketsImage" class="upload-preview" src="${cfg.tickets.image ? `/uploads/${path.basename(cfg.tickets.image)}` : ''}" style="${cfg.tickets.image ? '' : 'display:none'}"></div><div class="grid">${opts.slice(0, 4).map((o, i) => `<div class="option"><h3>الخيار ${i + 1}</h3>${optionField(`ticketLabel${i}`, 'الاسم', o.label)}${optionField(`ticketValue${i}`, 'القيمة', o.value)}${optionField(`ticketDescription${i}`, 'الوصف', o.description)}${optionField(`ticketEmoji${i}`, 'Emoji ID / Emoji', o.emoji, 'text', 'placeholder="مثال: 123456789012345678"')}</div>`).join('')}</div><button class="btn secondary" type="submit" name="sendPanel" value="1">حفظ وإرسال اللوحة الآن</button> ${saveButton()}</form></section>`; }
function suggestionForm(guild, cfg) { return `<section class="card"><h2>الاقتراحات والبلاغات</h2>${formStart(`/dashboard/${guild.id}/suggestions`, 'multipart/form-data')}<label class="check"><input type="checkbox" name="suggestionsEnabled" ${cfg.suggestions.enabled ? 'checked' : ''}> تفعيل الاقتراحات</label>${channelSelect(guild, 'suggestionsChannelId', 'قناة الاقتراحات', cfg.suggestions.channelId)}<div class="row">${optionField('suggestionsColor', 'لون الإيمبد', cfg.suggestions.color, 'color')}${optionField('suggestionsApproveEmoji', 'إيموجي بديل للتأييد', cfg.suggestions.approveEmoji)}</div><div class="row">${optionField('suggestionsApproveEmojiId', 'معرف إيموجي التأييد', cfg.suggestions.approveEmojiId)}${optionField('suggestionsRejectEmojiId', 'معرف إيموجي المعارضة', cfg.suggestions.rejectEmojiId)}</div>${optionField('suggestionsRejectEmoji', 'إيموجي بديل للمعارضة', cfg.suggestions.rejectEmoji)}<div class="field"><label>صورة الاقتراح</label><input class="input" type="file" name="suggestionsImage" accept="image/png,image/jpeg,image/webp,image/gif"><img id="preview-suggestionsImage" class="upload-preview" src="${cfg.suggestions.image ? `/uploads/${path.basename(cfg.suggestions.image)}` : ''}" style="${cfg.suggestions.image ? '' : 'display:none'}"></div><hr><h2>البلاغات السرية</h2>${channelSelect(guild, 'reportsChannelId', 'قناة البلاغات', cfg.reports.channelId)}<hr><h2>رسائل مجهولة</h2><p class="muted">أي رسالة تكتب في قناة الرسائل المجهولة تتحول تلقائياً إلى إيمبد مجهول ويظهر تحتها زر إبلاغ عن عضو.</p>${saveButton()}</form></section>`; }
function moderationForm(guild, cfg) { return `<section class="card"><h2>الإدارة والحماية</h2>${formStart(`/dashboard/${guild.id}/moderation`)}<label class="check"><input type="checkbox" name="antiSpam" ${cfg.protection.antiSpam ? 'checked' : ''}> منع السبام</label><label class="check"><input type="checkbox" name="antiLinks" ${cfg.protection.antiLinks ? 'checked' : ''}> منع الروابط الخارجية</label><label class="check"><input type="checkbox" name="antiInvites" ${cfg.protection.antiInvites ? 'checked' : ''}> منع دعوات السيرفرات</label><div class="row">${optionField('muteMinutes', 'مدة الكتم بالدقائق', cfg.protection.muteMinutes, 'number', 'min="1" max="1440"')}${optionField('maxMessages', 'الحد الأقصى للرسائل', cfg.protection.maxMessages, 'number', 'min="2" max="50"')}</div><div class="row">${optionField('warningLimit', 'عدد التحذيرات قبل الإجراء', cfg.warnings.maxWarnings, 'number', 'min="1" max="20"')}${selectField('warningAction', 'الإجراء', ['kick', 'طرد'], ['ban', 'حظر'])}</div>${channelSelect(guild, 'logsChannelId', 'قناة السجلات', cfg.logs.channelId)}<label class="check"><input type="checkbox" name="logsEnabled" ${cfg.logs.enabled ? 'checked' : ''}> تفعيل السجلات</label>${saveButton()}</form></section>`; }
function engagementForm(guild, cfg) { return `<section class="card"><h2>التفاعل والمستويات</h2>${formStart(`/dashboard/${guild.id}/engagement`)}<label class="check"><input type="checkbox" name="levelingEnabled" ${cfg.leveling.enabled ? 'checked' : ''}> تفعيل نظام XP والمستويات</label>${channelSelect(guild, 'levelingChannelId', 'قناة إشعارات الترقية', cfg.leveling.channelId)}<div class="row">${optionField('xpMin', 'أقل XP', cfg.leveling.xpMin, 'number')}${optionField('xpMax', 'أعلى XP', cfg.leveling.xpMax, 'number')}</div>${optionField('xpCooldown', 'فترة الانتظار بالثواني', cfg.leveling.cooldownSeconds, 'number')}${saveButton()}</form></section><section class="card"><h2>ملاحظات</h2><p class="muted">الأعضاء يحصلون على XP عند التحدث، ويمكن عرض الترتيب بأمر /leaderboard.</p></section>`; }
function eventsForm(guild, cfg) { const reminder = store.reminders.find(x => x.guildId === guild.id) || { enabled: cfg.reminders.enabled, channelId: cfg.reminders.channelId, text: cfg.reminders.text, intervalMinutes: cfg.reminders.intervalMinutes }; return `<section class="card"><h2>التذكيرات المجدولة</h2>${formStart(`/dashboard/${guild.id}/events`)}<label class="check"><input type="checkbox" name="remindersEnabled" ${reminder.enabled ? 'checked' : ''}> تفعيل التذكير الدوري</label>${channelSelect(guild, 'reminderChannelId', 'قناة التذكير', reminder.channelId)}${optionField('reminderText', 'نص التذكير', reminder.text)}${optionField('reminderInterval', 'الفاصل بالدقائق', reminder.intervalMinutes || 1440, 'number', 'min="1"')}<hr><h2>المسابقات</h2>${channelSelect(guild, 'giveawayChannelId', 'قناة المسابقات', cfg.giveaways.channelId)}${optionField('giveawayPrize', 'الجائزة الافتراضية', 'اكتب الجائزة عند تشغيل الأمر')}${optionField('giveawayMinutes', 'مدة المسابقة بالدقائق', 60, 'number', 'min="1"')}${saveButton()}</form><\/section>`; }
function announcementsForm(guild, cfg) { return `<section class="card"><h2>إعلانات السيرفر</h2><p class="muted">اكتب الإعلان وسيقوم البوت بإرساله إلى القنوات النصية المختارة. التنفيذ يحتاج صلاحية إرسال الرسائل.</p>${formStart(`/dashboard/${guild.id}/announcements`)}${optionField('announcementTitle', 'عنوان الإعلان', 'إعلان جديد')}${optionField('announcementText', 'نص الإعلان', '')}${optionField('announcementColor', 'لون الإعلان', '#5865f2', 'color')}<div class="field"><label>القنوات المستهدفة — اكتب المعرفات مفصولة بفاصلة</label><input class="input" name="announcementChannels" value="${(cfg.announcements.allowedChannelIds || []).join(',')}"></div>${saveButton()}</form></section>`; }
function utilitiesForm(guild, cfg) { return `<section class="card"><h2>الأدوات العامة</h2>${formStart(`/dashboard/${guild.id}/utilities`)}<label class="check"><input type="checkbox" name="anonymousEnabled" ${cfg.anonymous.enabled ? 'checked' : ''}> تفعيل الرسائل المجهولة</label>${channelSelect(guild, 'anonymousChannelId', 'قناة الرسائل المجهولة', cfg.anonymous.channelId)}<hr><label class="check"><input type="checkbox" name="autoEnabled" ${cfg.autoresponses.enabled ? 'checked' : ''}> تفعيل الردود التلقائية</label><p class="muted">الرد الافتراضي الحالي: ${cfg.autoresponses.items?.[0]?.response || 'لا يوجد'}</p>${optionField('autoTrigger', 'كلمة التشغيل', cfg.autoresponses.items?.[0]?.trigger || '')}${optionField('autoResponse', 'الرد', cfg.autoresponses.items?.[0]?.response || '')}${saveButton()}</form></section>`; }

app.post('/dashboard/:guildId/welcome', requireLogin, upload.single('welcomeImage'), async (req, res) => { const g = guildFromReq(req, res); if (!g) return; const c = guildConfig(g.id); c.welcome = { ...c.welcome, enabled: bool(req.body.welcomeEnabled), channelId: req.body.welcomeChannelId || '', title: safeText(req.body.welcomeTitle), description: safeText(req.body.welcomeDescription), color: color(req.body.welcomeColor), rulesUrl: safeText(req.body.welcomeRulesUrl) }; if (req.file) c.welcome.image = saveUpload(req.file); c.autorole = { enabled: bool(req.body.autoroleEnabled), roleId: req.body.autoroleRoleId || '' }; c.verification = { ...c.verification, enabled: bool(req.body.verificationEnabled), channelId: req.body.verificationChannelId || '', roleId: req.body.verificationRoleId || '', title: safeText(req.body.verificationTitle), description: safeText(req.body.verificationDescription) }; saveStore(); if (req.body.sendVerification === '1' && c.verification.channelId) { const ch = await getChannel(g, c.verification.channelId); if (ch?.isTextBased()) await ch.send(verificationPanel(c)).catch(() => { }); } res.redirect(`/dashboard/${g.id}/welcome?saved=1`); });
app.post('/dashboard/:guildId/tickets', requireLogin, upload.single('ticketsImage'), async (req, res) => { const g = guildFromReq(req, res); if (!g) return; const c = guildConfig(g.id); c.tickets = { ...c.tickets, enabled: bool(req.body.ticketsEnabled), channelId: req.body.ticketsPanelChannelId || '', supportRoleId: req.body.ticketsSupportRoleId || '', categoryId: req.body.ticketsCategoryId || '', title: safeText(req.body.ticketsTitle), description: safeText(req.body.ticketsDescription), color: color(req.body.ticketsColor) }; if (req.file) c.tickets.image = saveUpload(req.file); c.tickets.options = [0, 1, 2, 3].map((i) => ({ label: safeText(req.body[`ticketLabel${i}`], `الخيار ${i + 1}`), value: safeText(req.body[`ticketValue${i}`], `option_${i + 1}`).replace(/[^a-z0-9_-]/gi, '_').slice(0, 50), description: safeText(req.body[`ticketDescription${i}`], 'فتح طلب جديد'), emoji: safeText(req.body[`ticketEmoji${i}`]) })); saveStore(); if (req.body.sendPanel === '1' && c.tickets.channelId) { const ch = await getChannel(g, c.tickets.channelId); if (ch?.isTextBased()) await ch.send(ticketPanel(c)).catch(() => { }); } res.redirect(`/dashboard/${g.id}/tickets?saved=1`); });
app.post('/dashboard/:guildId/suggestions', requireLogin, upload.single('suggestionsImage'), async (req, res) => { const g = guildFromReq(req, res); if (!g) return; const c = guildConfig(g.id); c.suggestions = { ...c.suggestions, enabled: bool(req.body.suggestionsEnabled), channelId: req.body.suggestionsChannelId || '', color: color(req.body.suggestionsColor, '#fee75c'), approveEmoji: safeText(req.body.suggestionsApproveEmoji, '✅'), rejectEmoji: safeText(req.body.suggestionsRejectEmoji, '❌'), approveEmojiId: safeText(req.body.suggestionsApproveEmojiId), rejectEmojiId: safeText(req.body.suggestionsRejectEmojiId) }; if (req.file) c.suggestions.image = saveUpload(req.file); c.reports.channelId = req.body.reportsChannelId || ''; saveStore(); res.redirect(`/dashboard/${g.id}/suggestions?saved=1`); });
app.post('/dashboard/:guildId/moderation', requireLogin, (req, res) => { const g = guildFromReq(req, res); if (!g) return; const c = guildConfig(g.id); c.protection = { ...c.protection, antiSpam: bool(req.body.antiSpam), antiLinks: bool(req.body.antiLinks), antiInvites: bool(req.body.antiInvites), muteMinutes: Number(req.body.muteMinutes) || 10, maxMessages: Number(req.body.maxMessages) || 6 }; c.logs = { enabled: bool(req.body.logsEnabled), channelId: req.body.logsChannelId || '' }; c.warnings = { ...c.warnings, maxWarnings: Number(req.body.warningLimit) || 3, action: req.body.warningAction || 'kick' }; saveStore(); res.redirect(`/dashboard/${g.id}/moderation?saved=1`); });
app.post('/dashboard/:guildId/events', requireLogin, async (req, res) => { const g = guildFromReq(req, res); if (!g) return; const c = guildConfig(g.id); c.reminders = { ...c.reminders, enabled: bool(req.body.remindersEnabled), channelId: req.body.reminderChannelId || '', text: safeText(req.body.reminderText), intervalMinutes: Number(req.body.reminderInterval) || 1440 }; c.giveaways = { ...c.giveaways, channelId: req.body.giveawayChannelId || '' }; const idx = store.reminders.findIndex(x => x.guildId === g.id); const item = { guildId: g.id, enabled: c.reminders.enabled, channelId: c.reminders.channelId, text: c.reminders.text, intervalMinutes: c.reminders.intervalMinutes, nextAt: Date.now() + c.reminders.intervalMinutes * 60000, title: 'تذكير دوري', color: '#5865f2' }; if (idx >= 0) store.reminders[idx] = item; else store.reminders.push(item); saveStore(); res.redirect(`/dashboard/${g.id}/events?saved=1`); });
app.post('/dashboard/:guildId/announcements', requireLogin, async (req, res) => { const g = guildFromReq(req, res); if (!g) return; const c = guildConfig(g.id); const ids = safeText(req.body.announcementChannels).split(',').map(x => x.trim()).filter(Boolean); c.announcements.allowedChannelIds = ids; saveStore(); const embed = new EmbedBuilder().setTitle(safeText(req.body.announcementTitle, 'إعلان جديد')).setDescription(safeText(req.body.announcementText)).setColor(color(req.body.announcementColor)).setTimestamp(); for (const id of ids) { const ch = await getChannel(g, id); if (ch?.isTextBased()) await ch.send({ embeds: [embed] }).catch(() => { }); } res.redirect(`/dashboard/${g.id}/announcements?saved=1`); });
app.post('/dashboard/:guildId/engagement', requireLogin, (req, res) => { const g = guildFromReq(req, res); if (!g) return; const c = guildConfig(g.id); c.leveling = { ...c.leveling, enabled: bool(req.body.levelingEnabled), channelId: req.body.levelingChannelId || '', xpMin: Number(req.body.xpMin) || 8, xpMax: Number(req.body.xpMax) || 15, cooldownSeconds: Number(req.body.xpCooldown) || 60 }; saveStore(); res.redirect(`/dashboard/${g.id}/engagement?saved=1`); });
app.post('/dashboard/:guildId/utilities', requireLogin, (req, res) => { const g = guildFromReq(req, res); if (!g) return; const c = guildConfig(g.id); c.anonymous = { enabled: bool(req.body.anonymousEnabled), channelId: req.body.anonymousChannelId || '' }; c.autoresponses = { enabled: bool(req.body.autoEnabled), items: [{ trigger: safeText(req.body.autoTrigger), response: safeText(req.body.autoResponse) }] }; saveStore(); res.redirect(`/dashboard/${g.id}/utilities?saved=1`); });
app.use((err, req, res, next) => { console.error(err); res.status(400).send(layout('خطأ', '<main class="main"><div class="notice">تعذر تنفيذ الطلب. تحقق من نوع الصورة وحجمها، الحد الأقصى 8MB.</div></main>', req)); });

app.listen(PORT, () => console.log(`Dashboard listening on ${publicBaseUrl()}`));
if (process.env.DISCORD_TOKEN) client.login(process.env.DISCORD_TOKEN).catch(error => console.error('Discord login failed:', error.message));
else console.warn('DISCORD_TOKEN is missing. Dashboard can still start, but the bot will not connect.');

process.on('SIGINT', () => { saveStore(); client.destroy(); process.exit(0); });
process.on('SIGTERM', () => { saveStore(); client.destroy(); process.exit(0); });
