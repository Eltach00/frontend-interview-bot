const questions = require('../../assets/data/questions.json');

const getRandomQuestion = (topic) => {
  const questionsByTopic = questions[topic];
  const randomIndex = Math.floor(Math.random() * questionsByTopic.length);
  return questionsByTopic[randomIndex];
};

module.exports = { getRandomQuestion };
