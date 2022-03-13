<script lang="ts">
    //This file is licensed under GNU GPL v3.0 only license
    
    import {Page, Navbar, List, ListItem, BlockTitle, BlockHeader, Block, Toolbar, Link, Tabs, Tab} from "framework7-svelte";
    import { getContext, onMount } from 'svelte';
    import type UpdatesHandler from "../../handlers/UpdatesHandler";
    import type { AdditionalInfoAray } from "../../handlers/UpdatesHandler";
    import keys from "../../keys";
    import GnuGpl from "../licenses/gnugpl.svelte";
    import Mit from "../licenses/mit.svelte";
    import Isc from "../licenses/isc.svelte";
    import Apache from "../licenses/apache.svelte";
    import HtmlElement from "../components/htmlElement.svelte";
    import config from '../../config';
    
    let uh: UpdatesHandler = getContext(keys.updatesHandler);
    let loaded = uh.loaded;
    let additionalInfo = uh.additionalInfo;

    let defaultInfo: AdditionalInfoAray[] = [
        ["SUBTITLE", config.softwareName],
		["STRONGBLOCK",
            ["PARAGRAPH","Version: "+config.versionString],
			["PARAGRAPH","This software was created by Leonardo The Human and is licensed under GNU GPL v3, check licenses page for more details"],
			["PARAGRAPH", config.softwareName+" was created with ❤️, but if you think this software is useful, you can support by giving a star on github, reporting a bug, sharing with your friends or making a donation"]
		],
    ]
</script>

<style lang="less">
    @import "../less/globalMixins.less";
    .content-container{
        .m-container();
        :global(.ab-link){
            color: blue;
            cursor: pointer;
        }
    }
    h1, h2{
        margin: 0px;
        text-align: center;
    }
    :global(.tabs > div){
        padding: 0px;
    }
</style>

<Page>
    <Navbar title="About" backLink />
    <Toolbar tabbar bottom>
        <Link tabLink="#tab-about" tabLinkActive>About</Link>
        <Link tabLink="#tab-licenses">Licenses</Link>
    </Toolbar>
    <Tabs animated>
        <Tab id="tab-about" class="page-content" tabActive>
            <div class="content-container allow-select">
                {#each defaultInfo as line}
                    <HtmlElement element={line} />
                {/each}
                {#each $additionalInfo as line}
                    <HtmlElement element={line} />
                {/each}
            </div>
        </Tab>
        <Tab id="tab-licenses" class="page-content">
            <div class="content-container">
                <BlockTitle><h1>Licenses</h1></BlockTitle>
                <Block strong>
                    <div>
                        <div>This software uses several components with different licenses</div>
                        <div>Kana Solver itself is licensed under GNU GPL v3</div>
                    </div>
                </Block>
                <hr />
                <Block>
                    <GnuGpl />
                </Block>
                <Block strong>
                    <h4>This license applies to:</h4>
                    <div>Kana Solver: Copyright (c) 2021-22 Leonardo The Human</div>
                </Block>
                <hr />
                <Block>
                    <Mit />
                </Block>
                <Block strong>
                    <h4>This license applies to:</h4>
                    <div>Webpack: Copyright JS Foundation and other contributors</div>
                    <div>Svelte: Copyright (c) 2016-22 Svelte Contributors</div>
                    <div>svelte-loader: Copyright (c) 2016-22 Svelte Contributors</div>
                    <div>svelte-preprocess: Copyright (c) 2016-22 Svelte Contributors</div>
                    <div>buffer-crc32: Copyright (c) 2013 Brian J. Brennan</div>
                    <div>yauzl: Copyright (c) 2014 Josh Wolfe</div>
                    <div>copy-webpack-plugin: Copyright JS Foundation and other contributors</div>
                    <div>css-loader: Copyright JS Foundation and other contributors</div>
                    <div>file-loader: Copyright JS Foundation and other contributors</div>
                    <div>less-loader: Copyright JS Foundation and other contributors</div>
                    <div>style-loader: Copyright JS Foundation and other contributors</div>
                    <div>mini-css-extract-plugin: Copyright JS Foundation and other contributors</div>
                    <div>html-webpack-plugin: Copyright JS Foundation and other contributors</div>
                    <div>url-loader: Copyright JS Foundation and other contributors</div>
                    <div>framework7: Copyright (c) 2014 Vladimir Kharlampidi</div>
                    <div>hasha: Copyright (c) Sindre Sorhus</div>
                    <div>ts-loader: Copyright (c) 2015 TypeStrong</div>
                    <div>ts-node: Copyright (c) 2014 Blake Embrey</div>
                    <div>iconv-lite: Copyright (c) 2011 Alexander Shtuchkin</div>
                    <div>node-disk-info: Copyright (c) 2019 Cristiam Mercado</div>
                    <div>nw.js: Copyright (c) 2011-2019 NW.js Authors</div>
                    <div>nw.js: Copyright (c) 2011-2019 The Chromium Authors</div>
                    <div>nw.js: Copyright (c) 2011-2018 Intel Corp</div>
                </Block>
                <hr />
                <Block>
                    <Isc />
                </Block>
                <Block strong>
                    <h4>This license applies to:</h4>
                    <div>rimraf: Copyright (c) Isaac Z. Schlueter and Contributors</div>
                    <div>nodejs-file-downloader: Copyright (c) ibrod83</div>
                </Block>
                <hr />
                <Block>
                    <Apache />
                </Block>
                <Block strong>
                    <h4>This license applies to:</h4>
                    <div>less: Copyright (c) 2009-2017 Alexis Sellier & The Core Less Team Licensed under the Apache License.</div>
                    <div>typescript: Copyright (c) 2012-2022 Microsoft</div>
                </Block>
            </div>
        </Tab>
    </Tabs>
</Page>