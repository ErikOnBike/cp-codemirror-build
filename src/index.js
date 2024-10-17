import { basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { css, cssLanguage } from "@codemirror/lang-css";
import { html, htmlLanguage } from "@codemirror/lang-html";
import { CompletionContext } from "@codemirror/autocomplete";

// Set of well known HTML tags
let wellKnownHtmlTags = [ "div", "span" ];

function htmlContextCompletions(context) {
	// Extract 'line' before the cursor.
	// Assume something like "<" [ <partial tag-name> ]
	const textBefore = context.matchBefore(/<[\w\-]*/);
	if(!textBefore) {
		return null;
	}

	// Extract tag name and lookup possible values
	const text = context.state.sliceDoc(textBefore.from, textBefore.to);
	const tagName = text.slice(1);
	const values = wellKnownHtmlTags.filter((each) => { return each.startsWith(tagName); });
	if(values.length === 0) {
		return null;
	}

	// Set replacement position according to the (partial) tag name provided
	const from = context.pos - tagName.length;
	return {
		from: from,
		options: values.map((value, index) => { return { label: value, type: "value", boost: 99 - index }; })
	};
}

const customHtmlCompletions = htmlLanguage.data.of({
	autocomplete: htmlContextCompletions
});


// Set of well known properties.
// The values are 'ordered' from likely usage to less likely usage.
let wellKnownProperties = {
	"display": [ "block", "inline-block", "flex", "inline-flex", "grid", "inline-grid", "none" ],
	"box-sizing": [ "border-box", "content-box" ],
	"position": [ "absolute", "relative", "static", "fixed", "sticky" ],
	"flex-direction": [ "row", "column", "row-reverse", "column-reverse" ],
	"flex-wrap": [ "nowrap", "wrap", "wrap-reverse" ],
	"justify-content": [ "flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly", "stretch", "start", "end", "left", "right", "normal" ],
	"align-items": [ "stretch", "flex-start", "flex-end", "center", "baseline", "start", "end", "self-start", "self-end", "anchor-center", "normal" ],
	"align-content": [ "flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly", "stretch", "start", "end", "baseline", "normal" ],
	"align-self": [ "flex-start", "flex-end", "center", "stretch", "anchor-stretch", "baseline", "normal" ],
	"float": [ "left", "right", "none", "inline-start", "inline-end" ],
	"overflow": [ "scroll", "hidden", "visible", "clip", "auto" ],
	"overflow-x": [ "scroll", "hidden", "visible", "clip", "auto" ],
	"overflow-y": [ "scroll", "hidden", "visible", "clip", "auto" ],
	"text-transform": [ "none", "capitalize", "uppercase", "lowercase", "full-width", "full-size-kana" ],
	"cursor": [ "auto", "default", "none", "context-menu", "help", "pointer", "progress", "wait", "cell", "crosshair", "text", "vertical-text", "alias", "copy", "move", "no-drop", "not-allowed", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out" ],
	"pointer-events": [ "auto", "none" ]
};

function cssContextCompletions(context) {
	// Extract 'line' before the cursor.
	// Assume something like <property-name> ":" [ <partial property-value> ]
	const textBefore = context.matchBefore(/[\w\-]+\s*:\s*[\w\-]*/);
	if(!textBefore) {
		return null;
	}

	// Extract property name and lookup possible values
	const text = context.state.sliceDoc(textBefore.from, textBefore.to);
	const propertyName = text.replace(/^([\w\-]+).*$/, "$1");
	const values = wellKnownProperties[propertyName];
	if(!values) {
		return null;
	}

	// Extract property value and set replacement position accordingly
	const propertyValue = text.replace(/^.*:\s*([\w\-]*)$/, "$1");
	const from = context.pos - propertyValue.length;
	return {
		from: from,
		options: values.map((value, index) => { return { label: value, type: "value", boost: 99 - index }; })
	};
}

const customCssCompletions = cssLanguage.data.of({
	autocomplete: cssContextCompletions
});

function createStateConfig(doc, language, completions) {
	return {
		doc: doc,
		extensions: [
			basicSetup,
			keymap.of([ indentWithTab ]),
			indentUnit.of("\t"),
			completions,
			language()
		]
	};
}

function createState(doc, language, completions) {
	return EditorState.create(createStateConfig(doc, language, completions));
}

function createEditor(element, doc, language, completions) {
	const editor = new EditorView({
		...createStateConfig(doc, language, completions),
		parent: element,
		root: element.getRootNode()
	});

	// Add convenience methods to the Editor
	let cleanDoc = editor.state.doc;
	editor.isDirty = function() {
		return !cleanDoc.eq(this.state.doc);
	};
	editor.revert = function() {
		this.setState(createState(cleanDoc, language, completions));
	};
	editor.markClean = function() {
		cleanDoc = editor.state.doc;
	};

	return editor;
}

const languageDefinitions = {
	"html": {
		language: html,
		completions: customHtmlCompletions
	},
	"css": {
		language: css,
		completions: customCssCompletions
	}
};

// Export function to open up an editor
window["cpOpenEditorIn:on:language:"] = function(element, doc, lang) {
	const languageDef = languageDefinitions[lang];
	if(!languageDef) {
		console.error("Unknown language: " + lang);
		return;
	}
	return createEditor(element, doc, languageDef.language, languageDef.completions);
};

// Export function to set the well known HTML tags
window["cpSetWellKnownHtmlTags:"] = function(htmlTags) {
	wellKnownHtmlTags = htmlTags;
}
