const questions = require('../../assets/data/questions.json');

const getAnswer = (topic, id, hasOptions) => {
  const question = questions[topic].find((question) => question.id === id);
  if (!hasOptions) {
    return question.answer;
  }
  return question.options.find((option) => option.isCorrect).text;
};

module.exports = { getAnswer };
