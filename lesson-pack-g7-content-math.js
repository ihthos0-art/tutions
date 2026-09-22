/* Math — Grade 7 Interactive Lesson Pack (transcribed verbatim).

   Source: the teacher's Grade 7 pack, New York State standards basis
   NY-7.RP (ratios and proportional relationships) and NY-7.EE (expressions
   and equations).

   Reference URLs the teacher cited:
     https://www.nysed.gov/standards-instruction/mathematics

   The pack names RATIO_BUILDER and EQUATION_BALANCE for its two number games,
   so those engines are implemented in lesson-pack.js rather than remapped to
   FILL_BLANK: a ratio built as two number pickers cannot mistype "3:5" into a
   wrong answer, which a free-text blank can.

   Answers are the pack's own, including "2:4" rather than "1:2" — the pack
   teaches equivalent ratios, not simplification here, so the teacher's key is
   kept as written rather than "corrected".
*/
(function (root) {
  'use strict';

  var LESSONS = [
    {
      subject: 'Math',
      lesson_id: 'ma-l1',
      grade: 7,
      title: 'Ratios, Proportions, and Unit Rates',
      objective: 'Students will:\nread a ratio\nfind an equal ratio\nfind a unit rate',
      keyWords: [
        { word: 'ratio', meaning: 'compares two amounts' },
        { word: 'rate', meaning: 'compares two amounts with different units' },
        { word: 'unit rate', meaning: 'amount for 1' },
        { word: 'equivalent', meaning: 'equal in value' },
        { word: 'proportion', meaning: 'two equal ratios' }
      ],
      read: {
        title: 'Learn',
        tts: true,
        paragraphs: [
          'A ratio compares two amounts.',
          'There are 2 red balls.',
          'There are 3 blue balls.',
          'Red to blue is 2 : 3.',
          'Order matters.',
          'red : blue = 2 : 3',
          'Equal ratios: multiply both numbers by the same number.',
          '2 : 3, multiplied by 2, is 4 : 6.',
          'So 2 : 3 = 4 : 6.',
          'A rate compares two amounts with different units.',
          'A unit rate is the amount for 1.',
          '120 miles in 2 hours.',
          '120 ÷ 2 = 60',
          'Unit rate = 60 miles per hour.'
        ]
      },
      visual: {
        svg: '<svg viewBox="0 0 850 280" width="100%" role="img" aria-label="Two red circles and three blue circles showing a ratio of 2 to 3">\n<rect width="850" height="280" fill="white"/>\n<text x="100" y="50" font-size="28">Red</text>\n<circle cx="120" cy="120" r="38" fill="#dc655d"/>\n<circle cx="220" cy="120" r="38" fill="#dc655d"/>\n<text x="470" y="50" font-size="28">Blue</text>\n<circle cx="440" cy="120" r="38" fill="#5d8fdc"/>\n<circle cx="540" cy="120" r="38" fill="#5d8fdc"/>\n<circle cx="640" cy="120" r="38" fill="#5d8fdc"/>\n<text x="315" y="245" font-size="34">red : blue = 2 : 3</text>\n</svg>',
        alt: 'Two red circles and three blue circles showing a ratio of 2 to 3'
      },
      guided: [],
      games: [
        {
          name: 'Build the Ratio',
          engine: 'RATIO_BUILDER',
          id: 'ma-l1-p1',
          instruction: 'Write the ratio. Order matters.',
          items: [
            {
              prompt: '3 green circles and 5 yellow circles',
              labels: ['green', 'yellow'],
              answer: '3:5',
              hint: 'Count the green circles first.'
            },
            {
              prompt: '2 red and 4 blue',
              labels: ['red', 'blue'],
              answer: '2:4',
              hint: 'Count the red first, then the blue.'
            },
            {
              prompt: '4 cats and 3 dogs',
              labels: ['cats', 'dogs'],
              answer: '4:3',
              hint: 'Cats come first in this question.'
            }
          ]
        },
        {
          name: 'Equal or Not?',
          engine: 'TRUE_FALSE',
          id: 'ma-l1-p2',
          instruction: 'Do these ratios show the same amount?',
          items: [
            { prompt: '2 : 3 and 4 : 6', answer: true, hint: 'Both numbers were multiplied by 2.' },
            { prompt: '3 : 5 and 6 : 10', answer: true, hint: 'Both numbers were multiplied by 2.' },
            { prompt: '4 : 7 and 8 : 15', answer: false, hint: 'Multiply both numbers of 4 : 7 by 2.' },
            { prompt: '5 : 2 and 15 : 6', answer: true, hint: 'Both numbers were multiplied by 3.' }
          ]
        },
        {
          name: 'Unit Rate',
          engine: 'FILL_BLANK',
          id: 'ma-l1-p3',
          mode: 'type',
          instruction: 'Find the amount for 1.',
          items: [
            { before: '100 miles in 2 hours =', after: 'miles per hour', answer: '50', hint: '100 ÷ 2' },
            { before: '$12 for 4 sandwiches = $', after: 'each', answer: '3', hint: '12 ÷ 4' },
            { before: '18 pages in 3 minutes =', after: 'pages per minute', answer: '6', hint: '18 ÷ 3' },
            { before: '$20 for 5 notebooks = $', after: 'each', answer: '4', hint: '20 ÷ 5' }
          ]
        },
        {
          name: 'Proportion Table',
          engine: 'DRAG_DROP',
          id: 'ma-l1-p4',
          instruction: 'Put each cost next to the number of bottles.',
          boxes: ['1 bottle', '2 bottles', '3 bottles', '4 bottles'],
          cards: [
            { text: '$2', box: '1 bottle' },
            { text: '$4', box: '2 bottles' },
            { text: '$6', box: '3 bottles' },
            { text: '$8', box: '4 bottles' }
          ]
        }
      ],
      challenge: {
        id: 'ma-l1-c1',
        prompt: '5 tickets cost $50.\nCost for 1 ticket: 50 ÷ 5 = ?',
        accept: ['$10', '10', '$10.00'],
        hint: 'Divide the total cost by the number of tickets.'
      }
    },
    {
      subject: 'Math',
      lesson_id: 'ma-l2',
      grade: 7,
      title: 'Expressions and Equations',
      objective: 'Students will:\nunderstand a variable\nuse substitution\nsolve simple equations',
      keyWords: [
        { word: 'variable', meaning: 'a letter that stands for a number' },
        { word: 'expression', meaning: 'math with no equal sign' },
        { word: 'equation', meaning: 'math with an equal sign' },
        { word: 'solve', meaning: 'find the missing number' },
        { word: 'substitute', meaning: 'put a number in place of a letter' }
      ],
      read: {
        title: 'Learn',
        tts: true,
        paragraphs: [
          'x + 4',
          'x is a variable. A variable is a letter that stands for a number.',
          'If x = 3:',
          'x + 4',
          '= 3 + 4',
          '= 7',
          'Expression or equation?',
          'Expression: 3x + 2',
          'Equation: 3x + 2 = 14',
          'The equation has an = sign.',
          'Solve x + 5 = 12',
          'Subtract 5 from both sides:',
          'x + 5 - 5 = 12 - 5',
          'x = 7'
        ]
      },
      visual: {
        svg: '<svg viewBox="0 0 880 320" width="100%" role="img" aria-label="Balance scale showing x plus five equals twelve">\n<rect width="880" height="320" fill="white"/>\n<line x1="440" y1="65" x2="440" y2="260" stroke="#555" stroke-width="10"/>\n<line x1="220" y1="115" x2="660" y2="115" stroke="#555" stroke-width="8"/>\n<line x1="220" y1="115" x2="175" y2="220" stroke="#777" stroke-width="4"/>\n<line x1="220" y1="115" x2="265" y2="220" stroke="#777" stroke-width="4"/>\n<line x1="660" y1="115" x2="615" y2="220" stroke="#777" stroke-width="4"/>\n<line x1="660" y1="115" x2="705" y2="220" stroke="#777" stroke-width="4"/>\n<rect x="145" y="220" width="150" height="25" rx="8" fill="#8ca8c3"/>\n<rect x="585" y="220" width="150" height="25" rx="8" fill="#8ca8c3"/>\n<text x="165" y="200" font-size="35">x + 5</text>\n<text x="635" y="200" font-size="35">12</text>\n<text x="285" y="305" font-size="30">Do the same thing to both sides.</text>\n</svg>',
        alt: 'Balance scale showing x plus five equals twelve'
      },
      guided: [],
      games: [
        {
          name: 'Expression or Equation?',
          engine: 'SORT',
          id: 'ma-l2-p1',
          instruction: 'Sort each one. Does it have an equal sign?',
          bins: ['Expression', 'Equation'],
          cards: [
            { text: 'x + 8', bin: 'Expression' },
            { text: '4y', bin: 'Expression' },
            { text: '2a + 5', bin: 'Expression' },
            { text: 'x + 8 = 15', bin: 'Equation' },
            { text: '4y = 20', bin: 'Equation' },
            { text: '2a + 5 = 13', bin: 'Equation' }
          ]
        },
        {
          name: 'Substitute',
          engine: 'FILL_BLANK',
          id: 'ma-l2-p2',
          mode: 'type',
          instruction: 'Put the number in place of the letter.',
          items: [
            { before: 'x + 5 when x = 3 =', after: '', answer: '8', hint: '3 + 5' },
            { before: '2x when x = 4 =', after: '', answer: '8', hint: '2 × 4' },
            { before: 'x - 7 when x = 10 =', after: '', answer: '3', hint: '10 - 7' },
            { before: '3x + 1 when x = 2 =', after: '', answer: '7', hint: '3 × 2, then add 1' }
          ]
        },
        {
          name: 'Solve',
          engine: 'EQUATION_BALANCE',
          id: 'ma-l2-p3',
          instruction: 'Do the same thing to both sides. Find x.',
          items: [
            { prompt: 'x + 6 = 10', answer: '4', hint: 'Subtract 6 from both sides.' },
            { prompt: 'x - 4 = 9', answer: '13', hint: 'Add 4 to both sides.' },
            { prompt: '3x = 15', answer: '5', hint: 'Divide both sides by 3.' },
            { prompt: 'x / 2 = 6', answer: '12', hint: 'Multiply both sides by 2.' }
          ]
        },
        {
          name: 'Match',
          engine: 'MATCH_PAIRS',
          id: 'ma-l2-p4',
          instruction: 'Match each equation to the value of x.',
          pairs: [
            ['x + 2 = 7', 'x = 5'],
            ['x - 5 = 3', 'x = 8'],
            ['4x = 20', 'x = 5'],
            ['x / 3 = 4', 'x = 12']
          ]
        }
      ],
      challenge: {
        id: 'ma-l2-c1',
        prompt: '2x + 3 = 13\nx = ?',
        accept: ['5', 'x = 5'],
        hint: 'First subtract 3 from both sides. 2x = 10.'
      }
    }
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = LESSONS;
  root.G7PackMath = LESSONS;
})(typeof window !== 'undefined' ? window : this);
