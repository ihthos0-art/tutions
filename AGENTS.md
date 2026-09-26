# LearnFlow project instructions

- Production is `https://learnflow.ihthos.dev`, hosted by the Cloudflare Pages project `learnflow`.
- A GitHub push to `origin main` alone does not publish this Pages project. For website changes, run `npm test`, commit and push the intended changes to `origin main`, then deploy `public/` and the root `functions/` directory to Pages with `wrangler pages deploy public --project-name learnflow --branch main`.
- Supply `CLOUDFLARE_API_TOKEN` from the private workstation env file at `/home/ihthos/Desktop/learnflow-cloudflare.env`; never put the token in Git, a remote URL, command text, or logs. The project has existing production secrets and the `HOMEWORK` KV binding; preserve them.
- After deployment, verify Cloudflare reports a successful production deployment for the pushed commit and check the affected live page/assets at `https://learnflow.ihthos.dev`.
- Keep secrets out of the repository. Exclude generated `graphify-out/` data from product commits.
- Preserve unrelated user changes; inspect staged and unstaged changes before committing.
