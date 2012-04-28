Playing around with Mario Kart analytics.

Pieces:
- Given images taken during races, emit a JSON object describing the current
  state (list of players, each of which includes at least position, and ideally
  also whether the player has finished, the current lap number, character, and
  weapons). Also ideally include the current map.
- Given this data, bucket these into discrete races, identifying at least each
  player's finishing position.
- Given this data, plus metadata describing the starting conditions and changes
  in player <-> human mappings, compute per-human stats.

For data ingestion:
- Consider starting with *only* a description of the end state of each race,
  that includes date, race number, track name, player <-> character, and final
  positions.
- Add JPEG images taken at regular intervals.  (Will it be necessary to also
  include a picture of the end state to identify the actual winner and to
  identify track changes?)
- Or: use video instead, which would allow arbitrarily fine-grained stats, plus 
  the ability to measure actual times per player, allowing for all kinds of
  stats about times taken on each track.

Notes:
- Main interface: web-based
- Restify for web backend, bunyan for logging

For processing images, libjpeg is probably the best bet (or libjpeg-turbo).
There's already a node-jpeg, but it can only write files, not read them.
