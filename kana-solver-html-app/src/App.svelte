<script lang="ts">
	import {App, View} from 'framework7-svelte';
	import {Routes} from './routes';
</script>
<App theme="aurora" name="Kana Solver" id="com.github.leonardothehuman.kanaSolver" routes={Routes}>
	<View main url="/" class="safe-areas" masterDetailBreakpoint={768} />
</App>