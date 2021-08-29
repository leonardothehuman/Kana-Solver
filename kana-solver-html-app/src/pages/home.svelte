<script>
    import {Page, List, ListItem, Navbar, theme, f7} from "framework7-svelte";
    import { onMount } from 'svelte';

    export let f7router;

    const onPageAfterIn = () => {
        if (!theme.aurora) return;
        if (f7.width >= 768) {
            f7router.navigate('/extract/', { reloadDetail: true });
        }
    };
    onMount(() => {
        if (theme.aurora) {
            const $el = f7.$('.page-home');
            const routeChangeCallback = (route) => {
                const url = route.url;
                if (!$el) return;
                const $linkEl = $el.find(`a[href="${url}"]`);
                if (!$linkEl.length) return;
                $el.find('.item-selected').removeClass('item-selected');
                $linkEl.addClass('item-selected');
            }
            f7router.on('routeChange', routeChangeCallback);
            return function(){
                f7router.off('routeChange', routeChangeCallback);
            }
        }
    });
</script>

<style lang="less">
    @media (min-width: 768px){
        .decorated-page-list :global(.item-selected){
            background-color: rgb(199, 199, 199);
        }
    }
</style>
<Page class="page-home" {onPageAfterIn}>
    <Navbar title="Kana Solver v3" />
    <div class="decorated-page-list">
        <List>
            <ListItem title="Extract/Install UTAU" link="/extract/" reloadDetail />
            <ListItem title="Conversion List Editor" link="/conversionEditor/" reloadDetail />
            <ListItem title="Convert UTAU" link="/utauConversor/" reloadDetail />
            <ListItem title="Convert ust file" link="/ustConversor/" reloadDetail />
            <ListItem title="Settings" link="/settings/" reloadDetail />
        </List>
    </div>
</Page>