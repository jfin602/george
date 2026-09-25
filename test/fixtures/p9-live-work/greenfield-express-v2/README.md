# greenfield-express-v2

Instrument version: `2`

The model-visible workspace is a newly initialized, clean Git repository containing only the files named by the task stack. It begins without dependencies or a lockfile.

Prerequisites are deliberately explicit: the user must allow network access and `npm install express@5.1.0`; otherwise this is an Evidence Gap. Product behavior is unchanged, so this instrument reuses acceptance version 1 at `test/acceptance/p9-live-work/greenfield-express-v1.test.mjs`, outside the model-visible workspace.

Run the task files in numeric order. The model must not be shown this README or the acceptance-test path.
