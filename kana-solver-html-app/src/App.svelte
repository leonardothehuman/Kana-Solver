<script lang="ts">
	//This file is licensed under GNU GPL v3.0 only license
	import {setContext} from 'svelte';
	import ModelsAndHandlers from './modelsAndHandlers';
	import keys from './keys';
	import {App, View} from 'framework7-svelte';
	import {generateRoutes} from './routes';
	import {masterRoute, masterDetailBreakpoint} from './generated/config/config';

	var routeCollection = generateRoutes();

	setContext(keys.kanaSolverAppModelsAndHandlers, ModelsAndHandlers);
	setContext(keys.pageLeaveConfirmators, routeCollection.getPageLeaveConfirmators());
</script>

<App theme="aurora" name="Kana Solver" id="com.github.leonardothehuman.kanaSolver" routes={routeCollection.getRoutes()}>
	<!-- <span class="theme-dark"> -->
		<View main url={masterRoute} class="safe-areas" masterDetailBreakpoint={masterDetailBreakpoint} />
	<!-- </span> -->
</App>