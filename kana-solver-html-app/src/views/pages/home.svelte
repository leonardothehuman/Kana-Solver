<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    import {Page, List, ListItem, Navbar, theme, f7, Toolbar, Link, Icon} from "framework7-svelte";
    import type { Router } from "framework7/types";
    import { onMount } from 'svelte';
    import {LimitedStack} from '../../minilibs/LimitedStack';
    import {masterRoute, masterDetailBreakpoint, mainDetailPage} from '../../generated/config/config';

    export let f7router: Router.Router;
    let routeStack: LimitedStack<string> = new LimitedStack(2, masterRoute);

    function handleResize(){
        if (!theme.aurora) return;
        if (f7.width < masterDetailBreakpoint) return;
        if(
            routeStack.get(1).trim() == masterRoute &&
            routeStack.get(0).trim() == masterRoute
        ){
            f7router.navigate(mainDetailPage, { reloadAll: false });
            return;
        }
        if(f7router.currentRoute.url.trim() != masterRoute) return;
        f7router.navigate(routeStack.get(1), { reloadAll: false });
    }

    const onPageAfterIn = () => {
        handleResize();
    };
    
    onMount(() => {
        if (theme.aurora) {
            const $el = f7.$('.page-home');
            const routeChangeCallback = (route: Router.Route) => {
                routeStack.add(route.url);
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
        }else{
            return function(){}
        }
    });
</script>

<style lang="less">
    @import '../../generated/config/config.less';

    .decorated-toolbar :global(.link){
        color: var(--f7-list-item-title-text-color);
    }
    @media (min-width: @masterDetailBreakpoint){
        .decorated-page-list :global(.item-selected){
            background-color: var(--f7-theme-color-tint);
            :global(.item-title),
            :global(.item-inner::before){
                color: var(--f7-button-fill-text-color, #fff);
            }
        }
        .decorated-toolbar :global(.item-selected){
            color: var(--f7-theme-color-shade);
        }
    }
</style>

<svelte:window on:resize={handleResize}/>

<Page class="page-home" {onPageAfterIn}>
    <Navbar title="Kana Solver v3" />
    <div class="decorated-page-list">
        <List>
            <ListItem title="Extract/Install UTAU" link="/extract/" reloadDetail />
            <ListItem title="Conversion List Editor" link="/conversionEditor/" reloadDetail />
            <ListItem title="Convert UTAU" link="/utauConversor/" reloadDetail />
            <ListItem title="Convert ust file" link="/ustConversor/" reloadDetail />
        </List>
    </div>
    
    <Toolbar position='bottom'>
        <span class="decorated-toolbar">
            <Link reloadDetail href="/settings/" text="Settings" iconF7="gear_alt" />
        </span>
    </Toolbar>
</Page>