var deps = {
	Core: {
		src: ['MapBBCode.js'],
		desc: 'The core module for parsing map bbcode'
	},

	UI: {
		src: ['MapBBCodeUI.js',
		      'FunctionButton.js',
		      'EditorSprites.js',
		      'handlers/Handler.Text.js'],
		desc: 'User Interface: displaying and editing map bbcode',
		deps: ['Core']
	},

	Editor: {
		src: ['MapBBCodeUI.Editor.js'],
		desc: 'BBCode Editor',
		deps: ['UI']
	},

	Sharing: {
		src: ['MapBBCodeUI.Share.js'],
		desc: 'Methods for interacting with MapBBCode Share',
		deps: ['UI']
	},

	HandlerColor: {
		src: ['handlers/Handler.Color.js'],
		desc: 'Color parameter',
		heading: 'Handlers'
	},

	HandlerWidth: {
		src: ['handlers/Handler.Width.js'],
		desc: 'Width parameter',
		noInclude: true
	},

	HandlerMeasure: {
		src: ['handlers/Handler.Measure.js'],
		desc: 'Length and Area measurement',
		noInclude: true
	},

	HandlerLength: {
		src: ['handlers/Handler.Length.js'],
		desc: 'Length measurement plugin',
		noInclude: true
	},

	LetterIcon: {
		src: ['LetterIcon.js'],
		desc: 'Optional LetterIcon',
		heading: 'Plugins'
	},

	PopupIcon: {
		src: ['PopupIcon.js'],
		desc: 'Icon that looks like a popup panel'
	},

	Search: {
		src: ['Leaflet.Search.js'],
		desc: 'Nominatim search control'
	},

	Attribution: {
		src: ['PermalinkAttribution.js'],
		desc: 'Make permalinks out of OSM attribution'
	},

	Export: {
		src: ['ExportButton.js'],
		desc: 'Export to share.mapbbcode.org button'
	},

	LayerSwitcher: {
		src: ['config/StaticLayerSwitcher.js'],
		desc: 'Layer switcher that is not a single button',
		config: true
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
		heading: 'Configuration',
		config: true,
		deps: ['LayerSwitcher', 'LayerList']
	},

	StringsEnglish: {
		src: ['strings/English.js'],
		desc: 'English',
		heading: 'Translations',
		deps: ['UI']
	},

	StringsRussian: {
		src: ['strings/Russian.js'],
		desc: 'Russian',
		deps: ['UI'],
		noInclude: true,
		onlyIn: ['russian']
	},

	StringsEnglishC: {
		src: ['strings/English.Config.js'],
		desc: 'English for Configuration',
		deps: ['Configuration'],
		config: true
	},

	StringsRussianC: {
		src: ['strings/Russian.Config.js'],
		desc: 'Russian for Configuration',
		deps: ['Configuration'],
		noInclude: true,
		config: true,
		onlyIn: ['russian']
	}
};

if (typeof exports !== 'undefined') {
	exports.deps = deps;
}
