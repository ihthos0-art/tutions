/* Science — Grade 2 Interactive Lesson Pack (transcribed verbatim) */
(function (root) {
  'use strict';

  var LESSONS = [
    {
      subject: 'Science',
      lesson_id: 'sc-l1',
      grade: 2,
      title: 'What Plants Need to Grow',
      objective: 'Students will explain that plants need:\nwater\nlight\nair\nspace',
      keyWords: [
        { word: 'plant', meaning: 'a living thing that grows' },
        { word: 'root', meaning: 'plant part that takes in water' },
        { word: 'stem', meaning: 'plant part that holds the plant up' },
        { word: 'leaf', meaning: 'plant part that uses light' },
        { word: 'flower', meaning: 'plant part that can help make seeds' },
        { word: 'sunlight', meaning: 'light from the Sun' }
      ],
      read: {
        title: 'What Does a Plant Need?',
        paragraphs: [
          'Plants are living things. Like all living things, they need certain things to grow.',
          'A plant needs water. Its roots take in water from the soil.',
          'A plant also needs light. Most plants get light from the Sun. Leaves use light to help the plant grow.',
          'Plants need air, too. They also need enough space for their roots and leaves.',
          'If a plant does not get what it needs, it may grow slowly or become weak.'
        ],
        tts: true
      },
      thinkAbout: [
        'Imagine two plants.',
        'Plant A gets water and sunlight.',
        'Plant B gets sunlight but no water.',
        'What do you predict will happen?'
      ],
      visual: {
        svg: "<svg viewBox=\"0 0 800 430\" width=\"100%\" role=\"img\" aria-label=\"Plant diagram showing flower, leaves, stem, roots, sunlight, water, and air\">\n  <rect width=\"800\" height=\"430\" fill=\"#eef9ff\"/>\n  <circle cx=\"675\" cy=\"70\" r=\"42\" fill=\"#ffd85c\"/>\n  <line x1=\"625\" y1=\"110\" x2=\"550\" y2=\"170\" stroke=\"#f2ba32\" stroke-width=\"5\"/>\n  <rect y=\"315\" width=\"800\" height=\"115\" fill=\"#b98258\"/>\n  <line x1=\"390\" y1=\"150\" x2=\"390\" y2=\"340\" stroke=\"#4e8f45\" stroke-width=\"18\"/>\n  <ellipse cx=\"345\" cy=\"220\" rx=\"48\" ry=\"25\" fill=\"#65b85c\" transform=\"rotate(-25 345 220)\"/>\n  <ellipse cx=\"440\" cy=\"245\" rx=\"48\" ry=\"25\" fill=\"#65b85c\" transform=\"rotate(25 440 245)\"/>\n  <circle cx=\"390\" cy=\"135\" r=\"34\" fill=\"#f0c94f\"/>\n  <circle cx=\"390\" cy=\"93\" r=\"26\" fill=\"#e87c95\"/>\n  <circle cx=\"430\" cy=\"120\" r=\"26\" fill=\"#e87c95\"/>\n  <circle cx=\"415\" cy=\"160\" r=\"26\" fill=\"#e87c95\"/>\n  <circle cx=\"365\" cy=\"160\" r=\"26\" fill=\"#e87c95\"/>\n  <circle cx=\"350\" cy=\"120\" r=\"26\" fill=\"#e87c95\"/>\n  <path d=\"M390 335 C350 360 340 390 315 415\" fill=\"none\" stroke=\"#7a4a32\" stroke-width=\"8\"/>\n  <path d=\"M390 335 C430 360 450 390 475 415\" fill=\"none\" stroke=\"#7a4a32\" stroke-width=\"8\"/>\n  <path d=\"M390 345 C380 380 380 400 380 425\" fill=\"none\" stroke=\"#7a4a32\" stroke-width=\"8\"/>\n  <g fill=\"#5aa9e6\">\n    <path d=\"M160 160 C140 195 140 210 160 210 C180 210 180 195 160 160Z\"/>\n    <path d=\"M210 190 C190 225 190 240 210 240 C230 240 230 225 210 190Z\"/>\n  </g>\n  <text x=\"610\" y=\"145\" font-size=\"25\">sunlight</text>\n  <text x=\"105\" y=\"140\" font-size=\"25\">water</text>\n  <text x=\"450\" y=\"115\" font-size=\"24\">flower</text>\n  <text x=\"475\" y=\"235\" font-size=\"24\">leaf</text>\n  <text x=\"405\" y=\"300\" font-size=\"24\">stem</text>\n  <text x=\"495\" y=\"395\" font-size=\"24\">roots</text>\n</svg>",
        alt: 'Plant diagram showing flower, leaves, stem, roots, sunlight, water, and air'
      },
      // Authored, not the teacher's — see the note on the English file.
      warmup: [
        {
          id: 'sc-l1-w1',
          authored: true,
          prompt: 'What do you give a plant to help it grow?',
          choices: ['Water', 'Sand', 'Paper'],
          answer: 'Water',
          hint: 'Think about what you pour on a plant.'
        },
        {
          id: 'sc-l1-w2',
          authored: true,
          engine: 'TRUE_FALSE',
          prompt: 'Plants are living things.',
          answer: true,
          hint: 'Living things grow and need food and water.'
        }
      ],
      guided: [
        {
          id: 'sc-l1-g1',
          authored: true,
          prompt: 'Which part of a plant takes in water from the soil?',
          choices: ['The roots', 'The flower', 'The stem'],
          answer: 'The roots',
          hint: 'Look at the picture. They are the part under the ground.'
        },
        {
          id: 'sc-l1-g2',
          authored: true,
          prompt: 'Most plants get their light from where?',
          choices: ['The Sun', 'The soil', 'A cup of water'],
          answer: 'The Sun',
          hint: 'Where does daylight come from each morning?'
        }
      ],
      games: [
        {
          name: 'Feed the Plant',
          engine: 'DRAG_DROP',
          id: 'sc-l1-p1',
          instruction: 'Drag what the plant needs into the garden:',
          boxes: ['garden'],
          cards: [
            { text: 'water', box: 'garden' },
            { text: 'sunlight', box: 'garden' },
            { text: 'air', box: 'garden' },
            { text: 'space', box: 'garden' },
            { text: 'toy car', box: null },
            { text: 'candy', box: null },
            { text: 'shoe', box: null }
          ]
        },
        {
          name: 'Label the Plant',
          engine: 'TAP_IMAGE',
          id: 'sc-l1-p2',
          prompt: 'Label the Plant',
          svg: "<svg viewBox=\"0 0 800 430\" width=\"100%\" role=\"img\" aria-label=\"Plant diagram showing flower, leaves, stem, roots, sunlight, water, and air\">\n  <rect width=\"800\" height=\"430\" fill=\"#eef9ff\"/>\n  <circle cx=\"675\" cy=\"70\" r=\"42\" fill=\"#ffd85c\"/>\n  <line x1=\"625\" y1=\"110\" x2=\"550\" y2=\"170\" stroke=\"#f2ba32\" stroke-width=\"5\"/>\n  <rect y=\"315\" width=\"800\" height=\"115\" fill=\"#b98258\"/>\n  <line x1=\"390\" y1=\"150\" x2=\"390\" y2=\"340\" stroke=\"#4e8f45\" stroke-width=\"18\"/>\n  <ellipse cx=\"345\" cy=\"220\" rx=\"48\" ry=\"25\" fill=\"#65b85c\" transform=\"rotate(-25 345 220)\"/>\n  <ellipse cx=\"440\" cy=\"245\" rx=\"48\" ry=\"25\" fill=\"#65b85c\" transform=\"rotate(25 440 245)\"/>\n  <circle cx=\"390\" cy=\"135\" r=\"34\" fill=\"#f0c94f\"/>\n  <circle cx=\"390\" cy=\"93\" r=\"26\" fill=\"#e87c95\"/>\n  <circle cx=\"430\" cy=\"120\" r=\"26\" fill=\"#e87c95\"/>\n  <circle cx=\"415\" cy=\"160\" r=\"26\" fill=\"#e87c95\"/>\n  <circle cx=\"365\" cy=\"160\" r=\"26\" fill=\"#e87c95\"/>\n  <circle cx=\"350\" cy=\"120\" r=\"26\" fill=\"#e87c95\"/>\n  <path d=\"M390 335 C350 360 340 390 315 415\" fill=\"none\" stroke=\"#7a4a32\" stroke-width=\"8\"/>\n  <path d=\"M390 335 C430 360 450 390 475 415\" fill=\"none\" stroke=\"#7a4a32\" stroke-width=\"8\"/>\n  <path d=\"M390 345 C380 380 380 400 380 425\" fill=\"none\" stroke=\"#7a4a32\" stroke-width=\"8\"/>\n  <g fill=\"#5aa9e6\">\n    <path d=\"M160 160 C140 195 140 210 160 210 C180 210 180 195 160 160Z\"/>\n    <path d=\"M210 190 C190 225 190 240 210 240 C230 240 230 225 210 190Z\"/>\n  </g>\n  <text x=\"610\" y=\"145\" font-size=\"25\">sunlight</text>\n  <text x=\"105\" y=\"140\" font-size=\"25\">water</text>\n  <text x=\"450\" y=\"115\" font-size=\"24\">flower</text>\n  <text x=\"475\" y=\"235\" font-size=\"24\">leaf</text>\n  <text x=\"405\" y=\"300\" font-size=\"24\">stem</text>\n  <text x=\"495\" y=\"395\" font-size=\"24\">roots</text>\n</svg>",
          choices: [
            { label: 'roots', correct: true },
            { label: 'stem', correct: false },
            { label: 'leaf', correct: false },
            { label: 'flower', correct: false }
          ]
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'sc-l1-p3',
          mode: 'type',
          before: 'Roots take in ',
          after: '.',
          answer: 'water',
          hint: null
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'sc-l1-p4',
          mode: 'type',
          before: 'Leaves use ',
          after: ' from the Sun.',
          answer: 'light',
          hint: null
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'sc-l1-p5',
          mode: 'type',
          before: 'The ',
          after: ' holds the plant up.',
          answer: 'stem',
          hint: null
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'sc-l1-p6',
          mode: 'type',
          before: 'Plants need ',
          after: ' to grow their roots and leaves.',
          answer: 'space',
          hint: null
        },
        {
          name: 'Plant Experiment',
          engine: 'SORT',
          id: 'sc-l1-p7',
          instruction: 'Sort the cards:',
          bins: ['Helps a plant grow', 'Does not help a plant grow'],
          cards: [
            { text: 'water', bin: 'Helps a plant grow' },
            { text: 'sunlight', bin: 'Helps a plant grow' },
            { text: 'air', bin: 'Helps a plant grow' },
            { text: 'space', bin: 'Helps a plant grow' },
            { text: 'plastic toy', bin: 'Does not help a plant grow' },
            { text: 'television', bin: 'Does not help a plant grow' },
            { text: 'sneaker', bin: 'Does not help a plant grow' },
            { text: 'candy', bin: 'Does not help a plant grow' }
          ]
        }
      ],
      challenge: {
        prompt: 'A plant is by a sunny window. It has air and space, but nobody waters it for many days.\nWhat is missing?',
        accept: ['water'],
        hint: null
      }
    },
    {
      subject: 'Science',
      lesson_id: 'sc-l2',
      grade: 2,
      title: 'Habitats and Living Things',
      objective: 'Students will understand:\na habitat is a place where a living thing lives\nhabitats provide food, water, shelter, and space\ndifferent habitats have different plants and animals',
      keyWords: [
        { word: 'habitat', meaning: 'the place where a living thing lives' },
        { word: 'shelter', meaning: 'a safe place to stay' },
        { word: 'pond', meaning: 'a small body of water' },
        { word: 'forest', meaning: 'a place with many trees' },
        { word: 'ocean', meaning: 'a very large body of salt water' },
        { word: 'survive', meaning: 'to stay alive' }
      ],
      read: {
        title: 'Homes in Nature',
        paragraphs: [
          'Animals and plants live in many different habitats.',
          'A forest has many trees. Birds may build nests in the branches. Squirrels can find nuts and places to hide.',
          'A pond has water and plants growing near the edge. Frogs, fish, insects, and ducks may live there.',
          'The ocean is a saltwater habitat. Fish, sea turtles, crabs, and many other animals live in the ocean.',
          'A good habitat gives living things what they need, such as food, water, shelter, and space.'
        ],
        tts: true
      },
      thinkAbout: [],
      visual: {
        svg: "<svg viewBox=\"0 0 900 380\" width=\"100%\" role=\"img\" aria-label=\"Three habitat panels showing a forest, pond, and ocean\">\n  <rect width=\"900\" height=\"380\" fill=\"#ffffff\"/>\n  <rect x=\"15\" y=\"30\" width=\"270\" height=\"315\" rx=\"18\" fill=\"#eaf6e4\"/>\n  <rect x=\"315\" y=\"30\" width=\"270\" height=\"315\" rx=\"18\" fill=\"#e8f7fb\"/>\n  <rect x=\"615\" y=\"30\" width=\"270\" height=\"315\" rx=\"18\" fill=\"#dff1ff\"/>\n\n<text x=\"105\" y=\"68\" font-size=\"28\">Forest</text>\n<rect x=\"90\" y=\"155\" width=\"24\" height=\"130\" fill=\"#83553a\"/>\n<circle cx=\"102\" cy=\"135\" r=\"72\" fill=\"#64ad59\"/>\n<circle cx=\"190\" cy=\"215\" r=\"25\" fill=\"#a87549\"/>\n<path d=\"M210 210 Q240 170 250 205\" fill=\"none\" stroke=\"#a87549\" stroke-width=\"12\"/>\n\n<text x=\"405\" y=\"68\" font-size=\"28\">Pond</text>\n<ellipse cx=\"450\" cy=\"250\" rx=\"105\" ry=\"48\" fill=\"#71bde5\"/>\n<ellipse cx=\"430\" cy=\"210\" rx=\"35\" ry=\"20\" fill=\"#66b85a\"/>\n<circle cx=\"425\" cy=\"198\" r=\"18\" fill=\"#66b85a\"/>\n<circle cx=\"420\" cy=\"194\" r=\"3\" fill=\"#222\"/>\n<circle cx=\"432\" cy=\"194\" r=\"3\" fill=\"#222\"/>\n\n<text x=\"720\" y=\"68\" font-size=\"28\">Ocean</text>\n<path d=\"M625 230 Q675 205 725 230 T825 230 T885 230 V345 H625Z\" fill=\"#68b9e8\"/>\n<ellipse cx=\"755\" cy=\"245\" rx=\"55\" ry=\"25\" fill=\"#f2b653\"/>\n<polygon points=\"810,245 845,220 845,270\" fill=\"#f2b653\"/>\n<circle cx=\"730\" cy=\"238\" r=\"4\" fill=\"#222\"/>\n</svg>",
        alt: 'Three habitat panels showing a forest, pond, and ocean'
      },
      // Authored, not the teacher's — see the note on the English file.
      warmup: [
        {
          id: 'sc-l2-w1',
          authored: true,
          prompt: 'Where does a fish live?',
          choices: ['In water', 'In a tree', 'In a desert'],
          answer: 'In water',
          hint: 'Fish need water to breathe and to swim.'
        },
        {
          id: 'sc-l2-w2',
          authored: true,
          prompt: 'Which of these is a place with many trees?',
          choices: ['A forest', 'A pond', 'A street'],
          answer: 'A forest',
          hint: 'Look at the first panel in the picture.'
        }
      ],
      guided: [
        {
          id: 'sc-l2-g1',
          authored: true,
          prompt: 'Where do squirrels find nuts and places to hide?',
          choices: ['In a forest', 'In the ocean', 'In a pond'],
          answer: 'In a forest',
          hint: 'Squirrels climb trees. Which habitat has trees?'
        },
        {
          id: 'sc-l2-g2',
          authored: true,
          prompt: 'A good habitat gives living things what they need. Which one is on that list?',
          choices: ['Food, water, shelter, and space', 'Only toys', 'Only water'],
          answer: 'Food, water, shelter, and space',
          hint: 'The last sentence of the reading lists four things.'
        }
      ],
      games: [
        {
          name: 'Match Animal to Habitat',
          engine: 'MATCH_PAIRS',
          id: 'sc-l2-p1',
          instruction: null,
          pairs: [
            ['squirrel', 'forest'],
            ['frog', 'pond'],
            ['fish', 'pond/ocean depending on image'],
            ['sea turtle', 'ocean'],
            ['crab', 'ocean'],
            ['woodpecker', 'forest']
          ]
        },
        {
          name: 'Habitat Sort',
          engine: 'SORT',
          id: 'sc-l2-p2',
          instruction: null,
          bins: ['Forest', 'Pond', 'Ocean'],
          cards: [
            { text: 'tree', bin: 'Forest' },
            { text: 'squirrel', bin: 'Forest' },
            { text: 'bird nest', bin: 'Forest' },
            { text: 'frog', bin: 'Pond' },
            { text: 'lily pad', bin: 'Pond' },
            { text: 'duck', bin: 'Pond' },
            { text: 'sea turtle', bin: 'Ocean' },
            { text: 'crab', bin: 'Ocean' },
            { text: 'coral', bin: 'Ocean' }
          ]
        },
        {
          name: 'What Does a Habitat Give?',
          engine: 'MULTIPLE_CHOICE',
          id: 'sc-l2-p3',
          prompt: 'A habitat can give an animal:',
          choices: [
            'food, water, shelter, and space',
            'video games',
            'homework',
            'pencils'
          ],
          answer: 'food, water, shelter, and space',
          hint: null
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'sc-l2-p4',
          mode: 'type',
          before: 'A place where an animal lives is its ',
          after: '.',
          answer: 'habitat',
          hint: null
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'sc-l2-p5',
          mode: 'type',
          before: 'A forest has many ',
          after: '.',
          answer: 'trees',
          hint: null
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'sc-l2-p6',
          mode: 'type',
          before: 'A pond contains ',
          after: '.',
          answer: 'water',
          hint: null
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'sc-l2-p7',
          mode: 'type',
          before: 'The ocean contains ',
          after: ' water.',
          answer: 'salt',
          hint: null
        }
      ],
      challenge: {
        prompt: 'A frog needs water, insects to eat, plants, and a safe place to hide.\nWhich habitat would probably be best?',
        choices: ['desert', 'pond', 'parking lot'],
        accept: ['pond'],
        hint: null
      }
    }
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = LESSONS;
  root.G2PackScience = LESSONS;
})(typeof window !== 'undefined' ? window : this);
