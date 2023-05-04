export interface TranslationEntry {
  id: string;
  [key: string]: string;
}

export interface I18nExtra {
  [code:string]:{ [key:string]:[value:string] }
}