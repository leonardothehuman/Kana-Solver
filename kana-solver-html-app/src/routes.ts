//This file is licensed under GNU GPL v3.0 only license

import Home from './views/pages/home.svelte';
import Extract from './views/pages/extract.svelte';
import ConversionEditor from './views/pages/conversionEditor.svelte';
import UtauConversor from './views/pages/utauConversor.svelte';
import UstConversor from './views/pages/ustConversor.svelte';
import Settings from './views/pages/settings.svelte';
import FileFinder from './views/pages/fileFinder.svelte';
import {masterRoute} from './generated/config/config';
import type { Router } from 'framework7/types';

var Routes: Router.RouteParameters[] = [
    {
        path: '/',
        component: Home
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
];

for(let i = 0; i < Routes.length; i++){
    if(Routes[i].path == masterRoute){
        Routes[i]['master'] = true;
    }
}

export {Routes};