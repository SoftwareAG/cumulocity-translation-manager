import { TranslationDirectoryService } from './translation-directory.service';
import { ApplicationOptions } from '@c8y/ngx-components';
import { TranslationEntry } from './translation-directory.model';
import { IManagedObject } from '@c8y/client';

describe('TranslationDirectoryService', () => {
  let service: TranslationDirectoryService;
  let applicationServiceMock: any;
  let inventoryMock: any;
  let fetchClientMock: any;
  let alertServiceMock: any;
  let translateServiceMock: any;
  let modalMock: any;
  let columnUtilServiceMock: any;
  let userPreferencesServiceMock: any;
  let userServiceMock: any;
  let publicOptionsAppService: any;

  beforeEach(async () => {
    applicationServiceMock = {
      listByName: jest.fn(),
    };
    fetchClientMock = {
      fetch: jest.fn(),
    };

    inventoryMock = {
      list: jest.fn(),
    };

    alertServiceMock = {
      danger: jest.fn(),
    };

    service = new TranslationDirectoryService(
      alertServiceMock,
      translateServiceMock,
      modalMock,
      columnUtilServiceMock,
      userPreferencesServiceMock,
      userServiceMock,
      publicOptionsAppService
    );

    service.applicationOptions = new ApplicationOptions();
    service.applicationOptions.i18nExtra = { de: { test: '' } };
  });

  describe('TranslationDirectoryService test suite', () => {
    it('It should retrive I18nExtra data', () => {
      // given
      const response = {
        status: 400,
        json: jest.fn().mockReturnValue({ i18nExtra: { de: { a: 'b' } } }),
      };
      const spyOnFetchClient = jest.spyOn(fetchClientMock, 'fetch').mockReturnValue(response);
      const langCode = [
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
      ];

      // when
      service.getI18nExtra(langCode);

      // expect
      expect(spyOnFetchClient).toHaveBeenCalled();
    });

    it('It should add the translationData locally for Save call', () => {
      // given
      service.applicationOptions = new ApplicationOptions();
      const entry = { de: 'Deutsch translation11', id: '' };

      // when
      service.saveTranslationLocally(entry, false);

      // expect
      expect(service.applicationOptions.i18nExtra).toStrictEqual({
        de: { undefined: 'Deutsch translation11' },
      });
    });

    it('It should remove the translationData locally for Delete call', () => {
      // given
      service.applicationOptions = new ApplicationOptions();
      service.applicationOptions.i18nExtra = { de: { test: 'testu' } };
      const entry = { de: 'Deutsch translation11', id: 'test' };

      // when
      service.saveTranslationLocally(entry, true);

      // expect
      expect(service.applicationOptions.i18nExtra).toStrictEqual({ de: {} });
    });

    it('It should validate when translation is provided', () => {
      // given
      const data = {
        de: 'abc',
        id: 'abc123',
      };

      // when
      const translationProvided = service.validateTranslationIsProvided(data);

      // expect
      expect(translationProvided).toBe(true);
    });

    it('It should validate when translation is not provided', () => {
      // given
      const data = {
        de: '',
        id: '',
      };

      // when
      const translationNotProvided = service.validateTranslationIsProvided(data);

      // expect
      expect(translationNotProvided).toBe(false);
    });

    it('It should normalize translationValues', () => {
      // given
      const entry: TranslationEntry = {
        de: '   Deutsch translation  ',
        en: '',
        id: ' color ',
      };

      // when
      const normalizedVal = service.normalizeTranslationValues(entry);

      // expect
      expect(normalizedVal).toStrictEqual({
        de: 'Deutsch translation',
        en: undefined,
        id: 'color',
      });
    });
  });
});
