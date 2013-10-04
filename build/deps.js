var deps = {
	Core: {
		src: ['MapBBCode.js'],
		desc: 'The core module for parsing map bbcode'
	},

	UI: {
		src: ['MapBBCodeUI.js',
		      'FunctionButton.js',
		      'FunctionButton.Fullscreen.js',
		      'EditorSprites.js'],
		desc: 'User Interface: displaying and editing map bbcode',
                deps: ['Core']
	},

        Editor: {
                src: ['MapBBCodeUI.Editor.js'],
                desc: 'BBCode Editor',
                deps: ['UI']
        },

        LetterIcon: {
		src: ['LetterIcon.js'],
		desc: 'Optional LetterIcon, enabled by default',
        },

        StringsEnglish: {
                src: ['strings/English.js'],
                desc: 'English',
                heading: 'Strings'
        },

        StringsRussian: {
                src: ['strings/Russian.js'],
                desc: 'Russian',
                noInclude: true
        }

        // todo: StringsRussian1251
};

if (typeof exports !== 'undefined') {
	exports.deps = deps;
}
