<script lang="ts">
	import {App, View} from 'framework7-svelte';
	import {Routes} from './routes';
	import {masterRoute, masterDetailBreakpoint} from './config/config';
</script>

<App theme="aurora" name="Kana Solver" id="com.github.leonardothehuman.kanaSolver" routes={Routes}>
	<!-- <span class="theme-dark"> -->
		<View main url={masterRoute} class="safe-areas" masterDetailBreakpoint={masterDetailBreakpoint} />
	<!-- </span> -->
</App>