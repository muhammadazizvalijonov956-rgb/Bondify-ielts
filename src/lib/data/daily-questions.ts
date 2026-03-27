export interface DailyQuestion {
  id: string;
  label: string;
  correct: string;
  type: string;
}

export const DAILY_QUESTION_POOL: DailyQuestion[] = [
  { id: 'dq1', label: 'Write the missing word: The weather in London is often ____.', correct: 'rainy', type: 'blank' },
  { id: 'dq2', label: 'True or False: IELTS Speaking has 3 parts.', correct: 'True', type: 'blank' },
  { id: 'dq3', label: 'Synonym of "Fast":', correct: 'quick', type: 'blank' },
  { id: 'dq4', label: 'Antonym of "Large":', correct: 'small', type: 'blank' },
  { id: 'dq5', label: 'What is 15 + 25?', correct: '40', type: 'blank' },
  { id: 'dq6', label: 'Which word is a noun: Run, Blue, Table, Quickly?', correct: 'Table', type: 'blank' },
  { id: 'dq7', label: 'I ____ to the gym every morning.', correct: 'go', type: 'blank' },
  { id: 'dq8', label: 'Spell the word for "a place where books are kept":', correct: 'library', type: 'blank' },
  { id: 'dq9', label: 'If it rains, I ____ stay home.', correct: 'will', type: 'blank' },
  { id: 'dq10', label: 'IELTS stands for International English Language ____ System.', correct: 'Testing', type: 'blank' },
  { id: 'dq11', label: 'She ____ English for three years.', correct: 'has studied', type: 'blank' },
  { id: 'dq12', label: 'What is the comparative form of "good"?', correct: 'better', type: 'blank' },
  { id: 'dq13', label: 'Identify the verb in: "The cat sleeps on the sofa."', correct: 'sleeps', type: 'blank' },
  { id: 'dq14', label: 'Opposite of "Heavy":', correct: 'light', type: 'blank' },
  { id: 'dq15', label: 'How many sections are there in the IELTS Listening test?', correct: '4', type: 'blank' },
  { id: 'dq16', label: 'Plural of "Child":', correct: 'children', type: 'blank' },
  { id: 'dq17', label: 'They ____ playing football when it started to rain.', correct: 'were', type: 'blank' },
  { id: 'dq18', label: 'Synonym of "Happy":', correct: 'joyful', type: 'blank' },
  { id: 'dq19', label: 'A person who writes books is an ____.', correct: 'author', type: 'blank' },
  { id: 'dq20', label: 'The sun ____ in the east.', correct: 'rises', type: 'blank' },
  { id: 'dq21', label: 'What is the past tense of "go"?', correct: 'went', type: 'blank' },
  { id: 'dq22', label: 'Complete the idiom: "A piece of ____" (meaning very easy).', correct: 'cake', type: 'blank' },
  { id: 'dq23', label: 'Which is correct: "A apple" or "An apple"?', correct: 'An apple', type: 'blank' },
  { id: 'dq24', label: 'Synonym of "Difficult":', correct: 'hard', type: 'blank' },
  { id: 'dq25', label: 'Antonym of "Old":', correct: 'new', type: 'blank' },
  { id: 'dq26', label: 'I have ____ to London twice.', correct: 'been', type: 'blank' },
  { id: 'dq27', label: 'The capital of France is ____.', correct: 'Paris', type: 'blank' },
  { id: 'dq28', label: 'What is 100 divided by 4?', correct: '25', type: 'blank' },
  { id: 'dq29', label: 'Identify the adjective in: "A beautiful garden."', correct: 'beautiful', type: 'blank' },
  { id: 'dq30', label: 'How many minutes are in an hour?', correct: '60', type: 'blank' },
  { id: 'dq31', label: 'I ____ like coffee.', correct: 'do not', type: 'blank' },
  { id: 'dq32', label: 'Spell the word for "the day after Tuesday":', correct: 'Wednesday', type: 'blank' },
  { id: 'dq33', label: 'Synonym of "Speak":', correct: 'talk', type: 'blank' },
  { id: 'dq34', label: 'The opposite of "Hot" is ____.', correct: 'cold', type: 'blank' },
  { id: 'dq35', label: 'A ____ has four wheels and is driven on roads.', correct: 'car', type: 'blank' },
  { id: 'dq36', label: 'What is the superlative form of "bad"?', correct: 'worst', type: 'blank' },
  { id: 'dq37', label: 'He is ____ than his brother.', correct: 'taller', type: 'blank' },
  { id: 'dq38', label: 'Identify the adverb: "He ran quickly."', correct: 'quickly', type: 'blank' },
  { id: 'dq39', label: 'We ____ to the park yesterday.', correct: 'went', type: 'blank' },
  { id: 'dq40', label: 'The plural of "Mouse" is ____.', correct: 'mice', type: 'blank' },
  { id: 'dq41', label: 'Synonym of "Small":', correct: 'tiny', type: 'blank' },
  { id: 'dq42', label: 'Antonym of "First":', correct: 'last', type: 'blank' },
  { id: 'dq43', label: 'How many days are in a leap year?', correct: '366', type: 'blank' },
  { id: 'dq44', label: 'Complete: "Believe in ____."', correct: 'yourself', type: 'blank' },
  { id: 'dq45', label: 'The color of grass is ____.', correct: 'green', type: 'blank' },
  { id: 'dq46', label: 'What is 7 times 8?', correct: '56', type: 'blank' },
  { id: 'dq47', label: 'Identify the noun: "Happiness is important."', correct: 'Happiness', type: 'blank' },
  { id: 'dq48', label: 'The book is ____ the table.', correct: 'on', type: 'blank' },
  { id: 'dq49', label: 'Spell the word for "someone who helps sick people":', correct: 'doctor', type: 'blank' },
  { id: 'dq50', label: 'I am ____ a letter.', correct: 'writing', type: 'blank' },
  { id: 'dq51', label: 'Which is a synonym of "Large": Big, Small, Tiny?', correct: 'Big', type: 'blank' },
  { id: 'dq52', label: 'The plural of "Tooth" is ____.', correct: 'teeth', type: 'blank' },
  { id: 'dq53', label: 'I ____ speak Spanish.', correct: 'can', type: 'blank' },
  { id: 'dq54', label: 'What is the past participle of "eat"?', correct: 'eaten', type: 'blank' },
  { id: 'dq55', label: 'Identify the preposition: "He is at school."', correct: 'at', type: 'blank' },
  { id: 'dq56', label: 'A ____ is used to tell time.', correct: 'clock', type: 'blank' },
  { id: 'dq57', label: 'The opposite of "Near" is ____.', correct: 'far', type: 'blank' },
  { id: 'dq58', label: 'How many legs does a spider have?', correct: '8', type: 'blank' },
  { id: 'dq59', label: 'Spell the word for "the season after summer":', correct: 'autumn', type: 'blank' },
  { id: 'dq60', label: 'You should ____ your teeth every day.', correct: 'brush', type: 'blank' },
  { id: 'dq61', label: 'Synchronous is the opposite of ____.', correct: 'asynchronous', type: 'blank' },
  { id: 'dq62', label: 'Which planet is known as the Red Planet?', correct: 'Mars', type: 'blank' },
  { id: 'dq63', label: 'What is the square root of 64?', correct: '8', type: 'blank' },
  { id: 'dq64', label: 'Identify the pronoun: "She is my friend."', correct: 'She', type: 'blank' },
  { id: 'dq65', label: 'A triangle has ____ sides.', correct: '3', type: 'blank' },
  { id: 'dq66', label: 'The taste of sugar is ____.', correct: 'sweet', type: 'blank' },
  { id: 'dq67', label: 'Opposite of "Empty":', correct: 'full', type: 'blank' },
  { id: 'dq68', label: 'What is the capital of Japan?', correct: 'Tokyo', type: 'blank' },
  { id: 'dq69', label: 'Spell the word for "a story told in pictures":', correct: 'comic', type: 'blank' },
  { id: 'dq70', label: 'Water freezes at ____ degrees Celsius.', correct: '0', type: 'blank' },
  { id: 'dq71', label: 'I prefer tea ____ coffee.', correct: 'over', type: 'blank' },
  { id: 'dq72', label: 'What is the plural of "Man"?', correct: 'men', type: 'blank' },
  { id: 'dq73', label: 'The moon ____ at night.', correct: 'shines', type: 'blank' },
  { id: 'dq74', label: 'Synonym of "Buy":', correct: 'purchase', type: 'blank' },
  { id: 'dq75', label: 'The opposite of "Lose" is ____.', correct: 'win', type: 'blank' },
  { id: 'dq76', label: 'They ____ gone to the store.', correct: 'have', type: 'blank' },
  { id: 'dq77', label: 'A ____ has seven colors.', correct: 'rainbow', type: 'blank' },
  { id: 'dq78', label: 'What is 12 multiplied by 12?', correct: '144', type: 'blank' },
  { id: 'dq79', label: 'Identify the conjunction: "I like apples and oranges."', correct: 'and', type: 'blank' },
  { id: 'dq80', label: 'The ocean is ____.', correct: 'blue', type: 'blank' },
  { id: 'dq81', label: 'Spell the word for "the first month of the year":', correct: 'January', type: 'blank' },
  { id: 'dq82', label: 'Synonym of "Finish":', correct: 'end', type: 'blank' },
  { id: 'dq83', label: 'Antonym of "Rich":', correct: 'poor', type: 'blank' },
  { id: 'dq84', label: 'We breathe ____ to live.', correct: 'air', type: 'blank' },
  { id: 'dq85', label: 'What is the comparative of "fast"?', correct: 'faster', type: 'blank' },
  { id: 'dq86', label: 'Identify the verb: "The birds fly south."', correct: 'fly', type: 'blank' },
  { id: 'dq87', label: 'I am ____ to the radio.', correct: 'listening', type: 'blank' },
  { id: 'dq88', label: 'The plural of "Goose" is ____.', correct: 'geese', type: 'blank' },
  { id: 'dq89', label: 'An ____ is a fruit that is usually red or green.', correct: 'apple', type: 'blank' },
  { id: 'dq90', label: 'What is 1000 grams in kilograms?', correct: '1', type: 'blank' },
  { id: 'dq91', label: 'Identify the adjective: "The loud music woke me up."', correct: 'loud', type: 'blank' },
  { id: 'dq92', label: 'The opposite of "Weak" is ____.', correct: 'strong', type: 'blank' },
  { id: 'dq93', label: 'We ____ at the movie theater last night.', correct: 'were', type: 'blank' },
  { id: 'dq94', label: 'Spell the word for "a vehicle that flies":', correct: 'airplane', type: 'blank' },
  { id: 'dq95', label: 'Synonym of "End":', correct: 'finish', type: 'blank' },
  { id: 'dq96', label: 'Antonym of "Thin":', correct: 'thick', type: 'blank' },
  { id: 'dq97', label: 'The earth ____ around the sun.', correct: 'revolves', type: 'blank' },
  { id: 'dq98', label: 'How many sides does a square have?', correct: '4', type: 'blank' },
  { id: 'dq99', label: 'Complete: "Once upon a ____."', correct: 'time', type: 'blank' },
  { id: 'dq100', label: 'The capital of Italy is ____.', correct: 'Rome', type: 'blank' },
];

export function getDailyQuestions(seedDate: string): DailyQuestion[] {
  // Use the date string as a seed to pick 10 questions from the pool
  const date = new Date(seedDate);
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const startIdx = (dayOfYear * 10) % DAILY_QUESTION_POOL.length;
  
  const selected = [];
  for (let i = 0; i < 10; i++) {
    const idx = (startIdx + i) % DAILY_QUESTION_POOL.length;
    selected.push(DAILY_QUESTION_POOL[idx]);
  }
  
  return selected;
}
