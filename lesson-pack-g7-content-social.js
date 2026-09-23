/* Social Studies — Grade 7 Interactive Lesson Pack (transcribed verbatim).

   Source: the teacher's Grade 7 pack. New York Grade 7 Social Studies is
   "History of the United States and New York State I"; the pack uses colonial
   development and the American Revolution.

   Reference URL the teacher cited:
     https://www.nysed.gov/standards-instruction/social-studies

   Two things are carried deliberately rather than tidied away, because they
   are the teacher's framing and not mine:
     - the Southern Colonies' reliance on the forced labour of enslaved
       Africans and African Americans is named as the pack names it;
     - "no taxation without representation" is explained through the absence of
       elected representatives in Parliament, as the pack explains it.
*/
(function (root) {
  'use strict';

  var LESSONS = [
    {
      subject: 'Social Studies',
      lesson_id: 'ss-l1',
      grade: 7,
      title: 'The 13 Colonies',
      objective: 'Students will:\nexplain what a colony was\nname the three colonial regions\ncompare the regions',
      keyWords: [
        { word: 'colony', meaning: 'land controlled by another country' },
        { word: 'region', meaning: 'an area with things in common' },
        { word: 'economy', meaning: 'how people make, buy, and sell things' },
        { word: 'trade', meaning: 'buying and selling goods' },
        { word: 'farm', meaning: 'land used to grow food or raise animals' },
        { word: 'port', meaning: 'a place where ships load and unload' }
      ],
      read: {
        title: 'Learn',
        tts: true,
        paragraphs: [
          'Before the United States became a country, Britain controlled 13 colonies on the east coast of North America.',
          'The colonies are often studied in three groups: the New England Colonies, the Middle Colonies, and the Southern Colonies.',
          'The land and climate were different in each region.',
          'Because of this, people often did different kinds of work.',
          'New England: Massachusetts, Rhode Island, Connecticut, and New Hampshire.',
          'Common work in New England: fishing, shipbuilding, trade, and small farms.',
          'Middle Colonies: New York, New Jersey, Pennsylvania, and Delaware.',
          'Common work in the Middle Colonies: farming, trade, and crafts.',
          'Southern Colonies: Virginia, Maryland, North Carolina, South Carolina, and Georgia.',
          'The South had a warmer climate and a long growing season.',
          'Agriculture was very important.',
          'Large plantations relied heavily on the forced labor of enslaved Africans and African Americans.'
        ]
      },
      visual: {
        svg: '<svg viewBox="0 0 900 440" width="100%" role="img" aria-label="Three boxes comparing New England, Middle, and Southern colonial regions">\n<rect width="900" height="440" fill="white"/>\n<rect x="75" y="45" width="750" height="95" rx="16" fill="#c9d8e8"/>\n<rect x="75" y="175" width="750" height="95" rx="16" fill="#d8e6bb"/>\n<rect x="75" y="305" width="750" height="95" rx="16" fill="#edd5b2"/>\n<text x="105" y="85" font-size="30">New England</text>\n<text x="105" y="120" font-size="21">fishing • trade • ships • small farms</text>\n<text x="105" y="215" font-size="30">Middle Colonies</text>\n<text x="105" y="250" font-size="21">farms • rivers • ports • trade</text>\n<text x="105" y="345" font-size="30">Southern Colonies</text>\n<text x="105" y="380" font-size="21">warm climate • long growing season • large farms</text>\n</svg>',
        alt: 'Three boxes comparing New England, Middle, and Southern colonial regions'
      },
      compare: {
        title: 'Compare the regions',
        columns: ['', 'New England', 'Middle Colonies', 'Southern Colonies'],
        rows: [
          ['Examples',
            'Massachusetts, Rhode Island, Connecticut, New Hampshire',
            'New York, New Jersey, Pennsylvania, Delaware',
            'Virginia, Maryland, North Carolina, South Carolina, Georgia'],
          ['Common work',
            'fishing, shipbuilding, trade, small farms',
            'farming, trade, crafts',
            'agriculture on large plantations']
        ]
      },
      // Authored, not the teacher's. The pack names a Warm-Up and a Try With
      // Help but writes neither for this lesson. Both use only this lesson's
      // own material. Marked `authored: true`.
      warmup: [
        {
          id: 'ss-l1-w1',
          authored: true,
          prompt: 'What is the name of the country you live in?',
          choices: ['The United States', 'Britain', 'France'],
          answer: 'The United States',
          hint: 'Think about the country you are in right now.'
        },
        {
          id: 'ss-l1-w2',
          authored: true,
          engine: 'TRUE_FALSE',
          prompt: 'Long ago, Britain ruled lands far away from Britain.',
          answer: true,
          hint: 'Think about ships crossing the ocean a very long time ago.'
        }
      ],
      guided: [
        {
          id: 'ss-l1-t1',
          authored: true,
          prompt: 'Which region had a warmer climate and a long growing season?',
          choices: ['The Southern Colonies', 'The New England Colonies', 'The Middle Colonies'],
          answer: 'The Southern Colonies',
          hint: 'Look at the third box in the picture and find the word "climate".'
        },
        {
          id: 'ss-l1-t2',
          authored: true,
          prompt: 'New England had rocky soil and a short growing season. What work did people there do most?',
          choices: ['Fishing, shipbuilding, and trade', 'Large plantations', 'Growing cotton'],
          answer: 'Fishing, shipbuilding, and trade',
          hint: 'When land is hard to farm, people turn to the sea and to ships.'
        }
      ],
      games: [
        {
          name: 'Sort the Region',
          engine: 'SORT',
          id: 'ss-l1-p1',
          instruction: 'Sort each card into the right region.',
          bins: ['New England', 'Middle', 'Southern'],
          cards: [
            { text: 'fishing', bin: 'New England' },
            { text: 'shipbuilding', bin: 'New England' },
            { text: 'small farms', bin: 'New England' },
            { text: 'New York', bin: 'Middle' },
            { text: 'good farmland', bin: 'Middle' },
            { text: 'rivers and ports', bin: 'Middle' },
            { text: 'warm climate', bin: 'Southern' },
            { text: 'long growing season', bin: 'Southern' },
            { text: 'large plantations', bin: 'Southern' }
          ]
        },
        {
          name: 'Match Colony to Region',
          engine: 'MATCH_PAIRS',
          id: 'ss-l1-p2',
          instruction: 'Match each colony to its region.',
          pairs: [
            ['Massachusetts', 'New England'],
            ['New York', 'Middle'],
            ['Pennsylvania', 'Middle'],
            ['Virginia', 'Southern'],
            ['Georgia', 'Southern']
          ]
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'ss-l1-p3',
          mode: 'type',
          instruction: 'Write one word or number in each blank.',
          items: [
            { before: 'The colonies were controlled by', after: '.', answer: 'Britain', hint: 'It is a country in Europe.' },
            { before: 'There were', after: 'main regions.', answer: 'three', hint: 'New England, Middle, and Southern.' },
            { before: 'New York was a', after: 'Colony.', answer: 'Middle', hint: 'Look at the map groups.' },
            { before: 'The Southern Colonies had a', after: 'climate.', answer: 'warmer', hint: 'Think about the long growing season.' }
          ]
        },
        {
          name: 'Place and Work',
          engine: 'MATCH_PAIRS',
          id: 'ss-l1-p4',
          instruction: 'Match what a place had to the work people did there.',
          pairs: [
            ['ocean access', 'fishing and shipping'],
            ['good farmland', 'farming'],
            ['long growing season', 'more time to grow crops'],
            ['ports', 'trade']
          ]
        }
      ],
      challenge: {
        id: 'ss-l1-c1',
        prompt: 'Why did regions have different kinds of work?',
        accept: [
          'The land, climate, rivers, and ocean access were different.',
          'The land and climate were different.',
          'Because the land and climate were different.',
          'The land was different.'
        ],
        hint: 'Think about the land, the climate, the rivers, and the ocean.'
      }
    },
    {
      subject: 'Social Studies',
      lesson_id: 'ss-l2',
      grade: 7,
      title: 'The American Revolution',
      objective: 'Students will explain:\nwhy conflict grew\nwhat “taxation without representation” meant\nwhat the Declaration of Independence did\nthe basic result of the war',
      keyWords: [
        { word: 'tax', meaning: 'money paid to a government' },
        { word: 'protest', meaning: 'action that shows disagreement' },
        { word: 'representation', meaning: 'having someone speak or vote for you in government' },
        { word: 'independence', meaning: 'freedom from another country’s control' },
        { word: 'revolution', meaning: 'a major political change' },
        { word: 'declaration', meaning: 'an official statement' }
      ],
      notes: [
        {
          label: 'Important events',
          lines: [
            '1773: Boston Tea Party — colonists protested British tea policy and taxation.',
            '1775: Lexington and Concord — fighting began.',
            '1776: Declaration of Independence — the Continental Congress approved it on July 4, 1776. It declared the colonies independent.',
            '1783: Treaty of Paris — Britain formally recognized the independence of the United States.'
          ]
        }
      ],
      read: {
        title: 'Learn',
        tts: true,
        paragraphs: [
          'Britain controlled the 13 colonies.',
          'After the French and Indian War, Britain had large debts.',
          'Britain placed new taxes and rules on the colonies.',
          'Many colonists opposed some of these taxes.',
          'A famous complaint was: “No taxation without representation.”',
          'This meant many colonists said Britain should not tax them when they did not have elected representatives in the British Parliament.',
          'Not everyone agreed about independence.',
          'Some people supported independence.',
          'Some stayed loyal to Britain.',
          'Others tried to stay away from the conflict.',
          'Cause: Britain placed new taxes and rules on the colonies. Effect: many colonists protested.',
          'Cause: conflict became worse. Effect: war began.',
          'Cause: the colonies won the war. Effect: Britain recognized U.S. independence.'
        ]
      },
      visual: {
        svg: '<svg viewBox="0 0 980 330" width="100%" role="img" aria-label="Timeline showing Boston Tea Party in 1773, Lexington and Concord in 1775, Declaration of Independence in 1776, and Treaty of Paris in 1783">\n<rect width="980" height="330" fill="white"/>\n<line x1="100" y1="165" x2="880" y2="165" stroke="#555" stroke-width="6"/>\n<circle cx="160" cy="165" r="14" fill="#6887a5"/>\n<circle cx="370" cy="165" r="14" fill="#6887a5"/>\n<circle cx="570" cy="165" r="14" fill="#6887a5"/>\n<circle cx="820" cy="165" r="14" fill="#6887a5"/>\n<text x="120" y="110" font-size="25">1773</text>\n<text x="80" y="78" font-size="20">Boston Tea Party</text>\n<text x="330" y="225" font-size="25">1775</text>\n<text x="285" y="260" font-size="20">Fighting begins</text>\n<text x="530" y="110" font-size="25">1776</text>\n<text x="480" y="78" font-size="20">Declaration</text>\n<text x="780" y="225" font-size="25">1783</text>\n<text x="720" y="260" font-size="20">Treaty of Paris</text>\n</svg>',
        alt: 'Timeline showing Boston Tea Party in 1773, Lexington and Concord in 1775, Declaration of Independence in 1776, and Treaty of Paris in 1783'
      },
      // Authored, not the teacher's — see the note on ss-l1.
      warmup: [
        {
          id: 'ss-l2-w1',
          authored: true,
          prompt: 'Who makes the laws and collects taxes where you live?',
          choices: ['The government', 'Your school', 'Your friends'],
          answer: 'The government',
          hint: 'Think about who pays for roads, parks, and schools.'
        },
        {
          id: 'ss-l2-w2',
          authored: true,
          engine: 'TRUE_FALSE',
          prompt: 'People sometimes disagree with a rule their government makes.',
          answer: true,
          hint: 'Think about a rule you once thought was unfair.'
        }
      ],
      guided: [
        {
          id: 'ss-l2-t1',
          authored: true,
          prompt: 'What did "No taxation without representation" mean?',
          choices: [
            'Britain should not tax the colonies unless colonists had someone to speak for them in Parliament.',
            'The colonies should stop trading with Britain.',
            'Britain should raise the taxes even higher.'
          ],
          answer: 'Britain should not tax the colonies unless colonists had someone to speak for them in Parliament.',
          hint: 'Representation means having someone to speak and vote for you.'
        },
        {
          id: 'ss-l2-t2',
          authored: true,
          prompt: 'Britain placed new taxes and rules on the colonies. What happened next?',
          choices: ['Many colonists protested.', 'The colonies joined France.', 'Nothing changed at all.'],
          answer: 'Many colonists protested.',
          hint: 'The reading gives this as a cause and its effect.'
        }
      ],
      games: [
        {
          name: 'Put in Order',
          engine: 'SEQUENCE',
          id: 'ss-l2-p1',
          instruction: 'Put these events in order. Start with the earliest year.',
          items: ['Boston Tea Party', 'Lexington and Concord', 'Declaration of Independence', 'Treaty of Paris']
        },
        {
          name: 'Match the Word',
          engine: 'MATCH_PAIRS',
          id: 'ss-l2-p2',
          instruction: 'Match each word to its meaning.',
          pairs: [
            ['tax', 'money paid to a government'],
            ['protest', 'action showing disagreement'],
            ['independence', 'freedom from another country’s control'],
            ['representation', 'having someone speak or vote for you in government']
          ]
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'ss-l2-p3',
          mode: 'type',
          instruction: 'Write one word or number in each blank.',
          items: [
            { before: 'Britain placed new', after: 'on the colonies.', answer: 'taxes', hint: 'Money paid to a government.' },
            { before: 'The colonies were controlled by', after: '.', answer: 'Britain', hint: 'It is the country that placed the taxes.' },
            { before: 'The Declaration was approved in', after: '.', answer: '1776', hint: 'It was approved on July 4 of that year.' },
            { before: 'The Treaty of Paris recognized U.S.', after: '.', answer: 'independence', hint: 'Freedom from another country’s control.' }
          ]
        },
        {
          name: 'Cause or Effect?',
          engine: 'SORT',
          id: 'ss-l2-p4',
          instruction: 'Sort each card. Is it a cause or an effect?',
          bins: ['Cause', 'Effect'],
          cards: [
            { text: 'Britain placed new taxes on the colonies.', bin: 'Cause' },
            { text: 'Political conflict grew.', bin: 'Cause' },
            { text: 'Many colonists protested.', bin: 'Effect' },
            { text: 'War began.', bin: 'Effect' }
          ]
        }
      ],
      challenge: {
        id: 'ss-l2-c1',
        prompt: 'What did “no taxation without representation” mean?',
        accept: [
          'Many colonists did not want Britain to tax them when they had no elected representatives in Parliament.',
          'Colonists did not want to be taxed without representatives in Parliament.',
          'They did not want Britain to tax them without representation.',
          'Britain should not tax them when they had no representatives.'
        ],
        hint: 'Think about who was allowed to speak and vote for the colonists in Parliament.'
      }
    }
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = LESSONS;
  root.G7PackSocial = LESSONS;
})(typeof window !== 'undefined' ? window : this);
