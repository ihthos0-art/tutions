/* Social Studies — Grade 2 Interactive Lesson Pack (transcribed verbatim) */
(function (root) {
  'use strict';
  var LESSONS = [
    {
      subject: 'Social Studies',
      lesson_id: 'ss-l1',
      grade: 2,
      title: 'Urban, Suburban, and Rural Communities',
      objective: 'Students will compare three kinds of communities:\nurban\nsuburban\nrural',
      keyWords: [
        { word: 'community', meaning: 'a place where people live, work, and help one another' },
        { word: 'urban', meaning: 'a city community with many people and buildings' },
        { word: 'suburban', meaning: 'a community near a city, often with homes and neighborhoods' },
        { word: 'rural', meaning: 'a community with fewer people and more open land' },
        { word: 'transportation', meaning: 'ways people move from place to place' }
      ],
      read: {
        title: 'Three Kinds of Communities',
        paragraphs: [
          'People live in many kinds of communities.',
          'An urban community is a city area. It often has many people, tall buildings, stores, buses, and trains. Brooklyn is part of New York City, so many places in Brooklyn are urban.',
          'A suburban community is usually near a city. It may have neighborhoods with houses, schools, parks, and stores.',
          'A rural community has fewer people and more open land. Some rural places have farms, fields, forests, and long roads.',
          'All three kinds of communities have people, homes, jobs, and places to learn.'
        ],
        tts: true
      },
      thinkAbout: [],
      visual: {
        svg: '<svg viewBox="0 0 960 390" width="100%" role="img" aria-label="Three panels comparing urban, suburban, and rural communities">\n  <rect width="960" height="390" fill="#fff"/>\n  <rect x="10" y="25" width="300" height="340" rx="16" fill="#eef2f6"/>\n  <rect x="330" y="25" width="300" height="340" rx="16" fill="#eef8ed"/>\n  <rect x="650" y="25" width="300" height="340" rx="16" fill="#f7f3df"/>\n\n<text x="110" y="62" font-size="29">Urban</text>\n<rect x="50" y="120" width="70" height="180" fill="#7189a7"/>\n<rect x="135" y="90" width="75" height="210" fill="#8699b0"/>\n<rect x="225" y="140" width="55" height="160" fill="#647c98"/>\n<g fill="#fff3a8">\n<rect x="65" y="145" width="14" height="18"/><rect x="90" y="145" width="14" height="18"/>\n<rect x="150" y="120" width="14" height="18"/><rect x="180" y="120" width="14" height="18"/>\n</g>\n<rect x="30" y="300" width="260" height="18" fill="#555"/>\n<rect x="80" y="320" width="130" height="28" rx="5" fill="#e3b94e"/>\n\n<text x="415" y="62" font-size="29">Suburban</text>\n<polygon points="370,190 430,135 490,190" fill="#bb6858"/>\n<rect x="382" y="188" width="95" height="85" fill="#f1d7b6"/>\n<rect x="510" y="185" width="95" height="88" fill="#dfc49d"/>\n<polygon points="500,185 558,140 616,185" fill="#777"/>\n<circle cx="585" cy="120" r="38" fill="#6ead61"/>\n<rect x="580" y="145" width="10" height="80" fill="#8b5a2b"/>\n<rect x="355" y="295" width="250" height="16" fill="#888"/>\n\n<text x="755" y="62" font-size="29">Rural</text>\n<rect x="690" y="245" width="105" height="70" fill="#d9664c"/>\n<polygon points="678,245 742,192 808,245" fill="#7b4738"/>\n<rect x="730" y="270" width="28" height="45" fill="#fff3d5"/>\n<path d="M650 325 Q760 285 950 330" fill="#d9c77b"/>\n<rect x="845" y="130" width="14" height="125" fill="#8b5a2b"/>\n<circle cx="852" cy="115" r="55" fill="#6aac5f"/>\n</svg>',
        alt: 'Three panels comparing urban, suburban, and rural communities'
      },
      compare: {
        title: 'Compare',
        columns: ['Community', 'Often Has'],
        rows: [
          ['Urban', 'tall buildings, many people, buses, trains'],
          ['Suburban', 'neighborhoods, houses, parks, roads'],
          ['Rural', 'farms, fields, forests, open land']
        ]
      },
      guided: [],
      games: [
        {
          name: 'Sort the Community',
          engine: 'SORT',
          id: 'ss-l1-g1',
          instruction: null,
          bins: ['Urban', 'Suburban', 'Rural'],
          cards: [
            { text: 'subway', bin: 'Urban' },
            { text: 'tall apartment building', bin: 'Urban' },
            { text: 'busy street', bin: 'Urban' },
            { text: 'many stores close together', bin: 'Urban' },
            { text: 'neighborhood street', bin: 'Suburban' },
            { text: 'houses with yards', bin: 'Suburban' },
            { text: 'local park', bin: 'Suburban' },
            { text: 'shopping center', bin: 'Suburban' },
            { text: 'farm', bin: 'Rural' },
            { text: 'field', bin: 'Rural' },
            { text: 'barn', bin: 'Rural' },
            { text: 'long country road', bin: 'Rural' }
          ]
        },
        {
          name: 'Picture Choice',
          engine: 'TAP_IMAGE',
          id: 'ss-l1-g2-1',
          prompt: '“Tap the urban community.”',
          svg: '<svg viewBox="0 0 960 390" width="100%" role="img" aria-label="Three panels comparing urban, suburban, and rural communities">\n  <rect width="960" height="390" fill="#fff"/>\n  <rect x="10" y="25" width="300" height="340" rx="16" fill="#eef2f6"/>\n  <rect x="330" y="25" width="300" height="340" rx="16" fill="#eef8ed"/>\n  <rect x="650" y="25" width="300" height="340" rx="16" fill="#f7f3df"/>\n\n<text x="110" y="62" font-size="29">Urban</text>\n<rect x="50" y="120" width="70" height="180" fill="#7189a7"/>\n<rect x="135" y="90" width="75" height="210" fill="#8699b0"/>\n<rect x="225" y="140" width="55" height="160" fill="#647c98"/>\n<g fill="#fff3a8">\n<rect x="65" y="145" width="14" height="18"/><rect x="90" y="145" width="14" height="18"/>\n<rect x="150" y="120" width="14" height="18"/><rect x="180" y="120" width="14" height="18"/>\n</g>\n<rect x="30" y="300" width="260" height="18" fill="#555"/>\n<rect x="80" y="320" width="130" height="28" rx="5" fill="#e3b94e"/>\n\n<text x="415" y="62" font-size="29">Suburban</text>\n<polygon points="370,190 430,135 490,190" fill="#bb6858"/>\n<rect x="382" y="188" width="95" height="85" fill="#f1d7b6"/>\n<rect x="510" y="185" width="95" height="88" fill="#dfc49d"/>\n<polygon points="500,185 558,140 616,185" fill="#777"/>\n<circle cx="585" cy="120" r="38" fill="#6ead61"/>\n<rect x="580" y="145" width="10" height="80" fill="#8b5a2b"/>\n<rect x="355" y="295" width="250" height="16" fill="#888"/>\n\n<text x="755" y="62" font-size="29">Rural</text>\n<rect x="690" y="245" width="105" height="70" fill="#d9664c"/>\n<polygon points="678,245 742,192 808,245" fill="#7b4738"/>\n<rect x="730" y="270" width="28" height="45" fill="#fff3d5"/>\n<path d="M650 325 Q760 285 950 330" fill="#d9c77b"/>\n<rect x="845" y="130" width="14" height="125" fill="#8b5a2b"/>\n<circle cx="852" cy="115" r="55" fill="#6aac5f"/>\n</svg>',
          choices: [
            { label: 'Urban', correct: true },
            { label: 'Suburban', correct: false },
            { label: 'Rural', correct: false }
          ]
        },
        {
          name: 'Picture Choice',
          engine: 'TAP_IMAGE',
          id: 'ss-l1-g2-2',
          prompt: '“Tap the rural community.”',
          svg: '<svg viewBox="0 0 960 390" width="100%" role="img" aria-label="Three panels comparing urban, suburban, and rural communities">\n  <rect width="960" height="390" fill="#fff"/>\n  <rect x="10" y="25" width="300" height="340" rx="16" fill="#eef2f6"/>\n  <rect x="330" y="25" width="300" height="340" rx="16" fill="#eef8ed"/>\n  <rect x="650" y="25" width="300" height="340" rx="16" fill="#f7f3df"/>\n\n<text x="110" y="62" font-size="29">Urban</text>\n<rect x="50" y="120" width="70" height="180" fill="#7189a7"/>\n<rect x="135" y="90" width="75" height="210" fill="#8699b0"/>\n<rect x="225" y="140" width="55" height="160" fill="#647c98"/>\n<g fill="#fff3a8">\n<rect x="65" y="145" width="14" height="18"/><rect x="90" y="145" width="14" height="18"/>\n<rect x="150" y="120" width="14" height="18"/><rect x="180" y="120" width="14" height="18"/>\n</g>\n<rect x="30" y="300" width="260" height="18" fill="#555"/>\n<rect x="80" y="320" width="130" height="28" rx="5" fill="#e3b94e"/>\n\n<text x="415" y="62" font-size="29">Suburban</text>\n<polygon points="370,190 430,135 490,190" fill="#bb6858"/>\n<rect x="382" y="188" width="95" height="85" fill="#f1d7b6"/>\n<rect x="510" y="185" width="95" height="88" fill="#dfc49d"/>\n<polygon points="500,185 558,140 616,185" fill="#777"/>\n<circle cx="585" cy="120" r="38" fill="#6ead61"/>\n<rect x="580" y="145" width="10" height="80" fill="#8b5a2b"/>\n<rect x="355" y="295" width="250" height="16" fill="#888"/>\n\n<text x="755" y="62" font-size="29">Rural</text>\n<rect x="690" y="245" width="105" height="70" fill="#d9664c"/>\n<polygon points="678,245 742,192 808,245" fill="#7b4738"/>\n<rect x="730" y="270" width="28" height="45" fill="#fff3d5"/>\n<path d="M650 325 Q760 285 950 330" fill="#d9c77b"/>\n<rect x="845" y="130" width="14" height="125" fill="#8b5a2b"/>\n<circle cx="852" cy="115" r="55" fill="#6aac5f"/>\n</svg>',
          choices: [
            { label: 'Urban', correct: false },
            { label: 'Suburban', correct: false },
            { label: 'Rural', correct: true }
          ]
        },
        {
          name: 'Picture Choice',
          engine: 'TAP_IMAGE',
          id: 'ss-l1-g2-3',
          prompt: '“Tap the community with the most open land.”',
          svg: '<svg viewBox="0 0 960 390" width="100%" role="img" aria-label="Three panels comparing urban, suburban, and rural communities">\n  <rect width="960" height="390" fill="#fff"/>\n  <rect x="10" y="25" width="300" height="340" rx="16" fill="#eef2f6"/>\n  <rect x="330" y="25" width="300" height="340" rx="16" fill="#eef8ed"/>\n  <rect x="650" y="25" width="300" height="340" rx="16" fill="#f7f3df"/>\n\n<text x="110" y="62" font-size="29">Urban</text>\n<rect x="50" y="120" width="70" height="180" fill="#7189a7"/>\n<rect x="135" y="90" width="75" height="210" fill="#8699b0"/>\n<rect x="225" y="140" width="55" height="160" fill="#647c98"/>\n<g fill="#fff3a8">\n<rect x="65" y="145" width="14" height="18"/><rect x="90" y="145" width="14" height="18"/>\n<rect x="150" y="120" width="14" height="18"/><rect x="180" y="120" width="14" height="18"/>\n</g>\n<rect x="30" y="300" width="260" height="18" fill="#555"/>\n<rect x="80" y="320" width="130" height="28" rx="5" fill="#e3b94e"/>\n\n<text x="415" y="62" font-size="29">Suburban</text>\n<polygon points="370,190 430,135 490,190" fill="#bb6858"/>\n<rect x="382" y="188" width="95" height="85" fill="#f1d7b6"/>\n<rect x="510" y="185" width="95" height="88" fill="#dfc49d"/>\n<polygon points="500,185 558,140 616,185" fill="#777"/>\n<circle cx="585" cy="120" r="38" fill="#6ead61"/>\n<rect x="580" y="145" width="10" height="80" fill="#8b5a2b"/>\n<rect x="355" y="295" width="250" height="16" fill="#888"/>\n\n<text x="755" y="62" font-size="29">Rural</text>\n<rect x="690" y="245" width="105" height="70" fill="#d9664c"/>\n<polygon points="678,245 742,192 808,245" fill="#7b4738"/>\n<rect x="730" y="270" width="28" height="45" fill="#fff3d5"/>\n<path d="M650 325 Q760 285 950 330" fill="#d9c77b"/>\n<rect x="845" y="130" width="14" height="125" fill="#8b5a2b"/>\n<circle cx="852" cy="115" r="55" fill="#6aac5f"/>\n</svg>',
          choices: [
            { label: 'Urban', correct: false },
            { label: 'Suburban', correct: false },
            { label: 'Rural', correct: true }
          ]
        },
        {
          name: 'Picture Choice',
          engine: 'TAP_IMAGE',
          id: 'ss-l1-g2-4',
          prompt: '“Tap the community with many tall buildings.”',
          svg: '<svg viewBox="0 0 960 390" width="100%" role="img" aria-label="Three panels comparing urban, suburban, and rural communities">\n  <rect width="960" height="390" fill="#fff"/>\n  <rect x="10" y="25" width="300" height="340" rx="16" fill="#eef2f6"/>\n  <rect x="330" y="25" width="300" height="340" rx="16" fill="#eef8ed"/>\n  <rect x="650" y="25" width="300" height="340" rx="16" fill="#f7f3df"/>\n\n<text x="110" y="62" font-size="29">Urban</text>\n<rect x="50" y="120" width="70" height="180" fill="#7189a7"/>\n<rect x="135" y="90" width="75" height="210" fill="#8699b0"/>\n<rect x="225" y="140" width="55" height="160" fill="#647c98"/>\n<g fill="#fff3a8">\n<rect x="65" y="145" width="14" height="18"/><rect x="90" y="145" width="14" height="18"/>\n<rect x="150" y="120" width="14" height="18"/><rect x="180" y="120" width="14" height="18"/>\n</g>\n<rect x="30" y="300" width="260" height="18" fill="#555"/>\n<rect x="80" y="320" width="130" height="28" rx="5" fill="#e3b94e"/>\n\n<text x="415" y="62" font-size="29">Suburban</text>\n<polygon points="370,190 430,135 490,190" fill="#bb6858"/>\n<rect x="382" y="188" width="95" height="85" fill="#f1d7b6"/>\n<rect x="510" y="185" width="95" height="88" fill="#dfc49d"/>\n<polygon points="500,185 558,140 616,185" fill="#777"/>\n<circle cx="585" cy="120" r="38" fill="#6ead61"/>\n<rect x="580" y="145" width="10" height="80" fill="#8b5a2b"/>\n<rect x="355" y="295" width="250" height="16" fill="#888"/>\n\n<text x="755" y="62" font-size="29">Rural</text>\n<rect x="690" y="245" width="105" height="70" fill="#d9664c"/>\n<polygon points="678,245 742,192 808,245" fill="#7b4738"/>\n<rect x="730" y="270" width="28" height="45" fill="#fff3d5"/>\n<path d="M650 325 Q760 285 950 330" fill="#d9c77b"/>\n<rect x="845" y="130" width="14" height="125" fill="#8b5a2b"/>\n<circle cx="852" cy="115" r="55" fill="#6aac5f"/>\n</svg>',
          choices: [
            { label: 'Urban', correct: true },
            { label: 'Suburban', correct: false },
            { label: 'Rural', correct: false }
          ]
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'ss-l1-g3-1',
          mode: 'type',
          before: 'A city community is often called ',
          after: '.',
          answer: 'urban',
          hint: null
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'ss-l1-g3-2',
          mode: 'type',
          before: 'A community with farms and open land may be ',
          after: '.',
          answer: 'rural',
          hint: null
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'ss-l1-g3-3',
          mode: 'type',
          before: 'A community near a city may be ',
          after: '.',
          answer: 'suburban',
          hint: null
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'ss-l1-g3-4',
          mode: 'type',
          before: 'A place where people live and work together is a ',
          after: '.',
          answer: 'community',
          hint: null
        },
        {
          name: 'Same or Different?',
          engine: 'TRUE_FALSE',
          id: 'ss-l1-g4-1',
          statement: 'All communities can have homes.',
          answer: true,
          hint: null
        },
        {
          name: 'Same or Different?',
          engine: 'TRUE_FALSE',
          id: 'ss-l1-g4-2',
          statement: 'Only urban communities have people.',
          answer: false,
          hint: null
        },
        {
          name: 'Same or Different?',
          engine: 'TRUE_FALSE',
          id: 'ss-l1-g4-3',
          statement: 'Rural areas often have more open land.',
          answer: true,
          hint: null
        },
        {
          name: 'Same or Different?',
          engine: 'TRUE_FALSE',
          id: 'ss-l1-g4-4',
          statement: 'Suburban communities can have schools and parks.',
          answer: true,
          hint: null
        }
      ],
      challenge: {
        prompt: 'Brooklyn has many apartment buildings, stores, buses, trains, and busy streets.\nWhich word best describes most of Brooklyn?',
        accept: ['urban'],
        hint: null
      }
    },
    {
      subject: 'Social Studies',
      lesson_id: 'ss-l2',
      grade: 2,
      title: 'Community Helpers, Rules, and Responsibilities',
      objective: 'Students will understand:\nwhat community helpers do\nwhy communities have rules\nhow people can be responsible community members',
      keyWords: [
        { word: 'rule', meaning: 'something people are expected to follow' },
        { word: 'law', meaning: 'an official rule in a community' },
        { word: 'responsibility', meaning: 'something you are expected to do' },
        { word: 'citizen', meaning: 'a member of a country or community' },
        { word: 'community helper', meaning: 'a person whose job helps other people' },
        { word: 'service', meaning: 'helpful work done for people' }
      ],
      read: {
        title: 'People Who Help Our Community',
        paragraphs: [
          'A community works better when people help one another.',
          'Teachers help children learn. Firefighters help during fires and emergencies. Sanitation workers collect trash and help keep streets clean. Doctors and nurses care for people who are sick or hurt. Police officers help with public safety.',
          'People who live in a community also have responsibilities. They can follow rules, keep shared places clean, treat others fairly, and care for public property.',
          'Rules are important because they can help people stay safe and work together.'
        ],
        tts: true
      },
      thinkAbout: [],
      visual: {
        svg: '<svg viewBox="0 0 920 360" width="100%" role="img" aria-label="Four community helper cards showing a teacher, firefighter, sanitation worker, and nurse">\n  <rect width="920" height="360" fill="#fff"/>\n  <g transform="translate(35,35)">\n    <rect width="195" height="285" rx="16" fill="#edf4ff"/>\n    <circle cx="98" cy="85" r="38" fill="#e7b79e"/>\n    <rect x="63" y="125" width="70" height="85" rx="12" fill="#7ba6d9"/>\n    <rect x="35" y="225" width="125" height="35" fill="#c59d70"/>\n    <text x="58" y="280" font-size="25">Teacher</text>\n  </g>\n  <g transform="translate(255,35)">\n    <rect width="195" height="285" rx="16" fill="#fff2ed"/>\n    <circle cx="98" cy="88" r="36" fill="#e7b79e"/>\n    <path d="M60 73 Q98 25 136 73" fill="#d84f42"/>\n    <rect x="60" y="125" width="76" height="95" rx="12" fill="#d95e4d"/>\n    <text x="38" y="280" font-size="25">Firefighter</text>\n  </g>\n  <g transform="translate(475,35)">\n    <rect width="195" height="285" rx="16" fill="#eef9ed"/>\n    <circle cx="98" cy="85" r="36" fill="#c98f70"/>\n    <rect x="61" y="124" width="74" height="92" rx="12" fill="#5d9b62"/>\n    <rect x="138" y="160" width="30" height="50" fill="#4f7c50"/>\n    <text x="20" y="280" font-size="24">Sanitation</text>\n    <text x="54" y="308" font-size="24">Worker</text>\n  </g>\n  <g transform="translate(695,35)">\n    <rect width="195" height="285" rx="16" fill="#f5effb"/>\n    <circle cx="98" cy="85" r="36" fill="#e7b79e"/>\n    <rect x="60" y="124" width="76" height="95" rx="12" fill="#eeeeee"/>\n    <rect x="92" y="148" width="12" height="42" fill="#d75656"/>\n    <rect x="77" y="163" width="42" height="12" fill="#d75656"/>\n    <text x="65" y="280" font-size="25">Nurse</text>\n  </g>\n</svg>',
        alt: 'Four community helper cards showing a teacher, firefighter, sanitation worker, and nurse'
      },
      compare: {
        title: 'Who Helps With What?',
        columns: ['Helper', 'Helps By'],
        rows: [
          ['teacher', 'teaching students'],
          ['firefighter', 'responding to fires and emergencies'],
          ['sanitation worker', 'collecting trash and helping keep streets clean'],
          ['nurse', 'caring for people who are sick or hurt']
        ]
      },
      guided: [],
      games: [
        {
          name: 'Match the Helper',
          engine: 'MATCH_PAIRS',
          id: 'ss-l2-g1',
          instruction: null,
          pairs: [
            ['teacher', 'helps students learn'],
            ['firefighter', 'helps during fires'],
            ['sanitation worker', 'collects trash'],
            ['nurse', 'cares for sick or hurt people']
          ]
        },
        {
          name: 'Good Community Choice',
          engine: 'MULTIPLE_CHOICE',
          id: 'ss-l2-g2-1',
          prompt: 'You see paper on the classroom floor. What is a responsible choice?',
          choices: [
            'Leave it there.',
            'Put it in the trash or recycling bin.',
            'Kick it.'
          ],
          answer: 'Put it in the trash or recycling bin.',
          hint: null
        },
        {
          name: 'Good Community Choice',
          engine: 'MULTIPLE_CHOICE',
          id: 'ss-l2-g2-2',
          prompt: 'The crossing signal says “Don’t Walk.” What should you do?',
          choices: [
            'Run across.',
            'Wait safely.',
            'Close your eyes and cross.'
          ],
          answer: 'Wait safely.',
          hint: null
        },
        {
          name: 'Good Community Choice',
          engine: 'MULTIPLE_CHOICE',
          id: 'ss-l2-g2-3',
          prompt: 'A library book belongs to the community. What should you do?',
          choices: [
            'Tear a page.',
            'Take care of it and return it.',
            'Draw on it.'
          ],
          answer: 'Take care of it and return it.',
          hint: null
        },
        {
          name: 'Rule or Responsibility?',
          engine: 'SORT',
          id: 'ss-l2-g3',
          instruction: null,
          note: 'Note for developer: some items can be both rules and responsibilities in real life. Keep this activity focused on the intended classroom category and explain overlap if asked.',
          bins: ['Rule', 'Responsibility'],
          cards: [
            { text: 'Stop at a red light.', bin: 'Rule' },
            { text: 'Follow school safety rules.', bin: 'Rule' },
            { text: 'Do not damage public property.', bin: 'Rule' },
            { text: 'Keep shared spaces clean.', bin: 'Responsibility' },
            { text: 'Return library books.', bin: 'Responsibility' },
            { text: 'Treat others respectfully.', bin: 'Responsibility' }
          ]
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'ss-l2-g4-1',
          mode: 'bank',
          bank: ['rules', 'safe', 'teacher', 'nurse'],
          before: 'Communities have ',
          after: ' to help people work together.',
          answer: 'rules',
          hint: null
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'ss-l2-g4-2',
          mode: 'bank',
          bank: ['rules', 'safe', 'teacher', 'nurse'],
          before: 'A firefighter helps keep people ',
          after: '.',
          answer: 'safe',
          hint: null
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'ss-l2-g4-3',
          mode: 'bank',
          bank: ['rules', 'safe', 'teacher', 'nurse'],
          before: 'A ',
          after: ' helps students learn.',
          answer: 'teacher',
          hint: null
        },
        {
          name: 'Fill the Blank',
          engine: 'FILL_BLANK',
          id: 'ss-l2-g4-4',
          mode: 'bank',
          bank: ['rules', 'safe', 'teacher', 'nurse'],
          before: 'A ',
          after: ' can care for someone who is sick.',
          answer: 'nurse',
          hint: null
        }
      ],
      challenge: {
        prompt: 'Why do communities have rules?',
        accept: ['“Rules help keep people safe.”', '“Rules help people work together.”', '“Rules tell people what they should or should not do.”'],
        hint: null
      }
    }
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = LESSONS;
  root.G2PackSocial = LESSONS;
})(typeof window !== 'undefined' ? window : this);
