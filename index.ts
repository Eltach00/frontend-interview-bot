import { config } from 'dotenv';
import { Bot } from 'grammy';

config();

const bot = new Bot('');

bot.on('message', (ctx) => ctx.reply('Hi there!'));

bot.start();
