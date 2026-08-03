# The Neelam Show 🎬
> *say the first word — no thinking allowed*

a rapid-fire word-association party game, inspired by neelam kothari's cameo in kuch kuch hota hai (1998) — hear a word, say the first thing that comes to mind, no time to think, 60 seconds on the clock.

**live at → [the-neelam-show.vercel.app](https://the-neelam-show.vercel.app)**

---

## -> what it does

- the host reads a word aloud, you say the first word that comes to mind, back to back for 60 seconds
- three ways to play: **solo** (beat your own best), **vs** (pass the phone, same-device head-to-head), **remote-play** (two separate phones, live, with floating emoji reactions when your opponent scores)
- an AI writes a witty, bollywood-film-critic-style "verdict" on your round afterward, shareable as a card
- waiting on your opponent in remote mode? there's a tap-to-shoot basketball mini-game (and actual waiting-room music) to pass the time instead of staring at a spinner

---

## -> tools & learning used to build this

built almost entirely through [claude code](https://claude.com/claude-code) — this one's less "vibe-coded UI, hand-wired backend" and more a full conversation-driven build, start to finish.

- **claude code** — basically the whole thing: game logic, UI, backend, remote multiplayer, bug fixes, the works
- **convex** — real-time database, used for remote multiplayer sync (live scores between two phones, room state) and personal-best/match history
- **openai (whisper + gpt-4o-mini)** — transcribes spoken answers in the background without slowing the round down, and writes the post-round verdict
- **elevenlabs** — the host's voice, pre-generated ahead of time so playback during a round is instant, not a live API call
- **vercel** — hosting, deployment, and the convex-backed serverless routes

---

## -> what i learned building this

- browsers behave very differently under the hood than you'd expect — a bug that only showed up on iPhone Safari never appeared once in my own testing
- distributed state is genuinely hard — two phones racing to update the same live score can arrive at the server out of order; learned this the hard way after real two-player testing showed mismatched numbers on each screen
- AI output is only as good as what you feed it — my AI-written verdicts were dull and sometimes nonsensical until i realized whisper was occasionally hallucinating fake "answers" (actual gibberish, sometimes fake youtube captions) that were quietly getting passed straight to the model
- test on a real device, not just a browser tab — most of the real bugs here never showed up until an actual phone, a real mic, and a real network were involved

---

## -> how this idea came about

"the neelam show" is named after neelam kothari's cameo in kuch kuch hota hai (1998) — she plays a talk-show host firing rapid questions at guests, demanding the first word that comes to mind, no time to think it over. that scene stuck with me for years — it's basically a party game hiding inside a movie moment. this rebuilds it as something you can actually play, solo or with someone else, on your phone.

---

## -> what's next

- leaderboard (global or friends)
- real login, so your personal-best follows you across devices instead of just the one phone
- a "v2" idea: the AI picks your next word live based on what you just said, instead of a fixed prompt list — bigger architectural lift, not scoped in detail yet

---

## -> known gaps + what i'd improve next

- [ ] **voice capture is still unreliable on iPhone Safari** — known issue, disclosed right in the app, real fix still in progress
- [ ] **no leaderboard yet** — solo, vs, and remote-play all track scores, but there's no global or friends view of them
- [ ] **hinglish-specific pronunciation got dropped** when the host voice moved to ElevenLabs — one voice reads every prompt the same way now, regardless of language mode
- [ ] **remote multiplayer is capped at 2 players** — no lobby/room support for more than a 1v1 match

---

## -> about me

**Swabhi Gupta** — customer success professional turned builder.

6+ years in CS across India, the Middle East, Singapore, and North America. still learning to build, one overly-specific Claude conversation at a time.

communities: women of CS · CS network · success hub

---

*built by describing a 90s movie scene to an AI until it turned into a working app.*
