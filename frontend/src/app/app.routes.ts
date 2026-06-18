import { Routes } from '@angular/router';
import { IndexLayoutComponent } from './component/layout/index-layout/index-layout.component';
import { IndexComponent } from './views/index/index.component';

export const routes: Routes = [

     {
        path: '',
        component: IndexLayoutComponent,
        children: [
            { path: '', component: IndexComponent,data: { title: 'Document', parent: "document" } }   
        ],
    },
];
