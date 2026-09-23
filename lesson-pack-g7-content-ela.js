/* English — Grade 7 Interactive Lesson Pack (transcribed verbatim).

   Source: the teacher's Grade 7 pack, "Simple ESL English", New York State
   standards basis 7R1 / 7R2 (citing text evidence, making logical inferences,
   finding central ideas, summarising). The pack's own build rules are honoured
   in the transcription: short sentences, common words, one idea per line, and
   every academic word defined in `keyWords` before it is used.

   Reference URLs the teacher cited:
     https://www.nysed.gov/standards-instruction/english-language-arts

   Two fields beyond the shape the Grade 2 content uses:
     notes          — the pack's own short scaffolds (Sentence Frames, Quick
                      Help, Easy Rule). A note marked `where: 'words'` is a
                      vocabulary scaffold and is rendered by lesson-pack.js in
                      the Words First step, ahead of the reading; the rest are
                      notes about the picture and render in the Look step.
     sentenceFrames — carried inside notes, because that is all they are.

   Two fields are NOT the teacher's, and every item in them is marked
   `authored: true`:
     warmup         — two very easy questions opening the topic. The pack names
                      a Warm-Up as step 1 and writes none for any lesson.
     guided (part)  — the pack writes one Try With Help for this pack (en-l1);
                      the second question here is mine. The other seven lessons
                      had none at all, so all of theirs are mine.
   They use only the lesson's own reading and word list, and they exist so the
   pack's own flow is complete rather than silently short.

   Game engines are named exactly as the pack names them, so a mapping is never
   guessed at here.
*/
(function (root) {
  'use strict';

  var LESSONS = [
    {
      subject: 'English',
      lesson_id: 'en-l1',
      grade: 7,
      title: 'Main Idea and Important Details',
      objective: 'Students will:\nfind the main idea\nfind important details\nmake a short summary',
      keyWords: [
        { word: 'main idea', meaning: 'what the whole text is mostly about' },
        { word: 'detail', meaning: 'a fact that gives more information' },
        { word: 'summary', meaning: 'a short version of the important ideas' },
        { word: 'support', meaning: 'help prove an idea' },
        { word: 'important', meaning: 'something we need to know' }
      ],
      notes: [
        {
          label: 'Sentence frames',
          where: 'words',
          lines: [
            'The main idea is _____.',
            'One important detail is _____.',
            'This detail helps because _____.',
            'In short, the text says _____.'
          ]
        },
        {
          label: 'Quick help',
          lines: [
            'Main idea: Trees help cities in many ways.',
            'Details:',
            'Trees give shade.',
            'Trees help with air.',
            'Roots take in some rainwater.',
            'Trees give animals places to live.'
          ]
        }
      ],
      read: {
        title: 'City Trees',
        tts: true,
        paragraphs: [
          'Trees are important in cities.',
          'Trees give shade on hot days. Shade can make streets and parks feel cooler.',
          'Trees also take in carbon dioxide from the air. They release oxygen.',
          'Tree roots can take in some rainwater. This may help reduce water on streets after rain.',
          'Trees also give birds and insects places to live.',
          'City trees do many jobs. They help people, animals, and the environment.'
        ]
      },
      visual: {
        svg: '<svg viewBox="0 0 900 400" width="100%" role="img" aria-label="A city tree giving shade, taking in rainwater, and giving a bird a home">\n<rect width="900" height="400" fill="#eef8ff"/>\n<rect y="300" width="900" height="100" fill="#d8d8d8"/>\n<rect x="70" y="175" width="150" height="125" fill="#8897a8"/>\n<rect x="690" y="145" width="140" height="155" fill="#7b8da3"/>\n<rect x="435" y="170" width="30" height="150" fill="#80583b"/>\n<circle cx="450" cy="130" r="105" fill="#5faa59"/>\n<circle cx="380" cy="125" r="65" fill="#67b85f"/>\n<circle cx="520" cy="125" r="65" fill="#67b85f"/>\n<ellipse cx="520" cy="125" rx="22" ry="13" fill="#395a7a"/>\n<circle cx="532" cy="121" r="3" fill="white"/>\n<path d="M330 320 Q450 350 570 320" fill="#72b8e8"/>\n<text x="320" y="55" font-size="27">shade</text>\n<text x="560" y="95" font-size="27">bird home</text>\n<text x="315" y="385" font-size="25">roots take in water</text>\n</svg>',
        alt: 'A city tree giving shade, taking in rainwater, and giving a bird a home'
      },
      // Authored, not the teacher's. The pack names a Warm-Up as step 1 and a
      // Try With Help as step 5 but writes neither for this lesson beyond the
      // one guided question below. These use only this lesson's own reading
      // and word list. Every item I wrote is marked `authored: true`.
      warmup: [
        {
          id: 'en-l1-w1',
          authored: true,
          prompt: 'Where do you usually see trees?',
          choices: ['In a park or on a street', 'Inside a refrigerator', 'Under the ocean'],
          answer: 'In a park or on a street',
          hint: 'Think about places near your home or your school.'
        },
        {
          id: 'en-l1-w2',
          authored: true,
          engine: 'TRUE_FALSE',
          prompt: 'On a hot day, the ground under a tree feels cooler than the ground in the sun.',
          answer: true,
          hint: 'Think about standing under a tree on a sunny day.'
        }
      ],
      guided: [
        {
          id: 'en-l1-t1',
          prompt: 'What is the main idea?',
          choices: ['Trees are green.', 'Trees help cities in many ways.', 'Birds can fly.'],
          answer: 'Trees help cities in many ways.',
          hint: 'Pick the answer that talks about most of the reading.'
        },
        {
          id: 'en-l1-t2',
          authored: true,
          prompt: 'Which sentence is a detail, not the main idea?',
          choices: [
            'Trees give shade on hot days.',
            'City trees do many jobs.',
            'Trees help people, animals, and the environment.'
          ],
          answer: 'Trees give shade on hot days.',
          hint: 'A detail is one small fact. The main idea covers the whole reading.'
        }
      ],
      games: [
        {
          name: 'Main Idea or Detail',
          engine: 'SORT',
          id: 'en-l1-p1',
          instruction: 'Sort each card. Is it the main idea or a detail?',
          bins: ['Main Idea', 'Detail'],
          cards: [
            { text: 'Trees help a city in many ways.', bin: 'Main Idea' },
            { text: 'Trees give shade.', bin: 'Detail' },
            { text: 'Roots take in rainwater.', bin: 'Detail' },
            { text: 'Trees help with air.', bin: 'Detail' },
            { text: 'Birds can live in trees.', bin: 'Detail' }
          ]
        },
        {
          name: 'Choose the Main Idea',
          engine: 'MULTIPLE_CHOICE',
          id: 'en-l1-p2',
          prompt: 'Dolphins are mammals. They breathe air. They live in water. They can work together in groups.\nWhat is the main idea?',
          choices: [
            'Dolphins have many special traits.',
            'Water is blue.',
            'All mammals live in water.'
          ],
          answer: 'Dolphins have many special traits.',
          hint: 'Pick the answer that talks about most of the reading.'
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'en-l1-p3',
          mode: 'bank',
          bank: ['shade', 'roots', 'birds', 'city'],
          instruction: 'Choose a word from the word bank.',
          items: [
            { before: 'Trees give', after: '.', answer: 'shade', hint: null },
            { before: 'Tree', after: 'take in some rainwater.', answer: 'roots', hint: null },
            { before: 'Trees can give', after: 'a home.', answer: 'birds', hint: null },
            { before: 'Trees can help a', after: '.', answer: 'city', hint: null }
          ]
        },
        {
          name: 'Build a Summary',
          engine: 'DRAG_DROP',
          id: 'en-l1-p4',
          instruction: 'Build the summary. Put one sentence first and one sentence second.',
          boxes: ['First sentence', 'Second sentence'],
          cards: [
            { text: 'Trees help cities.', box: 'First sentence' },
            {
              text: 'They give shade, help with air and water, and give animals homes.',
              box: 'Second sentence'
            }
          ]
        }
      ],
      challenge: {
        id: 'en-l1-c1',
        prompt: 'Finish this sentence.\nThe main idea is _____ because the text says _____.',
        accept: [
          'The main idea is that trees help cities because the text says trees give shade and take in rainwater.',
          'Trees help cities because they give shade and take in rainwater.',
          'The main idea is that trees help cities.'
        ],
        hint: 'Say what the whole text is mostly about, then give one detail from the text.'
      }
    },
    {
      subject: 'English',
      lesson_id: 'en-l2',
      grade: 7,
      title: 'Text Evidence and Inference',
      objective: 'Students will:\nfind evidence\nuse clues to make an inference',
      keyWords: [
        { word: 'evidence', meaning: 'words or facts that help prove an answer' },
        { word: 'inference', meaning: 'an idea you make from clues' },
        { word: 'clue', meaning: 'information that helps you understand' },
        { word: 'text', meaning: 'the words you read' },
        { word: 'conclude', meaning: 'decide after using clues' }
      ],
      notes: [
        {
          label: 'Easy rule',
          lines: [
            'Evidence = what the text says.',
            'Inference = what you understand from the clues.'
          ]
        },
        {
          label: 'Sentence frames',
          where: 'words',
          lines: [
            'The text says, “_____.”',
            'This is evidence that _____.',
            'I think _____ because _____.',
            'From this clue, I can infer _____.'
          ]
        }
      ],
      read: {
        title: 'The Empty Bus Stop',
        tts: true,
        paragraphs: [
          'Jamal walked to the bus stop at 7:15 in the morning.',
          'Usually, five or six people waited there.',
          'Today, no one was at the stop.',
          'Jamal looked at his phone. The date was Saturday.',
          'He smiled.',
          'Then he turned around and walked home.',
          'The text says: no one was at the stop, it was Saturday, and Jamal went home.',
          'We can infer that Jamal forgot he did not need the bus that morning.',
          'The story does not say this exact sentence. We use clues.'
        ]
      },
      visual: {
        svg: '<svg viewBox="0 0 900 380" width="100%" role="img" aria-label="Jamal alone at a bus stop checking a phone that says Saturday">\n<rect width="900" height="380" fill="#eef6fb"/>\n<rect y="290" width="900" height="90" fill="#bbb"/>\n<rect x="560" y="90" width="18" height="200" fill="#555"/>\n<rect x="515" y="75" width="110" height="55" rx="7" fill="#5e8ca8"/>\n<text x="528" y="109" font-size="19" fill="white">BUS STOP</text>\n<circle cx="330" cy="155" r="38" fill="#c88e6b"/>\n<rect x="295" y="195" width="70" height="95" rx="10" fill="#657ca8"/>\n<rect x="390" y="205" width="60" height="90" rx="8" fill="#222"/>\n<rect x="397" y="214" width="46" height="66" fill="#fff"/>\n<text x="401" y="242" font-size="14">SAT</text>\n<text x="400" y="265" font-size="14">7:15</text>\n<text x="90" y="70" font-size="28">No other people</text>\n</svg>',
        alt: 'Jamal alone at a bus stop checking a phone that says Saturday'
      },
      warmup: [
        {
          id: 'en-l2-w1',
          authored: true,
          prompt: 'It is Saturday and there is no school. Which of these will you probably NOT do today?',
          choices: ['Take the school bus', 'Eat breakfast', 'Play outside'],
          answer: 'Take the school bus',
          hint: 'Think about what is different about that day.'
        },
        {
          id: 'en-l2-w2',
          authored: true,
          engine: 'TRUE_FALSE',
          prompt: 'If you are told only part of a story, you can sometimes guess the rest.',
          answer: true,
          hint: 'Think about guessing the end of a story you have heard before.'
        }
      ],
      guided: [
        {
          id: 'en-l2-t1',
          authored: true,
          prompt: 'What is the evidence that it was Saturday?',
          choices: [
            'Jamal looked at his phone and the date was Saturday.',
            'Jamal walked to the bus stop at 7:15 in the morning.',
            'Usually, five or six people waited there.'
          ],
          answer: 'Jamal looked at his phone and the date was Saturday.',
          hint: 'Evidence is what the text actually says. Find the words that tell you the day.'
        },
        {
          id: 'en-l2-t2',
          authored: true,
          prompt: 'What can you infer about why Jamal smiled?',
          choices: [
            'He realised he did not need the bus that morning.',
            'He was late for the bus.',
            'He forgot where he lived.'
          ],
          answer: 'He realised he did not need the bus that morning.',
          hint: 'An inference uses clues. The clue is the date on his phone.'
        }
      ],
      games: [
        {
          name: 'Evidence or Inference?',
          engine: 'SORT',
          id: 'en-l2-p1',
          instruction: 'Sort each card. Is it evidence or an inference?',
          bins: ['Evidence', 'Inference'],
          cards: [
            { text: '“The date was Saturday.”', bin: 'Evidence' },
            { text: 'Jamal did not need the bus.', bin: 'Inference' },
            { text: '“No one was at the stop.”', bin: 'Evidence' },
            { text: 'Jamal forgot what day it was.', bin: 'Inference' }
          ]
        },
        {
          name: 'Best Evidence',
          engine: 'MULTIPLE_CHOICE',
          id: 'en-l2-p2',
          prompt: 'Inference: Jamal was surprised that the stop was empty.\nWhich sentence is the best evidence?',
          choices: [
            '“Usually, five or six people waited there.”',
            'Jamal had shoes.',
            'His phone was small.'
          ],
          answer: '“Usually, five or six people waited there.”',
          hint: 'Look for the clue about how many people usually wait at the stop.'
        },
        {
          name: 'Sentence Builder',
          engine: 'SENTENCE_FRAME',
          id: 'en-l2-p3',
          instruction: 'Tap the words in order to build the sentence.',
          words: ['I', 'infer', 'that', 'Jamal', 'forgot', 'it', 'was', 'Saturday', 'because', 'the', 'text', 'says,', '“The', 'date', 'was', 'Saturday.”'],
          answer: 'I infer that Jamal forgot it was Saturday because the text says, “The date was Saturday.”',
          hint: 'Start with “I infer that…”'
        },
        {
          name: 'New Text',
          engine: 'MULTIPLE_CHOICE',
          id: 'en-l2-p4',
          prompt: 'Ana came inside. Water dripped from her coat. She put her wet umbrella near the door.\nWhat can you infer?',
          choices: ['It is raining outside.', 'It is very hot.', 'Ana is cooking.'],
          answer: 'It is raining outside.',
          hint: 'Think about the clues: water on her coat and a wet umbrella.'
        }
      ],
      challenge: {
        id: 'en-l2-c1',
        prompt: 'Luis opened the refrigerator. He saw only one egg and some water. He closed the door and picked up a grocery bag.\nWhat can you infer?',
        accept: [
          'Luis needs to buy food.',
          'Luis needs food.',
          'He needs to buy food.'
        ],
        hint: 'Use the clues: one egg, some water, and a grocery bag.'
      }
    }
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = LESSONS;
  root.G7PackEla = LESSONS;
})(typeof window !== 'undefined' ? window : this);
