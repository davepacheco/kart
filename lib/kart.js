/*
 * kart.js: stub
 */

var mod_assert = require('assert');

var mod_extsprintf = require('extsprintf');
var mod_jsprim = require('jsprim');

function printf()
{
	process.stdout.write(mod_extsprintf.sprintf.apply(null,
	    Array.prototype.slice.call(arguments)));
}

/*
 * Each session is a list of races plus starting conditions.  It should be
 * pretty self-explanatory:
 */
var sampleSession = {
    /* Initial mapping of (game player number) to (character name) */
    'characters': [ 'Yoshi', 'Peach', 'Toad', 'Wario' ],

    /* Names of humans in each player slot. (Extras are rotated in.) */
    'people': [ 'wdp', 'rm', 'wesolows', 'brendan', 'dap' ],

    /* List of race results. */
    'races': [ {
	'track': 'Luigi Raceway',
	'result': [ 'Yoshi', 'Wario', 'Toad', 'Peach' ]
    }, {
	'track': 'Choco Mountain',
	'result': [ 'Peach', 'Yoshi', 'Wario', 'Toad' ]
    }, {
	'track': 'Rainbow Road',
	'result': [ 'Toad', 'Yoshi', 'Peach', 'Wario' ]
    }, {
	'track': 'Mario Raceway',
	'result': [ 'Peach', 'Toad', 'Wario', 'Yoshi' ]
    }, {
	'track': 'Frappe Snowland',
	'result': [ 'Yoshi', 'Wario', 'Toad', 'Peach' ]
    }, {
	'track': 'Sherbet Land',
	'result': [ 'Peach', 'Toad', 'Wario', 'Yoshi' ]
    } ]
};

/*
 * Prints summary results by character.
 */
function printSummaryByCharacter(session)
{
	var nchars = session['characters'].length;
	var chars = {};

	mod_assert.ok(nchars <= 4);

	session['races'].forEach(function (race) {
		var i, chr;

		mod_assert.equal(race['result'].length, nchars);

		for (i = 0; i < race['result'].length; i++) {
			chr = race['result'][i];
			if (!chars.hasOwnProperty(chr))
				chars[chr] = [ 0, 0, 0, 0 ];
			chars[chr][i]++;
		}
	});

	printf('%5s  ', '');
	session['characters'].forEach(function (chr) {
		printf('%8s  ', chr);
	});
	printf('\n');

	function print_row(ordinal, index) {
		printf('%5s  ', ordinal);

		session['characters'].forEach(function (chr) {
			printf('%8d  ', chars[chr][index]);
		});

		printf('\n');
	}

	print_row('1st', 0);
	print_row('2nd', 1);
	if (nchars > 2) {
		print_row('3rd', 2);

		if (nchars > 3)
			print_row('4th', 3);
	}
}

printSummaryByCharacter(sampleSession);
