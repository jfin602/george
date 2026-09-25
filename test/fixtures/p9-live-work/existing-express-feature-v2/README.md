# existing-express-feature-v2

Instrument version: `2`

The model-visible workspace is created from the self-contained `base/`, whose fixture version 1 bytes are unchanged from `existing-express-feature-v1/base/`, and committed before the task begins with fixed author/committer identity and timestamp. This makes one reproducible fixture commit for every run; its observed SHA is recorded with the run.

It requires the user's explicit approval for network access and `npm install`. Product behavior is unchanged, so this instrument reuses acceptance version 1 at `test/acceptance/p9-live-work/existing-express-feature-v1.test.mjs`, outside the copied workspace.
