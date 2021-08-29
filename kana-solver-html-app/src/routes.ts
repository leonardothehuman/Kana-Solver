import Home from './pages/home.svelte';
import Extract from './pages/extract.svelte';
import ConversionEditor from './pages/conversionEditor.svelte';
import UtauConversor from './pages/utauConversor.svelte';
import UstConversor from './pages/ustConversor.svelte';
import Settings from './pages/settings.svelte';
import FileFinder from './pages/fileFinder.svelte';

export var Routes = [
    {
        path: '/',
        component: Home,
        master: true
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