(function (root) {
  'use strict';

  // [[numerator/denominator]] is rendered by math-renderer.js as a visual
  // fraction. It is never inserted as text into a student-facing page.
  function questions(source) {
    return source.trim().split('\n').map(function (line) { return line.trim(); });
  }

  function assignment(title, questionList) {
    return { title: title, questions: questionList.slice() };
  }

  var tahaQuestions = questions(`
4,836 + 7,295 =
15,000 − 8,764 =
347 × 26 =
2,408 × 35 =
4,536 ÷ 18 =
7,425 ÷ 25 =
14.75 + 8.936 =
20.4 − 13.785 =
6.25 × 3.4 =
18.72 ÷ 2.4 =
[[3/4]] + [[5/8]] =
[[7/9]] − [[1/3]] =
[[5/6]] + [[7/12]] =
[[7/8]] − [[5/16]] =
[[3/5]] × [[7/10]] =
[[8/9]] × [[3/16]] =
[[3/4]] ÷ [[2/5]] =
[[5/6]] ÷ [[10/9]] =
2 [[1/4]] × 1 [[2/3]] =
4 [[1/2]] ÷ 1 [[1/5]] =
Find the GCF of 24 and 36.
Find the GCF of 42 and 63.
Find the LCM of 8 and 12.
Find the LCM of 15 and 20.
Find the GCF of 36, 48, and 60.
Find the LCM of 6, 8, and 12.
Simplify 12:18.
Simplify 24:36.
Simplify 45:60.
[[3/5]] = [[?/20]]
[[7/8]] = [[21/?]]
4:7 = 20:?
9:12 = ?:36
15:25 = ?:10
240 ÷ 6 =
375 ÷ 5 =
18 ÷ 4 =
56 ÷ 8 =
Find the unit rate: [[150/5]]
Find the unit rate: [[42/6]]
10% of 80 =
25% of 200 =
50% of 74 =
20% of 350 =
15% of 120 =
30% of 450 =
Convert 0.45 to a percent.
Convert 0.08 to a percent.
Convert 65% to a decimal.
Convert 125% to a decimal.
Convert [[1/2]] to a percent.
Convert [[3/4]] to a percent.
? × 20% = 16
? × 25% = 30
8 □ −3
−7 □ −2
−12 □ −15
Order least to greatest: 4, −6, 0, 9, −2
Order least to greatest: −3, 7, −10, 2, 0
|−14| =
|9| =
|−27| =
The opposite of −8 is ___.
The opposite of 13 is ___.
Which quadrant contains (4, 6)?
Which quadrant contains (−3, 7)?
Which quadrant contains (−5, −2)?
Which quadrant contains (8, −4)?
Reflect (3, 5) across the x-axis.
Reflect (−4, 2) across the y-axis.
Find the distance between (2, 3) and (2, 9).
Find the distance between (−5, 4) and (3, 4).
2⁴ =
5³ =
10⁴ =
3³ =
6² =
4³ =
8 + 3 × 5 =
24 ÷ 6 + 7 =
5 + 2(6) =
3(8 − 4) + 7 =
2³ + 4 × 5 =
18 ÷ 3 + 2² =
4(7 + 2) − 6 =
5² − 3 × 4 =
Simplify: 3x + 5x
Simplify: 7a + 2a
Simplify: 9y − 4y
Simplify: 4x + 3 + 2x
Simplify: 8a + 5 − 3a
Expand: 3(x + 4)
Expand: 5(2x + 3)
Expand: 2(4y − 5)
Evaluate 3x + 5 when x = 4.
Evaluate 7a − 2 when a = 6.
Evaluate 2x² when x = 3.
Evaluate 4y + 8 when y = 5.
Evaluate 3a² + 2 when a = 4.
Evaluate 2(x + 5) when x = 7.
Solve: x + 7 = 19
Solve: x − 8 = 15
Solve: 4x = 36
Solve: [[x/5]] = 7
Solve: y + 13 = 28
Solve: a − 17 = 25
Solve: 6m = 54
Solve: [[n/8]] = 9
Solve: x + 5 > 12
Solve: x − 3 < 8
Solve: x + 7 ≥ 15
Solve: x − 9 ≤ 4
Graph x > 3 on a number line.
Graph x ≤ −2 on a number line.
Find the area of a triangle: b = 12, h = 8.
Find the area of a triangle: b = 15, h = 6.
Find the area of a parallelogram: b = 14, h = 9.
Find the area of a trapezoid: b₁ = 8, b₂ = 14, h = 5.
Find the volume: l = 8, w = 5, h = 4.
Find the volume: l = 6.5, w = 4, h = 3.
Find the missing height: V = 120, l = 6, w = 5.
Find the area of a square with side 9.
Find the volume of a cube with side 4.
Find the surface area of a cube with side 5.
Find the surface area of a rectangular prism with l = 8, w = 3, h = 4.
Find the surface area of a cube with side 7.
Find the mean: 5, 7, 8, 10, 10
Find the mean: 12, 15, 18, 21, 24
Find the median: 3, 8, 5, 12, 9
Find the median: 4, 7, 10, 13, 16, 20
Find the mode: 4, 6, 6, 7, 8, 6, 9
Find the range: 5, 17, 9, 22, 13
Find the mean: 8, 12, 14, 16, 20
Find the range: 31, 18, 45, 27, 39
Find P(heads) for a fair coin.
Find P(rolling a 4) on a six-sided die.
Find P(rolling an even number) on a six-sided die.
A bag has 3 red and 7 blue marbles. Find P(red).
A bag has 5 green and 5 yellow marbles. Find P(yellow).
A spinner has 8 equal sections and 2 are red. Find P(red).
`);

  var nahidQuestions = questions(`
Write 483,206 in expanded form.
Write 700,045 in word form.
What is the value of the 7 in 372,418?
458,219 □ 458,291
Order least to greatest: 305,602; 350,206; 305,260; 350,026
Round 6,748 to the nearest 10.
Round 38,451 to the nearest 100.
Round 274,680 to the nearest 1,000.
Round 649,215 to the nearest 10,000.
Round 751,492 to the nearest 100,000.
4,728 + 3,965 =
28,496 + 17,835 =
307,458 + 284,627 =
8,003 − 4,786 =
40,000 − 17,658 =
600,204 − 278,936 =
46 × 7 =
328 × 6 =
2,415 × 4 =
7,036 × 8 =
34 × 26 =
48 × 32 =
96 ÷ 4 =
348 ÷ 3 =
1,248 ÷ 6 =
3,725 ÷ 5 =
965 ÷ 6 = ___ R ___
2,819 ÷ 7 = ___ R ___
List all factor pairs of 24.
List all factors of 36.
Write the first five multiples of 8.
Is 29 prime or composite?
Is 51 prime or composite?
Complete: 5, 10, 20, 40, __, __
Complete: 7, 14, 21, 28, __, __
If the rule is “add 6,” complete: 4, 10, 16, __, __
[[1/2]] = [[?/8]]
[[2/3]] = [[?/6]]
[[3/4]] = [[?/12]]
[[2/5]] = [[?/10]]
[[3/6]] □ [[1/2]]
[[3/4]] □ [[5/8]]
[[2/3]] □ [[3/4]]
Order least to greatest: [[1/4]], [[3/4]], [[2/4]]
[[2/8]] + [[3/8]] =
[[5/12]] + [[4/12]] =
[[7/8]] − [[3/8]] =
[[9/10]] − [[3/10]] =
[[5/6]] = [[1/6]] + [[?/6]]
Write [[9/4]] as a mixed number.
Write 2 [[3/8]] as a fraction greater than 1.
3 × [[1/4]] =
4 × [[2/3]] =
5 × [[3/10]] =
Convert [[7/10]] to a decimal.
Convert [[34/100]] to a decimal.
Convert 0.6 to a fraction with denominator 10.
Convert 0.27 to a fraction with denominator 100.
0.7 □ 0.65
0.42 □ 0.4
7 ft = ___ in
5 km = ___ m
8 m = ___ cm
3 hr = ___ min
6 min = ___ sec
4 yd = ___ ft
5 lb = ___ oz
3 L = ___ mL
Find the area of a rectangle with l = 12, w = 7.
Find the perimeter of a rectangle with l = 9, w = 5.
A rectangle has area 48 square units and width 6 units. Find its length.
A rectangle has perimeter 30 units and length 9 units. Find its width.
Name the angle type: 35°.
Name the angle type: 90°.
Name the angle type: 128°.
Name the angle type: 180°.
37° + ? = 90°
115° + ? = 180°
An angle is split into 42° and 31°. Find the whole angle.
Draw an angle measuring 65°.
Are two lines that never meet parallel or perpendicular?
Two lines meet at 90°. Are they parallel or perpendicular?
Name a quadrilateral with two pairs of parallel sides and four right angles.
Is a square also a rectangle? Answer yes or no.
Classify a triangle with one 90° angle.
Classify a triangle with three acute angles.
Classify a triangle with one 120° angle.
How many lines of symmetry does a square have?
How many lines of symmetry does a rectangle that is not a square have?
Plot these values on a line plot: [[1/8]], [[2/8]], [[2/8]], [[3/8]], [[4/8]].
Using the data [[1/8]], [[2/8]], [[2/8]], [[3/8]], [[4/8]], which value occurs most often?
Find the difference between the greatest and least values: [[1/8]], [[2/8]], [[3/8]], [[5/8]].
6 × 300 =
40 × 70 =
3,600 ÷ 9 =
2,400 ÷ 6 =
9 × ? = 72
? ÷ 7 = 8
56 = ? × 8
4,999 + ? = 10,000
`);

  var gradeSevenQuestions = questions(`
−8 + 13 =
7 − 15 =
−12 − 9 =
−14 + 6 =
(−7)(8) =
(−9)(−6) =
72 ÷ (−8) =
−84 ÷ (−7) =
|−17| =
−5 □ −9
[[3/4]] + [[5/8]] =
[[7/6]] − [[2/3]] =
[[4/5]] × [[15/16]] =
[[7/9]] ÷ [[14/27]] =
−[[3/4]] + [[1/2]] =
−[[5/6]] − [[1/4]] =
{{frac:[[3/4]]|[[5/8]]}} =
{{frac:1 + [[1/2]]|[[3/4]]}} =
3.75 + 8.496 =
−4.2 − 3.7 =
4.8 × (−2.7) =
15.75 ÷ 2.5 =
Simplify the ratio 18:24.
Find the unit rate: [[210/6]].
[[3/5]] = [[x/45]]
7:9 = 35:x
Determine whether the relationship is proportional: (2, 6), (4, 12), (7, 21).
Determine whether the relationship is proportional: (2, 5), (4, 10), (6, 16).
Find the constant of proportionality if y = 4.5x.
Write an equation for a proportional relationship with constant 7.
If y = 3x, find y when x = 8.
If y = [[5/2]]x, find y when x = 6.
35% of 80 =
15% of 240 =
72 is what percent of 90?
18 is 30% of what number?
Increase 160 by 25%.
Decrease 250 by 18%.
Find the percent increase from 40 to 50.
Find the percent decrease from 80 to 60.
Find 8% sales tax on 75 dollars.
Find a 20% tip on 46 dollars.
Find the sale price of 120 dollars after a 30% discount.
Find the final price of 80 dollars after a 25% markup.
Find one year of simple interest on 500 dollars at 6%.
Find the percent error if the estimate is 48 and the actual value is 50.
Simplify: 5x + 3x − 7
Simplify: 9a − 4a + 2
Expand: 4(x + 6)
Expand: −3(2x − 5)
Factor: 12x + 18
Factor: 15y − 25
Evaluate 3x + 7 when x = −4.
Evaluate 2a² − 5 when a = 3.
Solve: x + 8 = 21
Solve: 3x = 27
Solve: 2x + 7 = 19
Solve: 5x − 9 = 26
Solve: 4(x + 2) = 28
Solve: 3(x − 2) + 5 = 20
Solve: [[x/5]] + 3 = 9
Solve: [[2/3]]x = 10
Solve: 4x + 3 > 19
Solve: 2x − 7 ≤ 11
Solve: −3x < 15
Solve: −2x + 5 ≥ 13
Graph x > 4 on a number line.
Graph x ≤ −3 on a number line.
A scale drawing uses 1 cm:5 m. Find the actual length represented by 7 cm.
A scale drawing uses 2 in:9 ft. Find the actual length represented by 8 in.
A 30 m length is represented by 6 cm. Find the scale in meters per centimeter.
Find the circumference of a circle with r = 7. Use π = [[22/7]].
Find the circumference of a circle with d = 12. Use π = 3.14.
Find the area of a circle with r = 6. Use π = 3.14.
Find the radius of a circle with diameter 18.
Two angles are complementary. One is 37°. Find the other.
Two angles are supplementary. One is 128°. Find the other.
Vertical angles measure 3x + 5 and 50°. Solve for x.
A linear pair measures 2x + 10 and 90°. Solve for x.
Triangle angles are 48°, 67°, x°. Find x.
Can side lengths 3, 4, and 8 form a triangle?
Can side lengths 5, 7, and 9 form a triangle?
Find the area of a triangle with b = 14, h = 9.
Find the area of a trapezoid with b₁ = 8, b₂ = 14, h = 6.
Find the volume of a rectangular prism with l = 8, w = 5, h = 4.
Find the volume of a triangular prism with triangle base b = 6, h = 4 and prism length 10.
Find the surface area of a cube with side 6.
Find the surface area of a rectangular prism with l = 7, w = 4, h = 3.
Find the mean: 7, 9, 12, 14, 18.
Find the median: 3, 11, 7, 15, 9.
Find the mode: 4, 6, 6, 7, 8, 6, 9.
Find the range: 14, 6, 22, 9, 17.
Find Q₁, median, and Q₃: 2, 4, 5, 7, 8, 10, 12.
Find the IQR for 3, 5, 7, 8, 10, 12, 14, 18.
Using the 1.5 × IQR rule, determine whether 30 is an outlier in 4, 5, 6, 7, 8, 9, 10, 30.
Compare the centers: Set A 4, 6, 8, 10, 12; Set B 10, 12, 14, 16, 18. Which has the greater mean?
A fair coin is flipped twice. Find P(HH).
A fair six-sided die is rolled twice. Find P(6 then 6).
A coin is flipped and a six-sided die is rolled. Find P(heads and an even number).
A bag contains 3 red and 2 blue marbles. One marble is selected, replaced, and another is selected. Find P(red then red).
A spinner has 4 equal sections: A, B, C, D. It is spun twice. How many outcomes are in the sample space?
List the sample space for flipping a coin twice.
Find P(at least one head) when a fair coin is flipped twice.
Find P(sum of 7) when two fair six-sided dice are rolled.
Convert 0.625 to a fraction in simplest form.
Convert [[7/8]] to a decimal.
Convert 135% to a decimal.
Convert 0.045 to a percent.
−2.5 + 7.8 =
(−1.5)(6) =
−18.4 ÷ 4 =
5 − (−12) =
−[[3/4]] ÷ [[9/10]] =
[[2/3]] − (−[[5/6]]) =
4 − 3(2 − 5) =
2³ + 5(−2) =
Simplify: 7(2x − 3) − 4x
Simplify: 5 − 2(3x + 4)
Solve: 5(x − 3) = 35
Solve: 2(x + 6) − 4 = 18
`);

  var assignments = {
    taha: assignment('Grade 6 · August Math Assignment', tahaQuestions),
    nahid: assignment('Grade 4 · August Math Assignment', nahidQuestions),
    salma: assignment('Grade 7 · August Math Assignment', gradeSevenQuestions),
    khadija: assignment('Grade 7 · August Math Assignment', gradeSevenQuestions)
  };

  root.AugustAssignments = Object.assign(root.AugustAssignments || {}, assignments);
  if (typeof module !== 'undefined' && module.exports) module.exports = assignments;
})(typeof window !== 'undefined' ? window : globalThis);
