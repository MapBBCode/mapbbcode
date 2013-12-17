var deps = {
	Core: {
		src: ['MapBBCode.js'],
		desc: 'The core module for parsing map bbcode'
	},

	UI: {
		src: ['MapBBCodeUI.js',
		      'controls/FunctionButton.js',
		      'images/EditorSprites.js',
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
		src: ['controls/LetterIcon.js'],
		desc: 'Optional LetterIcon',
		heading: 'Plugins'
	},

	PopupIcon: {
		src: ['controls/PopupIcon.js'],
		desc: 'Icon that looks like a popup panel'
	},

	Search: {
		src: ['controls/Leaflet.Search.js'],
		desc: 'Nominatim search control'
	},

	Attribution: {
		src: ['controls/PermalinkAttribution.js'],
		desc: 'Make permalinks out of OSM attribution'
	},

	Export: {
		src: ['controls/ExportButton.js'],
		desc: 'Export to share.mapbbcode.org button'
	},

	LayerSwitcher: {
		src: ['controls/StaticLayerSwitcher.js'],
		desc: 'Layer switcher that is not a single button'
	},

	LayerList: {
		src: ['layers/LayerList.js'],
		desc: 'List of layers to simplify configuration',
		heading: 'Layers',
		config: true
	},

	LayerBing: {
		src: ['layers/Bing.js'],
		desc: 'Bing layer',
		noInclude: true
	},

	LayerGoogle: {
		src: ['layers/Google.js'],
		desc: 'Google layer',
		noInclude: true
	},

	LayerYandex: {
		src: ['layers/Yandex.js'],
		desc: 'Yandex layer',
		noInclude: true
	},

	LayerEsri: {
		src: ['layers/Esri.js'],
		desc: 'Esri layer',
		noInclude: true
	},

	LayerNokia: {
		src: ['layers/Nokia.js'],
		desc: 'Nokia layer',
		noInclude: true
	},

	Layer2GIS: {
		src: ['layers/2GIS.js'],
		desc: '2GIS layer',
		noInclude: true
	},

	Configuration: {
		src: ['config/MapBBCodeUI.Config.js',
		      'controls/StaticLayerSwitcher.js',
		      'controls/FunctionButton.js'],
		desc: 'MapBBCode UI configuration module',
		heading: 'Configuration',
		config: true,
		deps: ['LayerList']
	},

	StringsEnglish: {
		src: ['strings/English.js'],
		desc: 'English',
		heading: 'Translations',
		deps: ['UI']
	},

	StringsEnglishC: {
		src: ['strings/English.Config.js'],
		desc: 'English for Configuration',
		deps: ['Configuration'],
		config: true
	}
};

if (typeof exports !== 'undefined') {
	exports.deps = deps;
}
