/* Social Studies — Grade 4 Interactive Lesson Pack.

   CONTENT PENDING. The teacher's material has not been supplied yet, so this
   array is deliberately empty: the page mounts, and the Social Studies tab renders
   its own "being prepared" card. Nothing here should be filled in from memory
   or invented — when the pack arrives it is transcribed verbatim, the same way
   lesson-pack-content-*.js was for the Grade 2 pack.

   Shape, once it lands (one entry per lesson, two per subject):

     {
       subject: 'Social Studies',
       lesson_id: 'ss-l1',        // REQUIRED prefix — en- | ma- | sc- | ss-
                                  // is what routes the lesson to its tab and
                                  // its subject badge. An id off that convention
                                  // loads but renders on no tab at all.
       grade: 4,
       title:       '',
       objective:   '',
       keyWords:    [{ word: '', meaning: '' }],
       read:        { title: '', paragraphs: [''] },
       visual:      { alt: '', svg: '' },   // svg must carry role="img" + aria-label
       guided:      [ …items… ],
       games:       [ …items, or a {name, engine, items} round set… ],
       challenge:   { …one item… },
       compare:     { columns: [], rows: [[]] }   // optional
     }
*/
(function (root) {
  'use strict';

  var LESSONS = [];

  if (typeof module !== 'undefined' && module.exports) module.exports = LESSONS;
  root.G4PackSocial = LESSONS;
})(typeof window !== 'undefined' ? window : this);
