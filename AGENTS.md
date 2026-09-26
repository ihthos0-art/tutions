# LearnFlow project instructions

- Production is `https://learnflow.ihthos.dev`, deployed by Cloudflare Pages from the connected GitHub `main` branch.
- For website changes, run `npm test`, commit the intended project changes, and push to `origin main`. Do not stop after local edits or use direct Wrangler deploy for routine publishing.
- After pushing, verify the live page or deployment result before reporting completion.
- Keep secrets out of the repository. Exclude generated `graphify-out/` data from product commits.
- Preserve unrelated user changes; inspect staged and unstaged changes before committing.
