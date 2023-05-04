import { FormBuilder } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ManageTranslationModalComponent } from './manage-translation-modal.component';

describe('ManageTranslationModalComponent', () => {
  let component: ManageTranslationModalComponent;
  let formBuilderMock: FormBuilder;
  let bsModelRef: BsModalRef;
  let directoryServiceMock: any;

  beforeEach(async () => {
    formBuilderMock = new FormBuilder();
    bsModelRef = new BsModalRef();

    directoryServiceMock = {
      validateTranslationIsProvided: jest.fn(),
      normalizeTranslationValues: jest.fn(),
      isAssetTypeOrCustomProperty: jest.fn()
    };

    component = new ManageTranslationModalComponent(
      formBuilderMock,
      bsModelRef,
      directoryServiceMock
    );

    component.translationEntry = {
      de: 'Deutsch translation',
      en: undefined,
      es: undefined,
      fr: undefined,
      ja_JP: undefined,
      ko: undefined,
      nl: undefined,
      pl: undefined,
      pt_BR: undefined,
      ru: undefined,
      id: null,
      zh_CN: undefined,
      zh_TW: undefined
    };

    component.langCodes = [
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
      'zh_TW'
    ];
  });

  describe('ManageTranslationModalComponent test suite', () => {
    it('Should set formGroup', () => {
      // given
      const formGroupValue = {
        de: 'de',
        en: 'en',
        es: 'es',
        fr: 'fr',
        ja_JP: 'ja_JP',
        ko: 'ko',
        nl: 'nl',
        pl: 'pl',
        pt_BR: 'pt_BR',
        ru: 'ru',
        zh_CN: 'zh_CN',
        zh_TW: 'zh_TW'
      };

      // when
      component.ngOnInit();

      // expect
      expect(component.formGroup.value).toEqual(formGroupValue);
    });

    it('should enable key field to be editable when adding the new translation item', () => {
      // given
      const formGroupValue = {
        de: 'de',
        en: 'en',
        es: 'es',
        fr: 'fr',
        ja_JP: 'ja_JP',
        ko: 'ko',
        nl: 'nl',
        pl: 'pl',
        pt_BR: 'pt_BR',
        id: null,
        ru: 'ru',
        zh_CN: 'zh_CN',
        zh_TW: 'zh_TW'
      };
      component.translationEntry = undefined;

      // when
      component.ngOnInit();

      // expect
      expect(component.formGroup.controls['id'].enabled).toBe(true);
      expect(component.formGroup.value).toEqual(formGroupValue);
    });

    it('When user clicks on Save button by providing the translation value it should set isTranslationProvided to true', () => {
      // given
      const spyDirectoryServiceIsTranslationProvided = jest
        .spyOn(directoryServiceMock, 'validateTranslationIsProvided')
        .mockReturnValue(true);
      component.onSave.emit = jest.fn();

      // when
      component.onSaveButtonClicked();

      // expect
      expect(directoryServiceMock.validateTranslationIsProvided('sample')).toBe(true);
      expect(spyDirectoryServiceIsTranslationProvided).toHaveBeenCalled();
      expect(component.onSave.emit).toBeDefined();
      expect(component.isTranslationProvided).toBe(true);
    });

    it('When user clicks on Save button without providing translation value it should set isTranslationProvided to false', () => {
      // given
      const spyDirectoryServiceIsTranslationProvided = jest
        .spyOn(directoryServiceMock, 'validateTranslationIsProvided')
        .mockReturnValue(false);
      jest.spyOn(directoryServiceMock, 'isAssetTypeOrCustomProperty').mockReturnValue(false);
      component.onSave.emit = jest.fn();

      // when
      component.onSaveButtonClicked();

      // expect
      expect(directoryServiceMock.validateTranslationIsProvided('sample')).toBe(false);
      expect(spyDirectoryServiceIsTranslationProvided).toHaveBeenCalled();
    });

    it('When user clicks on Cancel button it should hide the model', () => {
      // given
      component['bsModelRef'] = bsModelRef;
      component['bsModelRef'].hide = jest.fn();
      component.onClose.emit = jest.fn();

      // when
      component.onCancel();

      // expect
      expect(component['bsModelRef'].hide).toHaveBeenCalled();
      expect(component.onClose.emit).toHaveBeenCalled();
    });
  });
});
