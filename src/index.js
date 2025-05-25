const { config } = require('dotenv');
const {
  Bot,
  Keyboard,
  GrammyError,
  HttpError,
  InlineKeyboard,
} = require('grammy');
const { getAnswer, getRandomQuestion } = require('./utils');

config();

const bot = new Bot(process.env.BOT_TOKEN);

const BASE_TOPICS = ['html', 'css', 'javascript', 'react'];

bot.command('start', async (ctx) => {
  const keyboard = new Keyboard()
    .text('HTML')
    .text('CSS')
    .row()
    .text('JavaScript')
    .text('React')
    .row()
    .text('Random question')
    .resized();

  await ctx.reply('Welcome! Which topic do you want to learn ?', {
    reply_markup: keyboard,
  });
});

bot.hears(
  ['CSS', 'HTML', 'JavaScript', 'React', 'Random question'],
  async (ctx) => {
    let topic = ctx.message.text.toLocaleLowerCase();
    let isRandom = '';
    if (topic === 'random question') {
      topic = BASE_TOPICS[Math.floor(Math.random() * BASE_TOPICS.length)];
      isRandom = '1';
    }

    const question = getRandomQuestion(topic);
    if (question.hasOptions) {
      const optionsKeyboard = new InlineKeyboard();
      question.options.forEach((option, i) => {
        if (i % 2 === 0) {
          optionsKeyboard.row();
        }
        optionsKeyboard.text(
          option.text,
          JSON.stringify({
            id: question.id,
            topic,
            hasOptions: question.hasOptions ? '1' : '',
            isCorrect: option.isCorrect ? '1' : '',
            isRandom,
          })
        );
      });
      await ctx.reply(question.text, {
        reply_markup: optionsKeyboard,
      });
    } else {
      const answerKeyboard = new InlineKeyboard().text(
        'Get Answer',
        JSON.stringify({
          topic,
          id: question.id,
          hasOptions: question.hasOptions ? '1' : '',
          isRandom,
        })
      );
      await ctx.reply(question.text, {
        reply_markup: answerKeyboard,
      });
    }
  }
);

bot.on('callback_query:data', async (ctx) => {
  const res = JSON.parse(ctx.callbackQuery.data);

  const { topic, id, hasOptions, isCorrect, type, isRandom } = res;

  const nextQuestionKeyboard = new InlineKeyboard().text(
    'Next Question',
    JSON.stringify({
      type: 'next',
      topic,
    })
  );

  // === [A] Обработка кнопки "Next Question"
  if (type === 'next') {
    if (isRandom === '1') {
      topic = BASE_TOPICS[Math.floor(Math.random() * BASE_TOPICS.length)];
    }
    const question = getRandomQuestion(topic);
    if (question.hasOptions) {
      const optionsKeyboard = new InlineKeyboard();
      question.options.forEach((option, i) => {
        if (i % 2 === 0) optionsKeyboard.row();
        optionsKeyboard.text(
          option.text,
          JSON.stringify({
            id: question.id,
            topic,
            hasOptions: question.hasOptions ? '1' : '',
            isCorrect: option.isCorrect ? '1' : '',
            isRandom,
          })
        );
      });
      await ctx.reply(question.text, {
        reply_markup: optionsKeyboard,
      });
    } else {
      const answerKeyboard = new InlineKeyboard().text(
        'Get Answer',
        JSON.stringify({
          topic,
          id: question.id,
          hasOptions: question.hasOptions ? '1' : '',
          isRandom,
        })
      );
      await ctx.reply(question.text, {
        reply_markup: answerKeyboard,
      });
    }
    await ctx.answerCallbackQuery();
    return;
  }

  // === [B] Обработка кнопки "Get Answer"
  if (!hasOptions || hasOptions === '') {
    const answer = getAnswer(topic, id);
    await ctx.reply(answer, {
      parse_mode: 'HTML',
      reply_markup: nextQuestionKeyboard,
    });
    await ctx.answerCallbackQuery();
    return;
  }

  // === [C] Обработка вариантов ответа
  if (isCorrect === '1') {
    await ctx.reply('Correct!', {
      reply_markup: nextQuestionKeyboard,
    });
  } else {
    const answer = getAnswer(topic, id, hasOptions);
    await ctx.reply(`Incorrect! \n Correct answer: ${answer}`, {
      reply_markup: nextQuestionKeyboard,
    });
  }

  await ctx.answerCallbackQuery();
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e);
  } else {
    console.error('Unknown error:', e);
  }
});
bot.start();
console.log('Bot is running...');

process.once('SIGINT', async () => {
  console.log('SIGINT received: stopping bot...');
  await bot.stop();
  process.exit(0);
});

process.once('SIGTERM', async () => {
  console.log('SIGTERM received: stopping bot...');
  await bot.stop();
  process.exit(0);
});

// because free deploy server is demand server port render.com
require('http')
  .createServer((req, res) => {
    res.end('server for telegram bot');
  })
  .listen(3000);
