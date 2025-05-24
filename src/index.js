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

    if (topic === 'random question') {
      const baseTopics = ['html', 'css', 'javascript', 'react'];
      topic = baseTopics[Math.floor(Math.random() * baseTopics.length)];
      console.log(topic);
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
            hasOptions: question.hasOptions ? '1' : '0',
            isCorrect: option.isCorrect ? '1' : '0',
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
          hasOptions: question.hasOptions ? '1' : '0',
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
  const { topic, id, hasOptions } = res;
  if (hasOptions === '0') {
    await ctx.reply(getAnswer(topic, id), {
      parse_mode: 'HTML',
    });
    await ctx.answerCallbackQuery();
    return;
  }
  if (res.isCorrect === '1') {
    await ctx.reply('Correct!');
  } else {
    const answer = getAnswer(topic, id, hasOptions);
    await ctx.reply(`Incorrect! \n Correct answer: ${answer}`);
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
