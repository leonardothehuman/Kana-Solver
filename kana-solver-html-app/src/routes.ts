//This file is licensed under GNU GPL v3.0 only license

import Home from './views/pages/home.svelte';
import Extract from './views/pages/extract.svelte';
import ConversionEditor from './views/pages/conversionEditor.svelte';
import UtauConversor from './views/pages/utauConversor.svelte';
import UstConversor from './views/pages/ustConversor.svelte';
import Settings from './views/pages/settings.svelte';
import FileFinder from './views/pages/fileFinder.svelte';
import ExtractDetails from './views/pages/extractDetails.svelte';
import UtauConversorDetails from './views/pages/utauConversorDetails.svelte';
import About from './views/pages/about.svelte';
import {masterRoute} from './generated/config/config';
import type { Router } from 'framework7/types';

export type leaveConfirmators = {
    conversionEditor: ({ resolve, reject }:{resolve: Function, reject: Function}) => void
}

//This function is here because we need a callback that will change as you enter or leaves 
//Pages that needs exit confirmation ...
function generateRoutes(){
    var PageLeaveConfirmators: leaveConfirmators = {
        conversionEditor: function({ resolve, reject }:{resolve: Function, reject: Function}){}
    }
    
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
            path: '/extract-details/',
            component: ExtractDetails
        },
        {
            path: '/conversionEditor/',
            component: ConversionEditor,
            beforeLeave: function ({ resolve, reject }) {
                var _resolve: Function = function(){
                    PageLeaveConfirmators.conversionEditor = function({ resolve, reject }:{resolve: Function, reject: Function}){};
                    resolve();
                }
                PageLeaveConfirmators.conversionEditor({resolve: _resolve, reject});
            }
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
        },
        {
            path: '/utau-conversor-details/',
            component: UtauConversorDetails
        },
        {
            path: '/about/',
            component: About
        }
    ];
    
    for(let i = 0; i < Routes.length; i++){
        if(Routes[i].path == masterRoute){
            Routes[i]['master'] = true;
        }
    }

    return {
        getPageLeaveConfirmators: function(){
            return PageLeaveConfirmators
        },
        getRoutes: function(){
            return Routes
        }
    }
}

export {generateRoutes};