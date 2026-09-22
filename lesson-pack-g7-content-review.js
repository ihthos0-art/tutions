/* Master Review — Grade 7 Interactive Lesson Pack.

   Source: the teacher's "MASTER REVIEW" list, fifteen facts, grouped into the
   four rounds the engine renders — English, Math, Science, Social Studies, two
   questions each.

   Every question below is built only from a fact the teacher wrote, and every
   distractor that had to be supplied (the pack lists facts, not questions) is
   drawn from another of the teacher's own definitions rather than invented.
   The answers are the pack's own numbers and words: glucose, grass, 1776,
   Middle, 8, 5.
*/
(function (root) {
  'use strict';

  var ROUNDS = [
    {
      name: 'Round 1: English',
      items: [
        {
          id: 'rv-e1',
          engine: 'MULTIPLE_CHOICE',
          prompt: 'What is the main idea?',
          choices: [
            'What the whole text is mostly about',
            'Words or facts from the text',
            'An idea you make from clues'
          ],
          answer: 'What the whole text is mostly about',
          hint: 'It is the big idea of the whole text.'
        },
        {
          id: 'rv-e2',
          engine: 'MULTIPLE_CHOICE',
          prompt: 'What is an inference?',
          choices: [
            'An idea made from clues',
            'What the whole text is mostly about',
            'A detail that gives more information'
          ],
          answer: 'An idea made from clues',
          hint: 'You make it from clues in the text.'
        }
      ]
    },
    {
      name: 'Round 2: Math',
      items: [
        {
          id: 'rv-m1',
          engine: 'FILL_BLANK',
          mode: 'type',
          before: '3 : 4 = 6 :',
          after: '',
          answer: '8',
          hint: 'Multiply both numbers of 3 : 4 by 2.'
        },
        {
          id: 'rv-m2',
          engine: 'FILL_BLANK',
          mode: 'type',
          before: '$15 for 3 items = $',
          after: 'each',
          answer: '5',
          hint: '15 ÷ 3'
        }
      ]
    },
    {
      name: 'Round 3: Science',
      items: [
        {
          id: 'rv-s1',
          engine: 'FILL_BLANK',
          mode: 'type',
          before: 'A plant makes a sugar called',
          after: '.',
          answer: 'glucose',
          hint: 'It is a simple sugar made by plants.'
        },
        {
          id: 'rv-s2',
          engine: 'FILL_BLANK',
          mode: 'type',
          before: 'In Sun → grass → rabbit, the producer is',
          after: '.',
          answer: 'grass',
          hint: 'A producer makes its own food.'
        }
      ]
    },
    {
      name: 'Round 4: Social Studies',
      items: [
        {
          id: 'rv-ss1',
          engine: 'MULTIPLE_CHOICE',
          prompt: 'Which colony was a Middle Colony?',
          choices: ['New York', 'Massachusetts', 'Virginia'],
          answer: 'New York',
          hint: 'Massachusetts is in New England and Virginia is in the South.'
        },
        {
          id: 'rv-ss2',
          engine: 'FILL_BLANK',
          mode: 'type',
          before: 'The Declaration of Independence was approved in',
          after: '.',
          answer: '1776',
          hint: 'It was approved on July 4 of that year.'
        }
      ]
    }
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = ROUNDS;
  root.G7PackReview = ROUNDS;
})(typeof window !== 'undefined' ? window : this);
