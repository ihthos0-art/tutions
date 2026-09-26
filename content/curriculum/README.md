# LearnFlow curriculum bundles

Each `grade-N.json` file contains four original subject lessons, answer keys, source links, visual credits, and a grade-to-student mapping. Lesson content is kept outside `public/` so answer keys are not exposed as static files. The authenticated publisher sends it to the homework API, where student responses omit `answer` and `acceptedAnswers`.

The source guides distinguish confirmed school materials from state standards, candidates, and archived examples. Each lesson includes a `scopeNote` so standards alignment is not mistaken for a current classroom schedule. Grade 9 is based on NYSED high-school standards because the supplied guide covers Grades 2–7 only.

Publish with the authenticated admin credentials supplied through environment variables; the script does not store or print them. In Bash, enter the password at a hidden prompt instead of putting it in shell history:

```sh
read -r -p 'Admin username: ' LEARNFLOW_ADMIN_USERNAME
read -r -s -p 'Admin password: ' LEARNFLOW_ADMIN_PASSWORD; echo
export LEARNFLOW_ADMIN_USERNAME LEARNFLOW_ADMIN_PASSWORD
npm run publish:curriculum
unset LEARNFLOW_ADMIN_USERNAME LEARNFLOW_ADMIN_PASSWORD
```

The publisher first compares every lesson mapping against the live admin roster. It replaces only the four subject worksheets for those students and preserves other homework fields and assignment records. The operation is safe to rerun if a network error interrupts it.
