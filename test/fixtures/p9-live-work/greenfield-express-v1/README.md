# greenfield-express-v1

Instrument version: `1`

The model-visible workspace is a newly initialized, clean Git repository containing only the files named by the task stack. It begins without dependencies or a lockfile.

Prerequisites are deliberately explicit: the user must allow network access and `npm install express@5.1.0`; otherwise this is an Evidence Gap. The acceptance test is retained outside that workspace at `test/acceptance/p9-live-work/greenfield-express-v1.test.mjs`.

Run the task files in numeric order. The model must not be shown this README's acceptance-test path.
