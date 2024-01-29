import { Component, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DxDataGridModule, DxTagBoxModule } from 'devextreme-angular';
import ArrayStore from 'devextreme/data/array_store';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { one } from 'devextreme/events';
import { Column } from 'devextreme/ui/data_grid';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, DxDataGridModule, DxTagBoxModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  private viewContainerRef = inject(ViewContainerRef);
  @ViewChild('tagsFilterRowEditor') private tagsFilterRowEditor: any;

  title = 'samples-angular-devexpress-grid-tags-filtering';
  tagsDataSource = new ArrayStore({
    data: [
      { Id: 1, Name: 'Tag 1' },
      { Id: 2, Name: 'Tag 2' },
      { Id: 3, Name: 'Tag 3' },
      { Id: 4, Name: 'Tag 4' },
      { Id: 5, Name: 'Tag 5' },
      { Id: 6, Name: 'Tag 6' },
      { Id: 7, Name: 'Tag 7' },
      { Id: 8, Name: 'Tag 8' },
      { Id: 9, Name: 'Tag 9' },
      { Id: 10, Name: 'Tag 10' },
    ],
    key: 'Id',
  });

  columns: any[] = [
    {
      dataField: 'Id',
    },
    {
      dataField: 'TagIds',
      allowFiltering: true,
      allowSorting: false,
      cellTemplate: 'tagsCellTemplate',
      calculateFilterExpression: function calculateTagsFilterExpression(
        this: Column,
        filterValue: any,
        selectedFilterOperation: string | null,
        target: string) : string | Function | any[] {
        if (Array.isArray(filterValue) && filterValue.length > 0 && (target === 'filterRow' || target === 'filterBuilder')) {
          const filterExpressions: string[] = filterValue.map(
            (value: any) => `${this.dataField}/any(t: t eq ${value})`);
          return [filterExpressions.join(' and ')];
        }
        return '';
      }
    },
    {
      dataField: 'TagIds',
      name: 'TagIds2',
      caption: 'Tag Ids 2',
      allowFiltering: true,
      allowSorting: false,
      cellTemplate: 'tagsCellTemplate',
      filterOperations: ['contains'],
      selectedFilterOperation: 'contains'
    },
  ];

  gridDataSource: DataSource = new DataSource({
    store: new ODataStore({
      url: 'https://samples-angular-devexpress-grid-tags-filtering-search.search.windows.net/indexes/documents/docs',
      key: 'Id',
      keyType: 'String',
      version: 4,
      filterToLower: false,
      beforeSend: (options): void => {
        if (options.params['$filter']) {
          options.params['$filter'] = this.replaceTagsFilter(options.params['$filter']);
          options.params['$filter'] = this.replaceTags2Filter(options.params['$filter']);
        }
        options.headers['api-key'] = 'pe0WoRUtzjVDq3bm9jDum0nGj1k8BzL2BGUkaftYPVAzSeDnIqji';
        options.params['api-version'] = '2019-05-06';
      }
    })
  });

  onEditorPreparing(e: any): void {
    if (e.parentType === 'filterRow' && e.dataField === 'TagIds') {
      e.cancel = true;
      if (this.tagsFilterRowEditor) {
        const childView = this.viewContainerRef.createEmbeddedView(
          this.tagsFilterRowEditor,
          { options: e }
        );

        childView.rootNodes.forEach((element) => {
          e.editorElement.appendChild(element);
        });

        one(e.editorElement, 'dxremove', () => {
          childView.destroy();
        });
      }
    }
  }

  /*
  * Devexpress grid adds 'eq true' at the end of the filter. Function changes 'TagIds/any(t: t eq 123) eq true'
  * to 'TagIds/any(t: t eq 123)'. This is needed because of azure search error
  * 'Comparison must be between a field, range variable or function call and a literal value.'.
  */
  private replaceTagsFilter(filterParam: string): string {
    const rx = /(TagIds\/any\(t: t eq \d+\)) eq true/g;
    return filterParam.replace(rx, '$1');
  }

  /*
  * Replaces contains(TagIds,[1,2,3]) with (TagIds/any(t: t eq 1) and TagIds/any(t: t eq 2) and TagIds/any(t: t eq 3)).
  */
  private replaceTags2Filter(input: string): string | undefined {
    const output = input.replace(
      /contains\(TagIds,\[([\d,]*)\]\)/g,
      (_: string, tagIdsString: string) => {
        if (tagIdsString === '') {
          return '';
        }
        const tagIds = tagIdsString.split(',').map((tagId: string) => `TagIds/any(t: t eq ${tagId})`);
        return `(${tagIds.join(' and ')})`;
      });

    return !!output ? output : undefined;
  }
}
