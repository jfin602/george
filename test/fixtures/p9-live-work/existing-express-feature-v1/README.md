# existing-express-feature-v1

Instrument version: `1`

The model-visible workspace is created from `base/` and committed before the task begins with fixed author/committer identity and timestamp. This makes one reproducible fixture commit for every run; its observed SHA is recorded with the run.

It requires the user's explicit approval for network access and `npm install`. The hidden acceptance suite is outside the copied workspace at `test/acceptance/p9-live-work/existing-express-feature-v1.test.mjs`.
