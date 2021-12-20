//This file is licensed under GNU GPL v3.0 only license

import Framework7 from 'framework7/lite-bundle';
import Framework7Svelte from 'framework7-svelte';
import App from './App.svelte';
import './app.less';
import 'framework7-icons';

import 'framework7/framework7-bundle.css';

function ready(fn: () => void) {
	if (document.readyState != 'loading'){
		fn();
	} else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}

ready(function(){
	window.ondragover = function(e) { e.preventDefault(); return false };
	window.ondrop = function(e) { e.preventDefault(); return false };
});

Framework7.use(Framework7Svelte);

let tgt:HTMLElement|null = document.getElementById('app');

var app = null;
if(tgt != null){
	app = new App({
		target: tgt
	});
}

export default app;