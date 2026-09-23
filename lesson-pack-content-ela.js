/* English — Grade 2 Interactive Lesson Pack (transcribed verbatim) */
(function (root) {
  'use strict';

  var LESSONS = [
    {
      subject: 'English',
      lesson_id: 'en-l1',
      grade: 2,
      title: 'Characters, Setting, and Events',
      objective: 'Students will identify:\ncharacter: who is in the story\nsetting: where and when the story happens\nevents: what happens in the story',
      keyWords: [
        { word: 'character', meaning: 'a person or animal in a story' },
        { word: 'setting', meaning: 'where and when a story happens' },
        { word: 'event', meaning: 'something that happens' },
        { word: 'beginning', meaning: 'the first part' },
        { word: 'middle', meaning: 'the part after the beginning' },
        { word: 'ending', meaning: 'the last part' }
      ],
      read: {
        title: 'Maya and the Lost Red Ball',
        paragraphs: [
          'Maya went to the park with her little brother, Leo.',
          'The sun was bright, and birds were singing in the trees.',
          'Maya brought a red ball. She and Leo tossed it back and forth. Then Leo threw the ball too far. It rolled under a green bench.',
          '“Where did it go?” Leo asked.',
          'Maya looked near the slide. She looked beside a tree. Then she saw something red under the bench.',
          '“There it is!” Maya said.',
          'She picked up the ball and gave it to Leo. They laughed and went back to playing.'
        ],
        tts: true
      },
      thinkAbout: [
        'Who are the characters?',
        'Where are Maya and Leo?',
        'What problem happens?',
        'How is the problem solved?'
      ],
      visual: {
        svg: '<svg viewBox="0 0 800 330" width="100%" role="img" aria-label="A park scene showing Maya and Leo, a red ball, a green bench, a tree, and a slide">\n  <rect width="800" height="330" fill="#eef8ff"/>\n  <circle cx="700" cy="55" r="34" fill="#ffd95a"/>\n  <rect y="245" width="800" height="85" fill="#bfe3a0"/>\n  <rect x="520" y="150" width="160" height="18" rx="6" fill="#6d8f48"/>\n  <rect x="535" y="168" width="12" height="55" fill="#6d8f48"/>\n  <rect x="650" y="168" width="12" height="55" fill="#6d8f48"/>\n  <circle cx="600" cy="230" r="16" fill="#e74c3c"/>\n  <rect x="95" y="95" width="28" height="150" fill="#8b5a2b"/>\n  <circle cx="108" cy="76" r="70" fill="#69b85b"/>\n  <path d="M330 235 L415 125 L445 235 Z" fill="#6cb8e8"/>\n  <circle cx="250" cy="185" r="25" fill="#f2b59c"/>\n  <rect x="230" y="210" width="40" height="65" rx="10" fill="#7cb9e8"/>\n  <circle cx="310" cy="195" r="22" fill="#f2b59c"/>\n  <rect x="292" y="216" width="36" height="58" rx="10" fill="#f2c85b"/>\n  <text x="210" y="305" font-size="22">Maya</text>\n  <text x="290" y="305" font-size="22">Leo</text>\n  <text x="555" y="135" font-size="22">bench</text>\n</svg>',
        alt: 'A park scene showing Maya and Leo, a red ball, a green bench, a tree, and a slide'
      },
      // Authored, not the teacher's. The Grade 2 pack names a Warm-up as step 1
      // and asks for two "very easy questions" but writes none for any lesson.
      // These use only this lesson's own material. Marked `authored: true`.
      warmup: [
        {
          id: 'en-l1-w1',
          authored: true,
          prompt: 'Where do children like to play?',
          choices: ['In a park', 'In a refrigerator', 'Under a car'],
          answer: 'In a park',
          hint: 'Think about a place with grass and trees.'
        },
        {
          id: 'en-l1-w2',
          authored: true,
          engine: 'TRUE_FALSE',
          prompt: 'A story happens in a place, like a park or a house.',
          answer: true,
          hint: 'Every story has a place where it happens.'
        }
      ],
      guided: [
        {
          id: 'en-l1-g1',
          prompt: 'Who are the characters?',
          choices: ['Maya and Leo', 'the bench and the tree', 'the park'],
          answer: 'Maya and Leo',
          hint: 'Characters are people or animals in a story.'
        },
        {
          id: 'en-l1-g2',
          prompt: 'What is the setting?',
          choices: ['a classroom', 'a park', 'a store'],
          answer: 'a park',
          hint: null
        }
      ],
      games: [
        {
          name: 'Drag the Story Parts',
          engine: 'DRAG_DROP',
          id: 'en-l1-p1',
          instruction: 'Drag each card into the correct box.',
          boxes: ['Character', 'Setting', 'Event'],
          cards: [
            { text: 'Maya', box: 'Character' },
            { text: 'Leo', box: 'Character' },
            { text: 'the park', box: 'Setting' },
            { text: 'a sunny day', box: 'Setting' },
            { text: 'the ball rolls under the bench', box: 'Event' },
            { text: 'Maya finds the ball', box: 'Event' }
          ]
        },
        {
          name: 'Put the Story in Order',
          engine: 'SEQUENCE',
          id: 'en-l1-p2',
          instruction: 'Put these events in order:',
          items: [
            'Maya and Leo toss the ball.',
            'The ball rolls under a bench.',
            'Maya looks for the ball.',
            'Maya finds the red ball.'
          ]
        },
        {
          name: 'Fill in the Blank',
          engine: 'FILL_BLANK',
          id: 'en-l1-p3',
          mode: 'type',
          before: 'Maya and Leo went to the ',
          after: '.',
          answer: 'park',
          hint: null
        },
        {
          name: 'Fill in the Blank',
          engine: 'FILL_BLANK',
          id: 'en-l1-p4',
          mode: 'type',
          before: 'The ball was ',
          after: '.',
          answer: 'red',
          hint: null
        },
        {
          name: 'Fill in the Blank',
          engine: 'FILL_BLANK',
          id: 'en-l1-p5',
          mode: 'type',
          before: 'The ball rolled under a ',
          after: '.',
          answer: 'bench',
          hint: null
        },
        {
          name: 'Fill in the Blank',
          engine: 'FILL_BLANK',
          id: 'en-l1-p6',
          mode: 'type',
          before: 'Maya ',
          after: ' the ball.',
          answer: 'found',
          hint: null
        },
        {
          name: 'Listen and Choose',
          engine: 'AUDIO_CHOICE',
          id: 'en-l1-p7',
          say: 'Who found the ball?',
          choices: ['Leo', 'Maya', 'the bird'],
          answer: 'Maya',
          hint: null
        }
      ],
      challenge: {
        prompt: 'Why did Maya look around the park?',
        accept: [
          'She wanted to find the lost ball.',
          'The ball was lost.',
          'She was looking for the red ball.'
        ],
        hint: null
      }
    },
    {
      subject: 'English',
      lesson_id: 'en-l2',
      grade: 2,
      title: 'Main Idea and Key Details',
      objective: 'Students will find:\nthe main idea\nimportant details that support the main idea',
      keyWords: [
        { word: 'main idea', meaning: 'what the text is mostly about' },
        { word: 'detail', meaning: 'a small fact that helps explain the main idea' },
        { word: 'fact', meaning: 'something that is true' },
        { word: 'support', meaning: 'to give helpful information' }
      ],
      read: {
        title: 'Why Bees Are Helpful',
        paragraphs: [
          'Bees are small insects, but they do an important job.',
          'Bees fly from flower to flower. As they move, tiny pieces of pollen stick to their bodies. Bees carry the pollen to other flowers. This helps many plants make seeds and fruit.',
          'Bees also collect nectar from flowers. They take the nectar back to their hive. There, bees use it to make honey.',
          'Many plants and people depend on bees. Bees help flowers, fruits, and vegetables grow.'
        ],
        tts: true
      },
      thinkAbout: [],
      visual: {
        svg: '<svg viewBox="0 0 800 330" width="100%" role="img" aria-label="A bee flying between flowers carrying pollen">\n  <rect width="800" height="330" fill="#f7fbff"/>\n  <rect y="255" width="800" height="75" fill="#bfe6a8"/>\n  <g transform="translate(150,175)">\n    <circle cx="0" cy="0" r="36" fill="#ffd84d"/>\n    <circle cx="-22" cy="0" r="16" fill="#5b3a29"/>\n    <circle cx="22" cy="0" r="16" fill="#5b3a29"/>\n    <ellipse cx="-10" cy="-37" rx="30" ry="18" fill="#d8f1ff"/>\n    <ellipse cx="23" cy="-37" rx="30" ry="18" fill="#d8f1ff"/>\n  </g>\n  <g transform="translate(470,205)">\n    <circle r="35" fill="#f7c44f"/>\n    <circle cx="0" cy="-42" r="26" fill="#e76886"/>\n    <circle cx="40" cy="-10" r="26" fill="#e76886"/>\n    <circle cx="25" cy="35" r="26" fill="#e76886"/>\n    <circle cx="-25" cy="35" r="26" fill="#e76886"/>\n    <circle cx="-40" cy="-10" r="26" fill="#e76886"/>\n    <rect x="-6" y="38" width="12" height="65" fill="#57934d"/>\n  </g>\n  <circle cx="205" cy="194" r="6" fill="#f2a93b"/>\n  <circle cx="225" cy="205" r="6" fill="#f2a93b"/>\n  <circle cx="248" cy="213" r="6" fill="#f2a93b"/>\n  <path d="M230 185 Q340 110 430 180" fill="none" stroke="#666" stroke-width="3" stroke-dasharray="8 8"/>\n  <text x="75" y="80" font-size="28">Bee</text>\n  <text x="450" y="80" font-size="28">Flower</text>\n</svg>',
        alt: 'A bee flying between flowers carrying pollen'
      },
      // Authored, not the teacher's — see the note on en-l1.
      warmup: [
        {
          id: 'en-l2-w1',
          authored: true,
          prompt: 'What do bees make?',
          choices: ['Honey', 'Milk', 'Bread'],
          answer: 'Honey',
          hint: 'Think of something sweet and sticky.'
        },
        {
          id: 'en-l2-w2',
          authored: true,
          engine: 'TRUE_FALSE',
          prompt: 'Bees visit flowers.',
          answer: true,
          hint: 'Think about where you see bees in the summer.'
        }
      ],
      guided: [
        {
          id: 'en-l2-g1',
          prompt: 'Find the Main Idea\nWhich sentence tells what the whole passage is mostly about?',
          choices: [
            'Honey is sweet.',
            'Bees are helpful because they help plants grow.',
            'Bees are small.'
          ],
          answer: 'Bees are helpful because they help plants grow.',
          hint: null
        },
        {
          id: 'en-l2-g2',
          prompt: 'Find the Details\nWhich facts support the main idea?',
          choices: [
            'Bees carry pollen.',
            'Bees help plants make seeds and fruit.',
            'Bees collect nectar.',
            'Bees can fly.'
          ],
          answer: [
            'Bees carry pollen.',
            'Bees help plants make seeds and fruit.',
            'Bees collect nectar.'
          ],
          hint: null
        }
      ],
      games: [
        {
          name: 'Main Idea Magnet',
          engine: 'DRAG_DROP',
          id: 'en-l2-p1',
          instruction: 'Drag only the supporting details to the magnet:',
          boxes: ['Bees help plants.'],
          cards: [
            { text: 'Bees carry pollen.', box: 'Bees help plants.' },
            { text: 'Bees help plants make fruit.', box: 'Bees help plants.' },
            { text: 'Bees have six legs.', box: null },
            { text: 'Bees fly from flower to flower.', box: 'Bees help plants.' },
            { text: 'A dog can bark.', box: null }
          ]
        },
        {
          name: 'Detail or Not?',
          engine: 'TRUE_FALSE',
          id: 'en-l2-p2',
          statement: 'Does this detail help explain why bees are helpful?\nBees move pollen between flowers.',
          answer: true,
          answerLabel: 'Yes',
          hint: null
        },
        {
          name: 'Detail or Not?',
          engine: 'TRUE_FALSE',
          id: 'en-l2-p3',
          statement: 'Does this detail help explain why bees are helpful?\nBees have wings.',
          answer: false,
          answerLabel: 'Not enough by itself',
          hint: null
        },
        {
          name: 'Detail or Not?',
          engine: 'TRUE_FALSE',
          id: 'en-l2-p4',
          statement: 'Does this detail help explain why bees are helpful?\nBees help fruit grow.',
          answer: true,
          answerLabel: 'Yes',
          hint: null
        },
        {
          name: 'Detail or Not?',
          engine: 'TRUE_FALSE',
          id: 'en-l2-p5',
          statement: 'Does this detail help explain why bees are helpful?\nBees make honey.',
          answer: true,
          answerLabel: 'Yes',
          hint: null
        },
        {
          name: 'Detail or Not?',
          engine: 'TRUE_FALSE',
          id: 'en-l2-p6',
          statement: 'Does this detail help explain why bees are helpful?\nFish swim in water.',
          answer: false,
          answerLabel: 'No',
          hint: null
        },
        {
          name: 'Fill the Missing Word',
          engine: 'FILL_BLANK',
          id: 'en-l2-p7',
          mode: 'bank',
          bank: ['pollen', 'nectar', 'fruit', 'hive'],
          before: 'Bees carry ',
          after: ' from flower to flower.',
          answer: 'pollen',
          hint: null
        },
        {
          name: 'Fill the Missing Word',
          engine: 'FILL_BLANK',
          id: 'en-l2-p8',
          mode: 'bank',
          bank: ['pollen', 'nectar', 'fruit', 'hive'],
          before: 'Bees collect ',
          after: ' from flowers.',
          answer: 'nectar',
          hint: null
        },
        {
          name: 'Fill the Missing Word',
          engine: 'FILL_BLANK',
          id: 'en-l2-p9',
          mode: 'bank',
          bank: ['pollen', 'nectar', 'fruit', 'hive'],
          before: 'Bees take nectar back to the ',
          after: '.',
          answer: 'hive',
          hint: null
        },
        {
          name: 'Fill the Missing Word',
          engine: 'FILL_BLANK',
          id: 'en-l2-p10',
          mode: 'bank',
          bank: ['pollen', 'nectar', 'fruit', 'hive'],
          before: 'Bees help some plants make ',
          after: '.',
          answer: 'fruit',
          hint: null
        },
        {
          name: 'Main Idea Detective',
          engine: 'MULTIPLE_CHOICE',
          id: 'en-l2-p11',
          prompt: 'Penguins are birds that live in cold places. Their thick feathers help keep them warm. They can swim very well.\nMain idea:',
          choices: [
            'Penguins are birds that can live in cold places.',
            'Penguins like pizza.',
            'All birds live in snow.'
          ],
          answer: 'Penguins are birds that can live in cold places.',
          hint: null
        }
      ],
      challenge: {
        prompt: 'Tell one detail from the bee passage that supports the main idea.',
        accept: [
          'Bees carry pollen.',
          'Bees help plants make seeds.',
          'Bees help fruit grow.',
          'Bees collect nectar and make honey.'
        ],
        hint: null
      }
    }
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = LESSONS;
  root.G2PackEla = LESSONS;
})(typeof window !== 'undefined' ? window : this);
