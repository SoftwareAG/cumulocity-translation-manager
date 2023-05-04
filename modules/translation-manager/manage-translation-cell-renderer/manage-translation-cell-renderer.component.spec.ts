import { CellRendererContext } from '@c8y/ngx-components';
import { ManageTranslationCellRendererComponent } from './manage-translation-cell-renderer.component';

describe('ManageTranslationCellRendererComponent', () => {
  let component: ManageTranslationCellRendererComponent;
  let translationDirectoryServiceMock: any;
  let contextMock: CellRendererContext;
  let c8yModalServiceMock: any;
  let translateServiceMock: any;

  beforeEach(() => {
    translationDirectoryServiceMock = {
      saveTranslationLocally: jest.fn(),
      validateTranslationIsProvided: jest.fn(),
      deleteTranslationItem: { emit: jest.fn() },
      saveTranslationItem: { emit: jest.fn() },
      normalizeTranslationValues: jest.fn(),
      isAssetTypeOrCustomProperty: jest.fn()
    };

    c8yModalServiceMock = {
      confirm: jest.fn()
    };

    translateServiceMock = {
      instant: jest.fn()
    };

    contextMock = new CellRendererContext();
    contextMock.item = { id: 'asset' };
    contextMock.property = { name: 'de', path: 'de' };

    component = new ManageTranslationCellRendererComponent(
      contextMock,
      translationDirectoryServiceMock,
      c8yModalServiceMock,
      translateServiceMock
    );

    jest.useFakeTimers();
  });

  describe('ManageTranslationCellRendererComponent test suite', () => {
    it('User clicking on Edit icon to update the translation values', () => {
      // given
      const cellVal = 'Deutsch translation';
      component.context.value = cellVal;
      component.cellInput = { nativeElement: {} };
      component.cellInput.nativeElement.focus = jest.fn();

      // when
      component.editCell();
      jest.runAllTimers();

      // expect
      expect(component.cellValue).toBe(cellVal);
      expect(component.isCellEditable).toBeTruthy();
    });

    it('User clicking on Save icon without providing any input values', () => {
      // given
      component.cellValue = '';

      // when
      component.save();

      // expect
      expect(component.isCellEditable).not.toBeTruthy();
      expect(component.context.value).toBe('');
    });

    it('should display popup if no translation is provided for the key, on click of cancel should remove the popup', async () => {
      // given
      component.cellValue = '';
      const modalSpy = spyOn(c8yModalServiceMock, 'confirm').and.returnValue(Promise.reject());

      // when
      await component.save();

      // expect
      expect(modalSpy).toHaveBeenCalled();
      expect(component.isCellEditable).not.toBeTruthy();
    });

    it('User clicking on Save icon by providing input values', () => {
      // given
      component.cellValue = 'sample';

      // when
      component.save();

      // expect
      expect(component.context.value).toBe('sample');
    });

    it('If translation value is not provided while saving the cell', () => {
      // given
      component.context.value = '';
      const spyDirectoryService = jest
        .spyOn(translationDirectoryServiceMock, 'validateTranslationIsProvided')
        .mockReturnValue(true);

      // when
      component.save();

      // expect
      expect(translationDirectoryServiceMock.validateTranslationIsProvided('sample')).toBe(true);
      expect(spyDirectoryService).toHaveBeenCalled();
      expect(component.context.item).toStrictEqual({ de: '', id: 'asset' });
    });

    it('User clicking on Cancel icon should cancel the changes', () => {
      // when
      component.cancel();

      // expect
      expect(component.isCellEditable).not.toBeTruthy();
    });
  });
});
