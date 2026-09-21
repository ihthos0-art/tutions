/* Math — Grade 2 Interactive Lesson Pack (transcribed verbatim) */
(function (root) {
  'use strict';

  // Inline SVG from the source, preserved line-for-line (blank lines included).
  var PLACE_VALUE_SVG = [
    '<svg viewBox="0 0 900 360" width="100%" role="img" aria-label="Place value picture showing two hundreds, four tens, and three ones">',
    '  <rect width="900" height="360" fill="#fbfdff"/>',
    '  <text x="95" y="45" font-size="26">Hundreds</text>',
    '  <text x="380" y="45" font-size="26">Tens</text>',
    '  <text x="700" y="45" font-size="26">Ones</text>',
    '',
    '  <g stroke="#5f86a6" fill="#dceef8">',
    '    <rect x="45" y="80" width="145" height="145"/>',
    '    <rect x="205" y="80" width="145" height="145"/>',
    '  </g>',
    '',
    '  <g fill="#d9edd0" stroke="#5a9152">',
    '    <rect x="385" y="80" width="28" height="145"/>',
    '    <rect x="430" y="80" width="28" height="145"/>',
    '    <rect x="475" y="80" width="28" height="145"/>',
    '    <rect x="520" y="80" width="28" height="145"/>',
    '  </g>',
    '',
    '  <g fill="#ffe3a5" stroke="#ba8b37">',
    '    <rect x="700" y="120" width="38" height="38"/>',
    '    <rect x="750" y="120" width="38" height="38"/>',
    '    <rect x="800" y="120" width="38" height="38"/>',
    '  </g>',
    '',
    '<text x="110" y="285" font-size="32">2</text>',
    '<text x="450" y="285" font-size="32">4</text>',
    '<text x="755" y="285" font-size="32">3</text>',
    '<text x="350" y="335" font-size="34">243 = 200 + 40 + 3</text>',
    '</svg>'
  ].join('\n');

  var NUMBER_LINE_SVG = [
    '<svg viewBox="0 0 850 320" width="100%" role="img" aria-label="Number line showing a jump from 34 to 54 by adding 20, then to 59 by adding 5">',
    '  <rect width="850" height="320" fill="#ffffff"/>',
    '  <line x1="70" y1="190" x2="780" y2="190" stroke="#444" stroke-width="4"/>',
    '  <g font-size="18">',
    '    <text x="90" y="225">30</text>',
    '    <text x="185" y="225">34</text>',
    '    <text x="470" y="225">54</text>',
    '    <text x="665" y="225">59</text>',
    '  </g>',
    '  <circle cx="200" cy="190" r="10" fill="#555"/>',
    '  <circle cx="495" cy="190" r="10" fill="#555"/>',
    '  <circle cx="690" cy="190" r="10" fill="#555"/>',
    '  <path d="M200 175 Q345 55 495 175" fill="none" stroke="#4e9dc4" stroke-width="5"/>',
    '  <path d="M495 175 Q590 95 690 175" fill="none" stroke="#78a958" stroke-width="5"/>',
    '  <text x="315" y="80" font-size="28">+20</text>',
    '  <text x="570" y="120" font-size="28">+5</text>',
    '  <text x="280" y="285" font-size="30">34 + 25 = 59</text>',
    '</svg>'
  ].join('\n');

  var LESSONS = [
    {
      subject: 'Math',
      lesson_id: 'ma-l1',
      grade: 2,
      title: 'Hundreds, Tens, and Ones',
      objective: 'Students will understand place value in three-digit numbers.',
      keyWords: [
        { word: 'digit', meaning: 'one number symbol, like 4 or 7' },
        { word: 'ones', meaning: 'single units' },
        { word: 'tens', meaning: 'groups of 10' },
        { word: 'hundreds', meaning: 'groups of 100' },
        { word: 'place value', meaning: 'the value of a digit because of its place' }
      ],
      read: {
        title: 'Learn',
        paragraphs: [
          'Look at the number:',
          '243',
          'The 2 means 2 hundreds.',
          'The 4 means 4 tens.',
          'The 3 means 3 ones.',
          'So:',
          '243 = 200 + 40 + 3'
        ],
        tts: true
      },
      thinkAbout: [],
      visual: {
        svg: PLACE_VALUE_SVG,
        alt: 'Place value picture showing two hundreds, four tens, and three ones'
      },
      guided: [
        {
          id: 'ma-l1-gu1',
          prompt: 'Example 1: 356\n3 hundreds = 300\n5 tens = 50\n6 ones = 6',
          answer: '356 = 300 + 50 + 6',
          hint: null
        },
        {
          id: 'ma-l1-gu2',
          prompt: 'Example 2: 407\n4 hundreds = 400\n0 tens = 0\n7 ones = 7',
          answer: '407 = 400 + 0 + 7',
          hint: null
        }
      ],
      games: [
        {
          name: 'Build the Number',
          engine: 'NUMBER_BUILDER',
          id: 'ma-l1-g1',
          items: [
            {
              engine: 'NUMBER_BUILDER',
              id: 'ma-l1-g1-1',
              prompt: 'Build 325.',
              target: 325,
              hint: null,
              // Source "Student drags:" spec, kept verbatim; no key for it in the
              // NUMBER_BUILDER shape, so it is carried here.
              drag: ['3 hundred blocks', '2 ten rods', '5 one cubes']
            },
            { engine: 'NUMBER_BUILDER', id: 'ma-l1-g1-2', prompt: '142', target: 142, hint: null },
            { engine: 'NUMBER_BUILDER', id: 'ma-l1-g1-3', prompt: '280', target: 280, hint: null },
            { engine: 'NUMBER_BUILDER', id: 'ma-l1-g1-4', prompt: '506', target: 506, hint: null },
            { engine: 'NUMBER_BUILDER', id: 'ma-l1-g1-5', prompt: '731', target: 731, hint: null },
            { engine: 'NUMBER_BUILDER', id: 'ma-l1-g1-6', prompt: '999', target: 999, hint: null }
          ]
        },
        {
          name: 'What Place?',
          engine: 'MULTIPLE_CHOICE',
          id: 'ma-l1-g2',
          items: [
            {
              engine: 'MULTIPLE_CHOICE',
              id: 'ma-l1-g2-1',
              prompt: 'In 482, what place is the 8 in?',
              choices: ['hundreds', 'tens', 'ones'],
              answer: 'tens',
              hint: null
            },
            {
              engine: 'MULTIPLE_CHOICE',
              id: 'ma-l1-g2-2',
              prompt: 'In 615, what place is the 6 in?',
              choices: ['hundreds', 'tens', 'ones'],
              answer: 'hundreds',
              hint: null
            },
            {
              engine: 'MULTIPLE_CHOICE',
              id: 'ma-l1-g2-3',
              prompt: 'In 397, what place is the 7 in?',
              choices: ['hundreds', 'tens', 'ones'],
              answer: 'ones',
              hint: null
            },
            {
              engine: 'MULTIPLE_CHOICE',
              id: 'ma-l1-g2-4',
              prompt: 'In 540, what place is the 4 in?',
              choices: ['hundreds', 'tens', 'ones'],
              answer: 'tens',
              hint: null
            }
          ]
        },
        {
          name: 'Expanded Form',
          engine: 'FILL_BLANK',
          id: 'ma-l1-g3',
          items: [
            { engine: 'FILL_BLANK', id: 'ma-l1-g3-1', mode: 'type', before: '274 = 200 + ', after: ' + 4', answer: '70', hint: null },
            { engine: 'FILL_BLANK', id: 'ma-l1-g3-2', mode: 'type', before: '631 = ', after: ' + 30 + 1', answer: '600', hint: null },
            { engine: 'FILL_BLANK', id: 'ma-l1-g3-3', mode: 'type', before: '805 = 800 + ', after: ' + 5', answer: '0', hint: null },
            { engine: 'FILL_BLANK', id: 'ma-l1-g3-4', mode: 'type', before: '492 = 400 + 90 + ', after: '', answer: '2', hint: null }
          ]
        },
        {
          name: 'Match the Number',
          engine: 'MATCH_PAIRS',
          id: 'ma-l1-g4',
          items: [
            {
              engine: 'MATCH_PAIRS',
              id: 'ma-l1-g4-1',
              instruction: 'Match the Number',
              pairs: [
                ['300 + 20 + 8', '328'],
                ['500 + 6', '506'],
                ['700 + 80 + 1', '781'],
                ['100 + 40 + 9', '149']
              ]
            }
          ]
        }
      ],
      challenge: {
        prompt: 'Which number has:\n6 hundreds\n0 tens\n9 ones',
        accept: ['609'],
        hint: null
      }
    },
    {
      subject: 'Math',
      lesson_id: 'ma-l2',
      grade: 2,
      title: 'Addition and Subtraction Within 100',
      objective: 'Students will add and subtract using tens and ones.',
      keyWords: [],
      read: {
        title: 'Learn',
        paragraphs: [
          'Learn: Add by Breaking Apart',
          '34 + 25',
          'Break the numbers into tens and ones:',
          '34 = 30 + 4',
          '25 = 20 + 5',
          'Add tens:',
          '30 + 20 = 50',
          'Add ones:',
          '4 + 5 = 9',
          'Put them together:',
          '50 + 9 = 59',
          'So:',
          '34 + 25 = 59',
          'Learn: Subtract by Breaking Apart',
          '67 - 23',
          '67 - 20 = 47',
          '47 - 3 = 44',
          'So:',
          '67 - 23 = 44'
        ],
        tts: true
      },
      thinkAbout: [],
      visual: {
        svg: NUMBER_LINE_SVG,
        alt: 'Number line showing a jump from 34 to 54 by adding 20, then to 59 by adding 5'
      },
      guided: [],
      games: [
        {
          name: 'Number Line Jump',
          engine: 'NUMBER_LINE',
          id: 'ma-l2-g1',
          items: [
            {
              engine: 'NUMBER_LINE',
              id: 'ma-l2-g1-1',
              prompt: 'Start at 42.\nJump +10\nJump +10\nJump +3\nWhere do you land?',
              target: 65,
              hint: null
            },
            { engine: 'NUMBER_LINE', id: 'ma-l2-g1-2', prompt: '31 + 24 = 55', target: 55, hint: null },
            { engine: 'NUMBER_LINE', id: 'ma-l2-g1-3', prompt: '46 + 12 = 58', target: 58, hint: null },
            { engine: 'NUMBER_LINE', id: 'ma-l2-g1-4', prompt: '70 - 21 = 49', target: 49, hint: null },
            { engine: 'NUMBER_LINE', id: 'ma-l2-g1-5', prompt: '83 - 32 = 51', target: 51, hint: null }
          ]
        },
        {
          name: 'Fill the Missing Number',
          engine: 'FILL_BLANK',
          id: 'ma-l2-g2',
          items: [
            { engine: 'FILL_BLANK', id: 'ma-l2-g2-1', mode: 'type', before: '20 + 18 = ', after: '', answer: '38', hint: null },
            { engine: 'FILL_BLANK', id: 'ma-l2-g2-2', mode: 'type', before: '45 + 14 = ', after: '', answer: '59', hint: null },
            { engine: 'FILL_BLANK', id: 'ma-l2-g2-3', mode: 'type', before: '72 - 20 = ', after: '', answer: '52', hint: null },
            { engine: 'FILL_BLANK', id: 'ma-l2-g2-4', mode: 'type', before: '68 - 15 = ', after: '', answer: '53', hint: null },
            { engine: 'FILL_BLANK', id: 'ma-l2-g2-5', mode: 'type', before: '39 + 30 = ', after: '', answer: '69', hint: null },
            { engine: 'FILL_BLANK', id: 'ma-l2-g2-6', mode: 'type', before: '91 - 40 = ', after: '', answer: '51', hint: null }
          ]
        },
        {
          name: 'Choose the Correct Answer',
          engine: 'MULTIPLE_CHOICE',
          id: 'ma-l2-g3',
          items: [
            {
              engine: 'MULTIPLE_CHOICE',
              id: 'ma-l2-g3-1',
              prompt: '26 + 31 =',
              choices: ['47', '57', '67'],
              answer: '57',
              hint: null
            },
            {
              engine: 'MULTIPLE_CHOICE',
              id: 'ma-l2-g3-2',
              prompt: '74 - 22 =',
              choices: ['52', '62', '42'],
              answer: '52',
              hint: null
            },
            {
              engine: 'MULTIPLE_CHOICE',
              id: 'ma-l2-g3-3',
              prompt: '18 + 40 =',
              choices: ['48', '58', '68'],
              answer: '58',
              hint: null
            }
          ]
        },
        {
          name: 'Word Problem Adventure',
          engine: 'MULTIPLE_CHOICE',
          id: 'ma-l2-g4',
          items: [
            {
              engine: 'MULTIPLE_CHOICE',
              id: 'ma-l2-g4-1',
              prompt: 'Ava has 32 stickers. Her friend gives her 16 more. How many stickers does Ava have now?',
              choices: ['48'],
              answer: '48',
              hint: null
            },
            {
              engine: 'MULTIPLE_CHOICE',
              id: 'ma-l2-g4-2',
              prompt: 'There are 63 birds in a park. 21 fly away. How many birds are left?',
              choices: ['42'],
              answer: '42',
              hint: null
            },
            {
              engine: 'MULTIPLE_CHOICE',
              id: 'ma-l2-g4-3',
              prompt: 'A class has 24 red pencils and 35 blue pencils. How many pencils are there in all?',
              choices: ['59'],
              answer: '59',
              hint: null
            }
          ]
        }
      ],
      challenge: {
        prompt: 'Noah has 55 toy blocks. He gives 18 blocks to his cousin.\nHow many blocks does Noah have left?',
        accept: ['37'],
        hint: '55 - 10 = 45\n45 - 8 = 37'
      }
    }
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = LESSONS;
  root.G2PackMath = LESSONS;
})(typeof window !== 'undefined' ? window : this);
