import { Component, ElementRef, ViewChild } from '@angular/core';
import {
  CellRendererContext,
  ModalService as C8yModalService,
  gettext,
  Status,
} from '@c8y/ngx-components';
import { TranslationDirectoryService } from '../translation-directory.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'c8y-cell-renderer',
  templateUrl: 'manage-translation-cell-renderer.component.html',
})
export class ManageTranslationCellRendererComponent {
  private readonly FOCUS_RENDER_WAIT_TIME_IN_MS = 100;
  isCellEditable = false;
  cellValue: string = '';
  @ViewChild('cellInput') cellInput: ElementRef;

  constructor(
    public context: CellRendererContext,
    private directoryService: TranslationDirectoryService,
    private c8yModalService: C8yModalService,
    private translateService: TranslateService
  ) {}

  async save(): Promise<void> {
    this.isCellEditable = false;
    const previousCellValue: string = this.context.value;
    const cellValueTrimed = this.cellValue.trim();
    this.context.value = cellValueTrimed;
    this.context.item[this.context.property.path] = cellValueTrimed;
    const normalizedEntry = this.directoryService.normalizeTranslationValues(this.context.item);
    const isTranslationProvided =
      this.directoryService.validateTranslationIsProvided(normalizedEntry);

    if (!isTranslationProvided) {
      this.removeTranslationDialog(previousCellValue);

      return;
    }

    this.directoryService.saveTranslationLocally(normalizedEntry);
    this.directoryService.saveTranslationItem.emit();
  }

  cancel(): void {
    this.isCellEditable = false;
  }

  editCell(): void {
    this.cellValue = this.context.value;
    this.isCellEditable = true;

    // Focuses the input box after the input text box is visible
    setTimeout(() => {
      this.cellInput.nativeElement.focus();
    }, this.FOCUS_RENDER_WAIT_TIME_IN_MS);
  }

  private async removeTranslationDialog(previousCellValue: string): Promise<void> {
    try {
      const title = gettext('Remove translation key?');
      const body = this.translateService.instant(
        gettext(
          'You are going to remove the last translation for key "{{ key }}", so the key will be deleted. Do you want to proceed?'
        ),
        { key: this.context.item.id }
      );
      await this.c8yModalService.confirm(title, body, Status.WARNING);
      this.directoryService.deleteTranslationItem.emit(this.context.item);
    } catch (ex) {
      this.context.value = previousCellValue;
      this.context.item[this.context.property.path] = previousCellValue;
    }
  }
}
