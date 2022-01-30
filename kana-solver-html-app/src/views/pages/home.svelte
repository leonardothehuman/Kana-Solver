<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    import {Page, List, ListItem, Navbar, theme, f7, Toolbar, Link, BlockTitle, Block, Button} from "framework7-svelte";
    import type { Router } from "framework7/types";
    import { getContext, onMount } from 'svelte';
    import keys from "../../keys";
    import {LimitedStack} from '../../minilibs/LimitedStack';
    import {masterRoute, masterDetailBreakpoint, mainDetailPage} from '../../generated/config/config';
    import type UpdatesHandler from "../../handlers/UpdatesHandler";
    import type ModelsAndHandlers from "../../modelsAndHandlers";
    import config from '../../config';

    export let f7router: Router.Router;
    let routeStack: LimitedStack<string> = new LimitedStack(2, masterRoute);

    let modelsAndHandlers:typeof ModelsAndHandlers = getContext(keys.kanaSolverAppModelsAndHandlers);
    let networkHandler = new modelsAndHandlers.NetworkHandler();

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

    let uh: UpdatesHandler = getContext(keys.updatesHandler);
    let loaded = uh.loaded;
    let latestVersionInteger = uh.latestVersionInteger;
    let downloadUrl = uh.downloadUrl;
    let updateTitle = uh.updateTitle;
    let updateMessage = uh.updateMessage;

    function openUpdateUrl(){
        networkHandler.openUrlOnBrowser(downloadUrl.get());
    }
</script>

<style lang="less">
    @import '../../generated/config/config.less';
    @import "../less/globalMixins.less";

    .content-container{
        .m-container();
    }
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
            color: var(--kana-solver-selected-color, var(--f7-theme-color-shade));
        }
    }
</style>

<svelte:window on:resize={handleResize}/>

<Page class="page-home" {onPageAfterIn}>
    <Navbar title={config.softwareName} />
    <div class="content-container">
        {#if $loaded && uh.currentVersion < $latestVersionInteger}
            <BlockTitle>{$updateTitle}</BlockTitle>
            <Block strong>
                <p>{$updateMessage}</p>
                <Button on:click={() => {openUpdateUrl()}} large raised fill>DOWNLOAD</Button>
            </Block>
        {/if}

        <div class="decorated-page-list">
            <List>
                <ListItem title="Extract/Install UTAU" link="/extract/" reloadDetail />
                <ListItem title="Conversion List Editor" link="/conversionEditor/" reloadDetail />
                <ListItem title="Convert UTAU" link="/utauConversor/" reloadDetail />
                <ListItem title="Convert UST file" link="/ustConversor/" reloadDetail />
            </List>
            <List>
                <ListItem title="About" link="/about/" reloadDetail />
            </List>
        </div>
    </div>
    
    <Toolbar position='bottom'>
        <span class="decorated-toolbar">
            <Link reloadDetail href="/settings/" text="Settings" iconF7="gear_alt" />
        </span>
    </Toolbar>
</Page>