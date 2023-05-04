import { Component, EventEmitter, HostListener, OnInit } from '@angular/core';
import {
  ActionControl,
  AlertService,
  AppStateService,
  BuiltInActionType,
  Column,
  gettext,
  GridConfig,
  ModalService as C8yModalService,
  OptionsService,
  Pagination,
  Status,
  BulkActionControl,
} from '@c8y/ngx-components';
import { TranslateService } from '@ngx-translate/core';
import { cloneDeep, isEqual, assign } from 'lodash-es';
import { PublicOptionsAppService } from '../../services/public-options-app.service';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { first } from 'rxjs/operators';
import { ManageTranslationCellRendererComponent } from './manage-translation-cell-renderer/manage-translation-cell-renderer.component';
import { ManageTranslationModalComponent } from './manage-translation-modal/manage-translation-modal.component';
import { TranslationEntry } from './translation-directory.model';
import { TranslationDirectoryService } from './translation-directory.service';

@Component({
  selector: 'dtm-translation-directory',
  templateUrl: 'translation-directory.component.html',
})
export class TranslationDirectoryComponent implements OnInit {
  
  columns: Column[];

  loadingItemsLabel: string = gettext('Loading translations...');

  actionControls: ActionControl[] = [
    {
      type: BuiltInActionType.Edit,
      callback: (selectedItem: TranslationEntry) => this.openTranslationModal(selectedItem),
    },
    {
      type: BuiltInActionType.Delete,
      callback: (selectedItem: TranslationEntry) => this.onItemDelete(selectedItem),
      showIf: (item: TranslationEntry) => item.isDeleteActionEnabled,
    },
  ];

  bulkActionControls: BulkActionControl[] = [
    {
      type: BuiltInActionType.Delete,
      callback: (ids: string[]) => this.onDeleteTranslationsBulk(ids),
    },
  ];

  pagination: Pagination;

  translationsData: TranslationEntry[] = [];

  translationsDataCopy: TranslationEntry[] = []; // to compare for changes

  refresh = new EventEmitter();

  disabled: boolean = true;

  isTranslationsDataChanged: boolean = false;

  isTranslationsDataFetched: boolean = false;

  constructor(
    private appStateService: AppStateService,
    private directoryService: TranslationDirectoryService,
    private options: OptionsService,
    private modalService: BsModalService,
    private c8yModalService: C8yModalService,
    private publicOptionsAppService: PublicOptionsAppService,
    protected translateService: TranslateService,
    protected alertService: AlertService
  ) {}

  @HostListener('window:beforeunload', ['$event'])
  onbeforeunload(event) {
    if (this.isChanged()) {
      event.returnValue = false;
    }
  }

  async ngOnInit() {
    this.isTranslationsDataFetched = false;

    const isPublicOptionsAppAvailable = await this.initPublicOptionsApp();
    this.disabled = !isPublicOptionsAppAvailable;

    if (this.disabled) {
      return;
    }

    const langCodes = this.appStateService.getLangs();

    this.initColumnConfiguration(langCodes);
    await this.initTranslationData(langCodes);
    this.initListenersTranslationItemActions();

    this.isTranslationsDataFetched = true;
  }

  async reload() {
    try {
      if (this.isChanged()) {
        await this.c8yModalService.confirm(
          gettext('Reload'),
          gettext('Reloading will remove your current changes. Do you want to continue?'),
          Status.WARNING
        );
      }
      this.disabled = true;
      await this.ngOnInit();
    } catch (ex) {
      // intended empty
    }
  }

  async openTranslationModal(selectedItem?: TranslationEntry) {
    const langCodes = this.appStateService.getLangs();
    const initialState: { initialState: Partial<ManageTranslationModalComponent> } = {
      initialState: {
        translationEntry: selectedItem,
        langCodes,
        translationsData: this.translationsData,
        langsDetail: this.options.languages,
      },
    };
    const modalRef: BsModalRef<ManageTranslationModalComponent> = this.modalService.show(
      ManageTranslationModalComponent,
      initialState
    );
    modalRef.content.onSave
      .pipe(
        first() // this is to not run into memory issues
      )
      .subscribe(() => {
        this.onTranslationModalSave(modalRef, selectedItem);
      });
  }

  onConfigChange(
    config: GridConfig,
    key: string = this.directoryService.TRANSLATION_GRID_CONFIG_DEFAULT_STORAGE_KEY
  ): void {
    if (this.columns) {
      this.directoryService.saveConfig$(config, key);
    }
  }

  async saveApplicationOptions() {
    this.isTranslationsDataChanged = false;
    await this.directoryService.saveOptionsJson();
    this.alertService.success(gettext('Translation configuration saved.'));
    this.translationsDataCopy = cloneDeep(this.translationsData);
    this.options.langsDetails = {
      ...this.options.langsDetails,
      ...this.directoryService.applicationOptions.i18nExtra,
    };
    this.translateService.reloadLang(this.translateService.currentLang).subscribe((data) => {
      this.translateService.setTranslation(this.translateService.currentLang, data);
      this.translateService.use(this.translateService.currentLang);
    });
  }

  async canDeactivate(): Promise<boolean> {
    if (this.isChanged()) {
      try {
        await this.c8yModalService.confirm(
          gettext('Unsaved changes'),
          gettext(
            "There are unapplied changes which will be lost if you don't apply them. Do you still want to leave this page?"
          ),
          Status.DANGER,
          { ok: gettext('Leave page') }
        );
        return true;
      } catch (ex) {
        return false;
      }
    }
    return true;
  }

  private isChanged() {
    return !isEqual(this.translationsDataCopy, this.translationsData);
  }

  private getColumns(langCodes: string[]): Column[] {
    const keyColumn = {
      name: 'id',
      header: 'Key',
      path: 'id',
      filterable: true,
      positionFixed: true,
    };

    return [
      keyColumn,
      ...langCodes.map((langCode, index: number) => this.addColumnsIntoDataGrid(langCode, index)),
    ];
  }

  private onTranslationModalSave(
    modalRef: BsModalRef<ManageTranslationModalComponent>,
    selectedItem: TranslationEntry
  ) {
    this.directoryService.saveTranslationLocally(modalRef.content.languageFormModel);
    if (selectedItem) {
      this.update(selectedItem, modalRef.content.languageFormModel);
    } else {
      this.add(modalRef.content.languageFormModel);
    }
    this.refresh.emit();
    modalRef.hide();
    this.isTranslationsDataChanged = true;
  }

  private update(selectedItem: TranslationEntry, entry: TranslationEntry) {
    const index = this.translationsData.indexOf(selectedItem);
    this.translationsData[index] = entry;
  }

  private add(selectedItemInput: TranslationEntry) {
    const selectedItem = assign(selectedItemInput, { isDeleteActionEnabled: true });
    this.translationsData.push(selectedItem);
  }

  private remove(selectedItem: TranslationEntry) {
    const index = this.translationsData.indexOf(selectedItem);
    if (index > -1) {
      this.translationsData.splice(index, 1);
    }
  }

  private addColumnsIntoDataGrid(langCode, index): Column {
    const column = {
      name: langCode,
      header: this.getLangFromLangCode(langCode),
      path: langCode,
      filterable: true,
      cellRendererComponent: ManageTranslationCellRendererComponent,
      visible: true,
    };
    if (index >= 3) {
      column.visible = false;
    }
    return column;
  }

  async onItemDelete(selectedItem: TranslationEntry) {
    try {
      await this.c8yModalService.confirm(
        gettext('Delete translation item'),
        gettext('Are you sure you want to delete the item?'),
        Status.DANGER
      );
      this.directoryService.saveTranslationLocally(selectedItem, true);
      this.remove(selectedItem);
      this.isTranslationsDataChanged = true;
    } catch (ex) {
      // inteded empty
    }
    this.refresh.emit();
  }

  async onDeleteTranslationsBulk(ids: string[]) {
  
      await this.c8yModalService.confirm(
        gettext('Delete translations'),
        this.translateService.instant(
          gettext(`You are about to delete translations: "{{ devices }}". Do you want to proceed?`),
          { devices: ids }
        ),
        Status.DANGER,
        { ok: gettext('Delete'), cancel: gettext('Cancel') }
      );

      const toDelete = ids.map((id) => this.translationsData.find(t => t.id === id)).filter(e => !!e);
        for (const item of toDelete) {
          this.directoryService.saveTranslationLocally(item, true);
          this.remove(item);
          this.isTranslationsDataChanged = true;
          
        }
      this.refresh.emit();
  }

  private getLangFromLangCode(langCode): string {
    if (this.options.languages[langCode]) {
      return this.options.languages[langCode].nativeName;
    }
  }

  private async initPublicOptionsApp(): Promise<boolean> {
    const isPublicOptionsAppAvailable =
      await this.publicOptionsAppService.isPublicOptionsAppAvailable();

    if (isPublicOptionsAppAvailable) {
      return true;
    }

    return await this.publicOptionsAppService.createPublicOptionsApp();
  }

  private initColumnConfiguration(langCodes: string[]): void {
    this.directoryService
      .getConfig$(this.directoryService.TRANSLATION_GRID_CONFIG_DEFAULT_STORAGE_KEY)
      .subscribe((data) => {
        this.columns = this.directoryService.applyConfigToColumns(data, this.getColumns(langCodes));
        this.pagination = data.pagination ? data.pagination : { pageSize: 20, currentPage: 1 };
      });
  }

  private async initTranslationData(langCodes: string[]): Promise<void> {
    this.translationsData = await this.initTranslationItems(langCodes);
    this.translationsDataCopy = cloneDeep(this.translationsData);
  }

  private async initTranslationItems(langCodes: string[]): Promise<TranslationEntry[]> {
    return await this.directoryService.getI18nExtra(langCodes);
  }

  private initListenersTranslationItemActions(): void {
    this.initListenerForSingleTranslationItemSaved();
    this.initListenerForSingleTranslationItemDeleted();
  }

  private initListenerForSingleTranslationItemDeleted(): void {
    this.directoryService.deleteTranslationItem.subscribe((entry: TranslationEntry) => {
      this.isTranslationsDataChanged = true;
      this.directoryService.saveTranslationLocally(entry, true);
      this.remove(entry);
      this.refresh.emit();
    });
  }

  private initListenerForSingleTranslationItemSaved(): void {
    this.directoryService.saveTranslationItem.subscribe(() => {
      this.isTranslationsDataChanged = true;
    });
  }
}
