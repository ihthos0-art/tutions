/* Science — Grade 7 Interactive Lesson Pack (transcribed verbatim).

   Source: the teacher's Grade 7 pack. New York uses a Grade 6–8 middle-school
   science band, and the pack cites MS-LS1-6 (photosynthesis), MS-LS2-3 and
   MS-LS2-4 (matter and energy in organisms, ecosystems, energy flow).

   Reference URL the teacher cited:
     https://www.nysed.gov/standards-instruction/science

   Science L1 Game 2 is the pack's "Build the Process", whose correct answer is
   the equation itself. It is kept as a DRAG_DROP into the equation's two sides
   — the words are the teacher's, and the engine named is the teacher's.
*/
(function (root) {
  'use strict';

  var LESSONS = [
    {
      subject: 'Science',
      lesson_id: 'sc-l1',
      grade: 7,
      title: 'Photosynthesis',
      objective: 'Students will explain how plants use light to make food.',
      keyWords: [
        { word: 'photosynthesis', meaning: 'how plants use light to make food' },
        { word: 'sunlight', meaning: 'light from the Sun' },
        { word: 'carbon dioxide', meaning: 'a gas in the air' },
        { word: 'oxygen', meaning: 'a gas many living things need' },
        { word: 'glucose', meaning: 'a simple sugar made by plants' },
        { word: 'chlorophyll', meaning: 'green material in leaves that catches light' }
      ],
      read: {
        title: 'Learn',
        tts: true,
        paragraphs: [
          'Plants need energy.',
          'Plants get light energy from the Sun.',
          'A plant uses sunlight, water, and carbon dioxide.',
          'The plant makes glucose and oxygen.',
          'Glucose is sugar.',
          'The plant uses glucose for energy and growth.',
          'Easy model:',
          'carbon dioxide + water + light → glucose + oxygen'
        ]
      },
      visual: {
        svg: '<svg viewBox="0 0 900 450" width="100%" role="img" aria-label="Photosynthesis diagram showing sunlight, carbon dioxide, and water entering a plant and glucose and oxygen coming out">\n<rect width="900" height="450" fill="#eef9ff"/>\n<circle cx="100" cy="80" r="48" fill="#ffd45e"/>\n<text x="45" y="150" font-size="24">sunlight</text>\n<rect y="350" width="900" height="100" fill="#ad7f58"/>\n<line x1="450" y1="210" x2="450" y2="370" stroke="#4e9446" stroke-width="22"/>\n<ellipse cx="385" cy="265" rx="75" ry="35" fill="#66b85c" transform="rotate(-22 385 265)"/>\n<ellipse cx="515" cy="280" rx="75" ry="35" fill="#66b85c" transform="rotate(22 515 280)"/>\n<circle cx="450" cy="190" r="65" fill="#67b75f"/>\n<text x="35" y="250" font-size="24">CO₂ from air →</text>\n<text x="260" y="425" font-size="24">water → roots</text>\n<text x="625" y="210" font-size="24">oxygen → air</text>\n<text x="620" y="290" font-size="24">glucose made</text>\n</svg>',
        alt: 'Photosynthesis diagram showing sunlight, carbon dioxide, and water entering a plant and glucose and oxygen coming out'
      },
      // Authored, not the teacher's. The pack names a Warm-Up and a Try With
      // Help but writes neither for this lesson. Both use only this lesson's
      // own material. Marked `authored: true`.
      warmup: [
        {
          id: 'sc-l1-w1',
          authored: true,
          prompt: 'What does a plant need to grow?',
          choices: ['Light and water', 'Only darkness', 'Nothing at all'],
          answer: 'Light and water',
          hint: 'Think about what you give a plant at home.'
        },
        {
          id: 'sc-l1-w2',
          authored: true,
          engine: 'TRUE_FALSE',
          prompt: 'Green leaves can catch light from the Sun.',
          answer: true,
          hint: 'Think about why leaves are green and flat.'
        }
      ],
      guided: [
        {
          id: 'sc-l1-t1',
          authored: true,
          prompt: 'What does a plant take IN to make its food?',
          choices: [
            'Sunlight, water, and carbon dioxide',
            'Oxygen and glucose',
            'Only soil'
          ],
          answer: 'Sunlight, water, and carbon dioxide',
          hint: 'Look at the arrows pointing towards the plant in the picture.'
        },
        {
          id: 'sc-l1-t2',
          authored: true,
          prompt: 'What does a plant give OUT?',
          choices: ['Oxygen and glucose', 'Water and soil', 'Sunlight'],
          answer: 'Oxygen and glucose',
          hint: 'The arrows pointing away from the plant show what leaves it.'
        }
      ],
      games: [
        {
          name: 'In or Out?',
          engine: 'SORT',
          id: 'sc-l1-p1',
          instruction: 'Sort each thing. Does it go into the plant or come out of it?',
          bins: ['Goes In', 'Comes Out'],
          cards: [
            { text: 'sunlight', bin: 'Goes In' },
            { text: 'water', bin: 'Goes In' },
            { text: 'carbon dioxide', bin: 'Goes In' },
            { text: 'glucose', bin: 'Comes Out' },
            { text: 'oxygen', bin: 'Comes Out' }
          ]
        },
        {
          name: 'Build the Process',
          engine: 'DRAG_DROP',
          id: 'sc-l1-p2',
          instruction: 'Build the process: carbon dioxide + water + light → glucose + oxygen. Put each thing on the correct side.',
          boxes: ['Goes In', 'Comes Out'],
          cards: [
            { text: 'carbon dioxide', box: 'Goes In' },
            { text: 'water', box: 'Goes In' },
            { text: 'light', box: 'Goes In' },
            { text: 'glucose', box: 'Comes Out' },
            { text: 'oxygen', box: 'Comes Out' }
          ]
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'sc-l1-p3',
          mode: 'type',
          instruction: 'Write one word in each blank.',
          items: [
            { before: 'Plants get light energy from', after: '.', answer: 'sunlight', hint: 'The light comes from the Sun.' },
            { before: 'Roots take in', after: '.', answer: 'water', hint: 'The plant takes this in through its roots.' },
            { before: 'Plants make', after: '.', answer: 'glucose', hint: 'It is a simple sugar.' },
            { before: 'Plants release', after: '.', answer: 'oxygen', hint: 'It is a gas many living things need.' }
          ]
        },
        {
          name: 'True or False',
          engine: 'TRUE_FALSE',
          id: 'sc-l1-p4',
          instruction: 'Read each sentence. Is it true?',
          items: [
            { prompt: 'Plants use light.', answer: true, hint: 'Plants get light energy from the Sun.' },
            { prompt: 'Plants make glucose.', answer: true, hint: 'Glucose is the sugar a plant makes.' },
            { prompt: 'Plants get all food by eating animals.', answer: false, hint: 'Plants make their own food.' },
            { prompt: 'Water is used in photosynthesis.', answer: true, hint: 'Look at the easy model.' }
          ]
        }
      ],
      challenge: {
        id: 'sc-l1-c1',
        prompt: 'Why is sunlight important?',
        accept: [
          'Sunlight gives the plant energy to make food.',
          'It gives the plant energy to make food.',
          'Sunlight gives the plant energy.',
          'Plants use sunlight to make food.'
        ],
        hint: 'Think about what the plant uses sunlight for.'
      }
    },
    {
      subject: 'Science',
      lesson_id: 'sc-l2',
      grade: 7,
      title: 'Food Chains and Ecosystems',
      objective: 'Students will understand:\nproducer\nconsumer\ndecomposer\nfood chain\nenergy flow',
      keyWords: [
        { word: 'ecosystem', meaning: 'living and nonliving things in one place' },
        { word: 'producer', meaning: 'makes its own food' },
        { word: 'consumer', meaning: 'eats other organisms' },
        { word: 'decomposer', meaning: 'breaks down dead material' },
        { word: 'food chain', meaning: 'shows how energy moves' },
        { word: 'energy', meaning: 'what living things need to live and grow' }
      ],
      read: {
        title: 'Learn',
        tts: true,
        paragraphs: [
          'Energy in many ecosystems starts with the Sun.',
          'Plants use sunlight to make food.',
          'Plants are producers.',
          'Animals eat plants or other animals.',
          'Animals are consumers.',
          'Fungi and many bacteria break down dead material.',
          'They are decomposers.',
          'Food chain:',
          'Sun → grass → rabbit → fox'
        ]
      },
      visual: {
        svg: '<svg viewBox="0 0 950 300" width="100%" role="img" aria-label="Food chain from the Sun to grass to a rabbit to a fox">\n<rect width="950" height="300" fill="#f8fcff"/>\n<circle cx="95" cy="135" r="52" fill="#ffd45a"/>\n<text x="65" y="215" font-size="25">Sun</text>\n<text x="275" y="145" font-size="34">🌱</text>\n<text x="260" y="215" font-size="25">grass</text>\n<text x="505" y="145" font-size="52">🐇</text>\n<text x="500" y="215" font-size="25">rabbit</text>\n<text x="755" y="145" font-size="52">🦊</text>\n<text x="760" y="215" font-size="25">fox</text>\n<text x="180" y="145" font-size="38">→</text>\n<text x="390" y="145" font-size="38">→</text>\n<text x="650" y="145" font-size="38">→</text>\n</svg>',
        alt: 'Food chain from the Sun to grass to a rabbit to a fox'
      },
      // Authored, not the teacher's — see the note on sc-l1.
      warmup: [
        {
          id: 'sc-l2-w1',
          authored: true,
          prompt: 'Which of these is an animal?',
          choices: ['A rabbit', 'A rock', 'A river'],
          answer: 'A rabbit',
          hint: 'An animal is a living thing that moves and eats.'
        },
        {
          id: 'sc-l2-w2',
          authored: true,
          prompt: 'Where does the energy in most food chains start?',
          choices: ['The Sun', 'The soil', 'The wind'],
          answer: 'The Sun',
          hint: 'Look at the first thing in the picture.'
        }
      ],
      guided: [
        {
          id: 'sc-l2-t1',
          authored: true,
          prompt: 'In the chain Sun → grass → rabbit → fox, which living thing is the producer?',
          choices: ['Grass', 'Rabbit', 'Fox'],
          answer: 'Grass',
          hint: 'A producer makes its own food instead of eating other living things.'
        },
        {
          id: 'sc-l2-t2',
          authored: true,
          prompt: 'Which living thing in that chain is the consumer?',
          choices: ['Rabbit', 'Grass', 'Sun'],
          answer: 'Rabbit',
          hint: 'A consumer eats other living things. The Sun is not a living thing.'
        }
      ],
      games: [
        {
          name: 'Producer or Consumer?',
          engine: 'SORT',
          id: 'sc-l2-p1',
          instruction: 'Sort each living thing.',
          bins: ['Producer', 'Consumer'],
          cards: [
            { text: 'grass', bin: 'Producer' },
            { text: 'tree', bin: 'Producer' },
            { text: 'algae', bin: 'Producer' },
            { text: 'rabbit', bin: 'Consumer' },
            { text: 'fox', bin: 'Consumer' },
            { text: 'deer', bin: 'Consumer' },
            { text: 'hawk', bin: 'Consumer' }
          ]
        },
        {
          name: 'Put in Order',
          engine: 'SEQUENCE',
          id: 'sc-l2-p2',
          instruction: 'Put the food chain in order. Start with the Sun.',
          items: ['Sun', 'grass', 'rabbit', 'fox']
        },
        {
          name: 'Match',
          engine: 'MATCH_PAIRS',
          id: 'sc-l2-p3',
          instruction: 'Match each word to its meaning.',
          pairs: [
            ['producer', 'makes its own food'],
            ['consumer', 'eats other organisms'],
            ['decomposer', 'breaks down dead material'],
            ['ecosystem', 'living and nonliving things in one place']
          ]
        },
        {
          name: 'What Happens?',
          engine: 'MULTIPLE_CHOICE',
          id: 'sc-l2-p4',
          prompt: 'If there is much less grass, what may happen to rabbits?',
          choices: [
            'Rabbit numbers may go down.',
            'Rabbits become plants.',
            'Nothing changes.'
          ],
          answer: 'Rabbit numbers may go down.',
          hint: 'Think about where the rabbit gets its energy.'
        }
      ],
      challenge: {
        id: 'sc-l2-c1',
        prompt: 'Sun → plant → mouse → owl\nType the producer. Then type the animal that eats the mouse.',
        accept: ['plant owl', 'plant, owl', 'plant; owl', 'plant and owl'],
        hint: 'The producer makes its own food. The animal that eats the mouse is next in the chain.'
      }
    }
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = LESSONS;
  root.G7PackScience = LESSONS;
})(typeof window !== 'undefined' ? window : this);
