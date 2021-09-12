<script lang="ts">
	//This file is licensed under GNU GPL v3.0 only license
	import {App, View} from 'framework7-svelte';
	import {Routes} from './routes';
	import {masterRoute, masterDetailBreakpoint} from './generated/config/config';
</script>

<App theme="aurora" name="Kana Solver" id="com.github.leonardothehuman.kanaSolver" routes={Routes}>
	<!-- <span class="theme-dark"> -->
		<View main url={masterRoute} class="safe-areas" masterDetailBreakpoint={masterDetailBreakpoint} />
	<!-- </span> -->
</App>