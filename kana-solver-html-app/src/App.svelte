<script lang="ts">
	//This file is licensed under GNU GPL v3.0 only license
	import {onDestroy, onMount, setContext} from 'svelte';
	import ModelsAndHandlers from './modelsAndHandlers';
	import keys from './keys';
	import {App, View} from 'framework7-svelte';
	import {generateRoutes} from './routes';
	import {masterRoute, masterDetailBreakpoint} from './generated/config/config';
	import SettingsHandler from './handlers/SettingsHandler';
	import type { colorSchemeOptions } from './handlers/ISettingsHandler';
	import { htmlEntities, sleep } from './minilibs/helpers';
	import SpinnerManipulator from './views/commonImplementations/spinnerManipulator';
	import { f7 } from 'framework7-svelte';
	import type { GlobalInterface } from './App';
	import { f7ConfirmPromisse, f7ConfirmYNPromisse } from './minilibs/f7extender';
	import ProgressProcess from './views/commonImplementations/progressProcess';
	var routeCollection = generateRoutes();

	setContext(keys.kanaSolverAppModelsAndHandlers, ModelsAndHandlers);
	setContext(keys.pageLeaveConfirmators, routeCollection.getPageLeaveConfirmators());
	let sh = new SettingsHandler();
	setContext(keys.settingsHandler, sh);

	let globalInterface: GlobalInterface = {
		showSpinner: async(title: string) => {
			let dialog = f7.dialog.preloader(title);
			await sleep(100);
			return new SpinnerManipulator(dialog);
		},
		emitAlert: (text: string, title: string) => {
			return new Promise<void>((resolve, reject) => {
				f7.dialog.alert(text, title, () => {resolve()});
			});
		},
        askConfirmation: (text: string, title: string) => {
            return f7ConfirmPromisse(f7, text, title);
        },
        askConfirmationYN: (text: string, title: string) => {
            return f7ConfirmYNPromisse(f7, text, title);
        },
        popup: (text: string, title: string) => {
            return new Promise((resolve, reject) => {
                let popup = f7.popup.create({
                    content: `<div class="popup">
                        <div class="page">
                        <div class="navbar">
                            <div class="navbar-bg"></div>
                            <div class="navbar-inner">
                            <div class="title">${htmlEntities(title)}</div>
                            <div class="right"><a href="#" class="link popup-close">Close</a></div>
                            </div>
                        </div>
                        <div class="page-content">
                            <div class="allow-select temp-view-container warning-messages">
                                ${text}
                            </div>
                        </div>
                        </div>
                    </div>`
                });
                popup.open();
                popup.once("close", () => {
                    resolve();
                });
            });
        },
        prompt: (title: string, text: string, defaultValue: string): Promise<{
            text: string,
            ok: boolean
        }> => {
            return new Promise((resolve, reject) => {
                f7.dialog.prompt(
                    text,
                    title,
                    (t: string) => {
                        resolve({
                            text: t,
                            ok: true
                        })
                    },
                    (t: string) => {
                        resolve({
                            text: t,
                            ok: false
                        })
                    },
                    defaultValue
                );
            });
        },
		createProgressProcess: (title: string, initialProgress: number) => {
            let dialog = f7.dialog.progress(title, initialProgress);
            return new ProgressProcess(dialog);
        },
	}
	setContext(keys.globalInterface, globalInterface);

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