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
		desc: 'Optional LetterIcon',
        },

        LayerSwitcher: {
                src: ['config/StaticLayerSwitcher.js'],
                desc: 'Layer switcher that is not a single button',
                config: true
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
        },

        LayerList: {
                src: ['config/LayerList.js'],
                desc: 'List of layers to simplify configuration',
                config: true
        },

        Configuration: {
                src: ['config/MapBBCodeUI.Config.js',
                      'FunctionButton.js'],
                desc: 'MapBBCode UI configuration module',
                config: true,
                deps: ['LayerSwitcher', 'LayerList']
        }
};

if (typeof exports !== 'undefined') {
	exports.deps = deps;
}
