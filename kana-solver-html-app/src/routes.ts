import Home from './pages/home.svelte';
import Extract from './pages/extract.svelte';
import ConversionEditor from './pages/conversionEditor.svelte';
import UtauConversor from './pages/utauConversor.svelte';
import UstConversor from './pages/ustConversor.svelte';
import Settings from './pages/settings.svelte';
import FileFinder from './pages/fileFinder.svelte';
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