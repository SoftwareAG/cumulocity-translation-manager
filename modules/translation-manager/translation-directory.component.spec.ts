import { TestBed } from '@angular/core/testing';
import { TranslationDirectoryComponent } from './translation-directory.component';
import { ColumnConfig, GridConfig, Pagination } from '@c8y/ngx-components';
import { TranslationEntry } from './translation-directory.model';
import { of } from 'rxjs';
import { TranslationDirectoryModule } from './translation-directory.module';

describe('TranslationDirectoryComponent', () => {
  TestBed.configureTestingModule({
    declarations: [],
    imports: [TranslationDirectoryModule],
  }).compileComponents();
  let component: TranslationDirectoryComponent;
  let appStateServiceMock: any;
  let directoryServiceMock: any;
  let optionsServiceMock: any;
  let modalServiceMock: any;
  let c8yModalServiceMock: any;
  let publicOptionsAppService: any;
  let translateServiceMock: any;
  let alertServiceMock: any;
  let config: GridConfig;

  const selectedItem: TranslationEntry = {
    de: 'de',
    id: 'embassy',
  };

  beforeEach(async () => {
    const columns: ColumnConfig[] = [{ name: 'label', visible: true, sortOrder: '' }];
    const pagination: Pagination = { pageSize: 10, currentPage: 1 };
    const gridConfig: GridConfig = { columns, pagination };
    directoryServiceMock = {
      isBrandingAppOfCurrentTenant: jest.fn(),
      saveOptionsJson: jest.fn(),
      saveTranslationLocally: jest.fn(),
      getUserConfiguredColumns: jest.fn(),
      getAssetids: jest.fn(),
      getI18nExtra: jest.fn(),
      saveConfig$: jest.fn(),
      applyConfigToColumns: jest.fn(),
      getConfig$: jest.fn().mockReturnValue(of(gridConfig)),
      deleteTranslationItem: { subscribe: jest.fn() },
      saveTranslationItem: { subscribe: jest.fn() },
      applicationOptions: { i18nExtra: '' },
    };
    alertServiceMock = {
      danger: jest.fn(),
      success: jest.fn(),
    };
    appStateServiceMock = {
      getLangs: jest.fn(),
    };
    optionsServiceMock = {
      languages: {
        de: { name: 'German', nativeName: 'Deutsch', url: './de.json' },
        en: { name: 'German', nativeName: 'Deutsch', url: './de.json' },
      },
      langsDetails: {},
    };
    modalServiceMock = {
      show: jest.fn(),
    };
    c8yModalServiceMock = {
      confirm: jest.fn(),
    };
    translateServiceMock = {
      reloadLang: jest.fn(),
      currentLang: 'en',
      setTranslation: jest.fn(),
      use: jest.fn(),
    };

    component = new TranslationDirectoryComponent(
      appStateServiceMock,
      directoryServiceMock,
      optionsServiceMock,
      modalServiceMock,
      c8yModalServiceMock,
      publicOptionsAppService,
      translateServiceMock,
      alertServiceMock
    );
  });

  describe('TranslationDirectoryComponent test suite', () => {
    it('It should enable Add term button by setting isBrandingAvailable to true', () => {
      // given
      jest.spyOn(directoryServiceMock, 'isBrandingAppOfCurrentTenant').mockReturnValue(true);
      jest
        .spyOn(directoryServiceMock, 'applyConfigToColumns')
        .mockReturnValue({ name: 'label', visible: true, sortOrder: '' });
      jest
        .spyOn(appStateServiceMock, 'getLangs')
        .mockReturnValue([
          'de',
          'en',
          'es',
          'fr',
          'ja_JP',
          'ko',
          'nl',
          'pl',
          'pt_BR',
          'ru',
          'zh_CN',
          'zh_TW',
        ]);
      jest
        .spyOn(directoryServiceMock, 'getI18nExtra')
        .mockReturnValue([{ de: 'Deutsch translation' }]);
      jest
        .spyOn(directoryServiceMock, 'getAssetids')
        .mockReturnValue([{ id: 'Building' }]);

      // when
      component.ngOnInit();

      // expect
      expect(component.disabled).not.toBeTruthy;
      expect(component.columns).toEqual({ name: 'label', visible: true, sortOrder: '' });
      expect(component.pagination).toEqual({ pageSize: 10, currentPage: 1 });
    });

    it('It should reload data on click of grid Reload option', () => {
      // given
      component.translationsData = [selectedItem];
      component.translationsDataCopy = [
        {
          de: 'en',
          id: 'embassy1',
        },
      ];
      jest.spyOn(c8yModalServiceMock, 'confirm').mockReturnValue('');

      // when
      component.reload();

      // expect
      expect(component.disabled).toBe(true);
    });

    it('should open TranslationModal on click of Edit button', () => {
      // given
      const val = {
        content: {
          onSave: {
            pipe: () => of(null),
          },
        },
      };
      jest.spyOn(modalServiceMock, 'show').mockReturnValue(val);

      // when
      component.openTranslationModal(selectedItem);

      // expect
      expect(optionsServiceMock.languages).toBeDefined();
    });

    it('should display delete TranslationModal popup and on click of yes, should delete it', async () => {
      // given
      component.translationsData = [selectedItem];
      component.isTranslationsDataChanged = false;

      // when
      await component.onItemDelete(selectedItem);

      // expect
      expect(component.translationsData).toHaveLength(0);
      expect(component.isTranslationsDataChanged).toBe(true);
    });

    it('should add new translation item', async () => {
      // given
      component.translationsData = [selectedItem];
      const val = {
        content: {
          onSave: {
            pipe: () => of(null),
          },
          languageFormModel: {
            de: 'si',
            id: 'Site11',
          },
        },
        hide: jest.fn(),
      };
      jest.spyOn(modalServiceMock, 'show').mockReturnValue(val);

      // when
      await component.openTranslationModal();

      // expect
      expect(component.translationsData).toHaveLength(2);
      expect(component.translationsData).toContainEqual({
        de: 'si',
        id: 'Site11',
        isDeleteActionEnabled: true,
      });
      expect(component.isTranslationsDataChanged).toBe(true);
    });

    it('On click of Apply button it should save the data', () => {
      // given
      component.translationsData = [selectedItem];
      jest.spyOn(translateServiceMock, 'reloadLang').mockReturnValue(of({}));

      // when
      component.saveApplicationOptions();

      // expect
      expect(directoryServiceMock.saveOptionsJson).toHaveBeenCalled();
      expect(optionsServiceMock.langsDetails).toBeDefined();
    });

    it('should display browser popup for unsaved changes, if navigated away from the application', () => {
      // given
      component.translationsData = [selectedItem];
      component.translationsDataCopy = [
        {
          de: 'en',
          id: 'embassy1',
        },
      ];
      const event = {
        returnValue: true,
      };

      // when
      component.onbeforeunload(event);

      // expect
      expect(event.returnValue).toBe(false);
    });

    it('should display popup for unsaved changes', () => {
      // given
      component.translationsData = [selectedItem];
      component.translationsDataCopy = [
        {
          de: 'en',
          id: 'embassy1',
        },
      ];

      // when
      component.canDeactivate();

      // expect
      expect(c8yModalServiceMock.confirm).toHaveBeenCalled();
    });

    it('should display popup for unsaved changes and on click of cancel it should cancel the popup without leaving the page', () => {
      // given
      const modalSpy = spyOn(c8yModalServiceMock, 'confirm').and.returnValue(Promise.reject());
      component.translationsData = [selectedItem];
      component.translationsDataCopy = [
        {
          de: 'en',
          id: 'embassy1',
        },
      ];

      // when
      component.canDeactivate();

      // expect
      expect(modalSpy).toHaveBeenCalled();
    });

    it('should not display popup if there is no change', () => {
      // given
      component.translationsData = [selectedItem];
      component.translationsDataCopy = [selectedItem];

      // when
      component.canDeactivate();

      // expect
      expect(c8yModalServiceMock.confirm).not.toBeCalled();
    });

    it('When there is change in column configuration updated configuration should get saved', () => {
      // given
      component.columns = [];
      const TRANSLATION_GRID_CONFIG_DEFAULT_STORAGE_KEY = 'dtm-translation-grid-configuration';
      const spy = jest.spyOn(directoryServiceMock, 'saveConfig$');

      // when
      component.onConfigChange(config, TRANSLATION_GRID_CONFIG_DEFAULT_STORAGE_KEY);

      // expect
      expect(spy).toBeCalledWith(config, TRANSLATION_GRID_CONFIG_DEFAULT_STORAGE_KEY);
    });
  });
});
