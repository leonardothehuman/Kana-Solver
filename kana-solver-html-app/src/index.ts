import Framework7 from 'framework7/lite-bundle';
import Framework7Svelte from 'framework7-svelte';
import App from './App.svelte';
import './app.css';
import 'framework7-icons';

import 'framework7/framework7-bundle.css';
Framework7.use(Framework7Svelte);

let tgt:HTMLElement|null = document.getElementById('app');

var app = null;
if(tgt != null){
	app = new App({
		target: tgt,
		props: {
			name: 'world'
		}
	});
}

export default app;