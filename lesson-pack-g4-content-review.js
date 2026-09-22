/* Master Review — Grade 4 Interactive Lesson Pack.

   CONTENT PENDING. The Master Review is four rounds — English, Math, Science,
   Social Studies — with a short set of questions each, matching the shape the
   Grade 2 pack uses (see reviewRounds() in lesson-pack.js, which is that pack's
   built-in set and the fallback when this is empty).

     [ { name: 'Round 1: English',
         items: [ { id: 'rv-e1', engine: 'MULTIPLE_CHOICE', prompt: '',
                    choices: ['', '', ''], answer: '', hint: '' } ] } ]
*/
(function (root) {
  'use strict';

  var ROUNDS = [];

  if (typeof module !== 'undefined' && module.exports) module.exports = ROUNDS;
  root.G4PackReview = ROUNDS;
})(typeof window !== 'undefined' ? window : this);
