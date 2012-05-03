/*
 * session.js: process individual Kart sessions
 */

var mod_assert = require('assert');
var mod_util = require('util');

var mod_verror = require('verror');

/*
 * A session has the following properties:
 *
 *     events		list of events (see below)
 *
 * Each event has the following:
 *
 *     time		time of the event
 *
 *     type		one of "addPeople", "beginSet", "setCharacters",
 *     			"setPeople", "raceResult"
 *
 * setPeople event:
 *
 *     people		ordered array of names (strings)
 *
 * beginSet event:
 *
 *     nplayers		4
 *
 *     mode		"battle" or "vs"
 *
 *     level		50cc, 100cc, 150cc, extra (for "vs" only)
 *
 * setCharacters event:
 *
 *     characters	ordered array of characters (strings)
 *
 * setActivePeople event:
 *
 *     people		ordered array of names (strings)
 *
 * raceResult event:
 *
 *     track		track name (string)
 *
 *     results		ordered array of characters (strings)
 *
 * From any valid sequence of events, we can determine for each race who was
 * playing which character and the final race results, which allows us to
 * compute arbitrary per-race metrics, including results by player, character,
 * track, level, or any combination of the above.
 *
 * We distinguish between people, characters, and players.  People are humans,
 * represented only by opaque names.  Characters correspond to the eight
 * racing characters defined in the game.  Players are the ordinal slots from 1
 * to currentSet.nplayers (i.e. player 1, player 2, and so on).
 *
 * setCharacters indicates which characters are being used by which players. So:
 *
 *     {
 *         "type": "setCharacters",
 *         "characters": [ "Mario", "Peach", "Toad", "Yoshi" ]
 *     }
 *
 * means:
 *
 *     Player 1 is Mario
 *     Player 2 is Peach
 *     Player 3 is Toad
 *     Player 4 is Yoshi
 *
 * setPeople defines the list of all people playing.  There may be more people
 * than players, in which case the first NPLAYERS "people" are assigned to the
 * first N "player" slots, and the bottom 1 or 2 active players are swapped out
 * with the two least-recently-played players. So:
 *
 *    {
 *        "type": "setPeople",
 *        "people": [ "rm", "wdp", "dap", "wesolows", "brendan" ]
 *    }
 *
 * means:
 *
 *    Player 1 is "rm"
 *    Player 2 is "wdp"
 *    Player 3 is "dap"
 *    Player 4 is "wesolows"
 *    Whoever comes in 4th in the first race will be replaced with "brendan".
 *
 * setActivePeople allows you to override the logic that determines who's
 * currently playing which characters.  For example, if "wdp" came in 4th in the
 * first race, "brendan" would replace him, and you'd have:
 *
 *     [ "rm", "brendan", "dap", "wesolows" ]
 *
 * but if "dap" and "rm" swap physical controllers (but not characters), you
 * could indicate this with:
 *
 *     {
 *         "type": "setActivePeople",
 *         "people": [ "dap", "brendan", "rm", "wesolows" ]
 *     }
 *
 *
 * EXAMPLES
 *
 * A simple session will consist of an initial setPeople event, a beginSet
 * event, a setCharacters event, followed by some number of raceResults events.
 * This covers most common cases.
 *
 * If you switch from "150cc" to "extra", or from "vs" to "battle", or from 4
 * players to 3 players, you add a "beginSet" event to indicate this.
 *
 * If new people show up or some leave, you indicate that with a "setPeople"
 * event.
 *
 * If someone takes a race off but you still have the same number of players, or
 * if players swap controllers, you indicate that with a "setActivePeople"
 * event.
 *
 * If people change characters, you indicate that with a "setCharacters" event.
 */

function mkSessionState()
{
	this.ss_results = [];
	this.ss_current = null;
}

/*
 * This is really the only public function in this module.  It constructs an
 * intermediate representation of the session that lists all races and describes
 * who was playing at any given time.  This essentially just resolves the input
 * (which character won each race) to what we care about (which player won each
 * race).  Stats can be more easily computed from this representation.
 */
function mkParseSession(session)
{
	var state = new mkSessionState();
	console.error('--- begin parsing session');
	mkParseEvents(state, session['events']);
	return (state.ss_results);
}

function mkParseEvents(state, events)
{
	events.forEach(mkParseEvent.bind(null, state));
}

var mkStateHandlers = {
    'beginSet': sessionBeginSet,
    'setCharacters': sessionSetCharacters,
    'setPeople': sessionSetPeople,
    'raceResult': sessionRaceResult
};

function mkParseEvent(state, entry)
{
	console.error('--- event: %j', entry);

	if (!mkStateHandlers.hasOwnProperty(entry['type']))
		throw (new mod_verror.VError(
		    'event has unknown type: %j', entry));

	mkStateHandlers[entry['type']](state, entry);
}

function sessionBeginSet(state, entry)
{
	/* XXX do something with "mode" and "level" */
	state.ss_current = {
	    'people': new Array(entry['nplayers']),
	    'characters': new Array(entry['nplayers']),
	    'validCharacters': false,
	    'validPeople': false
	};
}

function sessionSetCharacters(state, entry)
{
	var cur = state.ss_current;

	if (entry['characters'].length != cur['characters'].length)
		throw (new mod_verror.VError(
		    'cannot change number of players with "setCharacters"'));

	/* XXX validate characters */
	cur['characters'] = entry['characters'].slice(0);
	cur['validCharacters'] = true;
}

function sessionSetPeople(state, entry)
{
	var cur = state.ss_current;

	if (entry['people'].length != cur['people'].length)
		throw (new mod_verror.VError(
		    'cannot change number of players with "setPeople"'));

	/* XXX validate people */
	cur['people'] = entry['people'].slice(0);
	cur['validPeople'] = true;
}

function sessionRaceResult(state, entry)
{
	var cur = state.ss_current;
	var result, nplayers, i, j;

	if (!cur)
		throw (new mod_verror.VError(
		    'expected "beginSet" before "raceResult"'));

	if (!cur['validCharacters'])
		throw (new mod_verror.VError(
		    'expected "setCharacters" before "raceResult"'));

	if (!cur['validPeople'])
		throw (new mod_verror.VError(
		    'expected "setPeople" before "raceResult"'));

	/* XXX validate track, results.length, and characters */

	nplayers = cur['people'].length;

	result = {
	    'track': entry['track'],
	    'results': []
	};

	for (i = 0; i < nplayers; i++) {
		for (j = 0; j < nplayers; j++) {
			if (entry['results'][i] == cur['characters'][j])
				break;
		}

		result['results'].push({
		    'place': i + 1,
		    'character': entry['results'][i],
		    'person': cur['people'][j]
		});
	}

	state.ss_results.push(result);
}

function test()
{
	var session = { 'events': [] };
	var events = session['events'];

	console.log(mkParseSession(session));

	events.push({
	    'type': 'raceResult',
	    'track': 'Royal Raceway',
	    'results': [ 'Wario', 'Luigi', 'Mario' ]
	});

	mod_assert.throws(function () { mkParseSession(session); },
	    /* JSSTYLED */
	    /expected "beginSet" before "raceResult"/);

	events.unshift({
	    'type': 'beginSet',
	    'nplayers': 3,
	    'mode': 'vs',
	    'level': '150cc'
	});

	mod_assert.throws(function () { mkParseSession(session); },
	    /* JSSTYLED */
	    /expected "setCharacters" before "raceResult"/);

	events.splice(1, 0, {
	    'type': 'setCharacters',
	    'characters': [ 'Luigi', 'Mario', 'Wario' ]
	});

	mod_assert.throws(function () { mkParseSession(session); },
	    /* JSSTYLED */
	    /expected "setPeople" before "raceResult"/);

	events.splice(1, 0, {
	    'type': 'setPeople',
	    'people': [ 'rm', 'brendan', 'wesolows' ]
	});

	console.log(mod_util.inspect(mkParseSession(session), null, 4));

	events.push({
	    'type': 'raceResult',
	    'track': 'Luigi Raceway',
	    'results': [ 'Wario', 'Mario', 'Luigi' ]
	});

	console.log(mod_util.inspect(mkParseSession(session), null, 4));
}

test();
