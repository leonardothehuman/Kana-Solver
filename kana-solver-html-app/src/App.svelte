<script lang="ts">
	//This file is licensed under GNU GPL v3.0 only license
	import {onDestroy, onMount, setContext} from 'svelte';
	import ModelsAndHandlers from './modelsAndHandlers';
	import keys from './keys';
	import {App, theme, View} from 'framework7-svelte';
	import {generateRoutes} from './routes';
	import {masterRoute, masterDetailBreakpoint} from './generated/config/config';
	import SettingsHandler from './handlers/SettingsHandler';
	import type { colorSchemeOptions } from './handlers/ISettingsHandler';

	var routeCollection = generateRoutes();

	setContext(keys.kanaSolverAppModelsAndHandlers, ModelsAndHandlers);
	setContext(keys.pageLeaveConfirmators, routeCollection.getPageLeaveConfirmators());
	let sh = new SettingsHandler();
	setContext(keys.settingsHandler, sh);


	var body = document.body;
	let unsubscriber = function(){};
	let initing = sh.init().then(() => {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
			if(sh.ColorScheme.get() == "light") return;
			if(sh.ColorScheme.get() == "dark") return;
			if(e.matches == true){
				body.classList.add("theme-dark");
			}else{
				body.classList.remove("theme-dark");
			}
		});
		unsubscriber = sh.ColorScheme.subscribe((value: colorSchemeOptions) => {
			if(value == "dark"){
				body.classList.add("theme-dark");
			}else if(value == "light"){
				body.classList.remove("theme-dark");
			}else{
				if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
					body.classList.add("theme-dark");
				}else{
					body.classList.remove("theme-dark");
				}
			}
		});
	});
	onDestroy(() => {
		unsubscriber();
	});
</script>

{#await initing}
	<p>Loading ...</p>
{:then}
	<App theme="aurora" name="Kana Solver" id="com.github.leonardothehuman.kanaSolver" routes={routeCollection.getRoutes()}>
		<View main url={masterRoute} class="safe-areas" masterDetailBreakpoint={masterDetailBreakpoint} />
	</App>
{/await}