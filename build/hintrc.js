exports.config = {
	// environment
	"browser": true,
	"node": true,
	"predef": ["L"],
	"strict": false,

	// code style
	"bitwise": true,
	"camelcase": true,
	"curly": false,
	// "eqeqeq": true, // forced ===
        // "es3": true, // ECMAScript 3
        "evil": true,
	"forin": false,
	"immed": true,
	"latedef": true,
	"newcap": true,
	"noarg": true,
	"noempty": true,
	"nonew": true,
	"plusplus": false,
	"quotmark": false, // "single"?
	"undef": true,
	"unused": "vars",

	// whitespace
	"indent": 4,
	"trailing": true,
	"smarttabs": false,
};
