<script lang="ts">
	import {App, View} from 'framework7-svelte';
	import Home from './pages/home.svelte';
	import Extract from './pages/extract.svelte';
	import ConversionEditor from './pages/conversionEditor.svelte';
	import UtauConversor from './pages/utauConversor.svelte';
	import UstConversor from './pages/ustConversor.svelte';
	import Settings from './pages/settings.svelte';
	import FileFinder from './pages/fileFinder.svelte'

	const routes = [
		{
			path: '/',
			component: Home,
			master: true
		},
		{
			path: '/extract/',
			component: Extract
		},
		{
			path: '/conversionEditor/',
			component: ConversionEditor
		},
		{
			path: '/utauConversor/',
			component: UtauConversor
		},
		{
			path: '/ustConversor/',
			component: UstConversor
		},
		{
			path: '/settings/',
			component: Settings
		},
		{
			path: '/findFile/',
			component: FileFinder
		}
	]
</script>
<App theme="aurora" name="Kana Solver" id="com.github.leonardothehuman.kanaSolver" routes={routes}>
	<View main url="/" class="safe-areas" masterDetailBreakpoint={768} />
</App>


