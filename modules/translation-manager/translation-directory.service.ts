import { EventEmitter, Injectable } from '@angular/core';
import { IApplication, UserService } from '@c8y/client';
import {
  AlertService,
  ApplicationOptions,
  I18nExtra,
  ModalService,
  UserPreferencesService,
  DataGridService,
} from '@c8y/ngx-components';
import { ColumnUtilService } from '@c8y/ngx-components/device-grid';
import { TranslateService } from '@ngx-translate/core';
import { merge, union, assign } from 'lodash-es';
import { TranslationEntry } from './translation-directory.model';
import { PublicOptionsAppService } from '../../services/public-options-app.service';
@Injectable({
  providedIn: 'root',
})
export class TranslationDirectoryService extends DataGridService {
  applicationOptions: ApplicationOptions;

  app: IApplication;

  deleteTranslationItem = new EventEmitter<TranslationEntry>();

  saveTranslationItem = new EventEmitter<TranslationEntry>();

  TRANSLATION_GRID_CONFIG_DEFAULT_STORAGE_KEY = 'c8y-translation-grid-configuration';

  constructor(
    protected alertService: AlertService,
    protected translateService: TranslateService,
    protected modal: ModalService,
    protected columnUtilService: ColumnUtilService,
    protected userPreferencesService: UserPreferencesService,
    protected userService: UserService,
    protected publicOptionsAppService: PublicOptionsAppService
  ) {
    super(userPreferencesService);
  }

  /**
   * Stores the current applicationOptions object as options.json in public-options.
   * @returns The result of the API call.
   */
  async saveOptionsJson() {
    this.publicOptionsAppService.saveOptionsJson(this.applicationOptions);
  }

  /**
   * Returns the I18nExtra object as TranslationEntry
   * @param langs The supported languages.
   * @returns The translations entry as array.
   */
  async getI18nExtra(langs: string[]): Promise<TranslationEntry[]> {
    this.applicationOptions = await this.publicOptionsAppService.getApplicationOptions();
    return this.transformI18nToTranslationEntry(this.applicationOptions.i18nExtra || {}, langs);
  }

  /**
   * Stores the translations in the current local object.
   * @param entry The TranslationEntry to store.
   * @param shouldRemove Indicates if the element should be removed from the local object.
   */
  saveTranslationLocally(entry: TranslationEntry, shouldRemove = false): void {
    const { id } = entry;
    Object.keys(entry)
      .filter((key) => key !== 'id')
      .forEach((code) => {
        this.ensure(code);
        if (!entry[code] || shouldRemove) {
          this.remove(code, id);
        } else {
          this.add(code, id, entry[code]);
        }
      });
  }

  normalizeTranslationValues(entry: TranslationEntry): TranslationEntry {
    entry.id = entry.id.trim();
    const onlyTranslationsKeyValues = this.getTranslationValueKeys(entry);
    onlyTranslationsKeyValues.forEach((key) => {
      entry[key] && entry[key].trim() !== ''
        ? (entry[key] = entry[key].trim())
        : (entry[key] = undefined);
    });
    return entry;
  }

  validateTranslationIsProvided(entry: TranslationEntry): boolean {
    const onlyTranslationsValues = this.getTranslationValues(entry);
    const numberOfTranslationValues = onlyTranslationsValues.filter(
      (value) => value && value.trim() !== ''
    ).length;
    return numberOfTranslationValues > 0;
  }

  private getTranslationValues(entry: TranslationEntry): string[] {
    return this.getTranslationValueKeys(entry).map((key) => entry[key]);
  }

  private getTranslationValueKeys(entry: TranslationEntry): string[] {
    return Object.keys(entry).filter(
      (key) => !['isDeleteActionEnabled', 'id'].includes(key)
    );
  }

  private transformI18nToTranslationEntry(
    i18n: I18nExtra,
    langCodes: string[]
  ): TranslationEntry[] {
    const strings = union(
      ...langCodes.filter((lang) => i18n[lang]).map((lang) => Object.keys(i18n[lang]))
    );
    return strings.map((id) =>
      this.mergeKeyAndLanguages(id, langCodes, true, i18n)
    );
  }

  private isExisting(i18nExtra: TranslationEntry[], name: string): unknown {
    let translationItem = i18nExtra.find(({ id }) => id === name);
    if (translationItem && translationItem['isDeleteActionEnabled']) {
      translationItem = assign(translationItem, { isDeleteActionEnabled: false });
    }
    return translationItem;
  }

  private mergeKeyAndLanguages(
    id: any,
    langCodes: string[],
    isDeleteActionEnabled: boolean,
    i18n: I18nExtra = {}
  ) {
    return merge(
      { id },
      { isDeleteActionEnabled },
      ...langCodes.map((lang) => ({
        [lang]: i18n[lang] ? i18n[lang][id] : undefined,
      }))
    );
  }

  private add(code: string, key: string, value: string) {
    this.applicationOptions.i18nExtra[code][key] = value;
  }

  private remove(code: string, key: string) {
    if (this.applicationOptions.i18nExtra[code] && this.applicationOptions.i18nExtra[code][key]) {
      delete this.applicationOptions.i18nExtra[code][key];
    }
  }

  private ensure(code: string) {
    if (!this.applicationOptions.i18nExtra) {
      this.applicationOptions.i18nExtra = {};
    }
    if (!this.applicationOptions.i18nExtra[code]) {
      this.applicationOptions.i18nExtra[code] = {};
    }
  }
}
